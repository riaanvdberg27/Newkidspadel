"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Pencil, Plus, Trash2, X, Upload, ImageIcon, Eye, EyeOff, Clock, Package,
  CheckCircle2, Truck, XCircle, RefreshCw, Tag,
} from "lucide-react"
import {
  createShopProduct,
  updateShopProduct,
  deleteShopProduct,
  toggleShopProductPublished,
  createShopCategory,
  updateShopCategory,
  deleteShopCategory,
  adminConfirmEftPayment,
  adminUpdateShopOrderFulfillment,
  adminCancelShopOrder,
  type ShopProductWithVariants,
  type ShopProductInput,
  type ShopVariantInput,
  type ShopCategoryInput,
} from "@/app/actions/shop"
import type { ShopOrder, ShopCategory } from "@/lib/db/schema"
import { blobImage } from "@/lib/blob"
import { upload } from "@vercel/blob/client"

const KIDS_SIZES = ["4-5", "5-6", "7-8", "9-10", "11-12", "13-14"]
const ADULT_SIZES = ["S", "M", "L", "XL"]

function makeEmptyProduct(categoryId: number): ShopProductInput {
  return {
    name: "",
    slug: "",
    description: "",
    categoryId,
    price: 0,
    images: [],
    hasVariants: false,
    variants: [],
    leadTimeDays: null,
    published: true,
    sortOrder: 0,
  }
}

function formatCents(cents: number) {
  return `R${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })
}

const FULFILLMENT_STYLES: Record<string, string> = {
  processing: "bg-amber-100 text-amber-800",
  ready: "bg-blue-100 text-blue-800",
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-lime/20 text-navy",
  cancelled: "bg-muted text-muted-foreground",
}

const PAYMENT_STYLES: Record<string, string> = {
  paid: "bg-lime/20 text-navy",
  pending: "bg-amber-100 text-amber-800",
  awaiting_payment: "bg-blue-100 text-blue-800",
  cancelled: "bg-muted text-muted-foreground",
}

export function AdminShopManager({
  initialProducts,
  initialOrders,
  initialCategories,
}: {
  initialProducts: ShopProductWithVariants[]
  initialOrders: ShopOrder[]
  initialCategories: ShopCategory[]
}) {
  const [section, setSection] = useState<"categories" | "products" | "orders">("products")

  const labels: Record<typeof section, string> = {
    categories: `Categories (${initialCategories.length})`,
    products: `Products (${initialProducts.length})`,
    orders: `Orders (${initialOrders.length})`,
  }

  return (
    <div>
      <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1 w-fit">
        {(["categories", "products", "orders"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
              section === s ? "bg-card text-navy shadow-sm" : "text-muted-foreground hover:text-navy"
            }`}
          >
            {labels[s]}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {section === "categories" && <ShopCategoriesSection initialCategories={initialCategories} />}
        {section === "products" && (
          <ShopProductsSection initialProducts={initialProducts} categories={initialCategories} />
        )}
        {section === "orders" && <ShopOrdersSection initialOrders={initialOrders} />}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

const EMPTY_CATEGORY: ShopCategoryInput = { name: "", slug: "", sortOrder: 0, published: true }

