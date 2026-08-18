"use server"

import { db } from "@/lib/db"
import { coaches, coachClubs, clubs, enrollments, sessionAttendance } from "@/lib/db/schema"
import { and, eq, inArray, or } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireCoachId } from "@/lib/coach-auth"
import { weekdayFromDateString } from "@/lib/slots"

export type CoachProfile = {
  id: number
  name: string
  imageUrl: string | null
}

async function requireCoach(): Promise<CoachProfile> {
  const coachId = await requireCoachId()
  const [coach] = await db.select().from(coaches).where(eq(coaches.id, coachId)).limit(1)
  if (!coach || coach.accountStatus !== "active") throw new Error("Not authorized")
  return { id: coach.id, name: coach.name, imageUrl: coach.imageUrl ?? null }
}

export async function getCoachProfile(): Promise<CoachProfile> {
  return requireCoach()
}

/** Clubs assigned to the currently logged-in coach. */
async function getAssignedClubIds(coachId: number): Promise<number[]> {
  const rows = await db.select({ clubId: coachClubs.clubId }).from(coachClubs).where(eq(coachClubs.coachId, coachId))
  return rows.map((r) => r.clubId)
}

export type RosterEntry = {
  enrollmentId: number
  childName: string
  childAge: number
  clubId: number
  clubName: string
  weekday: number
  hour: number | null
  ageGroup: string | null
  status: "present" | "absent" | null
  note: string
}

/** The coach's roster of active enrollments scheduled on the given date, across their assigned clubs. */
export async function getRosterForDate(dateStr: string): Promise<RosterEntry[]> {
  const coach = await requireCoach()
  const clubIds = await getAssignedClubIds(coach.id)
  if (clubIds.length === 0) return []

  const weekday = weekdayFromDateString(dateStr)

  const rows = await db
    .select()
    .from(enrollments)
    .where(
      and(
        inArray(enrollments.clubId, clubIds),
        eq(enrollments.status, "active"),
        or(eq(enrollments.slotWeekday, weekday), eq(enrollments.slotWeekday2, weekday)),
      ),
    )

  if (rows.length === 0) return []

  const clubRows = await db.select().from(clubs).where(inArray(clubs.id, clubIds))
  const clubNameById = new Map(clubRows.map((c) => [c.id, c.name]))

  const enrollmentIds = rows.map((r) => r.id)
  const attendanceRows = await db
    .select()
    .from(sessionAttendance)
    .where(and(inArray(sessionAttendance.enrollmentId, enrollmentIds), eq(sessionAttendance.sessionDate, dateStr)))
  const attendanceByEnrollment = new Map(attendanceRows.map((a) => [a.enrollmentId, a]))

  const entries: RosterEntry[] = []
  for (const e of rows) {
    // A twice-a-week package may match on either slot — emit one roster row per matching slot for that weekday.
    const slotsForToday: { weekday: number | null; hour: number | string | null; ageGroup: string | null }[] = []
    if (e.slotWeekday === weekday) {
      slotsForToday.push({ weekday: e.slotWeekday, hour: e.slotHour, ageGroup: e.slotAgeGroup })
    }
    if (e.slotWeekday2 === weekday && e.slotWeekday2 !== e.slotWeekday) {
      slotsForToday.push({ weekday: e.slotWeekday2, hour: e.slotHour2, ageGroup: e.slotAgeGroup2 })
    }
    for (const slot of slotsForToday) {
      const existing = attendanceByEnrollment.get(e.id)
      entries.push({
        enrollmentId: e.id,
        childName: e.childName,
        childAge: e.childAge,
        clubId: e.clubId!,
        clubName: clubNameById.get(e.clubId!) ?? e.club,
        weekday,
        hour: slot.hour != null ? parseFloat(String(slot.hour)) : null,
        ageGroup: slot.ageGroup,
        status: (existing?.status as "present" | "absent" | undefined) ?? null,
        note: existing?.note ?? "",
      })
    }
  }

  entries.sort((a, b) => (a.hour ?? 0) - (b.hour ?? 0) || a.clubName.localeCompare(b.clubName) || a.childName.localeCompare(b.childName))
  return entries
}

export async function markAttendance(input: {
  enrollmentId: number
  sessionDate: string
  status: "present" | "absent"
  note?: string
}): Promise<{ ok: boolean; error?: string }> {
  const coach = await requireCoach()
  const clubIds = await getAssignedClubIds(coach.id)

  const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.id, input.enrollmentId)).limit(1)
  if (!enrollment || enrollment.clubId == null || !clubIds.includes(enrollment.clubId)) {
    return { ok: false, error: "You are not assigned to this child's club." }
  }

  await db
    .insert(sessionAttendance)
    .values({
      coachId: coach.id,
      enrollmentId: input.enrollmentId,
      sessionDate: input.sessionDate,
      status: input.status,
      note: input.note ?? "",
    })
    .onConflictDoUpdate({
      target: [sessionAttendance.enrollmentId, sessionAttendance.sessionDate],
      set: {
        coachId: coach.id,
        status: input.status,
        note: input.note ?? "",
        updatedAt: new Date(),
      },
    })

  revalidatePath("/coach")
  revalidatePath("/dashboard")
  return { ok: true }
}

/**
 * Attendance summary per enrollment — for the parent dashboard.
 * Callers must only pass enrollment IDs already scoped to the requesting parent.
 */
export async function getAttendanceStatsForEnrollments(
  enrollmentIds: number[],
): Promise<Record<number, { present: number; absent: number; total: number }>> {
  if (enrollmentIds.length === 0) return {}
  const rows = await db
    .select()
    .from(sessionAttendance)
    .where(inArray(sessionAttendance.enrollmentId, enrollmentIds))

  const stats: Record<number, { present: number; absent: number; total: number }> = {}
  for (const r of rows) {
    const s = stats[r.enrollmentId] ?? (stats[r.enrollmentId] = { present: 0, absent: 0, total: 0 })
    s.total += 1
    if (r.status === "present") s.present += 1
    else s.absent += 1
  }
  return stats
}

export type AttendanceRecord = {
  sessionDate: string
  status: "present" | "absent"
  note: string
}

/**
 * Full attendance history per enrollment, newest first — for the parent dashboard.
 * Callers must only pass enrollment IDs already scoped to the requesting parent.
 */
export async function getAttendanceHistoryForEnrollments(
  enrollmentIds: number[],
): Promise<Record<number, AttendanceRecord[]>> {
  if (enrollmentIds.length === 0) return {}
  const rows = await db
    .select()
    .from(sessionAttendance)
    .where(inArray(sessionAttendance.enrollmentId, enrollmentIds))

  const history: Record<number, AttendanceRecord[]> = {}
  for (const r of rows) {
    const list = history[r.enrollmentId] ?? (history[r.enrollmentId] = [])
    list.push({
      sessionDate: r.sessionDate,
      status: r.status as "present" | "absent",
      note: r.note ?? "",
    })
  }
  for (const list of Object.values(history)) {
    list.sort((a, b) => (a.sessionDate < b.sessionDate ? 1 : a.sessionDate > b.sessionDate ? -1 : 0))
  }
  return history
}
