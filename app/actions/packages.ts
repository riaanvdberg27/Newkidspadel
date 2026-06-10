"use server"

import { revalidatePath } from "next/cache"
import { asc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { packages } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/admin-auth"

export type PublicPackage = {
  id: number
  slug: string
  name: string
  price: number
  period: string
  tagline: string
  features: string[]
  popular: boolean
  published: boolean
  sortOrder: number
}

function toPublic(row: typeof packages.$inferSelect): PublicPackage {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: row.price,
    period: row.period,
    tagline: row.tagline,
    features: Array.isArray(row.features) ? (row.features as string[]) : [],
    popular: row.popular,
    published: row.published,
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

/** All packages (incl. unpublished) for the admin dashboard. */
export async function getAllPackagesAdmin(): Promise<PublicPackage[]> {
  await requireAdmin()
  const rows = await db.select().from(packages).orderBy(asc(packages.sortOrder), asc(packages.id))
  return rows.map(toPublic)
}

export type PackageInput = {
  slug: string
  name: string
  price: number
  period: string
  tagline: string
  features: string[]
  popular: boolean
  published: boolean
  sortOrder: number
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
    period: input.period.trim() || "/month",
    tagline: input.tagline.trim(),
    features: input.features.map((f) => f.trim()).filter(Boolean),
    popular: input.popular,
    published: input.published,
    sortOrder: Math.round(input.sortOrder),
  }
}

export async function createPackage(input: PackageInput) {
  await requireAdmin()
  const values = clean(input)
  if (!values.slug || !values.name) throw new Error("Slug and name are required.")
  await db.insert(packages).values(values)
  revalidatePath("/")
  revalidatePath("/enrollment")
  revalidatePath("/admin")
}

export async function updatePackage(id: number, input: PackageInput) {
  await requireAdmin()
  const values = clean(input)
  if (!values.slug || !values.name) throw new Error("Slug and name are required.")
  await db
    .update(packages)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(packages.id, id))
  revalidatePath("/")
  revalidatePath("/enrollment")
  revalidatePath("/admin")
}

export async function deletePackage(id: number) {
  await requireAdmin()
  await db.delete(packages).where(eq(packages.id, id))
  revalidatePath("/")
  revalidatePath("/enrollment")
  revalidatePath("/admin")
}
