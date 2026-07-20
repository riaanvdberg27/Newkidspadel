import Link from "next/link"
import { CoachShell } from "@/components/coach/coach-shell"
import { getCoachDashboard } from "@/app/actions/coach"
import { formatHour } from "@/lib/coach-utils"

export const dynamic = "force-dynamic"

function StatCard({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className={`rounded-card border border-border p-4 ${accent ? "bg-lime/10" : "bg-card"}`}>
      <p className="text-2xl font-extrabold text-navy">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function CoachDashboardPage() {
  const data = await getCoachDashboard()
  const firstName = data.coachName.split(" ")[0] || "Coach"

  return (
    <CoachShell>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy text-balance">Welcome back, {firstName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Here&apos;s your coaching overview for today.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Players" value={data.totalPlayers} accent />
        <StatCard label="Clubs" value={data.clubCount} />
        <StatCard label="Schools" value={data.schoolCount} />
        <StatCard label="Weekly Sessions" value={data.weekSessionCount} />
      </div>

      {data.pendingEvaluations > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-card border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-800">
            {data.pendingEvaluations} player{data.pendingEvaluations === 1 ? "" : "s"} still need a first evaluation.
          </p>
          <Link href="/coach/players" className="text-sm font-bold text-amber-900 underline">
            Review
          </Link>
        </div>
      )}

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">Today&apos;s Sessions</h2>
          <Link href="/coach/calendar" className="text-sm font-semibold text-lime-700 hover:underline">
            Full calendar →
          </Link>
        </div>

        {data.todaySessions.length === 0 ? (
          <div className="rounded-card border border-dashed border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">No sessions scheduled for today. Enjoy your day off!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.todaySessions.map((s) => (
              <Link
                key={s.key}
                href={`/coach/calendar?session=${encodeURIComponent(s.key)}`}
                className="flex items-center justify-between rounded-card border border-border bg-card p-4 transition-colors hover:border-lime"
              >
                <div>
                  <p className="font-bold text-navy">
                    {formatHour(s.hour)} · {s.schoolName ?? s.club}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.packageName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-lime/15 px-3 py-1 text-sm font-bold text-lime-700">
                    {s.players.length} player{s.players.length === 1 ? "" : "s"}
                  </span>
                  <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </CoachShell>
  )
}
