"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, History } from "lucide-react"
import type { AttendanceRecord } from "@/app/actions/attendance"

type Props = {
  records: AttendanceRecord[]
}

function formatSessionDate(dateStr: string) {
  // sessionDate is stored as a plain YYYY-MM-DD string — parse manually to avoid timezone shifts.
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString("en-ZA", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function AttendanceHistory({ records }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (records.length === 0) return null

  const visible = expanded ? records : records.slice(0, 3)

  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 p-3 text-left"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <History className="h-3.5 w-3.5" />
          Attendance History
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      <div className="border-t border-border divide-y divide-border">
        {visible.map((r) => (
          <div key={r.sessionDate} className="flex items-start justify-between gap-3 px-3 py-2 text-sm">
            <div className="flex items-start gap-2">
              {r.status === "present" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-lime-600" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              )}
              <div>
                <p className="text-navy">{formatSessionDate(r.sessionDate)}</p>
                {r.note && <p className="mt-0.5 text-xs text-muted-foreground">{r.note}</p>}
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold capitalize ${
                r.status === "present" ? "bg-lime/20 text-navy" : "bg-red-100 text-red-700"
              }`}
            >
              {r.status}
            </span>
          </div>
        ))}
      </div>

      {records.length > 3 && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full border-t border-border px-3 py-2 text-center text-xs font-semibold text-navy transition-colors hover:bg-muted/40"
        >
          Show all {records.length} sessions
        </button>
      )}
    </div>
  )
}
