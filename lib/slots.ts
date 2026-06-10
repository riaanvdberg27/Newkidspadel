export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const

// Hours offered: 08:00 - 18:00 (start hours 8..18)
export const SLOT_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18] as const

export function formatHour(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`
}

export function formatSlot(weekday: number, hour: number) {
  return `${WEEKDAYS[weekday]} at ${formatHour(hour)}`
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
