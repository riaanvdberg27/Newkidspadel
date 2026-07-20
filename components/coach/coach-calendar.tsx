"use client"

import { useState, useEffect, useCallback } from "react"
import { getAttendanceForDate } from "@/app/actions/coach"
import { formatHour, WEEKDAYS } from "@/lib/coach-utils"
import { AttendanceRow } from "@/components/coach/attendance-row"
import { EvaluationDialog } from "@/components/coach/evaluation-dialog"
import type { CoachSession, CoachPlayer } from "@/app/actions/coach"

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function CoachCalendar({ sessions, initialSelectedKey }: { sessions: CoachSession[]; initialSelectedKey?: string }) {
  const [date, setDate] = useState(todayISO())
  const [expanded, setExpanded] = useState<string | null>(initialSelectedKey ?? null)
  const [attendance, setAttendance] = useState<Record<number, { status: string; note: string }>>({})
  const [loading, setLoading] = useState(false)
  const [evaluating, setEvaluating] = useState<CoachPlayer | null>(null)

  const expandedSession = sessions.find((s) => s.key === expanded)

  const loadAttendance = useCallback(
    async (session: CoachSession, forDate: string) => {
      setLoading(true)
      const ids = session.players.map((p) => p.enrollmentId)
      const data = await getAttendanceForDate(forDate, ids)
      setAttendance(data)
      setLoading(false)
    },
    [],
  )

  useEffect(() => {
    if (expandedSession) {
      loadAttendance(expandedSession, date)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, date])

  // Group sessions by weekday
  const byDay = new Map<number, CoachSession[]>()
  for (const s of sessions) {
    if (!byDay.has(s.weekday)) byDay.set(s.weekday, [])
    byDay.get(s.weekday)!.push(s)
  }
  const orderedDays = Array.from(byDay.keys()).sort((a, b) => a - b)
  const selectedWeekday = new Date(date + "T00:00:00").getDay()

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 rounded-card border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-navy">Attendance date</p>
          <p className="text-xs text-muted-foreground">Pick the date you are recording attendance for.</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-lime"
        />
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-card border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">No players are assigned to you yet. Once an admin assigns players, your sessions will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orderedDays.map((day) => (
            <div key={day}>
              <div className="mb-2 flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wide text-navy">
                  {day >= 0 ? WEEKDAYS[day] : "Unscheduled"}
                </h2>
                {day === selectedWeekday && (
                  <span className="rounded-full bg-lime/15 px-2 py-0.5 text-[10px] font-bold text-lime-700">
                    Selected date
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {byDay.get(day)!.map((s) => {
                  const isOpen = expanded === s.key
                  return (
                    <div key={s.key} className="overflow-hidden rounded-card border border-border bg-card">
                      <button
                        onClick={() => setExpanded(isOpen ? null : s.key)}
                        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/40"
                      >
                        <div>
                          <p className="font-bold text-navy">
                            {formatHour(s.hour)} · {s.schoolName ?? s.club}
                          </p>
                          <p className="text-xs text-muted-foreground">{s.packageName}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="rounded-full bg-lime/15 px-3 py-1 text-sm font-bold text-lime-700">
                            {s.players.length}
                          </span>
                          <svg
                            className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                      {isOpen && (
                        <div className="border-t border-border px-4 pb-2">
                          {loading ? (
                            <p className="py-4 text-center text-sm text-muted-foreground">Loading attendance…</p>
                          ) : (
                            s.players.map((p) => (
                              <AttendanceRow
                                key={p.enrollmentId}
                                player={p}
                                sessionDate={date}
                                initialStatus={attendance[p.enrollmentId]?.status}
                                onEvaluate={setEvaluating}
                              />
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {evaluating && <EvaluationDialog player={evaluating} onClose={() => setEvaluating(null)} />}
    </div>
  )
}
