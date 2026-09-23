"use server"

import { db } from "@/lib/db"
import { groupAccessCodes, packages } from "@/lib/db/schema"
import { and, eq, lt, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { nanoid } from "nanoid"
import { requireAdmin } from "@/lib/admin-auth"
import { getPackageForAccessCode, type PublicPackage } from "@/app/actions/packages"

function generateGroupCode(): string {
  return `GRP-${nanoid(6).toUpperCase()}`
}

function sanitizeCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// ---------------------------------------------------------------------------
// Admin CRUD
// ---------------------------------------------------------------------------

export type GroupAccessCodeRow = {
  id: number
  code: string
  label: string
  packageId: number
  packageName: string
  maxRedemptions: number
  redemptionCount: number
  enabled: boolean
  expiresAt: Date | null
  createdAt: Date
}

export async function adminGetGroupAccessCodes(): Promise<GroupAccessCodeRow[]> {
  await requireAdmin()
  const rows = await db
    .select({
      id: groupAccessCodes.id,
      code: groupAccessCodes.code,
      label: groupAccessCodes.label,
      packageId: groupAccessCodes.packageId,
      packageName: packages.name,
      maxRedemptions: groupAccessCodes.maxRedemptions,
      redemptionCount: groupAccessCodes.redemptionCount,
      enabled: groupAccessCodes.enabled,
      expiresAt: groupAccessCodes.expiresAt,
      createdAt: groupAccessCodes.createdAt,
    })
    .from(groupAccessCodes)
    .innerJoin(packages, eq(packages.id, groupAccessCodes.packageId))
    .orderBy(desc(groupAccessCodes.createdAt))
  return rows.map((r) => ({ ...r, packageName: r.packageName ?? "" }))
}

export async function adminCreateGroupAccessCode(input: {
  label: string
  packageId: number
  code?: string
  maxRedemptions: number
  expiryDays?: number | null
  enabled: boolean
}) {
  await requireAdmin()

  const maxRedemptions = Math.round(input.maxRedemptions)
  if (!Number.isFinite(maxRedemptions) || maxRedemptions < 1 || maxRedemptions > 1000) {
    throw new Error("Max redemptions must be an integer between 1 and 1000.")
  }
  if (!input.packageId) throw new Error("A package is required.")

  const code = input.code?.trim() ? sanitizeCode(input.code) : generateGroupCode()
  if (!code) throw new Error("Code cannot be empty.")

  const expiresAt =
    input.expiryDays != null && input.expiryDays > 0
      ? new Date(Date.now() + input.expiryDays * 24 * 60 * 60 * 1000)
      : null

  await db.insert(groupAccessCodes).values({
    code,
    label: input.label.trim(),
    packageId: input.packageId,
    maxRedemptions,
    enabled: input.enabled,
    expiresAt,
  })

  revalidatePath("/admin")
  return { code }
}

export async function adminUpdateGroupAccessCode(
  id: number,
  input: { label?: string; maxRedemptions?: number; enabled?: boolean; expiresAt?: Date | null },
) {
  await requireAdmin()

  const updates: Partial<typeof groupAccessCodes.$inferInsert> = { updatedAt: new Date() }
  if (input.label !== undefined) updates.label = input.label.trim()
  if (input.maxRedemptions !== undefined) {
    const m = Math.round(input.maxRedemptions)
    if (!Number.isFinite(m) || m < 1 || m > 1000) {
      throw new Error("Max redemptions must be an integer between 1 and 1000.")
    }
    updates.maxRedemptions = m
  }
  if (input.enabled !== undefined) updates.enabled = input.enabled
  if (input.expiresAt !== undefined) updates.expiresAt = input.expiresAt

  await db.update(groupAccessCodes).set(updates).where(eq(groupAccessCodes.id, id))
  revalidatePath("/admin")
}

// ---------------------------------------------------------------------------
// Public validation (used by the enrollment wizard)
// ---------------------------------------------------------------------------

export type ValidateGroupAccessCodeResult =
  | { valid: true; accessCodeId: number; package: PublicPackage }
  | { valid: false; error: string }

export async function validateGroupAccessCode(codeInput: string): Promise<ValidateGroupAccessCodeResult> {
  const code = sanitizeCode(codeInput)
  if (!code) return { valid: false, error: "Please enter a code." }

  const rows = await db.select().from(groupAccessCodes).where(eq(groupAccessCodes.code, code)).limit(1)
  const row = rows[0]
  if (!row) return { valid: false, error: "Invalid code." }
  if (!row.enabled) return { valid: false, error: "This code is no longer active." }
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
    return { valid: false, error: "This code has expired." }
  }
  if (row.redemptionCount >= row.maxRedemptions) {
    return { valid: false, error: "This code has reached its limit." }
  }

  const pkg = await getPackageForAccessCode(row.packageId)
  if (!pkg) return { valid: false, error: "The package for this code is no longer available." }

  return { valid: true, accessCodeId: row.id, package: pkg }
}

/**
 * Re-validates a group access code at submission time and, if still valid,
 * atomically increments its redemption count (guarded by the `lt` cap check
 * so a last-moment race can't oversubscribe the cap). Returns the row id to
 * stamp onto the enrollment rows, or throws if the code is no longer usable.
 */
export async function redeemGroupAccessCode(code: string, packageId: number): Promise<number> {
  const sanitized = sanitizeCode(code)
  const rows = await db.select().from(groupAccessCodes).where(eq(groupAccessCodes.code, sanitized)).limit(1)
  const row = rows[0]
  if (!row) throw new Error("This group code is invalid.")
  if (!row.enabled) throw new Error("This group code is no longer active.")
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) throw new Error("This group code has expired.")
  if (row.packageId !== packageId) throw new Error("This group code does not apply to the selected package.")
  if (row.redemptionCount >= row.maxRedemptions) {
    throw new Error("This group code has reached its limit or is no longer active.")
  }

  const result = await db
    .update(groupAccessCodes)
    .set({ redemptionCount: row.redemptionCount + 1, updatedAt: new Date() })
    .where(and(eq(groupAccessCodes.id, row.id), lt(groupAccessCodes.redemptionCount, groupAccessCodes.maxRedemptions)))

  if ((result.rowCount ?? 0) === 0) {
    throw new Error("This group code has reached its limit or is no longer active.")
  }

  return row.id
}
