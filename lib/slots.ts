export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const

/**
 * All valid start hours offered, in half-hour increments from 08:00 to 18:00.
 * Stored as decimals: 8 = 08:00, 8.5 = 08:30, 13.5 = 13:30, etc.
 */
export const SLOT_HOURS = [
  8, 8.5,
  9, 9.5,
  10, 10.5,
  11, 11.5,
  12, 12.5,
  13, 13.5,
  14, 14.5,
  15, 15.5,
  16, 16.5,
  17, 17.5,
  18,
] as const

export type SlotHour = (typeof SLOT_HOURS)[number]

/**
 * Format a decimal hour to a time string.
 * 8   → "08:00"
 * 8.5 → "08:30"
 * 13.5 → "13:30"
 */
export function formatHour(hour: number | string): string {
  const h = typeof hour === "string" ? parseFloat(hour) : hour
  const wholePart = Math.floor(h)
  const mins = h % 1 >= 0.5 ? "30" : "00"
  return `${String(wholePart).padStart(2, "0")}:${mins}`
}

/**
 * Format a decimal hour to an end-time string (1 hour later).
 * 8   → "09:00"
 * 8.5 → "09:30"
 */
export function formatEndHour(hour: number | string): string {
  const h = typeof hour === "string" ? parseFloat(hour) : hour
  return formatHour(h + 1)
}

export function formatSlot(weekday: number, hour: number | string): string {
  return `${WEEKDAYS[weekday]} at ${formatHour(hour)} – ${formatEndHour(hour)}`
}

export type SlotAvailability = {
  id: number
  clubId: number
  weekday: number
  hour: number
  capacity: number
  booked: number
  remaining: number
}
