export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function formatHour(hour: number | string | null): string {
  if (hour === null || hour === undefined || hour === "") return "—"
  const h = typeof hour === "string" ? Number.parseFloat(hour) : hour
  if (!Number.isFinite(h)) return "—"
  const hours = Math.floor(h)
  const mins = Math.round((h - hours) * 60)
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`
}

export const SKILL_CATEGORIES = [
  { key: "technique", label: "Technique" },
  { key: "footwork", label: "Footwork" },
  { key: "positioning", label: "Positioning" },
  { key: "teamwork", label: "Teamwork" },
  { key: "attitude", label: "Attitude & Effort" },
] as const

export const ATTENDANCE_STATUSES = [
  { value: "present", label: "Present", color: "bg-lime-100 text-lime-700" },
  { value: "absent", label: "Absent", color: "bg-red-100 text-red-600" },
  { value: "late", label: "Late", color: "bg-amber-100 text-amber-700" },
  { value: "excused", label: "Excused", color: "bg-sky-100 text-sky-700" },
] as const
