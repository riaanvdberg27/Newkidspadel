"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  shopProducts,
  shopProductVariants,
  shopOrders,
  shopCategories,
  type ShopProduct,
  type ShopProductVariant,
  type ShopOrder,
  type ShopCategory,
} from "@/lib/db/schema"
import { and, asc, desc, eq, inArray } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/admin-auth"
import { buildNetcashPayNowFields, NETCASH_PAY_NOW_URL, type NetcashFormFields } from "@/lib/netcash"

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  return session.user.id
}

// ---------------------------------------------------------------------------
// Shared shapes
// ---------------------------------------------------------------------------

export type ShopVariantInput = {
  size: string
  priceOverride?: number | null // Rands, null = use product base price
}

export type ShopProductInput = {
  name: string
  slug: string
  description: string
  categoryId: number
  price: number // Rands
  images: string[] // blob pathnames
  hasVariants: boolean
  variants: ShopVariantInput[]
  leadTimeDays: number | null
  published: boolean
  sortOrder: number
}

export type ShopCategoryInput = {
  name: string
  slug: string
  sortOrder: number
  published: boolean
}

export type ShopProductWithVariants = ShopProduct & {
  variants: ShopProductVariant[]
  categoryName: string
  categorySlug: string
}

function toRands(cents: number) {
  return cents / 100
}
function toCents(rands: number) {
  return Math.round(rands * 100)
}

// ---------------------------------------------------------------------------
// Storefront reads (public)
// ---------------------------------------------------------------------------

function attachVariants<T extends ShopProduct & { categoryName: string; categorySlug: string }>(
  products: T[],
  variants: ShopProductVariant[],
): (T & { variants: ShopProductVariant[] })[] {
  return products.map((p) => ({
    ...p,
    variants: variants.filter((v) => v.productId === p.id),
  }))
}

async function fetchProductsWithCategory(where?: ReturnType<typeof eq>) {
  const rows = await db
    .select({
      product: shopProducts,
      categoryName: shopCategories.name,
      categorySlug: shopCategories.slug,
    })
    .from(shopProducts)
    .innerJoin(shopCategories, eq(shopProducts.categoryId, shopCategories.id))
    .where(where)
    .orderBy(shopProducts.sortOrder, desc(shopProducts.createdAt))

  return rows.map((r) => ({ ...r.product, categoryName: r.categoryName, categorySlug: r.categorySlug }))
}

export async function getShopProducts(): Promise<ShopProductWithVariants[]> {
  const products = await fetchProductsWithCategory(eq(shopProducts.published, true))

  if (products.length === 0) return []

  const variants = await db
    .select()
    .from(shopProductVariants)
    .where(inArray(shopProductVariants.productId, products.map((p) => p.id)))
    .orderBy(shopProductVariants.sortOrder)

  return attachVariants(products, variants)
}

export async function getShopProduct(slug: string): Promise<ShopProductWithVariants | null> {
  const products = await fetchProductsWithCategory(eq(shopProducts.slug, slug))
  const product = products[0]
  if (!product || !product.published) return null
  const variants = await db
    .select()
    .from(shopProductVariants)
    .where(eq(shopProductVariants.productId, product.id))
    .orderBy(shopProductVariants.sortOrder)
  return { ...product, variants }
}

// ---------------------------------------------------------------------------
// Admin reads
// ---------------------------------------------------------------------------

export async function adminGetShopProducts(): Promise<ShopProductWithVariants[]> {
  await requireAdmin()
  const products = await fetchProductsWithCategory()
  if (products.length === 0) return []
  const variants = await db
    .select()
    .from(shopProductVariants)
    .where(inArray(shopProductVariants.productId, products.map((p) => p.id)))
    .orderBy(shopProductVariants.sortOrder)
  return attachVariants(products, variants)
}

// ---------------------------------------------------------------------------
// Admin CRUD — categories
// ---------------------------------------------------------------------------

export async function getShopCategories(): Promise<ShopCategory[]> {
  return db.select().from(shopCategories).where(eq(shopCategories.published, true)).orderBy(asc(shopCategories.sortOrder))
}

