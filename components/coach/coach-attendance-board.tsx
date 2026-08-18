"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Check, X, Users } from "lucide-react"
import { markAttendance, type RosterEntry } from "@/app/actions/attendance"
import { addDaysToDateString, formatDateString, formatHour, todayDateString } from "@/lib/slots"

type Props = {
  sessionDate: string
  roster: RosterEntry[]
}

export function CoachAttendanceBoard({ sessionDate, roster: initialRoster }: Props) {
  const router = useRouter()
  const [roster, setRoster] = useState(initialRoster)
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set())
  const [, startTransition] = useTransition()
  const isToday = sessionDate === todayDateString()

  const groups = useMemo(() => {
    const byClub = new Map<string, RosterEntry[]>()
    for (const entry of roster) {
      const key = entry.clubName
      if (!byClub.has(key)) byClub.set(key, [])
      byClub.get(key)!.push(entry)
    }
    return Array.from(byClub.entries())
  }, [roster])

  const markedCount = roster.filter((r) => r.status !== null).length

  function goToDate(newDate: string) {
    router.push(`/coach?date=${newDate}`)
  }

  function setStatus(enrollmentId: number, status: "present" | "absent") {
    setRoster((prev) => prev.map((r) => (r.enrollmentId === enrollmentId ? { ...r, status } : r)))
    setPendingIds((prev) => new Set(prev).add(enrollmentId))
    startTransition(async () => {
      const result = await markAttendance({ enrollmentId, sessionDate, status })
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(enrollmentId)
        return next
      })
      if (!result.ok) {
        // revert on failure
        setRoster((prev) => prev.map((r) => (r.enrollmentId === enrollmentId ? { ...r, status: null } : r)))
      }
    })
  }

  return (
    <div>
      {/* Date navigator */}
      <div className="flex items-center justify-between rounded-card border border-border bg-card px-4 py-3 shadow-sm">
        <button
          type="button"
          onClick={() => goToDate(addDaysToDateString(sessionDate, -1))}
          className="flex h-9 w-9 items-center justify-center rounded-md text-navy transition-colors hover:bg-muted"
          aria-label="Previous day"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-navy">{formatDateString(sessionDate)}</p>
          {!isToday && (
            <button
              type="button"
              onClick={() => goToDate(todayDateString())}
              className="text-xs font-medium text-lime underline-offset-2 hover:underline"
            >
              Jump to today
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => goToDate(addDaysToDateString(sessionDate, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-md text-navy transition-colors hover:bg-muted"
          aria-label="Next day"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Summary */}
      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>
          {markedCount} of {roster.length} marked
        </span>
      </div>

      {roster.length === 0 ? (
        <div className="mt-6 rounded-card border border-dashed border-border bg-card px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">No sessions scheduled for this date at your club(s).</p>
        </div>
      ) : (
        <div className="mt-4 space-y-6">
          {groups.map(([clubName, entries]) => (
            <div key={clubName}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-navy">{clubName}</h2>
              <ul className="space-y-2">
                {entries.map((entry) => {
                  const isPending = pendingIds.has(entry.enrollmentId)
                  return (
                    <li
                      key={entry.enrollmentId}
                      className="flex items-center justify-between gap-3 rounded-card border border-border bg-card px-4 py-3 shadow-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-navy">{entry.childName}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.hour != null ? `${formatHour(entry.hour)}` : ""}
                          {entry.ageGroup ? ` · ${entry.ageGroup}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => setStatus(entry.enrollmentId, "present")}
                          aria-pressed={entry.status === "present"}
                          className={`flex h-9 w-9 items-center justify-center rounded-md border transition-colors disabled:opacity-50 ${
                            entry.status === "present"
                              ? "border-lime bg-lime text-lime-foreground"
                              : "border-border bg-transparent text-muted-foreground hover:border-lime hover:text-lime"
                          }`}
                          aria-label={`Mark ${entry.childName} present`}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => setStatus(entry.enrollmentId, "absent")}
                          aria-pressed={entry.status === "absent"}
                          className={`flex h-9 w-9 items-center justify-center rounded-md border transition-colors disabled:opacity-50 ${
                            entry.status === "absent"
                              ? "border-destructive bg-destructive text-destructive-foreground"
                              : "border-border bg-transparent text-muted-foreground hover:border-destructive hover:text-destructive"
                          }`}
                          aria-label={`Mark ${entry.childName} absent`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
