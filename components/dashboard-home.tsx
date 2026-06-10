import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CalendarDays, MapPin, Package, User, Bell, ArrowRight, Trophy } from "lucide-react"
import { CLUBS, PACKAGES } from "@/lib/academy"

type Enrollment = {
  id: number
  referenceNumber: string
  parentName: string
  childName: string
  childAge: number
  club: string
  packageName: string
  status: string
}

type Notification = {
  id: number
  type: string
  title: string
  body: string
  read: boolean
  createdAt: Date | string
}

type Announcement = {
  id: number
  title: string
  body: string
  createdAt: Date | string
}

const STATUS_LABELS: Record<string, string> = {
  processing: "Processing",
  active: "Active",
  paused: "Paused",
  cancelled: "Cancelled",
}

export function DashboardHome({
  enrollment,
  notifications,
  announcements,
  firstName,
}: {
  enrollment: Enrollment
  notifications: Notification[]
  announcements: Announcement[]
  firstName: string
}) {
  const club = CLUBS.find((c) => c.id === enrollment.club)
  const pkg = PACKAGES.find((p) => p.id === enrollment.packageName)
  const unread = notifications.filter((n) => !n.read).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-balance md:text-3xl">
          Welcome back, {firstName}
        </h1>
        <p className="text-muted-foreground">{"Here's everything happening with your child's padel journey."}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Player</CardTitle>
            <Trophy className="size-4 text-primary" />
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <p className="font-heading text-xl font-bold">{enrollment.childName}</p>
            <p className="text-sm text-muted-foreground">{enrollment.childAge} years old</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Programme</CardTitle>
            <Package className="size-4 text-primary" />
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <p className="font-heading text-xl font-bold">{pkg?.name ?? enrollment.packageName}</p>
            <p className="text-sm text-muted-foreground">{pkg?.frequency ?? "Weekly coaching"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Enrollment status</CardTitle>
            <Badge variant={enrollment.status === "active" ? "default" : "secondary"}>
              {STATUS_LABELS[enrollment.status] ?? enrollment.status}
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <p className="font-heading text-xl font-bold">Ref {enrollment.referenceNumber}</p>
            <p className="text-sm text-muted-foreground">Keep this for your records</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Enrollment details</CardTitle>
              <CardDescription>Your registered club and contact on file.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 text-primary" />
                <div className="flex flex-col">
                  <span className="font-medium">{club?.name ?? enrollment.club}</span>
                  <span className="text-sm text-muted-foreground">{club?.address ?? "Club location"}</span>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <User className="mt-0.5 size-5 text-primary" />
                <div className="flex flex-col">
                  <span className="font-medium">{enrollment.parentName}</span>
                  <span className="text-sm text-muted-foreground">Primary parent / guardian</span>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 size-5 text-primary" />
                <div className="flex flex-col gap-2">
                  <span className="font-medium">Weekly sessions</span>
                  <span className="text-sm text-muted-foreground">
                    {club?.schedule ?? "Your coach will confirm your weekly slot before the first session."}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-1">
                <Button
                  render={
                    <Link href="/portal/requests">
                      Request a change
                      <ArrowRight data-icon="inline-end" />
                    </Link>
                  }
                  size="sm"
                />
                <Button render={<Link href="/portal/profile">Update details</Link>} size="sm" variant="outline" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Academy announcements</CardTitle>
              <CardDescription>Latest news from Next Gen Padel Academy.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {announcements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No announcements right now. Check back soon.</p>
              ) : (
                announcements.map((a) => (
                  <div key={a.id} className="flex flex-col gap-1 rounded-lg border border-border bg-muted/40 p-4">
                    <span className="font-medium">{a.title}</span>
                    <span className="text-sm text-muted-foreground">{a.body}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div className="flex flex-col gap-1">
              <CardTitle>Notifications</CardTitle>
              <CardDescription>{unread > 0 ? `${unread} unread` : "You're all caught up"}</CardDescription>
            </div>
            <Bell className="size-5 text-primary" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              notifications.slice(0, 5).map((n) => (
                <div
                  key={n.id}
                  className="flex flex-col gap-1 rounded-lg border border-border p-3"
                  data-unread={!n.read}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{n.title}</span>
                    {!n.read && <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                  </div>
                  <span className="text-sm text-muted-foreground">{n.body}</span>
                </div>
              ))
            )}
            <Button
              render={<Link href="/portal/notifications">View all</Link>}
              size="sm"
              variant="ghost"
              className="self-start"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