export async function adminGetShopCategories(): Promise<ShopCategory[]> {
  await requireAdmin()
  return db.select().from(shopCategories).orderBy(asc(shopCategories.sortOrder))
}

export async function createShopCategory(input: ShopCategoryInput) {
  await requireAdmin()
  const [category] = await db
    .insert(shopCategories)
    .values({
      name: input.name.trim(),
      slug: input.slug.trim(),
      sortOrder: input.sortOrder,
      published: input.published,
    })
    .returning()
  revalidatePath("/admin")
  revalidatePath("/shop")
  return { ok: true, id: category.id }
}

export async function updateShopCategory(id: number, input: ShopCategoryInput) {
  await requireAdmin()
  await db
    .update(shopCategories)
    .set({
      name: input.name.trim(),
      slug: input.slug.trim(),
      sortOrder: input.sortOrder,
      published: input.published,
      updatedAt: new Date(),
    })
    .where(eq(shopCategories.id, id))
  revalidatePath("/admin")
  revalidatePath("/shop")
  return { ok: true }
}

export async function deleteShopCategory(id: number) {
  await requireAdmin()
  const existing = await db
    .select({ id: shopProducts.id })
    .from(shopProducts)
    .where(eq(shopProducts.categoryId, id))
    .limit(1)
  if (existing.length > 0) throw new Error("Move or delete the products in this category first")
  await db.delete(shopCategories).where(eq(shopCategories.id, id))
  revalidatePath("/admin")
  revalidatePath("/shop")
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Admin CRUD — products & variants
// ---------------------------------------------------------------------------

/**
 * Next.js redacts the real message of any error THROWN from a Server Action
 * in production, replacing it with a generic, unhelpful digest string. So
 * for expected, user-fixable failures (like a duplicate slug) we catch the
 * real Postgres error here — where the real message is still available —
 * and return { ok: false, error } instead of throwing, so the client
 * actually sees a useful message.
 */
function friendlyShopSaveError(e: unknown): string {
  const message = e instanceof Error ? e.message : String(e)
  if (/duplicate key|unique constraint/i.test(message) && /slug/i.test(message)) {
    return "A product with this slug already exists. Choose a different, unique slug (e.g. add \"-boys\" or \"-girls\") and try again."
  }
  if (/duplicate key|unique constraint/i.test(message)) {
    return "That value is already in use. Choose a different one and try again."
  }
  return "Something went wrong saving the product. Please try again."
}

export async function createShopProduct(input: ShopProductInput): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  await requireAdmin()

  try {
    const [product] = await db
      .insert(shopProducts)
      .values({
        name: input.name.trim(),
        slug: input.slug.trim(),
        description: input.description.trim(),
        categoryId: input.categoryId,
        price: toCents(input.price),
        images: input.images,
        hasVariants: input.hasVariants,
        leadTimeDays: input.leadTimeDays,
        published: input.published,
        sortOrder: input.sortOrder,
      })
      .returning()

    if (input.hasVariants && input.variants.length > 0) {
      await db.insert(shopProductVariants).values(
        input.variants.map((v, i) => ({
          productId: product.id,
          size: v.size,
          priceOverride: v.priceOverride != null ? toCents(v.priceOverride) : null,
          sortOrder: i,
        })),
      )
    }

    revalidatePath("/admin")
    revalidatePath("/shop")
    return { ok: true, id: product.id }
  } catch (e) {
    return { ok: false, error: friendlyShopSaveError(e) }
  }
}

export async function updateShopProduct(id: number, input: ShopProductInput): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin()

  try {
    await db
      .update(shopProducts)
      .set({
        name: input.name.trim(),
        slug: input.slug.trim(),
        description: input.description.trim(),
        categoryId: input.categoryId,
        price: toCents(input.price),
        images: input.images,
        hasVariants: input.hasVariants,
        leadTimeDays: input.leadTimeDays,
        published: input.published,
        sortOrder: input.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(shopProducts.id, id))

    // Replace variants wholesale — simplest way to keep sizes/prices in sync
    await db.delete(shopProductVariants).where(eq(shopProductVariants.productId, id))
    if (input.hasVariants && input.variants.length > 0) {
      await db.insert(shopProductVariants).values(
        input.variants.map((v, i) => ({
          productId: id,
          size: v.size,
          priceOverride: v.priceOverride != null ? toCents(v.priceOverride) : null,
          sortOrder: i,
        })),
      )
    }

    revalidatePath("/admin")
    revalidatePath("/shop")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: friendlyShopSaveError(e) }
  }
}

