"use server"

import { db } from "@/lib/db"
import { clubs, clubSlots, enrollments } from "@/lib/db/schema"
import { and, asc, eq, sql } from "drizzle-orm"
import type { Club, ClubSlot, AgeGroup } from "@/lib/db/schema"
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
 * Slots for a club + age group with live remaining count.
 * Bookings that share the same slot AND ageGroup count against capacity.
 */
export async function getClubAvailability(clubId: number, ageGroup: AgeGroup): Promise<SlotAvailability[]> {
  const slots = await db
    .select()
    .from(clubSlots)
    .where(and(eq(clubSlots.clubId, clubId), eq(clubSlots.ageGroup, ageGroup)))
    .orderBy(asc(clubSlots.weekday), asc(clubSlots.hour))

  const allBooked = await db
    .select({
      weekday: enrollments.slotWeekday,
      hour: enrollments.slotHour,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.clubId, clubId),
        eq(enrollments.slotAgeGroup, ageGroup),
        // Only active enrollments consume a slot; inactive/cancelled/pending release it
        eq(enrollments.status, "active"),
      ),
    )
    .groupBy(enrollments.slotWeekday, enrollments.slotHour)

  const bookedMap = new Map<string, number>()
  for (const r of allBooked) {
    if (r.weekday == null || r.hour == null) continue
    bookedMap.set(`${r.weekday}-${parseFloat(String(r.hour))}`, r.count)
  }

  return slots.map((s: ClubSlot) => {
    const h = parseFloat(String(s.hour))
    const booked = bookedMap.get(`${s.weekday}-${h}`) ?? 0
    return {
      id: s.id,
      clubId: s.clubId,
      weekday: s.weekday,
      hour: h,
      capacity: s.capacity,
      booked,
      remaining: Math.max(0, s.capacity - booked),
    }
  })
}
