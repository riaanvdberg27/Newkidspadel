import { redirect } from "next/navigation"
import { getCoachId } from "@/lib/coach-auth"
import { getCoachProfile, getRosterForDate } from "@/app/actions/attendance"
import { todayDateString } from "@/lib/slots"
import { CoachAttendanceBoard } from "@/components/coach/coach-attendance-board"
import { CoachLogoutButton } from "@/components/coach/coach-logout-button"

export const metadata = {
  title: "Coach Portal | Next Gen Padel",
}

type Props = {
  searchParams: Promise<{ date?: string }>
}

export default async function CoachPortalPage({ searchParams }: Props) {
  const coachId = await getCoachId()
  if (!coachId) {
    redirect("/coach/login")
  }

  const { date } = await searchParams
  const sessionDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayDateString()

  const [coach, roster] = await Promise.all([getCoachProfile(), getRosterForDate(sessionDate)])

  return (
    <main className="min-h-screen bg-muted">
      <header className="border-b border-border bg-navy">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-lime">Coach Portal</p>
            <h1 className="text-lg font-extrabold text-white">{coach.name || "Coach"}</h1>
          </div>
          <CoachLogoutButton />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        <CoachAttendanceBoard sessionDate={sessionDate} roster={roster} />
      </div>
    </main>
  )
}
