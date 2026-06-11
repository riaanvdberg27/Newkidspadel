"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

interface Props {
  value: string // "YYYY-MM-DD"
  onChange: (value: string) => void
}

export function DobPicker({ value, onChange }: Props) {
  const now = new Date()
  const currentYear = now.getFullYear()

  // Parse initial value
  const parsed = value ? new Date(value + "T00:00:00") : null
  const [year, setYear] = useState<number>(parsed?.getFullYear() ?? currentYear - 8)
  const [month, setMonth] = useState<number>(parsed?.getMonth() ?? 0)
  const [day, setDay] = useState<number>(parsed?.getDate() ?? 1)
  const [mode, setMode] = useState<"day" | "month" | "year">("day")

  const maxDays = daysInMonth(year, month)
  const safeDay = Math.min(day, maxDays)

  // Sync upward whenever any part changes
  useEffect(() => {
    const safe = Math.min(day, daysInMonth(year, month))
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(safe).padStart(2, "0")}`
    onChange(iso)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, day])

  const minYear = currentYear - 17
  const maxYear = currentYear - 4

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Tab bar */}
      <div className="grid grid-cols-3 border-b border-border">
        {(["day", "month", "year"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`py-3 text-center text-sm font-bold capitalize transition-colors ${
              mode === m
                ? "bg-lime text-lime-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {m === "day" ? String(safeDay).padStart(2, "0")
              : m === "month" ? MONTHS[month].slice(0, 3)
              : year}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {mode === "day" && (
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => { setDay(d); }}
                className={`aspect-square rounded-full text-sm font-semibold transition-all ${
                  d === safeDay
                    ? "bg-lime text-lime-foreground shadow-sm scale-110"
                    : "hover:bg-lime/20 text-foreground"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        )}

        {mode === "month" && (
          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((m, i) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMonth(i); setMode("day"); }}
                className={`rounded-xl py-3 text-sm font-bold transition-all ${
                  i === month
                    ? "bg-lime text-lime-foreground shadow-sm"
                    : "hover:bg-lime/20 text-foreground"
                }`}
              >
                {m.slice(0, 3)}
              </button>
            ))}
          </div>
        )}

        {mode === "year" && (
          <YearPicker
            year={year}
            minYear={minYear}
            maxYear={maxYear}
            onChange={(y) => { setYear(y); setMode("month"); }}
          />
        )}
      </div>

      {/* Summary */}
      <div className="border-t border-border bg-muted/50 px-4 py-2.5 text-center text-sm font-semibold text-navy">
        {MONTHS[month]} {String(safeDay).padStart(2, "0")}, {year}
      </div>
    </div>
  )
}

function YearPicker({
  year, minYear, maxYear, onChange,
}: { year: number; minYear: number; maxYear: number; onChange: (y: number) => void }) {
  const years: number[] = []
  for (let y = maxYear; y >= minYear; y--) years.push(y)

  const [page, setPage] = useState(() => Math.floor(years.indexOf(year) / 12))
  const pageYears = years.slice(page * 12, page * 12 + 12)
  const totalPages = Math.ceil(years.length / 12)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-muted-foreground">
          {pageYears[pageYears.length - 1]} – {pageYears[0]}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page === totalPages - 1}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {pageYears.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => onChange(y)}
            className={`rounded-xl py-2.5 text-sm font-bold transition-all ${
              y === year
                ? "bg-lime text-lime-foreground shadow-sm"
                : "hover:bg-lime/20 text-foreground"
            }`}
          >
            {y}
          </button>
        ))}
      </div>
    </div>
  )
}
