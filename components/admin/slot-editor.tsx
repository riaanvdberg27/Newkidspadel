"use client"

import { useEffect, useState, useTransition } from "react"
import { Loader2, Check } from "lucide-react"
import { getClubSlots, setSlotCapacity } from "@/app/actions/admin"
import { SLOT_HOURS, WEEKDAYS, formatHour } from "@/lib/slots"
import type { ClubSlot } from "@/lib/db/schema"

// Weekdays shown in the editor (Mon-Sun order)
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function SlotEditor({ clubId }: { clubId: number }) {
  // capacity keyed by "weekday-hour"
  const [grid, setGrid] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [savedKey, setSavedKey] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    let active = true
    setLoading(true)
    getClubSlots(clubId)
      .then((slots: ClubSlot[]) => {
        if (!active) return
        const next: Record<string, number> = {}
        for (const s of slots) next[`${s.weekday}-${s.hour}`] = s.capacity
        setGrid(next)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [clubId])

  function updateCell(weekday: number, hour: number, value: number) {
    const key = `${weekday}-${hour}`
    const capacity = Math.max(0, Math.min(99, Math.floor(value || 0)))
    setGrid((g) => ({ ...g, [key]: capacity }))
    startTransition(async () => {
      await setSlotCapacity({ clubId, weekday, hour, capacity })
      setSavedKey(key)
      setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 1200)
    })
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading slot grid…
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        Set the number of available places for each hour (08:00–18:00) on each day. Enter 0 to close a time. Changes
        save automatically. Existing bookings are never removed.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-center text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 bg-card p-2 text-left font-semibold text-navy">Time</th>
              {WEEKDAY_ORDER.map((wd) => (
                <th key={wd} className="p-2 font-semibold text-navy">
                  {WEEKDAYS[wd].slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SLOT_HOURS.map((hour) => (
              <tr key={hour} className="border-t border-border">
                <td className="sticky left-0 bg-card p-2 text-left font-semibold text-muted-foreground">
                  {formatHour(hour)}
                </td>
                {WEEKDAY_ORDER.map((wd) => {
                  const key = `${wd}-${hour}`
                  const value = grid[key] ?? 0
                  return (
                    <td key={wd} className="p-1">
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={99}
                          value={value}
                          onChange={(e) => updateCell(wd, hour, Number(e.target.value))}
                          className={`w-14 rounded-md border bg-card px-2 py-1.5 text-center outline-none focus:border-lime ${
                            value > 0 ? "border-lime/60 font-semibold text-navy" : "border-border text-muted-foreground"
                          }`}
                        />
                        {savedKey === key && (
                          <Check className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-lime p-0.5 text-lime-foreground" />
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pending && (
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Saving…
        </p>
      )}
    </div>
  )
}
