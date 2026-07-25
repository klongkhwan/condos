"use client";

import { useState } from "react";
import {
  Bell,
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle,
  CreditCard,
  Mail,
  MailOpen,
  ChevronRight,
  Filter,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { FilterBar, FilterSelect } from "@/components/ui/filter-bar";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/hooks/use-queries";
import type { NotificationSummary, NotificationItem } from "@/lib/supabase";

// Static data hoisted outside component to prevent recreation on every render
// See: Vercel Best Practices - rendering-hoist-jsx
const MONTH_OPTIONS_SHORT = [
  { value: "1", label: "ม.ค." },
  { value: "2", label: "ก.พ." },
  { value: "3", label: "มี.ค." },
  { value: "4", label: "เม.ย." },
  { value: "5", label: "พ.ค." },
  { value: "6", label: "มิ.ย." },
  { value: "7", label: "ก.ค." },
  { value: "8", label: "ส.ค." },
  { value: "9", label: "ก.ย." },
  { value: "10", label: "ต.ค." },
  { value: "11", label: "พ.ย." },
  { value: "12", label: "ธ.ค." },
];

export default function NotificationsPage() {
  const { user } = useAuth();
  const { summaries, loading, markAsRead, markAllAsRead, refetch, unreadCount, totalItems } =
    useNotifications(user?.id);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [selectedMonth, setSelectedMonth] = useState("");
  const [isRead, setIsRead] = useState("");
  const [selectedSummary, setSelectedSummary] = useState<NotificationSummary | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i);



  // Filter summaries
  const filteredSummaries = summaries?.filter((summary) => {
    const summaryDate = new Date(summary.date);
    const summaryYear = summaryDate.getFullYear().toString();
    const summaryMonth = (summaryDate.getMonth() + 1).toString();

    const yearMatch = !selectedYear || summaryYear === selectedYear;
    const monthMatch = !selectedMonth || summaryMonth === selectedMonth;
    const readMatch =
      !isRead ||
      (isRead === "read" ? summary.is_read : !summary.is_read);

    return yearMatch && monthMatch && readMatch;
  });

  const handleViewDetails = async (summary: NotificationSummary) => {
    setSelectedSummary(summary);
    setIsModalOpen(true);
    if (!summary.is_read) {
      await markAsRead(summary.id);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const getTypeIcon = (type: string) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case "rent_overdue":
        return <AlertTriangle className={`${iconClass} text-destructive`} />;
      case "rent_due":
        return <Calendar className={`${iconClass} text-warning`} />;
      case "contract_expiring":
        return <Clock className={`${iconClass} text-warning`} />;
      case "payment_received":
        return <CheckCircle className={`${iconClass} text-success`} />;
      case "condo_payment_due":
        return <CreditCard className={`${iconClass} text-info`} />;
      default:
        return <Bell className={`${iconClass} text-muted-foreground`} />;
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-destructive bg-destructive-muted/50";
      case "medium":
        return "border-l-warning bg-warning-muted/50";
      case "low":
        return "border-l-success bg-success-muted/50";
      default:
        return "border-l-border-strong bg-muted/50";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "วันนี้";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "เมื่อวาน";
    }
    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
    });
  };

  const formatFullDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("th-TH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Group items by priority
  const groupItemsByPriority = (items: NotificationItem[]) => {
    const high = items.filter((i) => i.priority === "high");
    const medium = items.filter((i) => i.priority === "medium");
    const low = items.filter((i) => i.priority === "low");
    return { high, medium, low };
  };

  // Calculate stats
  const highPriorityCount = summaries?.reduce((sum, s) => sum + s.high_count, 0) || 0;

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <PageHeader
          title="การแจ้งเตือน"
          description="ติดตามการแจ้งเตือนและข้อมูลสำคัญของคุณ"
          icon={Bell}
          actions={
            unreadCount > 0 ? (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <MailOpen className="h-4 w-4" />
                อ่านทั้งหมด
              </button>
            ) : undefined
          }
        />

        <FilterBar>
          <FilterSelect label="ปี" value={selectedYear} onChange={setSelectedYear}>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year + 543}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="เดือน" value={selectedMonth} onChange={setSelectedMonth}>
            <option value="">ทุกเดือน</option>
            {MONTH_OPTIONS_SHORT.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="สถานะ" value={isRead} onChange={setIsRead}>
            <option value="">ทั้งหมด</option>
            <option value="unread">ยังไม่อ่าน</option>
            <option value="read">อ่านแล้ว</option>
          </FilterSelect>
        </FilterBar>

        {/* Inbox List */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          ) : filteredSummaries?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="p-4 bg-muted rounded-full mb-4">
                <Sparkles className="h-8 w-8" />
              </div>
              <p className="text-lg font-medium text-foreground mb-1">ไม่มีการแจ้งเตือน</p>
              <p className="text-sm">คุณไม่มีรายการแจ้งเตือนในขณะนี้</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredSummaries?.map((summary, idx) => (
                <div
                  key={summary.id}
                  onClick={() => handleViewDetails(summary)}
                  className={`group relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 cursor-pointer transition-all hover:bg-surface-raised ${
                    !summary.is_read ? "bg-primary/5" : ""
                  }`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {/* Unread indicator */}
                  {!summary.is_read && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                  )}

                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all ${
                      !summary.is_read
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground group-hover:bg-accent"
                    }`}
                  >
                    {!summary.is_read ? (
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <MailOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                      <span className={`font-semibold text-sm sm:text-base ${!summary.is_read ? "text-foreground" : "text-foreground"}`}>
                        {formatDate(summary.date)}
                      </span>
                      {!summary.is_read && (
                        <span className="px-1.5 py-0.5 sm:px-2 bg-primary/20 text-primary text-xs font-medium rounded-full">
                          ใหม่
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Bell className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        {summary.total_count} รายการ
                      </span>
                      {summary.high_count > 0 && (
                        <span className="flex items-center gap-1 text-destructive">
                          <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          {summary.high_count} สำคัญ
                        </span>
                      )}
                      {summary.email_sent && (
                        <span className="hidden sm:flex items-center gap-1 text-success">
                          <CheckCircle className="h-3.5 w-3.5" />
                          ส่งเมลแล้ว
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title=""
        size="lg"
      >
        {selectedSummary && (
          <div className="space-y-6">
            {/* Modal Header */}
            <div className="text-center pb-4 border-b border-border">
              <div className="inline-flex p-3 bg-primary/20 rounded-2xl mb-3">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                แจ้งเตือน{formatDate(selectedSummary.date) === "วันนี้" ? "วันนี้" : ""}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {formatFullDate(selectedSummary.date)}
              </p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted rounded-xl p-3 text-center border border-border">
                <div className="text-xl font-bold text-foreground">
                  {selectedSummary.total_count}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">ทั้งหมด</div>
              </div>
              <div className="bg-destructive-muted rounded-xl p-3 text-center border border-destructive/25">
                <div className="text-xl font-bold text-destructive">
                  {selectedSummary.high_count}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">สำคัญ</div>
              </div>
              <div className="bg-warning-muted rounded-xl p-3 text-center border border-warning/25">
                <div className="text-xl font-bold text-warning">
                  {selectedSummary.medium_count}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">ปานกลาง</div>
              </div>
            </div>

            {/* Grouped Items */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {(() => {
                const grouped = groupItemsByPriority(selectedSummary.items || []);
                return (
                  <>
                    {/* High Priority */}
                    {grouped.high.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1 bg-destructive-muted rounded">
                            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                          </div>
                          <span className="text-sm font-medium text-destructive">
                            สำคัญสูง ({grouped.high.length})
                          </span>
                        </div>
                        <div className="space-y-2">
                          {grouped.high.map((item, idx) => (
                            <div
                              key={idx}
                              className={`border-l-4 p-3 rounded-lg ${getPriorityStyles(item.priority)}`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {getTypeIcon(item.type)}
                                <span className="font-medium text-foreground text-sm">{item.title}</span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">{item.message}</p>
                              {item.amount && (
                                <div className="mt-2 inline-flex items-center px-2 py-1 bg-muted rounded text-xs font-medium text-foreground">
                                  ฿{item.amount.toLocaleString()}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Medium Priority */}
                    {grouped.medium.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1 bg-warning-muted rounded">
                            <Calendar className="h-3.5 w-3.5 text-warning" />
                          </div>
                          <span className="text-sm font-medium text-warning">
                            ปานกลาง ({grouped.medium.length})
                          </span>
                        </div>
                        <div className="space-y-2">
                          {grouped.medium.map((item, idx) => (
                            <div
                              key={idx}
                              className={`border-l-4 p-3 rounded-lg ${getPriorityStyles(item.priority)}`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {getTypeIcon(item.type)}
                                <span className="font-medium text-foreground text-sm">{item.title}</span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">{item.message}</p>
                              {item.amount && (
                                <div className="mt-2 inline-flex items-center px-2 py-1 bg-muted rounded text-xs font-medium text-foreground">
                                  ฿{item.amount.toLocaleString()}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Low Priority */}
                    {grouped.low.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1 bg-success-muted rounded">
                            <Bell className="h-3.5 w-3.5 text-success" />
                          </div>
                          <span className="text-sm font-medium text-success">
                            ทั่วไป ({grouped.low.length})
                          </span>
                        </div>
                        <div className="space-y-2">
                          {grouped.low.map((item, idx) => (
                            <div
                              key={idx}
                              className={`border-l-4 p-3 rounded-lg ${getPriorityStyles(item.priority)}`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {getTypeIcon(item.type)}
                                <span className="font-medium text-foreground text-sm">{item.title}</span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">{item.message}</p>
                              {item.amount && (
                                <div className="mt-2 inline-flex items-center px-2 py-1 bg-muted rounded text-xs font-medium text-foreground">
                                  ฿{item.amount.toLocaleString()}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
}
