import { CoachShell } from "@/components/coach/coach-shell"
import { getCoachSessions, getCoachDashboard } from "@/app/actions/coach"
import { CoachCalendar } from "@/components/coach/coach-calendar"

export const dynamic = "force-dynamic"

export default async function CoachCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>
}) {
  const [sessions, dashboard] = await Promise.all([getCoachSessions(), getCoachDashboard()])
  const { session } = await searchParams

  return (
    <CoachShell>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy">Calendar &amp; Attendance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your weekly sessions. Expand a session to take attendance.
        </p>
      </div>
      <CoachCalendar sessions={sessions} initialSelectedKey={session} evalEnabled={dashboard.evalEnabled} />
    </CoachShell>
  )
}
