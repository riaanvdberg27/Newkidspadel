/**
 * Automatic Capacity Tracking for Coaching Sessions
 * 
 * Tracks available spaces for each session automatically based on:
 * - Total capacity
 * - Active enrollments
 * - Cancelled enrollments
 */

import { db } from "@/lib/db"
import { clubSlots, packageSlots, enrollments } from "@/lib/db/schema"
import { and, eq, sql } from "drizzle-orm"

export type CapacityInfo = {
  capacity: number
  enrolled: number
  available: number
  isFull: boolean
}

/**
 * Get current capacity info for a club slot
 * Automatically calculates available spaces based on active enrollments
 */
export async function getClubSlotCapacity(
  clubId: number,
  weekday: number,
  hour: number | string,
  ageGroup: string,
): Promise<CapacityInfo> {
  // Parse hour to ensure decimal consistency
  const hourNum = typeof hour === "string" ? parseFloat(hour) : hour
  const slotHour = Math.round(hourNum * 2) / 2

  // Get the slot definition
  const slotDef = await db
    .select()
    .from(clubSlots)
    .where(
      and(
        eq(clubSlots.clubId, clubId),
        eq(clubSlots.weekday, weekday),
        eq(clubSlots.hour, slotHour.toString()),
        eq(clubSlots.ageGroup, ageGroup),
      ),
    )
    .limit(1)

  if (!slotDef[0]) {
    return { capacity: 0, enrolled: 0, available: 0, isFull: true }
  }

  const capacity = slotDef[0].capacity

  // Count active enrollments for this slot
  const enrolled = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.clubId, clubId),
        eq(enrollments.slotWeekday, weekday),
        eq(enrollments.slotAgeGroup, ageGroup),
        // Only active enrollments consume a space
        eq(enrollments.status, "active"),
        // Match both slot1 and slot2 for Advanced Package
        sql`(${enrollments.slotHour} = ${slotHour.toString()} OR ${enrollments.slotHour2} = ${slotHour.toString()})`,
      ),
    )

  const enrolledCount = enrolled[0]?.count ?? 0
  const available = Math.max(0, capacity - enrolledCount)

  return {
    capacity,
    enrolled: enrolledCount,
    available,
    isFull: available === 0,
  }
}

/**
 * Get current capacity info for a package slot
 */
export async function getPackageSlotCapacity(
  packageId: number,
  clubId: number,
  weekday: number,
  hour: number | string,
  ageGroup: string,
): Promise<CapacityInfo> {
  // Parse hour to ensure decimal consistency
  const hourNum = typeof hour === "string" ? parseFloat(hour) : hour
  const slotHour = Math.round(hourNum * 2) / 2

  // Get the slot definition
  const slotDef = await db
    .select()
    .from(packageSlots)
    .where(
      and(
        eq(packageSlots.packageId, packageId),
        eq(packageSlots.clubId, clubId),
        eq(packageSlots.weekday, weekday),
        eq(packageSlots.hour, slotHour.toString()),
        eq(packageSlots.ageGroup, ageGroup),
      ),
    )
    .limit(1)

  if (!slotDef[0]) {
    return { capacity: 0, enrolled: 0, available: 0, isFull: true }
  }

  const capacity = slotDef[0].capacity

  // Count active enrollments for this slot
  const enrolled = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.clubId, clubId),
        eq(enrollments.slotWeekday, weekday),
        eq(enrollments.slotAgeGroup, ageGroup),
        eq(enrollments.status, "active"),
        sql`(${enrollments.slotHour} = ${slotHour.toString()} OR ${enrollments.slotHour2} = ${slotHour.toString()})`,
      ),
    )

  const enrolledCount = enrolled[0]?.count ?? 0
  const available = Math.max(0, capacity - enrolledCount)

  return {
    capacity,
    enrolled: enrolledCount,
    available,
    isFull: available === 0,
  }
}

/**
 * Automatically update enrollment status and trigger capacity recalculation
 * This is called when:
 * - A payment is confirmed (status -> "active")
 * - A parent cancels (status -> "cancelled")
 * - Admin removes a child (status -> "removed")
 */
export async function updateEnrollmentStatus(
  enrollmentId: number,
  newStatus: "active" | "cancelled" | "removed" | "pending",
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(enrollments)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(enrollments.id, enrollmentId))

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update enrollment status",
    }
  }
}

/**
 * Get all slots for a club with their current capacity info
 * Useful for admin dashboards showing availability across all slots
 */
export async function getClubSlotsWithCapacity(
  clubId: number,
  ageGroup: string,
): Promise<
  Array<{
    id: number
    weekday: number
    hour: number
    capacity: CapacityInfo
  }>
> {
  const slots = await db
    .select()
    .from(clubSlots)
    .where(and(eq(clubSlots.clubId, clubId), eq(clubSlots.ageGroup, ageGroup)))

  const result = []

  for (const slot of slots) {
    const capacity = await getClubSlotCapacity(clubId, slot.weekday, slot.hour, ageGroup)
    result.push({
      id: slot.id,
      weekday: slot.weekday,
      hour: parseFloat(String(slot.hour)),
      capacity,
    })
  }

  return result
}
