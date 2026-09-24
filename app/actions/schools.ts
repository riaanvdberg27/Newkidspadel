"use server"

import { db } from "@/lib/db"
import { schools, coachSchools, coaches, schoolSlots } from "@/lib/db/schema"
import { asc, eq, and, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/admin-auth"
import type { School, SchoolSlot, AgeGroup } from "@/lib/db/schema"
import { AGE_GROUPS } from "@/lib/db/schema"
import { SLOT_HOURS } from "@/lib/slots"
import { toFriendlyDbError } from "@/lib/db-errors"

export type SchoolInput = {
  name: string
  location: string
  address: string
  phone: string
  email: string
  website: string
  description: string
  logoUrl?: string | null
  contactPerson: string
  published: boolean
  coachIds: number[]
}

/** All published schools for the public site. */
export async function getPublishedSchools(): Promise<School[]> {
  return db.select().from(schools).where(eq(schools.published, true)).orderBy(asc(schools.name))
}

/** All schools for admin (published + unpublished). */
export async function getAllSchoolsAdmin(): Promise<School[]> {
  return db.select().from(schools).orderBy(asc(schools.name))
}

/** A single school by id. */
export async function getSchoolById(id: number): Promise<School | null> {
  const rows = await db.select().from(schools).where(eq(schools.id, id)).limit(1)
  return rows[0] ?? null
}

/** Coach IDs assigned to each school (admin only) — keyed by schoolId. */
export async function getSchoolCoachAssignments(): Promise<Record<number, number[]>> {
  await requireAdmin()
  const rows = await db.select().from(coachSchools)
  const map: Record<number, number[]> = {}
  for (const r of rows) {
    if (!map[r.schoolId]) map[r.schoolId] = []
    map[r.schoolId].push(r.coachId)
  }
  return map
}

/** Coaches assigned to a specific school — used by the enrollment/coaching portal to attribute students. */
export async function getCoachesBySchool(schoolId: number) {
  const assignments = await db
    .select({ coachId: coachSchools.coachId })
    .from(coachSchools)
    .where(eq(coachSchools.schoolId, schoolId))
  if (assignments.length === 0) return []
  const coachIds = assignments.map((a) => a.coachId)
  return db
    .select({ id: coaches.id, name: coaches.name })
    .from(coaches)
    .where(inArray(coaches.id, coachIds))
    .orderBy(asc(coaches.sortOrder), asc(coaches.id))
}

async function syncSchoolCoaches(schoolId: number, coachIds: number[]) {
  await db.delete(coachSchools).where(eq(coachSchools.schoolId, schoolId))
  if (coachIds.length > 0) {
    await db.insert(coachSchools).values(coachIds.map((coachId) => ({ coachId, schoolId })))
  }
}

/** Create a new school (admin only). */
export async function createSchool(
  input: SchoolInput,
): Promise<{ ok: true; school: School } | { ok: false; error: string }> {
  await requireAdmin()
  try {
    const [row] = await db
      .insert(schools)
      .values({
        name: input.name,
        location: input.location,
        address: input.address,
        phone: input.phone,
        email: input.email,
        website: input.website,
        description: input.description,
        logoUrl: input.logoUrl ?? null,
        contactPerson: input.contactPerson,
        published: input.published,
      })
      .returning()
    await syncSchoolCoaches(row.id, input.coachIds ?? [])
    revalidatePath("/schools")
    revalidatePath("/admin")
    return { ok: true, school: row }
  } catch (error) {
    return { ok: false, error: toFriendlyDbError(error, "Failed to create school. Please try again.") }
  }
}

/** Update an existing school (admin only). */
export async function updateSchool(
  id: number,
  input: SchoolInput,
): Promise<{ ok: true; school: School } | { ok: false; error: string }> {
  await requireAdmin()
  try {
    const [row] = await db
      .update(schools)
      .set({
        name: input.name,
        location: input.location,
        address: input.address,
        phone: input.phone,
        email: input.email,
        website: input.website,
        description: input.description,
        logoUrl: input.logoUrl ?? null,
        contactPerson: input.contactPerson,
        published: input.published,
        updatedAt: new Date(),
      })
      .where(eq(schools.id, id))
      .returning()
    await syncSchoolCoaches(id, input.coachIds ?? [])
    revalidatePath("/schools")
    revalidatePath("/admin")
    return { ok: true, school: row }
  } catch (error) {
    return { ok: false, error: toFriendlyDbError(error, "Failed to update school. Please try again.") }
  }
}

/** Full slot grid (weekday x hour) for a school filtered by age group, including hours with 0 capacity. */
export async function getSchoolSlots(schoolId: number, ageGroup: AgeGroup): Promise<SchoolSlot[]> {
  await requireAdmin()
  return db
    .select()
    .from(schoolSlots)
    .where(and(eq(schoolSlots.schoolId, schoolId), eq(schoolSlots.ageGroup, ageGroup)))
    .orderBy(asc(schoolSlots.weekday), asc(schoolSlots.hour))
}

/** Upsert a single school slot's capacity per age group. Capacity 0 removes the slot. */
export async function setSchoolSlotCapacity(input: {
  schoolId: number
  weekday: number
  hour: number
  capacity: number
  ageGroup: AgeGroup
}) {
  await requireAdmin()
  const capacity = Math.max(0, Math.floor(input.capacity))
  const hour = Math.round(input.hour * 2) / 2

  if (!(SLOT_HOURS as readonly number[]).includes(hour)) {
    throw new Error("Invalid hour")
  }
  if (!AGE_GROUPS.includes(input.ageGroup as AgeGroup)) {
    throw new Error("Invalid age group")
  }

  const existing = await db
    .select()
    .from(schoolSlots)
    .where(
      and(
        eq(schoolSlots.schoolId, input.schoolId),
        eq(schoolSlots.weekday, input.weekday),
        eq(schoolSlots.hour, String(hour)),
        eq(schoolSlots.ageGroup, input.ageGroup),
      ),
    )
    .limit(1)

  if (existing.length > 0) {
    await db
      .update(schoolSlots)
      .set({ capacity, updatedAt: new Date() })
      .where(eq(schoolSlots.id, existing[0].id))
  } else if (capacity > 0) {
    await db.insert(schoolSlots).values({
      schoolId: input.schoolId,
      weekday: input.weekday,
      hour: String(hour),
      capacity,
      ageGroup: input.ageGroup,
    })
  }
  revalidatePath("/admin")
  revalidatePath("/enrollment")
  return { success: true }
}

/**
 * Make a school Inactive (published=false). No records are deleted.
 */
export async function deactivateSchool(id: number): Promise<void> {
  await requireAdmin()
  await db.update(schools).set({ published: false, updatedAt: new Date() }).where(eq(schools.id, id))
  revalidatePath("/schools")
  revalidatePath("/admin")
  revalidatePath("/enrollment")
}

/**
 * Reactivate a school (published=true). No records are deleted.
 */
export async function reactivateSchool(id: number): Promise<void> {
  await requireAdmin()
  await db.update(schools).set({ published: true, updatedAt: new Date() }).where(eq(schools.id, id))
  revalidatePath("/schools")
  revalidatePath("/admin")
  revalidatePath("/enrollment")
}

/** @deprecated Use deactivateSchool instead — production records must never be deleted. */
export async function deleteSchool(id: number): Promise<void> {
  await requireAdmin()
  await db.delete(schools).where(eq(schools.id, id))
  revalidatePath("/schools")
  revalidatePath("/admin")
}
