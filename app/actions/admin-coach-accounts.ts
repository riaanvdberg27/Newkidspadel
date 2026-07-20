"use server"

import { db } from "@/lib/db"
import { coaches, coachSchools, coachClubs, enrollments, schools, clubs } from "@/lib/db/schema"
import { eq, asc, inArray, sql, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { hashPassword } from "@/lib/coach-auth"
import { sendCoachWelcomeEmail } from "@/lib/email"

const PORTAL_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://nextgenpadelacademy.co.za"

export type CoachAccountRow = {
  id: number
  name: string
  role: string
  email: string | null
  mobile: string
  qualifications: string
  employmentStatus: string
  emergencyContactName: string
  emergencyContactPhone: string
  accountStatus: string
  hasPassword: boolean
  schoolIds: number[]
  clubIds: number[]
  playerCount: number
}

export async function getCoachAccounts(): Promise<CoachAccountRow[]> {
  const rows = await db.select().from(coaches).orderBy(asc(coaches.sortOrder), asc(coaches.id))
  if (rows.length === 0) return []
  const ids = rows.map((r) => r.id)

  const schoolLinks = await db
    .select({ coachId: coachSchools.coachId, schoolId: coachSchools.schoolId })
    .from(coachSchools)
    .where(inArray(coachSchools.coachId, ids))
  const schoolMap = new Map<number, number[]>()
  for (const l of schoolLinks) {
    if (!schoolMap.has(l.coachId)) schoolMap.set(l.coachId, [])
    schoolMap.get(l.coachId)!.push(l.schoolId)
  }

  const clubLinks = await db
    .select({ coachId: coachClubs.coachId, clubId: coachClubs.clubId })
    .from(coachClubs)
    .where(inArray(coachClubs.coachId, ids))
  const clubMap = new Map<number, number[]>()
  for (const l of clubLinks) {
    if (!clubMap.has(l.coachId)) clubMap.set(l.coachId, [])
    clubMap.get(l.coachId)!.push(l.clubId)
  }

  const counts = await db
    .select({ coachId: enrollments.coachId, count: sql<number>`count(*)::int` })
    .from(enrollments)
    .where(and(inArray(enrollments.coachId, ids), sql`${enrollments.status} != 'cancelled'`))
    .groupBy(enrollments.coachId)
  const countMap = new Map<number, number>()
  for (const c of counts) if (c.coachId !== null) countMap.set(c.coachId, c.count)

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    email: r.email ?? null,
    mobile: r.mobile,
    qualifications: r.qualifications,
    employmentStatus: r.employmentStatus,
    emergencyContactName: r.emergencyContactName,
    emergencyContactPhone: r.emergencyContactPhone,
    accountStatus: r.accountStatus,
    hasPassword: Boolean(r.passwordHash),
    schoolIds: schoolMap.get(r.id) ?? [],
    clubIds: clubMap.get(r.id) ?? [],
    playerCount: countMap.get(r.id) ?? 0,
  }))
}

export async function saveCoachAccount(input: {
  id: number
  email: string
  password?: string
  mobile: string
  qualifications: string
  employmentStatus: string
  emergencyContactName: string
  emergencyContactPhone: string
  accountStatus: string
  schoolIds: number[]
  clubIds: number[]
}): Promise<{ ok: boolean; error?: string; welcomeEmailSent?: boolean }> {
  const cleanEmail = input.email.trim().toLowerCase()

  if (cleanEmail) {
    // Ensure the email is unique across coaches
    const existing = await db
      .select({ id: coaches.id })
      .from(coaches)
      .where(sql`lower(${coaches.email}) = ${cleanEmail}`)
    if (existing.some((e) => e.id !== input.id)) {
      return { ok: false, error: "That email is already used by another coach." }
    }
  }

  // Fetch current record so we can detect first-time password set
  const [current] = await db
    .select({ name: coaches.name, passwordHash: coaches.passwordHash })
    .from(coaches)
    .where(eq(coaches.id, input.id))

  const isFirstPassword =
    !current?.passwordHash && Boolean(input.password && input.password.length >= 6)

  const setFields: Record<string, unknown> = {
    email: cleanEmail || null,
    mobile: input.mobile,
    qualifications: input.qualifications,
    employmentStatus: input.employmentStatus,
    emergencyContactName: input.emergencyContactName,
    emergencyContactPhone: input.emergencyContactPhone,
    accountStatus: input.accountStatus,
    updatedAt: new Date(),
  }
  if (input.password && input.password.length >= 6) {
    setFields.passwordHash = hashPassword(input.password)
  }

  await db.update(coaches).set(setFields).where(eq(coaches.id, input.id))

  // Sync school assignments
  await db.delete(coachSchools).where(eq(coachSchools.coachId, input.id))
  if (input.schoolIds.length > 0) {
    await db.insert(coachSchools).values(input.schoolIds.map((schoolId) => ({ coachId: input.id, schoolId })))
  }

  // Sync club assignments
  await db.delete(coachClubs).where(eq(coachClubs.coachId, input.id))
  if (input.clubIds.length > 0) {
    await db.insert(coachClubs).values(input.clubIds.map((clubId) => ({ coachId: input.id, clubId })))
  }

  revalidatePath("/admin")

  // Send welcome email on first-time password creation (coach has an email set)
  let welcomeEmailSent = false
  if (isFirstPassword && cleanEmail) {
    const emailResult = await sendCoachWelcomeEmail({
      to: cleanEmail,
      coachName: current?.name ?? "Coach",
      password: input.password!,
      portalUrl: `${PORTAL_URL}/coach/login`,
    })
    welcomeEmailSent = emailResult.ok
  }

  return { ok: true, welcomeEmailSent }
}

export async function getSchoolsForAccounts() {
  return db.select({ id: schools.id, name: schools.name }).from(schools).orderBy(asc(schools.name))
}

export async function getClubsForAccounts() {
  return db.select({ id: clubs.id, name: clubs.name }).from(clubs).orderBy(asc(clubs.name))
}
