"use client"

import { useState, useTransition } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/portal"
import { Bell, BellOff, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Notification = {
  id: number
  type: string
  title: string
  body: string
  read: boolean
  createdAt: Date | string
}

const TYPE_LABELS: Record<string, string> = {
  enrollment_update: "Enrollment",
  session_reminder: "Session",
  announcement: "Announcement",
  welcome: "Welcome",
}

export function NotificationsList({ notifications }: { notifications: Notification[] }) {
  const [items, setItems] = useState(notifications)
  const [isPending, startTransition] = useTransition()

  const unread = items.filter((n) => !n.read).length

  function readOne(id: number) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    startTransition(async () => {
      await markNotificationRead(id)
    })
  }

  function readAll() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    startTransition(async () => {
      await markAllNotificationsRead()
      toast.success("All notifications marked as read")
    })
  }

  if (items.length === 0) {
    return (
      <Empty className="rounded-xl border border-dashed border-border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BellOff />
          </EmptyMedia>
          <EmptyTitle>No notifications</EmptyTitle>
          <EmptyDescription>{"You're all caught up. We'll let you know when something happens."}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary">{unread > 0 ? `${unread} unread` : "All read"}</Badge>
        {unread > 0 && (
          <Button size="sm" variant="outline" onClick={readAll} disabled={isPending}>
            <Check data-icon="inline-start" />
            Mark all read
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {items.map((n) => (
          <Card key={n.id} className={cn(!n.read && "border-primary/40 bg-primary/5")}>
            <CardContent className="flex items-start gap-3 p-4">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bell className="size-4" />
              </span>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{n.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {TYPE_LABELS[n.type] ?? "Update"}
                  </Badge>
                  {!n.read && <span className="size-2 rounded-full bg-primary" aria-label="Unread" />}
                </div>
                <p className="text-sm text-muted-foreground">{n.body}</p>
                <span className="text-xs text-muted-foreground">
                  {new Date(n.createdAt).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              {!n.read && (
                <Button size="sm" variant="ghost" onClick={() => readOne(n.id)} disabled={isPending}>
                  Mark read
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
