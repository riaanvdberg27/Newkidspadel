import "server-only"
import { db } from "@/lib/db"
import { packages, type PackageRow } from "@/lib/db/schema"
import { asc, eq } from "drizzle-orm"

export type Package = {
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

function toPackage(row: PackageRow): Package {
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

/** Published packages for public pages (homepage + enrollment). */
export async function getPublishedPackages(): Promise<Package[]> {
  const rows = await db
    .select()
    .from(packages)
    .where(eq(packages.published, true))
    .orderBy(asc(packages.sortOrder), asc(packages.id))
  return rows.map(toPackage)
}

/** All packages (admin). */
export async function getAllPackages(): Promise<Package[]> {
  const rows = await db.select().from(packages).orderBy(asc(packages.sortOrder), asc(packages.id))
  return rows.map(toPackage)
}

export async function getPackageBySlug(slug: string): Promise<Package | null> {
  const [row] = await db.select().from(packages).where(eq(packages.slug, slug)).limit(1)
  return row ? toPackage(row) : null
}
