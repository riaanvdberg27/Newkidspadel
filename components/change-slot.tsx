"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CalendarClock, Check } from "lucide-react"
import { SlotPicker, type SelectedSlot } from "@/components/slot-picker"
import { formatSlot } from "@/lib/slots"
import { updateEnrollmentSlot } from "@/app/actions/enrollment"
import type { AgeGroup } from "@/lib/db/schema"

export function ChangeSlot({
  enrollmentId,
  clubId,
  weekday,
  hour,
  ageGroup,
}: {
  enrollmentId: number
  clubId: number | null
  weekday: number | null
  hour: number | null
  ageGroup: AgeGroup | null
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [slot, setSlot] = useState<SelectedSlot | null>(
    weekday != null && hour != null ? { weekday, hour } : null,
  )
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const current = weekday != null && hour != null ? formatSlot(weekday, hour) : "Not set"

  if (clubId == null) {
    return (
      <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
        <span className="flex items-center gap-2 text-muted-foreground">
          <CalendarClock className="h-4 w-4 text-lime" />
          Time Slot
        </span>
        <span className="text-right font-semibold text-navy">{current}</span>
      </div>
    )
  }

  function save() {
    if (!slot) return
    setError(null)
    startTransition(async () => {
      try {
        await updateEnrollmentSlot({ enrollmentId, slotWeekday: slot.weekday, slotHour: slot.hour })
        setEditing(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not update slot.")
      }
    })
  }

  return (
    <div className="border-b border-border pb-2">
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-2 text-muted-foreground">
          <CalendarClock className="h-4 w-4 text-lime" />
          Time Slot
        </span>
        <span className="flex items-center gap-3">
          <span className="text-right font-semibold text-navy">{current}</span>
          <button
            onClick={() => setEditing((v) => !v)}
            className="rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-navy transition-colors hover:bg-muted"
          >
            {editing ? "Cancel" : "Change"}
          </button>
        </span>
      </div>

      {editing && (
        <div className="mt-3 rounded-md border border-border bg-muted/30 p-3">
          {ageGroup ? (
            <SlotPicker clubId={clubId} ageGroup={ageGroup} selected={slot} onSelect={setSlot} />
          ) : (
            <p className="text-sm text-muted-foreground">Age group not set — cannot filter slots.</p>
          )}
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          <button
            onClick={save}
            disabled={!slot || pending}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-lime px-4 py-2 text-sm font-bold text-lime-foreground transition-colors hover:bg-lime/90 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {pending ? "Saving…" : "Save Slot"}
          </button>
        </div>
      )}
    </div>
  )
}