function ShopCategoriesSection({ initialCategories }: { initialCategories: ShopCategory[] }) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<ShopCategory | null>(null)
  const [pending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleSave(input: ShopCategoryInput) {
    setError(null)
    startTransition(async () => {
      try {
        if (editing) await updateShopCategory(editing.id, input)
        else await createShopCategory(input)
        setCreating(false)
        setEditing(null)
        router.refresh()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Something went wrong")
      }
    })
  }

  function handleDelete(id: number) {
    setError(null)
    startTransition(async () => {
      try {
        await deleteShopCategory(id)
        setConfirmDelete(null)
        router.refresh()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Could not delete category")
        setConfirmDelete(null)
      }
    })
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-navy">Shop Categories</h2>
        <button
          onClick={() => { setCreating(true); setEditing(null); setError(null) }}
          className="inline-flex items-center gap-2 rounded-md bg-lime px-4 py-2 text-sm font-bold text-lime-foreground transition-colors hover:bg-lime/90"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {initialCategories.map((c) => (
          <article key={c.id} className={`rounded-card border bg-card p-4 shadow-sm ${!c.published ? "border-dashed border-muted-foreground/30 opacity-80" : "border-border"}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-lime" />
                <h3 className="font-bold text-navy">{c.name}</h3>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${c.published ? "bg-lime/20 text-navy" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                {c.published ? "Visible" : "Hidden"}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">/shop · {c.slug}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => { setEditing(c); setCreating(false); setError(null) }}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-muted disabled:opacity-50"
              >
                <Pencil className="h-3.5 w-3.5 text-lime" />
                Edit
              </button>
              <button
                onClick={() => setConfirmDelete({ id: c.id, name: c.name })}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>

            {confirmDelete?.id === c.id && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
                <p className="text-xs font-semibold text-red-800">Delete <strong>{c.name}</strong>? This cannot be undone.</p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => handleDelete(c.id)} disabled={pending} className="rounded-md bg-red-600 px-3 py-1 text-xs font-bold text-white disabled:opacity-50 hover:bg-red-700">
                    {pending ? "Deleting…" : "Delete"}
                  </button>
                  <button onClick={() => setConfirmDelete(null)} className="rounded-md border border-border px-3 py-1 text-xs font-semibold text-navy hover:bg-muted">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}

        {initialCategories.length === 0 && (
          <p className="col-span-full rounded-card border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
            No categories yet. Click &quot;Add Category&quot; to create your first one (e.g. Apparel, Gear, Accessories).
          </p>
        )}
      </div>

      {(creating || editing) && (
        <Modal title={editing ? `Edit ${editing.name}` : "Add New Category"} onClose={() => { setCreating(false); setEditing(null) }}>
          <CategoryForm
            category={editing}
            pending={pending}
            onSubmit={handleSave}
            onCancel={() => { setCreating(false); setEditing(null) }}
          />
        </Modal>
      )}
    </div>
  )
}

function CategoryForm({
  category,
  pending,
  onSubmit,
  onCancel,
}: {
  category: ShopCategory | null
  pending: boolean
  onSubmit: (input: ShopCategoryInput) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(category?.name ?? "")
  const [slug, setSlug] = useState(category?.slug ?? "")
  const [sortOrder, setSortOrder] = useState(String(category?.sortOrder ?? 0))
  const [published, setPublished] = useState(category?.published ?? true)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ name, slug, sortOrder: Number(sortOrder), published })
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required>
          <input type="text" value={name} required onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-lime" />
        </Field>
        <Field label="Slug (URL id)" required>
          <input type="text" value={slug} required placeholder="apparel" onChange={(e) => setSlug(e.target.value)} className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-lime" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Sort Order">
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-lime" />
        </Field>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4 accent-lime" />
            <span className="text-sm font-semibold text-navy">Published (visible in shop)</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-navy hover:bg-muted">
          Cancel
        </button>
        <button type="submit" disabled={pending} className="rounded-md bg-lime px-5 py-2 text-sm font-bold text-lime-foreground disabled:opacity-50 hover:bg-lime/90">
          {pending ? "Saving…" : category ? "Save Changes" : "Add Category"}
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

function ShopProductsSection({
  initialProducts,
  categories,
}: {
  initialProducts: ShopProductWithVariants[]
  categories: ShopCategory[]
}) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<ShopProductWithVariants | null>(null)
  const [pending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleSave(input: ShopProductInput) {
    setError(null)
    startTransition(async () => {
      try {
        if (editing) await updateShopProduct(editing.id, input)
        else await createShopProduct(input)
        setCreating(false)
        setEditing(null)
        router.refresh()
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Something went wrong"
        setError(
          /duplicate key|unique/i.test(message)
            ? `A product with the slug "${input.slug}" already exists. Choose a different slug (e.g. add "-boys" or "-girls") and try again.`
            : message,
        )
      }
    })
  }

  function handleDelete(id: number) {
    setError(null)
    startTransition(async () => {
      try {
        await deleteShopProduct(id)
        setConfirmDelete(null)
        router.refresh()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Could not delete product")
        setConfirmDelete(null)
      }
    })
  }

  function handleTogglePublished(id: number, published: boolean) {
    startTransition(async () => {
      await toggleShopProductPublished(id, published)
      router.refresh()
    })
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-navy">Shop Products</h2>
        <button
          onClick={() => { setCreating(true); setEditing(null); setError(null) }}
          className="inline-flex items-center gap-2 rounded-md bg-lime px-4 py-2 text-sm font-bold text-lime-foreground transition-colors hover:bg-lime/90"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {initialProducts.map((p) => {
          const image = p.images?.[0]
          return (
            <article key={p.id} className={`overflow-hidden rounded-card border bg-card shadow-sm ${!p.published ? "border-dashed border-muted-foreground/30 opacity-80" : "border-border"}`}>
              <div className="relative aspect-square bg-muted">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={blobImage(image, 400) ?? "/placeholder.svg"} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
                <span className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-xs font-bold ${p.published ? "bg-lime/90 text-lime-foreground" : "bg-muted-foreground/80 text-white"}`}>
                  {p.published ? "Published" : "Hidden"}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-navy">{p.name}</h3>
                  <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs capitalize text-muted-foreground">{p.categoryName}</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-lime">{formatCents(p.price)}</p>
                {p.leadTimeDays != null && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {p.leadTimeDays} day lead time
                  </p>
                )}
                {p.hasVariants && (
                  <p className="mt-1 text-xs text-muted-foreground">{p.variants.length} size{p.variants.length !== 1 ? "s" : ""}</p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => { setEditing(p); setCreating(false) }}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    <Pencil className="h-3.5 w-3.5 text-lime" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleTogglePublished(p.id, !p.published)}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    {p.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {p.published ? "Hide" : "Show"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete({ id: p.id, name: p.name })}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>

                {confirmDelete?.id === p.id && (
                  <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
                    <p className="text-xs font-semibold text-red-800">Delete <strong>{p.name}</strong>? This cannot be undone.</p>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => handleDelete(p.id)} disabled={pending} className="rounded-md bg-red-600 px-3 py-1 text-xs font-bold text-white disabled:opacity-50 hover:bg-red-700">
                        {pending ? "Deleting…" : "Delete"}
                      </button>
                      <button onClick={() => setConfirmDelete(null)} className="rounded-md border border-border px-3 py-1 text-xs font-semibold text-navy hover:bg-muted">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </article>
          )
        })}

        {initialProducts.length === 0 && (
          <p className="col-span-full rounded-card border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
            No products yet. Click &quot;Add Product&quot; to load your first item.
          </p>
        )}
      </div>

      {(creating || editing) && (
        <Modal title={editing ? `Edit ${editing.name}` : "Add New Product"} onClose={() => { setCreating(false); setEditing(null) }}>
          <ProductForm
            product={editing}
            categories={categories}
            pending={pending}
            onSubmit={handleSave}
            onCancel={() => { setCreating(false); setEditing(null) }}
          />
        </Modal>
      )}
    </div>
  )
}

