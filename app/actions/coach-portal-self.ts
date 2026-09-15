"use server"

/**
 * Coach self-service actions — used by the coach's own portal (/coach/portal).
 * These functions authenticate via the coach session cookie (not the admin cookie).
 */

import { db } from "@/lib/db"
import { sessionAttendance, enrollments, coachClubs, coachSchools } from "@/lib/db/schema"
import { eq, and, gte, lte, asc, inArray, or } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireCoachSession } from "@/lib/coach-auth"
import type { CoachingEnrollment, AttendanceRecord } from "@/app/actions/coaching-portal"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function weekBounds(offset: number): { start: Date; end: Date } {
  const now = new Date()
  const day = now.getDay()
  const diffToMon = day === 0 ? -6 : 1 - day
  const mon = new Date(now)
  mon.setDate(now.getDate() + diffToMon + offset * 7)
  mon.setHours(0, 0, 0, 0)
  const fri = new Date(mon)
  fri.setDate(mon.getDate() + 4)
  fri.setHours(23, 59, 59, 999)
  return { start: mon, end: fri }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function selfGetEnrollments(): Promise<CoachingEnrollment[]> {
  const { coachId } = await requireCoachSession()

  // Resolve which clubs AND schools this coach covers
  const [ccRows, csRows] = await Promise.all([
    db.select({ clubId: coachClubs.clubId }).from(coachClubs).where(eq(coachClubs.coachId, coachId)),
    db.select({ schoolId: coachSchools.schoolId }).from(coachSchools).where(eq(coachSchools.coachId, coachId)),
  ])
  const clubIds = ccRows.map((r) => r.clubId)
  const schoolIds = csRows.map((r) => r.schoolId)
  if (clubIds.length === 0 && schoolIds.length === 0) return []

  const scopeFilter =
    clubIds.length > 0 && schoolIds.length > 0
      ? or(inArray(enrollments.clubId, clubIds), inArray(enrollments.schoolId, schoolIds))
      : clubIds.length > 0
        ? inArray(enrollments.clubId, clubIds)
        : inArray(enrollments.schoolId, schoolIds)

  const rows = await db
    .select()
    .from(enrollments)
    .where(and(scopeFilter, inArray(enrollments.status, ["active", "pending"])))
    .orderBy(asc(enrollments.clubId), asc(enrollments.slotWeekday), asc(enrollments.slotHour))

  return rows.map((r) => ({
    enrollmentId: r.id,
    childName: r.childName ?? "",
    parentName: r.parentName ?? "",
    club: r.club ?? "",
    clubId: r.clubId ?? null,
    schoolId: r.schoolId ?? null,
    schoolName: r.schoolName ?? null,
    packageName: r.packageName ?? "",
    status: r.status ?? "active",
    slotWeekday: r.slotWeekday ?? null,
    slotHour: r.slotHour != null ? Number(r.slotHour) : null,
    slotWeekday2: r.slotWeekday2 ?? null,
    slotHour2: r.slotHour2 != null ? Number(r.slotHour2) : null,
    assignedCoachId: r.coachId ?? null,
    assignedCoachId2: r.coachId2 ?? r.coachId ?? null,
  }))
}

export async function selfGetAttendance(weekOffset: number): Promise<AttendanceRecord[]> {
  const { coachId } = await requireCoachSession()
  const { start, end } = weekBounds(weekOffset)
  const startStr = toDateStr(start)
  const endStr = toDateStr(end)
  const rows = await db
    .select()
    .from(sessionAttendance)
    .where(
      and(
        eq(sessionAttendance.coachId, coachId),
        gte(sessionAttendance.sessionDate, startStr),
        lte(sessionAttendance.sessionDate, endStr)
      )
    )

  return rows.map((r) => ({
    id: r.id,
    enrollmentId: r.enrollmentId,
    sessionDate: String(r.sessionDate).split("T")[0],
    status: r.status as "present" | "absent" | "excused",
    note: r.note ?? null,
  }))
}

export async function selfGetAttendanceHistory(): Promise<AttendanceRecord[]> {
  const { coachId } = await requireCoachSession()
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const cutoff = toDateStr(ninetyDaysAgo)
  const rows = await db
    .select()
    .from(sessionAttendance)
    .where(
      and(
        eq(sessionAttendance.coachId, coachId),
        gte(sessionAttendance.sessionDate, cutoff)
      )
    )
    .orderBy(asc(sessionAttendance.sessionDate))

  return rows.map((r) => ({
    id: r.id,
    enrollmentId: r.enrollmentId,
    sessionDate: String(r.sessionDate).split("T")[0],
    status: r.status as "present" | "absent" | "excused",
    note: r.note ?? null,
  }))
}

export async function selfMarkAttendance(input: {
  enrollmentId: number
  sessionDate: string
  status: "present" | "absent" | "excused"
  note?: string
}): Promise<{ ok: boolean; id?: number; error?: string }> {
  try {
    const { coachId } = await requireCoachSession()
    const existing = await db
      .select({ id: sessionAttendance.id })
      .from(sessionAttendance)
      .where(
        and(
          eq(sessionAttendance.coachId, coachId),
          eq(sessionAttendance.enrollmentId, input.enrollmentId),
          eq(sessionAttendance.sessionDate, input.sessionDate)
        )
      )
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(sessionAttendance)
        .set({ status: input.status, note: input.note ?? null, updatedAt: new Date() })
        .where(eq(sessionAttendance.id, existing[0].id))
      revalidatePath("/coach/portal")
      return { ok: true, id: existing[0].id }
    }

    const [row] = await db
      .insert(sessionAttendance)
      .values({
        coachId,
        enrollmentId: input.enrollmentId,
        sessionDate: input.sessionDate,
        status: input.status,
        note: input.note ?? null,
      })
      .returning({ id: sessionAttendance.id })
    revalidatePath("/coach/portal")
    return { ok: true, id: row.id }
  } catch (err) {
    console.error("[v0] selfMarkAttendance failed:", err)
    return {
      ok: false,
      error:
        err instanceof Error && err.message === "Not authenticated as coach"
          ? "Your session has expired. Please sign in again."
          : err instanceof Error
            ? err.message
            : "Failed to mark attendance",
    }
  }
}

export async function selfCorrectAttendance(
  attendanceId: number,
  status: "present" | "absent" | "excused",
  note?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { coachId } = await requireCoachSession()
    const result = await db
      .update(sessionAttendance)
      .set({ status, note: note ?? null, updatedAt: new Date() })
      .where(
        and(
          eq(sessionAttendance.id, attendanceId),
          eq(sessionAttendance.coachId, coachId) // scoped to this coach
        )
      )
      .returning({ id: sessionAttendance.id })
    if (result.length === 0) {
      return { ok: false, error: "Attendance record not found or not owned by you." }
    }
    revalidatePath("/coach/portal")
    return { ok: true }
  } catch (err) {
    console.error("[v0] selfCorrectAttendance failed:", err)
    return {
      ok: false,
      error:
        err instanceof Error && err.message === "Not authenticated as coach"
          ? "Your session has expired. Please sign in again."
          : err instanceof Error
            ? err.message
            : "Failed to correct attendance",
    }
  }
}
