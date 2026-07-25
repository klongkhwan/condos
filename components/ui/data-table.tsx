"use client"

import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (item: T) => ReactNode
  hideOnMobile?: boolean
  align?: "left" | "right" | "center"
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  emptyMessage?: string
  itemsPerPage?: number
  showPagination?: boolean
  onRowClick?: (item: T) => void
  className?: string
}

/** สร้างรายการหมายเลขหน้า: หน้าแรก ... หน้ารอบปัจจุบัน ... หน้าสุดท้าย */
function buildPageList(totalPages: number, currentPage: number): (number | "gap")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

  const pages = new Set<number>([1, totalPages, currentPage])
  if (currentPage - 1 > 1) pages.add(currentPage - 1)
  if (currentPage + 1 < totalPages) pages.add(currentPage + 1)
  if (currentPage <= 3) pages.add(2).add(3)
  if (currentPage >= totalPages - 2) pages.add(totalPages - 1).add(totalPages - 2)

  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)
  const result: (number | "gap")[] = []
  sorted.forEach((page, index) => {
    if (index > 0 && page - (sorted[index - 1] as number) > 1) result.push("gap")
    result.push(page)
  })
  return result
}

const alignClass = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = "ไม่มีข้อมูล",
  itemsPerPage = 10,
  showPagination = true,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage))

  // ถ้าข้อมูลถูกกรองจนหน้าปัจจุบันเกินช่วง ให้ดีดกลับหน้าสุดท้ายที่ยังมีข้อมูล
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = showPagination ? data.slice(startIndex, startIndex + itemsPerPage) : data
  const pageList = useMemo(() => buildPageList(totalPages, currentPage), [totalPages, currentPage])

  if (loading) {
    return (
      <div className={cn("overflow-hidden rounded-xl border border-border bg-card shadow-card", className)}>
        <div className="divide-y divide-border">
          {Array.from({ length: Math.min(itemsPerPage, 5) }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 px-4 py-4 sm:px-6">
              <div className="h-3.5 flex-1 animate-pulse rounded bg-muted" />
              <div className="hidden h-3.5 w-24 animate-pulse rounded bg-muted sm:block" />
              <div className="h-3.5 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={cn("rounded-xl border border-border bg-card shadow-card", className)}>
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Inbox className="h-5 w-5" />
          </span>
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card shadow-card", className)}>
      <div className="scrollbar-slim overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-border bg-surface-raised">
              {columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className={cn(
                    "whitespace-nowrap px-3 py-2.5 text-xs font-medium text-muted-foreground sm:px-5",
                    alignClass[column.align ?? "left"],
                    column.hideOnMobile && "hidden sm:table-cell",
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedData.map((item, index) => (
              <tr
                key={index}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                className={cn(
                  "transition-colors",
                  onRowClick ? "cursor-pointer hover:bg-surface-raised" : "hover:bg-surface-raised/60",
                )}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={cn(
                      "px-3 py-3 text-xs text-foreground sm:px-5 sm:py-3.5 sm:text-sm",
                      alignClass[column.align ?? "left"],
                      column.align === "right" && "tabular",
                      column.hideOnMobile && "hidden sm:table-cell",
                      column.className,
                    )}
                  >
                    {column.render ? column.render(item) : item[column.key as keyof T]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && data.length > itemsPerPage && (
        <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2.5 sm:px-5">
          <p className="tabular text-xs text-muted-foreground">
            <span className="hidden sm:inline">แสดง </span>
            {startIndex + 1}–{Math.min(currentPage * itemsPerPage, data.length)}
            <span className="hidden sm:inline"> จาก {data.length} รายการ</span>
            <span className="sm:hidden"> / {data.length}</span>
          </p>

          <nav className="flex items-center gap-1" aria-label="การแบ่งหน้า">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="หน้าก่อนหน้า"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="hidden items-center gap-1 sm:flex">
              {pageList.map((page, index) =>
                page === "gap" ? (
                  <span key={`gap-${index}`} className="px-1 text-xs text-muted-foreground">
                    …
                  </span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    aria-current={currentPage === page ? "page" : undefined}
                    className={cn(
                      "tabular h-7 min-w-7 rounded-md px-2 text-xs font-medium transition-colors",
                      currentPage === page
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground hover:bg-surface-raised hover:text-foreground",
                    )}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>

            <span className="tabular px-1 text-xs text-muted-foreground sm:hidden">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="หน้าถัดไป"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        </div>
      )}
    </div>
  )
}