function ProductForm({
  product,
  categories,
  pending,
  onSubmit,
  onCancel,
}: {
  product: ShopProductWithVariants | null
  categories: ShopCategory[]
  pending: boolean
  onSubmit: (input: ShopProductInput) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(product?.name ?? "")
  const [slug, setSlug] = useState(product?.slug ?? "")
  const [description, setDescription] = useState(product?.description ?? "")
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? 0)
  const [price, setPrice] = useState(String(product ? product.price / 100 : 0))
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [hasVariants, setHasVariants] = useState(product?.hasVariants ?? false)
  const [variants, setVariants] = useState<ShopVariantInput[]>(
    product?.variants.map((v) => ({ size: v.size, priceOverride: v.priceOverride != null ? v.priceOverride / 100 : null })) ?? [],
  )
  const [leadTimeDays, setLeadTimeDays] = useState(product?.leadTimeDays != null ? String(product.leadTimeDays) : "")
  const [published, setPublished] = useState(product?.published ?? true)
  const [sortOrder, setSortOrder] = useState(String(product?.sortOrder ?? 0))
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setError(null)
    try {
      for (const file of Array.from(files)) {
        const result = await upload(file.name, file, {
          access: "private",
          handleUploadUrl: "/api/admin/upload-shop-image",
          contentType: file.type,
          multipart: file.size > 5 * 1024 * 1024,
        })
        setImages((prev) => [...prev, result.url])
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

  function toggleSize(size: string) {
    setVariants((prev) => {
      const exists = prev.find((v) => v.size === size)
      if (exists) return prev.filter((v) => v.size !== size)
      return [...prev, { size, priceOverride: null }]
    })
  }

  function setVariantPriceOverride(size: string, value: string) {
    setVariants((prev) =>
      prev.map((v) => (v.size === size ? { ...v, priceOverride: value === "" ? null : Number(value) } : v)),
    )
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      name,
      slug,
      description,
      categoryId: Number(categoryId),
      price: Math.max(0, Number(price)),
      images,
      hasVariants,
      variants: hasVariants ? variants : [],
      leadTimeDays: leadTimeDays === "" ? null : Math.max(0, Number(leadTimeDays)),
      published,
      sortOrder: Number(sortOrder),
    })
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required>
          <input type="text" value={name} required onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-lime" />
        </Field>
        <Field label="Slug (URL id)" required>
          <input type="text" value={slug} required placeholder="padel-tshirt" onChange={(e) => setSlug(e.target.value)} className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-lime" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Category">
          <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-lime">
            {categories.length === 0 && <option value={0}>Add a category first</option>}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Base Price (R)" required>
          <input type="number" min={0} step="0.01" value={price} required onChange={(e) => setPrice(e.target.value)} className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-lime" />
        </Field>
        <Field label="Lead Time (days)">
          <input type="number" min={0} value={leadTimeDays} placeholder="e.g. 14" onChange={(e) => setLeadTimeDays(e.target.value)} className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-lime" />
        </Field>
      </div>

      <Field label="Description">
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-lime" />
      </Field>

      {/* Images */}
      <Field label="Photos">
        <div className="mt-2 flex flex-wrap gap-3">
          {images.map((img, idx) => (
            <div key={idx} className="relative h-20 w-20 overflow-hidden rounded-md border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={blobImage(img, 160) ?? "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => removeImage(idx)} className="absolute right-0.5 top-0.5 rounded-full bg-navy/80 p-1 text-white hover:bg-navy">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-muted-foreground hover:border-lime hover:text-navy">
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="sr-only" onChange={(e) => handleUpload(e.target.files)} />
            {uploading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            <span className="text-[10px] font-semibold">{uploading ? "Uploading…" : "Add photo"}</span>
          </label>
        </div>
      </Field>

      {/* Variants / sizes */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={hasVariants} onChange={(e) => setHasVariants(e.target.checked)} className="h-4 w-4 accent-lime" />
          <span className="text-sm font-semibold text-navy">This product has sizes</span>
        </label>

        {hasVariants && (
          <div className="mt-3 space-y-3 rounded-md border border-border bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kids Sizes</p>
            <div className="flex flex-wrap gap-2">
              {KIDS_SIZES.map((s) => (
                <SizeChip key={s} size={s} active={!!variants.find((v) => v.size === s)} onToggle={() => toggleSize(s)} />
              ))}
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Adult / Standard Sizes</p>
            <div className="flex flex-wrap gap-2">
              {ADULT_SIZES.map((s) => (
                <SizeChip key={s} size={s} active={!!variants.find((v) => v.size === s)} onToggle={() => toggleSize(s)} />
              ))}
            </div>

            {variants.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Optional price override per size (leave blank to use base price)
                </p>
                {variants.map((v) => (
                  <div key={v.size} className="flex items-center gap-3">
                    <span className="w-16 shrink-0 rounded-md bg-navy px-2 py-1 text-center text-xs font-bold text-navy-foreground">{v.size}</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder={`R${price || 0}`}
                      value={v.priceOverride ?? ""}
                      onChange={(e) => setVariantPriceOverride(v.size, e.target.value)}
                      className="w-32 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-lime"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Sort Order">
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-lime" />
        </Field>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4 accent-lime" />
            <span className="text-sm font-semibold text-navy">Published (visible in shop)</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-navy hover:bg-muted">
          Cancel
        </button>
        <button type="submit" disabled={pending || uploading} className="rounded-md bg-lime px-5 py-2 text-sm font-bold text-lime-foreground disabled:opacity-50 hover:bg-lime/90">
          {pending ? "Saving…" : product ? "Save Changes" : "Add Product"}
        </button>
      </div>
    </form>
  )
}

function SizeChip({ size, active, onToggle }: { size: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
        active ? "border-lime bg-lime text-lime-foreground" : "border-border bg-background text-muted-foreground hover:border-lime"
      }`}
    >
      {size}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

function ShopOrdersSection({ initialOrders }: { initialOrders: ShopOrder[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [filter, setFilter] = useState<"all" | "awaiting" | "paid">("all")

  function confirmEft(id: number) {
    startTransition(async () => {
      await adminConfirmEftPayment(id)
      router.refresh()
    })
  }

  function updateFulfillment(id: number, status: "processing" | "ready" | "shipped" | "delivered" | "cancelled") {
    startTransition(async () => {
      await adminUpdateShopOrderFulfillment(id, status)
      router.refresh()
    })
  }

  function cancelOrder(id: number) {
    startTransition(async () => {
      await adminCancelShopOrder(id)
      router.refresh()
    })
  }

  const visible = initialOrders.filter((o) => {
    if (filter === "awaiting") return o.paymentStatus !== "paid" && o.paymentStatus !== "cancelled"
    if (filter === "paid") return o.paymentStatus === "paid"
    return true
  })

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-navy">Shop Orders</h2>
        <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1">
          {(["all", "awaiting", "paid"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${filter === f ? "bg-card text-navy shadow-sm" : "text-muted-foreground hover:text-navy"}`}
            >
              {f === "all" ? "All" : f === "awaiting" ? "Awaiting Payment" : "Paid"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {visible.map((order) => {
          const items = (order.items as { name: string; size: string | null; quantity: number; unitPrice: number; lineTotal: number }[]) ?? []
          return (
            <article key={order.id} className="rounded-card border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-navy">{order.orderReference}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${PAYMENT_STYLES[order.paymentStatus] ?? "bg-muted text-muted-foreground"}`}>
                      {order.paymentStatus.replace("_", " ")}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${FULFILLMENT_STYLES[order.fulfillmentStatus] ?? "bg-muted text-muted-foreground"}`}>
                      {order.fulfillmentStatus}
                    </span>
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs font-semibold uppercase text-muted-foreground">
                      {order.paymentMethod}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.parentName} · {order.parentEmail} · {order.parentMobile}
                  </p>
                  <p className="text-xs text-muted-foreground">Placed {formatDate(order.createdAt)}</p>
                </div>
                <p className="text-lg font-black text-navy">{formatCents(order.totalAmount)}</p>
              </div>

              <div className="mt-3 space-y-1 rounded-md bg-muted/30 p-3">
                {items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-navy">
                      {it.quantity}× {it.name}{it.size ? ` (${it.size})` : ""}
                    </span>
                    <span className="font-semibold text-navy">{formatCents(Math.round(it.lineTotal * 100))}</span>
                  </div>
                ))}
              </div>

              {order.notes && (
                <p className="mt-2 text-xs text-muted-foreground">Note: {order.notes}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {order.paymentMethod === "eft" && order.paymentStatus !== "paid" && order.paymentStatus !== "cancelled" && (
                  <button
                    onClick={() => confirmEft(order.id)}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 rounded-md bg-lime px-3 py-1.5 text-xs font-bold text-lime-foreground hover:bg-lime/90 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Confirm EFT Received
                  </button>
                )}

                <select
                  value={order.fulfillmentStatus}
                  onChange={(e) => updateFulfillment(order.id, e.target.value as "processing" | "ready" | "shipped" | "delivered" | "cancelled")}
                  disabled={pending}
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-xs font-semibold text-navy outline-none focus:border-lime disabled:opacity-50"
                >
                  <option value="processing">Processing</option>
                  <option value="ready">Ready for Collection</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                {order.paymentStatus !== "cancelled" && (
                  <button
                    onClick={() => cancelOrder(order.id)}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Cancel Order
                  </button>
                )}
              </div>
            </article>
          )
        })}

        {visible.length === 0 && (
          <p className="rounded-card border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
            No orders found.
          </p>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared UI
// ---------------------------------------------------------------------------

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-card border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-navy">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-navy">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  )
}
