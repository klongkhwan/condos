"use client"

import { useCallback, useState } from "react"
import { Notification } from "@/components/ui/notification"

type NotificationType = "success" | "error" | "info"

interface NotificationState {
  message: string
  type: NotificationType
}

/**
 * รวม state การแจ้งเตือนที่เคยถูกประกาศซ้ำในทุกหน้า (condos / tenants / rent / financials / personal-finance)
 *
 * const { notify, notificationElement } = useNotification()
 * notify.success("บันทึกแล้ว")
 * ...
 * {notificationElement}
 */
export function useNotification(duration = 3000) {
  const [notification, setNotification] = useState<NotificationState | null>(null)

  const dismiss = useCallback(() => setNotification(null), [])

  const notify = {
    success: useCallback((message: string) => setNotification({ message, type: "success" }), []),
    error: useCallback((message: string) => setNotification({ message, type: "error" }), []),
    info: useCallback((message: string) => setNotification({ message, type: "info" }), []),
  }

  const notificationElement = notification ? (
    <Notification message={notification.message} type={notification.type} onClose={dismiss} duration={duration} />
  ) : null

  return { notify, dismiss, notification, setNotification, notificationElement }
}
