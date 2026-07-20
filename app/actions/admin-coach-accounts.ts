"use server"

import { db } from "@/lib/db"
import { coaches, coachSchools, enrollments, schools } from "@/lib/db/schema"
import { eq, asc, inArray, sql, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { hashPassword } from "@/lib/coach-auth"

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
}): Promise<{ ok: boolean; error?: string }> {
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

  revalidatePath("/admin")
  return { ok: true }
}

export async function getSchoolsForAccounts() {
  return db.select({ id: schools.id, name: schools.name }).from(schools).orderBy(asc(schools.name))
}