export async function deleteShopProduct(id: number) {
  await requireAdmin()
  await db.delete(shopProducts).where(eq(shopProducts.id, id))
  revalidatePath("/admin")
  revalidatePath("/shop")
  return { ok: true }
}

export async function toggleShopProductPublished(id: number, published: boolean) {
  await requireAdmin()
  await db.update(shopProducts).set({ published, updatedAt: new Date() }).where(eq(shopProducts.id, id))
  revalidatePath("/admin")
  revalidatePath("/shop")
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

export type ShopCartLine = {
  productId: number
  size: string | null // null when product has no variants
  quantity: number
}

export type PricedCartLine = ShopCartLine & {
  name: string
  unitPrice: number // Rands
  leadTimeDays: number | null
  lineTotal: number // Rands
}

function generateShopReference() {
  const year = new Date().getFullYear()
  const a = Math.random().toString(36).slice(2, 7).toUpperCase()
  const b = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `SHOP-${year}-${(a + b).slice(0, 8)}`
}

/**
 * Recomputes cart pricing server-side from the DB — never trusts client-sent
 * prices. Throws if a product/size is unpublished, missing, or the quantity
 * is invalid.
 */
async function priceCart(cart: ShopCartLine[]): Promise<{ lines: PricedCartLine[]; total: number }> {
  if (cart.length === 0) throw new Error("Cart is empty")

  const productIds = [...new Set(cart.map((c) => c.productId))]
  const products = await db.select().from(shopProducts).where(inArray(shopProducts.id, productIds))
  const variants = await db.select().from(shopProductVariants).where(inArray(shopProductVariants.productId, productIds))

  const lines: PricedCartLine[] = cart.map((line) => {
    const qty = Math.trunc(line.quantity)
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) {
      throw new Error("Invalid quantity")
    }
    const product = products.find((p) => p.id === line.productId)
    if (!product || !product.published) throw new Error("A product in your cart is no longer available")

    let unitPriceCents = product.price
    if (product.hasVariants) {
      if (!line.size) throw new Error(`Please select a size for ${product.name}`)
      const variant = variants.find((v) => v.productId === product.id && v.size === line.size)
      if (!variant) throw new Error(`Size ${line.size} is not available for ${product.name}`)
      unitPriceCents = variant.priceOverride ?? product.price
    }

    return {
      productId: product.id,
      size: line.size,
      quantity: qty,
      name: product.name,
      unitPrice: toRands(unitPriceCents),
      leadTimeDays: product.leadTimeDays,
      lineTotal: toRands(unitPriceCents * qty),
    }
  })

  const total = lines.reduce((sum, l) => sum + l.lineTotal, 0)
  return { lines, total }
}

/** Public pricing check used by the cart/checkout UI to show a trustworthy total before submitting. */
export async function priceShopCart(cart: ShopCartLine[]) {
  return priceCart(cart)
}

export type ShopCheckoutInput = {
  cart: ShopCartLine[]
  parentName: string
  parentEmail: string
  parentMobile: string
  paymentMethod: "netcash" | "eft"
  notes?: string
}

