"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { enrollments, sessionAttendance, playerEvaluations, coaches, coachClubs, coachSchools } from "@/lib/db/schema"
import { and, eq, sql, desc } from "drizzle-orm"
import {
  validateCoachCredentials,
  setCoachSession,
  clearCoachSession,
  requireCoach,
  getCurrentCoach,
} from "@/lib/coach-auth"
import { WEEKDAYS } from "@/lib/coach-utils"

// ---- Auth actions ----

export async function coachLogin(_prev: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")
  if (!email || !password) {
    return { error: "Please enter your email and password." }
  }
  const coachId = await validateCoachCredentials(email, password)
  if (!coachId) {
    return { error: "Invalid email or password, or your account is inactive." }
  }
  await setCoachSession(coachId)
  redirect("/coach")
}

export async function coachLogout() {
  await clearCoachSession()
  redirect("/coach/login")
}

// ---- Roster / sessions ----

export type CoachPlayer = {
  enrollmentId: number
  childName: string
  childAge: number
  parentName: string
  parentMobile: string
  parentEmail: string
  packageName: string
  club: string
  schoolName: string | null
  slotWeekday: number | null
  slotHour: string | null
  status: string
  consentMedia: boolean
}

/** All active players assigned to the current coach. */
export async function getCoachRoster(): Promise<CoachPlayer[]> {
  const coach = await requireCoach()
  const rows = await db
    .select({
      enrollmentId: enrollments.id,
      childName: enrollments.childName,
      childAge: enrollments.childAge,
      parentName: enrollments.parentName,
      parentMobile: enrollments.parentMobile,
      parentEmail: enrollments.parentEmail,
      packageName: enrollments.packageName,
      club: enrollments.club,
      schoolName: enrollments.schoolName,
      slotWeekday: enrollments.slotWeekday,
      slotHour: enrollments.slotHour,
      status: enrollments.status,
      consentMedia: enrollments.consentMedia,
    })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.coachId, coach.id),
        sql`${enrollments.status} != 'cancelled'`,
        sql`${enrollments.packageName} != 'Bootcamp'`,
      ),
    )
    .orderBy(enrollments.slotWeekday, enrollments.slotHour, enrollments.childName)
  return rows.map((r) => ({ ...r, slotHour: r.slotHour ? String(r.slotHour) : null }))
}

export type CoachSession = {
  key: string
  weekday: number
  weekdayLabel: string
  hour: string | null
  club: string
  schoolName: string | null
  packageName: string
  players: CoachPlayer[]
}

/** Roster grouped into weekly recurring sessions (by weekday + hour + venue). */
export async function getCoachSessions(): Promise<CoachSession[]> {
  const roster = await getCoachRoster()
  const map = new Map<string, CoachSession>()
  for (const p of roster) {
    const venue = p.schoolName ?? p.club
    const key = `${p.slotWeekday ?? "x"}-${p.slotHour ?? "x"}-${venue}`
    if (!map.has(key)) {
      map.set(key, {
        key,
        weekday: p.slotWeekday ?? -1,
        weekdayLabel: p.slotWeekday !== null ? WEEKDAYS[p.slotWeekday] : "Unscheduled",
        hour: p.slotHour,
        club: p.club,
        schoolName: p.schoolName,
        packageName: p.packageName,
        players: [],
      })
    }
    map.get(key)!.players.push(p)
  }
  return Array.from(map.values()).sort((a, b) => {
    if (a.weekday !== b.weekday) return a.weekday - b.weekday
    return (Number.parseFloat(a.hour ?? "99") || 99) - (Number.parseFloat(b.hour ?? "99") || 99)
  })
}

export type CoachDashboard = {
  coachName: string
  totalPlayers: number
  clubCount: number
  schoolCount: number
  todaySessions: CoachSession[]
  weekSessionCount: number
  pendingEvaluations: number
}

export async function getCoachDashboard(): Promise<CoachDashboard> {
  const coach = await requireCoach()
  const sessions = await getCoachSessions()
  const roster = sessions.flatMap((s) => s.players)
  const today = new Date().getDay()

  // Use junction tables for accurate club/school counts (not derived from enrollments)
  const [clubRows, schoolRows] = await Promise.all([
    db.select({ id: coachClubs.clubId }).from(coachClubs).where(eq(coachClubs.coachId, coach.id)),
    db.select({ id: coachSchools.schoolId }).from(coachSchools).where(eq(coachSchools.coachId, coach.id)),
  ])
  const todaySessions = sessions.filter((s) => s.weekday === today)

  // Count players with no evaluation yet
  const evaluated = await db
    .select({ enrollmentId: playerEvaluations.enrollmentId })
    .from(playerEvaluations)
    .where(eq(playerEvaluations.coachId, coach.id))
  const evaluatedSet = new Set(evaluated.map((e) => e.enrollmentId))
  const pendingEvaluations = roster.filter((p) => !evaluatedSet.has(p.enrollmentId)).length

  return {
    coachName: coach.name,
    totalPlayers: roster.length,
    clubCount: clubRows.length,
    schoolCount: schoolRows.length,
    todaySessions,
    weekSessionCount: sessions.length,
    pendingEvaluations,
  }
}

// ---- Attendance ----

export async function getAttendanceForDate(sessionDate: string, enrollmentIds: number[]) {
  const coach = await requireCoach()
  if (enrollmentIds.length === 0) return {}
  const rows = await db
    .select()
    .from(sessionAttendance)
    .where(and(eq(sessionAttendance.coachId, coach.id), eq(sessionAttendance.sessionDate, sessionDate)))
  const result: Record<number, { status: string; note: string }> = {}
  for (const r of rows) {
    if (enrollmentIds.includes(r.enrollmentId)) {
      result[r.enrollmentId] = { status: r.status, note: r.note }
    }
  }
  return result
}

export async function markAttendance(input: {
  enrollmentId: number
  sessionDate: string
  status: string
  note?: string
}) {
  const coach = await requireCoach()
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
      set: { status: input.status, note: input.note ?? "", updatedAt: new Date() },
    })
  revalidatePath("/coach")
  return { ok: true }
}

// ---- Evaluations ----

export async function getEvaluationsForPlayer(enrollmentId: number) {
  await requireCoach()
  return db
    .select()
    .from(playerEvaluations)
    .where(eq(playerEvaluations.enrollmentId, enrollmentId))
    .orderBy(desc(playerEvaluations.evalDate))
}

export async function saveEvaluation(input: {
  enrollmentId: number
  skills: Record<string, number>
  comments: string
  overallRating: number
  recommendations: string
}) {
  const coach = await requireCoach()
  await db.insert(playerEvaluations).values({
    coachId: coach.id,
    enrollmentId: input.enrollmentId,
    skills: input.skills,
    comments: input.comments,
    overallRating: input.overallRating,
    recommendations: input.recommendations,
  })
  revalidatePath("/coach")
  return { ok: true }
}

// ---- Profile ----

export async function getCoachProfile() {
  return getCurrentCoach()
}

export async function updateCoachProfile(input: { mobile: string; emergencyContactName: string; emergencyContactPhone: string }) {
  const coach = await requireCoach()
  await db
    .update(coaches)
    .set({
      mobile: input.mobile,
      emergencyContactName: input.emergencyContactName,
      emergencyContactPhone: input.emergencyContactPhone,
      updatedAt: new Date(),
    })
    .where(eq(coaches.id, coach.id))
  revalidatePath("/coach/profile")
  return { ok: true }
}
