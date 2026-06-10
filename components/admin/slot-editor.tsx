"use client"

import { useEffect, useState, useTransition } from "react"
import { Loader2, Check } from "lucide-react"
import { getClubSlots, setSlotCapacity } from "@/app/actions/admin"
import { SLOT_HOURS, WEEKDAYS, formatHour } from "@/lib/slots"
import { AGE_GROUPS, type AgeGroup, type ClubSlot } from "@/lib/db/schema"

// Mon–Sun order
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  "5-8": "Ages 5 – 8",
  "9-13": "Ages 9 – 13",
  "14-18": "Ages 14 – 18",
}

function AgeGroupGrid({ clubId, ageGroup }: { clubId: number; ageGroup: AgeGroup }) {
  const [grid, setGrid] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [savedKey, setSavedKey] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    let active = true
    setLoading(true)
    getClubSlots(clubId, ageGroup)
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
  }, [clubId, ageGroup])

  function updateCell(weekday: number, hour: number, value: number) {
    const key = `${weekday}-${hour}`
    const capacity = Math.max(0, Math.min(99, Math.floor(value || 0)))
    setGrid((g) => ({ ...g, [key]: capacity }))
    startTransition(async () => {
      await setSlotCapacity({ clubId, weekday, hour, capacity, ageGroup })
      setSavedKey(key)
      setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 1400)
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
        Set available places per time slot for{" "}
        <span className="font-semibold text-navy">{AGE_GROUP_LABELS[ageGroup]}</span>. Enter{" "}
        <span className="font-semibold">0</span> to close a time slot. Changes save automatically.
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
                            value > 0
                              ? "border-lime/60 font-semibold text-navy"
                              : "border-border text-muted-foreground"
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

export function SlotEditor({ clubId }: { clubId: number }) {
  const [activeGroup, setActiveGroup] = useState<AgeGroup>("5-8")

  return (
    <div>
      {/* Age-group tab bar */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted p-1">
        {AGE_GROUPS.map((ag) => (
          <button
            key={ag}
            type="button"
            onClick={() => setActiveGroup(ag)}
            className={`flex-1 rounded-md py-2 text-sm font-bold transition-colors ${
              activeGroup === ag
                ? "bg-navy text-navy-foreground shadow-sm"
                : "text-muted-foreground hover:text-navy"
            }`}
          >
            {AGE_GROUP_LABELS[ag]}
          </button>
        ))}
      </div>

      <div className="mt-5">
        <AgeGroupGrid key={`${clubId}-${activeGroup}`} clubId={clubId} ageGroup={activeGroup} />
      </div>
    </div>
  )
}
