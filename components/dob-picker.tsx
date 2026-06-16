"use client"

import { useEffect, useState } from "react"

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
  const minYear = currentYear - 17
  const maxYear = currentYear - 4

  const parsed = value ? new Date(value + "T00:00:00") : null
  const [day, setDay] = useState<number>(parsed?.getDate() ?? 1)
  const [month, setMonth] = useState<number>(parsed?.getMonth() ?? 0)
  const [year, setYear] = useState<number>(parsed?.getFullYear() ?? currentYear - 8)

  // Clamp day when month/year changes
  const maxDay = daysInMonth(year, month)
  const safeDay = Math.min(day, maxDay)

  useEffect(() => {
    const d = Math.min(day, daysInMonth(year, month))
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    onChange(iso)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, month, year])

  const years: number[] = []
  for (let y = maxYear; y >= minYear; y--) years.push(y)

  const selectClass =
    "flex-1 rounded-md border border-border bg-card px-2 py-2 text-sm font-semibold text-navy outline-none focus:border-lime appearance-none cursor-pointer"

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        {/* Day */}
        <div className="flex flex-col flex-1">
          <span className="mb-1 text-xs font-semibold text-muted-foreground">Day</span>
          <select
            value={safeDay}
            onChange={(e) => setDay(Number(e.target.value))}
            className={selectClass}
          >
            {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Month */}
        <div className="flex flex-col flex-1">
          <span className="mb-1 text-xs font-semibold text-muted-foreground">Month</span>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className={selectClass}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>{m.slice(0, 3)}</option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div className="flex flex-col flex-1">
          <span className="mb-1 text-xs font-semibold text-muted-foreground">Year</span>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className={selectClass}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Formatted summary */}
      <p className="text-xs text-muted-foreground">
        {MONTHS[month]} {String(safeDay).padStart(2, "0")}, {year}
      </p>
    </div>
  )
}
