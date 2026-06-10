"use server"

import { revalidatePath } from "next/cache"
import { asc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { packages, packageSlots } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/admin-auth"
import type { PackageSlot } from "@/lib/db/schema"

export type PublicPackage = {
  id: number
  slug: string
  name: string
  price: number
  period: string
  tagline: string
  features: string[]
  description: string
  popular: boolean
  published: boolean
  slotType: string
  sortOrder: number
}

export type CustomSlot = Pick<PackageSlot, "id" | "packageId" | "weekday" | "hour" | "capacity">

function toPublic(row: typeof packages.$inferSelect): PublicPackage {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: row.price,
    period: row.period,
    tagline: row.tagline,
    features: Array.isArray(row.features) ? (row.features as string[]) : [],
    description: row.description ?? "",
    popular: row.popular,
    published: row.published,
    slotType: row.slotType ?? "standard",
    sortOrder: row.sortOrder,
  }
}

/** Published packages for the public site (homepage + enrollment). */
export async function getPublishedPackages(): Promise<PublicPackage[]> {
  const rows = await db
    .select()
    .from(packages)
    .where(eq(packages.published, true))
    .orderBy(asc(packages.sortOrder), asc(packages.id))
  return rows.map(toPublic)
}

/** Custom slots for a package — usable in the enrollment wizard (no auth guard). */
export async function getPublicPackageSlots(packageId: number): Promise<CustomSlot[]> {
  const rows = await db
    .select()
    .from(packageSlots)
    .where(eq(packageSlots.packageId, packageId))
    .orderBy(asc(packageSlots.weekday), asc(packageSlots.hour))
  return rows.map((r) => ({ id: r.id, packageId: r.packageId, weekday: r.weekday, hour: r.hour, capacity: r.capacity }))
}

/** All packages (incl. unpublished) for the admin dashboard. */
export async function getAllPackagesAdmin(): Promise<PublicPackage[]> {
  await requireAdmin()
  const rows = await db.select().from(packages).orderBy(asc(packages.sortOrder), asc(packages.id))
  return rows.map(toPublic)
}

/** Custom slots for a single package. */
export async function getPackageSlots(packageId: number): Promise<CustomSlot[]> {
  await requireAdmin()
  const rows = await db
    .select()
    .from(packageSlots)
    .where(eq(packageSlots.packageId, packageId))
    .orderBy(asc(packageSlots.weekday), asc(packageSlots.hour))
  return rows.map((r) => ({ id: r.id, packageId: r.packageId, weekday: r.weekday, hour: r.hour, capacity: r.capacity }))
}

export type PackageInput = {
  slug: string
  name: string
  price: number
  period: string
  tagline: string
  features: string[]
  description: string
  popular: boolean
  published: boolean
  slotType: string
  sortOrder: number
  customSlots?: { weekday: number; hour: number; capacity: number }[]
}

function clean(input: PackageInput) {
  return {
    slug: input.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
    name: input.name.trim(),
    price: Math.max(0, Math.round(input.price)),
    period: input.period || "monthly",
    tagline: input.tagline.trim(),
    features: input.features.map((f) => f.trim()).filter(Boolean),
    description: input.description.trim(),
    popular: input.popular,
    published: input.published,
    slotType: input.slotType === "custom" ? "custom" : "standard",
    sortOrder: Math.round(input.sortOrder),
  }
}

export async function createPackage(input: PackageInput) {
  await requireAdmin()
  const values = clean(input)
  if (!values.slug || !values.name) throw new Error("Slug and name are required.")
  const [row] = await db.insert(packages).values(values).returning({ id: packages.id })
  if (values.slotType === "custom" && input.customSlots?.length) {
    await db.insert(packageSlots).values(
      input.customSlots.map((s) => ({ packageId: row.id, weekday: s.weekday, hour: s.hour, capacity: s.capacity })),
    )
  }
  revalidatePaths()
}

export async function updatePackage(id: number, input: PackageInput) {
  await requireAdmin()
  const values = clean(input)
  if (!values.slug || !values.name) throw new Error("Slug and name are required.")
  await db.update(packages).set({ ...values, updatedAt: new Date() }).where(eq(packages.id, id))
  // Replace all custom slots for this package
  await db.delete(packageSlots).where(eq(packageSlots.packageId, id))
  if (values.slotType === "custom" && input.customSlots?.length) {
    await db.insert(packageSlots).values(
      input.customSlots.map((s) => ({ packageId: id, weekday: s.weekday, hour: s.hour, capacity: s.capacity })),
    )
  }
  revalidatePaths()
}

export async function deletePackage(id: number) {
  await requireAdmin()
  await db.delete(packageSlots).where(eq(packageSlots.packageId, id))
  await db.delete(packages).where(eq(packages.id, id))
  revalidatePaths()
}

function revalidatePaths() {
  revalidatePath("/")
  revalidatePath("/enrollment")
  revalidatePath("/admin")
}
