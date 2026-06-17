"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CalendarClock, Check } from "lucide-react"
import { SlotPicker, type SelectedSlot } from "@/components/slot-picker"
import { PackageSlotPicker } from "@/components/package-slot-picker"
import { formatSlot } from "@/lib/slots"
import { updateEnrollmentSlot } from "@/app/actions/enrollment"
import { getPackageByName } from "@/app/actions/packages"
import type { AgeGroup } from "@/lib/db/schema"

export function ChangeSlot({
  enrollmentId,
  clubId,
  weekday,
  hour,
  ageGroup,
  packageName,
}: {
  enrollmentId: number
  clubId: number | null
  weekday: number | null
  hour: number | null
  ageGroup: AgeGroup | null
  /** The package name stored on the enrollment — used to look up slotType. */
  packageName: string | null
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [slot, setSlot] = useState<SelectedSlot | null>(
    weekday != null && hour != null ? { weekday, hour } : null,
  )
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Resolved package info — loaded once when the edit panel first opens.
  // null = not fetched yet, "loading" = in flight,
  // object = resolved (id=0 means package not found → treat as standard)
  const [pkgInfo, setPkgInfo] = useState<
    { id: number; slotType: "standard" | "custom" } | "loading" | null
  >(null)

  const current = weekday != null && hour != null ? formatSlot(weekday, hour) : "Not set"

  useEffect(() => {
    if (!editing || pkgInfo !== null) return
    if (!packageName) {
      setPkgInfo({ id: 0, slotType: "standard" })
      return
    }
    setPkgInfo("loading")
    getPackageByName(packageName).then((res) =>
      setPkgInfo(res ?? { id: 0, slotType: "standard" }),
    )
  }, [editing, packageName, pkgInfo])

  // No clubId means we can't change the slot — show read-only
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

  const resolvedPkg = pkgInfo !== "loading" ? pkgInfo : null
  const isLoading = pkgInfo === "loading" || (editing && pkgInfo === null)
  const isCustom = resolvedPkg?.slotType === "custom"

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
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading available slots…</p>
          ) : isCustom && resolvedPkg && packageName && ageGroup ? (
            // Package has fixed custom slots — enforce the same rules as enrollment
            <PackageSlotPicker
              packageId={resolvedPkg.id}
              packageName={packageName}
              ageGroup={ageGroup}
              selected={slot}
              onSelect={setSlot}
            />
          ) : ageGroup ? (
            // Standard package — show live venue availability
            <SlotPicker clubId={clubId} ageGroup={ageGroup} selected={slot} onSelect={setSlot} />
          ) : (
            <p className="text-sm text-muted-foreground">Age group not set — cannot filter slots.</p>
          )}
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          <button
            onClick={save}
            disabled={!slot || pending || isLoading}
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
