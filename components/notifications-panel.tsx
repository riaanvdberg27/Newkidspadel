"use client"

import { useState, useTransition } from "react"
import { Bell, X } from "lucide-react"
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/notifications"

export type NotificationItem = {
  id: number
  title: string
  message: string
  read: boolean
  createdAt: Date | string
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })
}

export function NotificationsPanel({ notifications, readOnly }: { notifications: NotificationItem[]; readOnly?: boolean }) {
  const [items, setItems] = useState(notifications)
  const [isPending, startTransition] = useTransition()
  const unreadCount = items.filter((n) => !n.read).length

  if (items.length === 0) return null

  function dismiss(id: number) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    if (!readOnly) startTransition(() => { markNotificationRead(id) })
  }

  function dismissAll() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    if (!readOnly) startTransition(() => { markAllNotificationsRead() })
  }

  return (
    <section aria-label="Notifications" className="rounded-card border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border p-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-lime" aria-hidden="true" />
          <h2 className="text-sm font-bold text-navy">Notifications</h2>
          {unreadCount > 0 && (
            <span className="rounded-full bg-lime px-2 py-0.5 text-xs font-bold text-lime-foreground">{unreadCount} new</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={dismissAll}
            disabled={isPending}
            className="text-xs font-medium text-muted-foreground hover:text-navy hover:underline disabled:opacity-50"
          >
            Mark all as read
          </button>
        )}
      </div>
      <ul className="divide-y divide-border">
        {items.slice(0, 8).map((n) => (
          <li
            key={n.id}
            className={`flex items-start justify-between gap-3 p-4 text-sm ${n.read ? "opacity-60" : "bg-lime/5"}`}
          >
            <div>
              <p className="font-semibold text-navy">{n.title}</p>
              <p className="mt-0.5 text-muted-foreground">{n.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatDate(n.createdAt)}</p>
            </div>
            {!n.read && (
              <button
                type="button"
                onClick={() => dismiss(n.id)}
                disabled={isPending}
                aria-label="Dismiss notification"
                className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-navy disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
