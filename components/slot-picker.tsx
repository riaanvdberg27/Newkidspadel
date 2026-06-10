"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { getClubAvailability } from "@/app/actions/clubs"
import { formatHour, WEEKDAYS, type SlotAvailability } from "@/lib/slots"
import type { AgeGroup } from "@/lib/db/schema"

export type SelectedSlot = { weekday: number; hour: number }

export function SlotPicker({
  clubId,
  ageGroup,
  selected,
  onSelect,
}: {
  clubId: number
  ageGroup: AgeGroup
  selected: SelectedSlot | null
  onSelect: (slot: SelectedSlot) => void
}) {
  const [slots, setSlots] = useState<SlotAvailability[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    setSlots(null)
    getClubAvailability(clubId, ageGroup)
      .then((data) => {
        if (active) setSlots(data)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [clubId, ageGroup])

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading available times…
      </div>
    )
  }

  const offered = (slots ?? []).filter((s) => s.capacity > 0)

  if (offered.length === 0) {
    return (
      <p className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        No time slots have been set up for this age group at this club yet. Please choose another club or contact us.
      </p>
    )
  }

  // Group by weekday
  const byWeekday = new Map<number, SlotAvailability[]>()
  for (const s of offered) {
    if (!byWeekday.has(s.weekday)) byWeekday.set(s.weekday, [])
    byWeekday.get(s.weekday)!.push(s)
  }
  const weekdayOrder = [1, 2, 3, 4, 5, 6, 0]
  const orderedWeekdays = weekdayOrder.filter((w) => byWeekday.has(w))

  return (
    <div className="space-y-5">
      {orderedWeekdays.map((wd) => (
        <div key={wd}>
          <p className="text-sm font-semibold text-navy">{WEEKDAYS[wd]}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {byWeekday
              .get(wd)!
              .sort((a, b) => a.hour - b.hour)
              .map((s) => {
                const isSelected = selected?.weekday === s.weekday && selected?.hour === s.hour
                const full = s.remaining <= 0
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={full}
                    onClick={() => onSelect({ weekday: s.weekday, hour: s.hour })}
                    className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      isSelected
                        ? "border-lime bg-lime/15 text-navy"
                        : full
                          ? "cursor-not-allowed border-border bg-muted text-muted-foreground opacity-60"
                          : "border-border bg-card text-navy hover:border-lime/60"
                    }`}
                  >
                    <span className="font-semibold">{formatHour(s.hour)}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {full ? "Full" : `${s.remaining} left`}
                    </span>
                  </button>
                )
              })}
          </div>
        </div>
      ))}
    </div>
  )
}
