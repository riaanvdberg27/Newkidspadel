"use client"

import { AlertCircle } from "lucide-react"
import { formatHour, formatEndHour, WEEKDAYS } from "@/lib/slots"
import type { CustomSlotWithAvailability } from "@/app/actions/packages"

export type SelectedAdvancedSlots = {
  slot1: { weekday: number; hour: number } | null
  slot2: { weekday: number; hour: number } | null
}

export function AdvancedSlotPicker({
  slots,
  selected,
  onSelect,
}: {
  slots: CustomSlotWithAvailability[]
  selected: SelectedAdvancedSlots
  onSelect: (slots: SelectedAdvancedSlots) => void
}) {
  const handleSlot1Click = (weekday: number, hour: number) => {
    // If slot2 is on the same weekday, clear it
    if (selected.slot2?.weekday === weekday) {
      onSelect({ slot1: { weekday, hour }, slot2: null })
    } else {
      onSelect({ ...selected, slot1: { weekday, hour } })
    }
  }

  const handleSlot2Click = (weekday: number, hour: number) => {
    // Prevent selecting the same weekday as slot1
    if (selected.slot1?.weekday === weekday) {
      return
    }
    onSelect({ ...selected, slot2: { weekday, hour } })
  }

  const byWeekday = new Map<number, CustomSlotWithAvailability[]>()
  for (const s of slots) {
    if (!byWeekday.has(s.weekday)) byWeekday.set(s.weekday, [])
    byWeekday.get(s.weekday)!.push(s)
  }
  const weekdayOrder = [1, 2, 3, 4, 5, 6, 0]
  const orderedWeekdays = weekdayOrder.filter((w) => byWeekday.has(w))

  const isSlot2Disabled = !selected.slot1

  return (
    <div className="space-y-6">
      {/* Slot 1 */}
      <div>
        <h3 className="text-sm font-bold text-navy mb-3">First Coaching Session</h3>
        <div className="space-y-5">
          {orderedWeekdays.map((wd) => (
            <div key={`slot1-${wd}`}>
              <p className="text-sm font-semibold text-navy">{WEEKDAYS[wd]}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {byWeekday
                  .get(wd)!
                  .sort((a, b) => Number(a.hour) - Number(b.hour))
                  .map((s) => {
                    const hourNum = Number(s.hour)
                    const isSelected = selected.slot1?.weekday === s.weekday && selected.slot1?.hour === hourNum
                    const isFull = s.remaining <= 0

                    return (
                      <button
                        key={`slot1-${s.weekday}-${s.hour}`}
                        type="button"
                        disabled={isFull}
                        onClick={() => !isFull && handleSlot1Click(s.weekday, hourNum)}
                        className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                          isFull
                            ? "cursor-not-allowed border-border bg-muted/40 opacity-50"
                            : isSelected
                              ? "border-lime bg-lime/15 text-navy"
                              : "border-border bg-card text-navy hover:border-lime/60"
                        }`}
                      >
                        <span className="font-semibold">{formatHour(hourNum)} – {formatEndHour(hourNum)}</span>
                        {isFull ? (
                          <span className="ml-2 text-xs text-muted-foreground">Full</span>
                        ) : (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {s.remaining} / {s.capacity} spot{s.capacity !== 1 ? "s" : ""} left
                          </span>
                        )}
                      </button>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Slot 2 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-bold text-navy">Second Coaching Session</h3>
          <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
            Different day required
          </span>
        </div>

        {isSlot2Disabled && (
          <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 flex items-start gap-2 mb-4">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-900">Select your first coaching session above to enable time selection here.</p>
          </div>
        )}

        <div className={`space-y-5 ${isSlot2Disabled ? "opacity-50 pointer-events-none" : ""}`}>
          {orderedWeekdays.map((wd) => (
            <div key={`slot2-${wd}`}>
              <p className="text-sm font-semibold text-navy">{WEEKDAYS[wd]}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {byWeekday
                  .get(wd)!
                  .sort((a, b) => Number(a.hour) - Number(b.hour))
                  .map((s) => {
                    const hourNum = Number(s.hour)
                    const isSelected = selected.slot2?.weekday === s.weekday && selected.slot2?.hour === hourNum
                    const isSameWeekdayAsSlot1 = selected.slot1?.weekday === s.weekday
                    const isFull = s.remaining <= 0

                    return (
                      <button
                        key={`slot2-${s.weekday}-${s.hour}`}
                        type="button"
                        disabled={isFull || isSameWeekdayAsSlot1 || isSlot2Disabled}
                        onClick={() => !isSameWeekdayAsSlot1 && !isFull && !isSlot2Disabled && handleSlot2Click(s.weekday, hourNum)}
                        title={isSameWeekdayAsSlot1 ? "Cannot select the same day as first session" : ""}
                        className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                          isSameWeekdayAsSlot1
                            ? "cursor-not-allowed border-border bg-muted/40 opacity-50"
                            : isFull
                              ? "cursor-not-allowed border-border bg-muted/40 opacity-50"
                              : isSelected
                                ? "border-lime bg-lime/15 text-navy"
                                : "border-border bg-card text-navy hover:border-lime/60"
                        }`}
                      >
                        <span className="font-semibold">{formatHour(hourNum)} – {formatEndHour(hourNum)}</span>
                        {isSameWeekdayAsSlot1 ? (
                          <span className="ml-2 text-xs text-muted-foreground">Same day</span>
                        ) : isFull ? (
                          <span className="ml-2 text-xs text-muted-foreground">Full</span>
                        ) : (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {s.remaining} / {s.capacity} spot{s.capacity !== 1 ? "s" : ""} left
                          </span>
                        )}
                      </button>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
