import { formatSlot } from "@/lib/slots"

/**
 * Format both slot1 and slot2 for display (Advanced Package support).
 * Returns a label like "Monday 13:30 & Wednesday 13:30" or "Monday 13:30" (single slot).
 */
export function formatBothSlots(
  slot1Weekday: number | null | undefined,
  slot1Hour: number | null | undefined,
  slot2Weekday?: number | null | undefined,
  slot2Hour?: number | null | undefined
): string {
  if (!slot1Weekday || slot1Hour === null) {
    return "To be confirmed"
  }

  const slot1Label = formatSlot(slot1Weekday, slot1Hour)

  if (slot2Weekday && slot2Hour !== null && slot2Hour !== undefined) {
    const slot2Label = formatSlot(slot2Weekday, slot2Hour)
    return `${slot1Label} & ${slot2Label}`
  }

  return slot1Label
}

/**
 * Compact format for tables: "Mon 13:30 & Wed 13:30" or just "Mon 13:30".
 */
export function formatBothSlotsCompact(
  slot1Weekday: number | null | undefined,
  slot1Hour: number | null | undefined,
  slot2Weekday?: number | null | undefined,
  slot2Hour?: number | null | undefined
): string {
  const full = formatBothSlots(slot1Weekday, slot1Hour, slot2Weekday, slot2Hour)
  // Convert "Monday at 13:30 – 14:30" → "Mon 13:30"
  return full
    .replace(/\bat\s+(\d{1,2}:\d{2})\s+–.*?(?=\s*&|$)/g, "$1")
    .replace(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/g, (day) => day.slice(0, 3))
}
