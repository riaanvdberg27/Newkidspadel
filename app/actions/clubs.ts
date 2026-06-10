"use server"

import { db } from "@/lib/db"
import { clubs, clubSlots, enrollments } from "@/lib/db/schema"
import { and, asc, eq, sql } from "drizzle-orm"
import type { Club, ClubSlot } from "@/lib/db/schema"
import type { SlotAvailability } from "@/lib/slots"

/** All published clubs for the public site. */
export async function getPublishedClubs(): Promise<Club[]> {
  return db.select().from(clubs).where(eq(clubs.published, true)).orderBy(asc(clubs.id))
}

/** A single club by id. */
export async function getClubById(id: number): Promise<Club | null> {
  const rows = await db.select().from(clubs).where(eq(clubs.id, id)).limit(1)
  return rows[0] ?? null
}

/**
 * Slots for a club with how many places are already booked and how many remain.
 * Existing bookings always remain valid; only `remaining` is affected by capacity changes.
 */
export async function getClubAvailability(clubId: number): Promise<SlotAvailability[]> {
  const slots = await db
    .select()
    .from(clubSlots)
    .where(eq(clubSlots.clubId, clubId))
    .orderBy(asc(clubSlots.weekday), asc(clubSlots.hour))

  const bookedRows = await db
    .select({
      weekday: enrollments.slotWeekday,
      hour: enrollments.slotHour,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(enrollments)
    .where(and(eq(enrollments.clubId, clubId), eq(enrollments.status, "active")))
    .groupBy(enrollments.slotWeekday, enrollments.slotHour)

  // status defaults to "pending"; count any enrollment that holds a slot regardless of status
  const allBooked = await db
    .select({
      weekday: enrollments.slotWeekday,
      hour: enrollments.slotHour,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(enrollments)
    .where(eq(enrollments.clubId, clubId))
    .groupBy(enrollments.slotWeekday, enrollments.slotHour)

  const bookedMap = new Map<string, number>()
  for (const r of allBooked) {
    if (r.weekday == null || r.hour == null) continue
    bookedMap.set(`${r.weekday}-${r.hour}`, r.count)
  }
  // (bookedRows kept for potential future status filtering)
  void bookedRows

  return slots.map((s: ClubSlot) => {
    const booked = bookedMap.get(`${s.weekday}-${s.hour}`) ?? 0
    return {
      id: s.id,
      clubId: s.clubId,
      weekday: s.weekday,
      hour: s.hour,
      capacity: s.capacity,
      booked,
      remaining: Math.max(0, s.capacity - booked),
    }
  })
}