export async function createShopOrder(input: ShopCheckoutInput) {
  const userId = await getUserId()
  const { lines, total } = await priceCart(input.cart)

  if (!input.parentName.trim() || !input.parentEmail.trim()) {
    throw new Error("Parent name and email are required")
  }
  if (!["netcash", "eft"].includes(input.paymentMethod)) {
    throw new Error("Invalid payment method")
  }

  const orderReference = generateShopReference()

  const [order] = await db
    .insert(shopOrders)
    .values({
      userId,
      orderReference,
      parentName: input.parentName.trim(),
      parentEmail: input.parentEmail.trim(),
      parentMobile: input.parentMobile.trim(),
      items: lines,
      totalAmount: toCents(total),
      paymentMethod: input.paymentMethod,
      paymentStatus: "pending",
      fulfillmentStatus: "processing",
      notes: input.notes?.trim() || null,
    })
    .returning()

  revalidatePath("/dashboard")
  return { ok: true, orderReference: order.orderReference, orderId: order.id, total }
}

/** Builds the Netcash Pay Now redirect for an existing shop order (paymentMethod === "netcash"). */
export async function buildNetcashPaymentForShopOrder(orderId: number): Promise<{
  netcashUrl: string
  formFields: NetcashFormFields
}> {
  const userId = await getUserId()
  const rows = await db
    .select()
    .from(shopOrders)
    .where(and(eq(shopOrders.id, orderId), eq(shopOrders.userId, userId)))
    .limit(1)
  const order = rows[0]
  if (!order) throw new Error("Order not found")
  if (order.paymentStatus === "paid") throw new Error("This order has already been paid")

  const serviceKey = process.env.NETCASH_SERVICE_KEY ?? ""
  if (!serviceKey) throw new Error("Payment gateway is not configured")

  const returnQueryParams = `ref=${encodeURIComponent(order.orderReference)}&name=${encodeURIComponent(order.parentName)}`

  const formFields = buildNetcashPayNowFields({
    serviceKey,
    orderReference: order.orderReference,
    amount: toRands(order.totalAmount).toFixed(2),
    itemDescription: `${order.orderReference} Shop Order`,
    customerEmail: order.parentEmail,
    customerMobile: order.parentMobile || undefined,
    paymentType: "once-off",
    returnQueryParams,
    extra1: String(order.id),
    extra2: "shop",
  })

  await db.update(shopOrders).set({ paymentStatus: "awaiting_payment", updatedAt: new Date() }).where(eq(shopOrders.id, order.id))

  return { netcashUrl: NETCASH_PAY_NOW_URL, formFields }
}

// ---------------------------------------------------------------------------
// Parent-facing reads
// ---------------------------------------------------------------------------

export async function getMyShopOrders(): Promise<ShopOrder[]> {
  const userId = await getUserId()
  return db.select().from(shopOrders).where(eq(shopOrders.userId, userId)).orderBy(desc(shopOrders.createdAt))
}

// ---------------------------------------------------------------------------
// Admin — orders
// ---------------------------------------------------------------------------

export async function adminGetShopOrders(): Promise<ShopOrder[]> {
  await requireAdmin()
  return db.select().from(shopOrders).orderBy(desc(shopOrders.createdAt))
}

/** Admin confirms a manual EFT payment has been received. */
export async function adminConfirmEftPayment(orderId: number) {
  await requireAdmin()
  await db
    .update(shopOrders)
    .set({ paymentStatus: "paid", paidAt: new Date(), updatedAt: new Date() })
    .where(eq(shopOrders.id, orderId))
  revalidatePath("/admin")
  revalidatePath("/dashboard")
  return { ok: true }
}

export async function adminUpdateShopOrderFulfillment(
  orderId: number,
  fulfillmentStatus: "processing" | "ready" | "shipped" | "delivered" | "cancelled",
) {
  await requireAdmin()
  await db
    .update(shopOrders)
    .set({ fulfillmentStatus, updatedAt: new Date() })
    .where(eq(shopOrders.id, orderId))
  revalidatePath("/admin")
  revalidatePath("/dashboard")
  return { ok: true }
}

export async function adminCancelShopOrder(orderId: number) {
  await requireAdmin()
  await db
    .update(shopOrders)
    .set({ paymentStatus: "cancelled", fulfillmentStatus: "cancelled", updatedAt: new Date() })
    .where(eq(shopOrders.id, orderId))
  revalidatePath("/admin")
  revalidatePath("/dashboard")
  return { ok: true }
}
