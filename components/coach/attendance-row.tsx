"use client"

import { useState, useTransition } from "react"
import { markAttendance } from "@/app/actions/coach"
import { ATTENDANCE_STATUSES } from "@/lib/coach-utils"
import type { CoachPlayer } from "@/app/actions/coach"

export function AttendanceRow({
  player,
  sessionDate,
  initialStatus,
  onEvaluate,
}: {
  player: CoachPlayer
  sessionDate: string
  initialStatus?: string
  onEvaluate: (p: CoachPlayer) => void
}) {
  const [status, setStatus] = useState(initialStatus ?? "")
  const [pending, startTransition] = useTransition()

  function set(next: string) {
    setStatus(next)
    startTransition(async () => {
      await markAttendance({ enrollmentId: player.enrollmentId, sessionDate, status: next })
    })
  }

  return (
    <div className="flex flex-col gap-2 border-b border-border py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-navy">{player.childName}</span>
        <span className="text-xs text-muted-foreground">Age {player.childAge}</span>
        {player.consentMedia ? (
          <span className="rounded-full bg-lime-100 px-1.5 py-0.5 text-[10px] font-semibold text-lime-700" title="Photo consent given">
            Photo OK
          </span>
        ) : (
          <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600" title="No photo consent">
            No photos
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {ATTENDANCE_STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => set(s.value)}
            disabled={pending}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all disabled:opacity-50 ${
              status === s.value ? s.color + " ring-2 ring-offset-1 ring-navy/20" : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {s.label}
          </button>
        ))}
        <button
          onClick={() => onEvaluate(player)}
          className="ml-1 rounded-full border border-lime bg-lime/10 px-2.5 py-1 text-xs font-semibold text-lime-700 hover:bg-lime/20"
        >
          Evaluate
        </button>
      </div>
    </div>
  )
}
