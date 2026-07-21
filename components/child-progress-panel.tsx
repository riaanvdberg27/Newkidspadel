"use client"

import { useState } from "react"
import type { ChildProgress } from "@/app/actions/child-progress"
import { Activity, ChevronDown, ChevronUp, Star, ClipboardCheck } from "lucide-react"

const SKILL_LABELS: Record<string, string> = {
  forehand: "Forehand",
  backhand: "Backhand",
  serve: "Serve",
  volley: "Volley",
  footwork: "Footwork",
  positioning: "Positioning",
  attitude: "Attitude & Effort",
}

const STATUS_STYLES: Record<string, string> = {
  present: "bg-lime/20 text-navy",
  late: "bg-amber-100 text-amber-800",
  absent: "bg-red-100 text-red-700",
  excused: "bg-blue-100 text-blue-700",
}

export function ChildProgressPanel({ progress }: { progress: ChildProgress }) {
  const [showAttendance, setShowAttendance] = useState(false)
  const [showEvals, setShowEvals] = useState(false)

  const { stats, recent, evaluations } = progress
  const hasData = stats.total > 0 || evaluations.length > 0

  if (!hasData) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Activity className="h-4 w-4 text-lime" /> Progress
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          No attendance or evaluations recorded yet. Your coach will update this after sessions begin.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Activity className="h-4 w-4 text-lime" /> Progress
      </p>

      {/* Attendance summary */}
      {stats.total > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-navy font-medium">Attendance rate</span>
            <span className="text-sm font-bold text-navy">{stats.attendanceRate}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-border" role="progressbar" aria-valuenow={stats.attendanceRate} aria-valuemin={0} aria-valuemax={100}>
            <div
              className={`h-full rounded-full ${stats.attendanceRate >= 80 ? "bg-lime" : stats.attendanceRate >= 50 ? "bg-amber-400" : "bg-red-400"}`}
              style={{ width: `${stats.attendanceRate}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{stats.present} present</span>
            <span>·</span>
            <span>{stats.late} late</span>
            <span>·</span>
            <span>{stats.absent} absent</span>
            <span>·</span>
            <span>{stats.excused} excused</span>
          </div>

          {recent.length > 0 && (
            <button
              onClick={() => setShowAttendance((v) => !v)}
              className="flex items-center gap-1 text-xs font-semibold text-navy hover:underline"
            >
              {showAttendance ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              Recent sessions
            </button>
          )}

          {showAttendance && (
            <div className="space-y-1">
              {recent.map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-2 rounded-md bg-card px-3 py-1.5 text-xs">
                  <span className="text-muted-foreground">
                    {new Date(r.sessionDate).toLocaleDateString("en-ZA", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 font-bold capitalize ${STATUS_STYLES[r.status] ?? "bg-muted text-muted-foreground"}`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Evaluations */}
      {evaluations.length > 0 && (
        <div className="space-y-2 border-t border-border pt-3">
          <button
            onClick={() => setShowEvals((v) => !v)}
            className="flex w-full items-center justify-between gap-1 text-sm font-medium text-navy"
          >
            <span className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-lime" />
              {evaluations.length} progress {evaluations.length === 1 ? "report" : "reports"}
            </span>
            {showEvals ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showEvals && (
            <div className="space-y-3">
              {evaluations.map((ev) => (
                <div key={ev.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(ev.evalDate).toLocaleDateString("en-ZA", { month: "long", day: "numeric", year: "numeric" })} · {ev.coachName}
                    </span>
                    <span className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`h-3.5 w-3.5 ${n <= ev.overallRating ? "fill-lime text-lime" : "text-border"}`}
                        />
                      ))}
                    </span>
                  </div>

                  {Object.keys(ev.skills).length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.entries(ev.skills).map(([skill, rating]) => (
                        <div key={skill} className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-muted-foreground">{SKILL_LABELS[skill] ?? skill}</span>
                          <span className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <span
                                key={n}
                                className={`h-1.5 w-1.5 rounded-full ${n <= rating ? "bg-lime" : "bg-border"}`}
                              />
                            ))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {ev.comments && <p className="text-xs text-navy leading-relaxed">{ev.comments}</p>}
                  {ev.recommendations && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-navy">Focus areas: </span>
                      {ev.recommendations}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
