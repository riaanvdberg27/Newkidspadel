"use server"

import { db } from "@/lib/db"
import { enrollments } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/admin-auth"

export type EnrollmentReportRow = {
  /** "2025-03" */
  monthKey: string
  /** "March 2025" */
  monthLabel: string
  clubEnrollments: number
  schoolEnrollments: number
  total: number
  active: number
  pending: number
  cancelled: number
  onHold: number
  paid: number
  unpaid: number
}

export type EnrollmentReportFilters = {
  /** Club name to filter by, or "" for all clubs */
  club: string
  /** School name to filter by, or "" for all schools */
  school: string
  /** "club" | "school" | "" — limit to only club-type or only school-type enrollments */
  type: "club" | "school" | ""
}

export type EnrollmentReportSummary = {
  rows: EnrollmentReportRow[]
  totalEnrollments: number
  clubs: string[]
  schools: string[]
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function monthLabel(key: string): string {
  const [y, m] = key.split("-")
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`
}

export async function getEnrollmentReport(
  filters: EnrollmentReportFilters,
): Promise<EnrollmentReportSummary> {
  await requireAdmin()

  // Fetch all enrollments (small dataset — admin only)
  const all = await db
    .select({
      createdAt: enrollments.createdAt,
      club: enrollments.club,
      schoolName: enrollments.schoolName,
      schoolId: enrollments.schoolId,
      status: enrollments.status,
      paymentStatus: enrollments.paymentStatus,
    })
    .from(enrollments)

  // Derive unique lists for filter dropdowns (before filtering)
  const clubs = Array.from(
    new Set(all.map((r) => r.club).filter((c): c is string => !!c && c !== "School Program")),
  ).sort()
  const schools = Array.from(
    new Set(all.map((r) => r.schoolName).filter((s): s is string => !!s)),
  ).sort()

  // Apply filters
  const filtered = all.filter((r) => {
    const isSchool = !!r.schoolId || !!r.schoolName || r.club === "School Program"
    if (filters.type === "club" && isSchool) return false
    if (filters.type === "school" && !isSchool) return false
    if (filters.club && r.club !== filters.club) return false
    if (filters.school && r.schoolName !== filters.school) return false
    return true
  })

  // Group by month
  const byMonth: Record<string, EnrollmentReportRow> = {}

  for (const r of filtered) {
    const date = r.createdAt ? new Date(r.createdAt) : new Date()
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const isSchool = !!r.schoolId || !!r.schoolName || r.club === "School Program"

    if (!byMonth[key]) {
      byMonth[key] = {
        monthKey: key,
        monthLabel: monthLabel(key),
        clubEnrollments: 0,
        schoolEnrollments: 0,
        total: 0,
        active: 0,
        pending: 0,
        cancelled: 0,
        onHold: 0,
        paid: 0,
        unpaid: 0,
      }
    }

    const row = byMonth[key]
    row.total++
    if (isSchool) row.schoolEnrollments++
    else row.clubEnrollments++

    switch (r.status) {
      case "active": row.active++; break
      case "pending": row.pending++; break
      case "cancelled": row.cancelled++; break
      case "on-hold": row.onHold++; break
    }

    if (r.paymentStatus === "paid") row.paid++
    else row.unpaid++
  }

  // Sort newest first
  const rows = Object.values(byMonth).sort((a, b) => b.monthKey.localeCompare(a.monthKey))

  return {
    rows,
    totalEnrollments: filtered.length,
    clubs,
    schools,
  }
}
