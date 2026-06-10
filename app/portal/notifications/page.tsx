import { getMyNotifications } from "@/app/actions/portal"
import { NotificationsList } from "@/components/notifications-list"

export default async function NotificationsPage() {
  const notifications = await getMyNotifications()
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">Notifications</h1>
        <p className="text-muted-foreground">Updates about sessions, requests and academy news.</p>
      </div>
      <NotificationsList notifications={notifications} />
    </div>
  )
}
