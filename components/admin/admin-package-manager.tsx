"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Plus, Check } from "lucide-react"
import {
  createPackage,
  updatePackage,
  deletePackage,
  getPackageSlots,
  type PublicPackage,
  type PackageInput,
  type CustomSlot,
} from "@/app/actions/packages"
import { AGE_GROUPS, type AgeGroup } from "@/lib/db/schema"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]

const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  "5-8": "Ages 5 – 8",
  "9-13": "Ages 9 – 13",
  "14-17": "Ages 14 – 17",
}

const EMPTY: PackageInput = {
  slug: "",
  name: "",
  price: 0,
  period: "monthly",
  tagline: "",
  features: [],
  description: "",
  popular: false,
  published: true,
  slotType: "standard",
  sortOrder: 0,
  customSlots: [],
}

export function AdminPackageManager({ initialPackages }: { initialPackages: PublicPackage[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<{ pkg: PublicPackage; slots: CustomSlot[] } | null>(null)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()

  function openCreate() {
    setCreating(true)
    setEditing(null)
  }

  function openEdit(pkg: PublicPackage) {
    startTransition(async () => {
      const slots = pkg.slotType === "custom" ? await getPackageSlots(pkg.id) : []
      setEditing({ pkg, slots })
      setCreating(false)
    })
  }

  function closeModal() {
    setCreating(false)
    setEditing(null)
  }

  function handleSave(input: PackageInput) {
    startTransition(async () => {
      if (editing) await updatePackage(editing.pkg.id, input)
      else await createPackage(input)
      closeModal()
      router.refresh()
    })
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      await deletePackage(id)
      setDeletingId(null)
      router.refresh()
    })
  }

  function periodLabel(p: string) {
    return p === "once-off" ? "once off" : "/month"
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-navy">Packages ({initialPackages.length})</h2>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-md bg-lime px-4 py-2 text-sm font-bold text-lime-foreground transition-colors hover:bg-lime/90"
        >
          <Plus className="h-4 w-4" />
          Add Package
        </button>
      </div>

      <div className="mt-6 grid gap-4">
        {initialPackages.map((pkg) => (
          <article key={pkg.id} className="rounded-card border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-navy">{pkg.name}</h3>
                  {pkg.popular && (
                    <span className="rounded-full bg-lime px-2 py-0.5 text-xs font-bold text-lime-foreground">
                      Popular
                    </span>
                  )}
                  {!pkg.published && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                      Hidden
                    </span>
                  )}
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                    {pkg.slotType === "custom" ? "Custom slots" : "Standard slots"}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-lime">
                  R{pkg.price.toLocaleString()}{" "}
                  <span className="font-normal text-muted-foreground">{periodLabel(pkg.period)}</span>
                </p>
                <p className="text-sm text-muted-foreground">{pkg.tagline}</p>
                {pkg.features.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-navy">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-lime" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                {pkg.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{pkg.description}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => openEdit(pkg)}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:bg-muted disabled:opacity-50"
                >
                  <Pencil className="h-4 w-4 text-lime" />
                  Edit
                </button>
                <button
                  onClick={() => setDeletingId(pkg.id)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 px-3 py-1.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>

            {deletingId === pkg.id && (
              <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-4">
                <p className="text-sm font-semibold text-destructive">
                  Delete {pkg.name}? Existing enrollments are unaffected.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleDelete(pkg.id)}
                    disabled={pending}
                    className="rounded-md bg-destructive px-4 py-1.5 text-sm font-bold text-destructive-foreground disabled:opacity-50"
                  >
                    {pending ? "Deleting…" : "Yes, delete"}
                  </button>
                  <button
                    onClick={() => setDeletingId(null)}
                    className="rounded-md border border-border px-4 py-1.5 text-sm font-semibold text-navy hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}

        {initialPackages.length === 0 && (
          <p className="rounded-card border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
            No packages yet. Click &quot;Add Package&quot; to create your first one.
          </p>
        )}
      </div>

      {(creating || editing) && (
        <Modal
          title={editing ? `Edit ${editing.pkg.name}` : "Add New Package"}
          onClose={closeModal}
        >
          <PackageForm
            pkg={editing?.pkg ?? null}
            initialSlots={editing?.slots ?? []}
            pending={pending}
            onSubmit={handleSave}
            onCancel={closeModal}
          />
        </Modal>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Package form
// ---------------------------------------------------------------------------

// Key is "ageGroup-weekday-hour"
type SlotKey = `${string}-${number}-${number}`

function slotKey(ageGroup: string, weekday: number, hour: number): SlotKey {
  return `${ageGroup}-${weekday}-${hour}`
}

function PackageForm({
  pkg,
  initialSlots,
  pending,
  onSubmit,
  onCancel,
}: {
  pkg: PublicPackage | null
  initialSlots: CustomSlot[]
  pending: boolean
  onSubmit: (input: PackageInput) => void
  onCancel: () => void
}) {
  const [slug, setSlug] = useState(pkg?.slug ?? "")
  const [name, setName] = useState(pkg?.name ?? "")
  const [price, setPrice] = useState(String(pkg?.price ?? 0))
  const [period, setPeriod] = useState(pkg?.period ?? "monthly")
  const [tagline, setTagline] = useState(pkg?.tagline ?? "")
  const [featuresText, setFeaturesText] = useState((pkg?.features ?? []).join("\n"))
  const [description, setDescription] = useState(pkg?.description ?? "")
  const [popular, setPopular] = useState(pkg?.popular ?? false)
  const [published, setPublished] = useState(pkg?.published ?? true)
  const [slotType, setSlotType] = useState(pkg?.slotType ?? "standard")
  const [sortOrder, setSortOrder] = useState(String(pkg?.sortOrder ?? 0))
  const [activeAgeGroup, setActiveAgeGroup] = useState<AgeGroup>("5-8")

  // Custom slots: map of "ageGroup-weekday-hour" -> capacity
  const [customSlots, setCustomSlots] = useState<Record<SlotKey, number>>(() => {
    const m: Record<SlotKey, number> = {}
    for (const s of initialSlots) {
      m[slotKey(s.ageGroup, s.weekday, s.hour)] = s.capacity
    }
    return m
  })

  function toggleSlot(ageGroup: string, weekday: number, hour: number) {
    const k = slotKey(ageGroup, weekday, hour)
    setCustomSlots((prev) => {
      const next = { ...prev }
      if (k in next) delete next[k]
      else next[k] = 10
      return next
    })
  }

  function setCapacity(ageGroup: string, weekday: number, hour: number, cap: number) {
    const k = slotKey(ageGroup, weekday, hour)
    setCustomSlots((prev) => ({ ...prev, [k]: Math.max(1, Math.round(cap)) }))
  }

  // Count slots active for current age group
  const activeCount = Object.keys(customSlots).filter((k) => k.startsWith(`${activeAgeGroup}-`)).length

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const customSlotList = Object.entries(customSlots).map(([k, capacity]) => {
      // key format: "ageGroup-weekday-hour" where ageGroup can contain "-"
      // e.g. "5-8-1-9" → ageGroup=5-8, weekday=1, hour=9
      // Split from the right: last two segments are hour and weekday
      const parts = k.split("-")
      const hour = Number(parts[parts.length - 1])
      const weekday = Number(parts[parts.length - 2])
      const ag = parts.slice(0, parts.length - 2).join("-")
      return { ageGroup: ag, weekday, hour, capacity }
    })
    onSubmit({
      slug,
      name,
      price: Math.max(0, Number(price)),
      period,
      tagline,
      features: featuresText.split("\n").map((f) => f.trim()).filter(Boolean),
      description,
      popular,
      published,
      slotType,
      sortOrder: Number(sortOrder),
      customSlots: slotType === "custom" ? customSlotList : [],
    })
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required>
          <input
            type="text"
            value={name}
            required
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-lime"
          />
        </Field>
        <Field label="Slug (URL id)" required>
          <input
            type="text"
            value={slug}
            required
            placeholder="beginner"
            onChange={(e) => setSlug(e.target.value)}
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-lime"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Price (R)" required>
          <input
            type="number"
            min={0}
            value={price}
            required
            onChange={(e) => setPrice(e.target.value)}
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-lime"
          />
        </Field>
        <Field label="Period">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-lime"
          >
            <option value="monthly">Monthly</option>
            <option value="once-off">Once-off</option>
          </select>
        </Field>
      </div>

      <Field label="Tagline">
        <input
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-lime"
        />
      </Field>

      <Field label="Features (one per line — each gets a tick mark on the homepage)">
        <textarea
          value={featuresText}
          onChange={(e) => setFeaturesText(e.target.value)}
          rows={5}
          placeholder={"4 coaching sessions per month\nBalls and court fees included"}
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-lime"
        />
      </Field>

      <Field label="Additional description (free text — displayed below features)">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Add any extra detail, terms, or notes."
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
        />
      </Field>

      {/* Slot type toggle */}
      <Field label="Booking slot type">
        <div className="mt-2 flex gap-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-4 py-2 has-[:checked]:border-lime has-[:checked]:bg-lime/10">
            <input
              type="radio"
              name="slotType"
              value="standard"
              checked={slotType === "standard"}
              onChange={() => setSlotType("standard")}
              className="accent-lime"
            />
            <span className="text-sm font-medium text-navy">Standard (club availability)</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-4 py-2 has-[:checked]:border-lime has-[:checked]:bg-lime/10">
            <input
              type="radio"
              name="slotType"
              value="custom"
              checked={slotType === "custom"}
              onChange={() => setSlotType("custom")}
              className="accent-lime"
            />
            <span className="text-sm font-medium text-navy">Custom (specific days &amp; times)</span>
          </label>
        </div>
      </Field>

      {/* Custom slots — tabbed by age group */}
      {slotType === "custom" && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="mb-3 text-sm font-semibold text-navy">
            Set available slots per age group
          </p>
          <p className="mb-4 text-xs text-muted-foreground">
            Select which days &amp; times are available for each age group. Click a cell to toggle it on/off, then adjust the capacity number.
          </p>

          {/* Age group tab bar */}
          <div className="flex gap-1 rounded-lg border border-border bg-muted p-1">
            {AGE_GROUPS.map((ag) => {
              const count = Object.keys(customSlots).filter((k) => k.startsWith(`${ag}-`)).length
              return (
                <button
                  key={ag}
                  type="button"
                  onClick={() => setActiveAgeGroup(ag)}
                  className={`flex-1 rounded-md py-2 text-xs font-bold transition-colors ${
                    activeAgeGroup === ag
                      ? "bg-navy text-navy-foreground shadow-sm"
                      : "text-muted-foreground hover:text-navy"
                  }`}
                >
                  {AGE_GROUP_LABELS[ag]}
                  {count > 0 && (
                    <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                      activeAgeGroup === ag ? "bg-lime text-navy" : "bg-lime/30 text-navy"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Slot grid for active age group */}
          <div className="mt-4 overflow-x-auto rounded-md border border-border">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-2 text-left font-semibold text-navy">Time</th>
                  {WEEKDAYS.map((d) => (
                    <th key={d} className="px-3 py-2 text-center font-semibold text-navy">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map((hour) => (
                  <tr key={hour} className="border-b border-border last:border-0 odd:bg-muted/20">
                    <td className="whitespace-nowrap px-3 py-2 font-medium text-navy">
                      {String(hour).padStart(2, "0")}:00
                    </td>
                    {WEEKDAYS.map((_, wd) => {
                      const k = slotKey(activeAgeGroup, wd, hour)
                      const active = k in customSlots
                      const cap = customSlots[k] ?? 10
                      return (
                        <td key={wd} className="px-1.5 py-1.5 text-center">
                          {active ? (
                            <div className="flex flex-col items-center gap-1">
                              <button
                                type="button"
                                onClick={() => toggleSlot(activeAgeGroup, wd, hour)}
                                className="rounded bg-lime px-2 py-0.5 text-xs font-bold text-lime-foreground"
                              >
                                ON
                              </button>
                              <input
                                type="number"
                                min={1}
                                max={99}
                                value={cap}
                                onChange={(e) => setCapacity(activeAgeGroup, wd, hour, Number(e.target.value))}
                                aria-label={`Capacity for ${WEEKDAYS[wd]} ${hour}:00 (${activeAgeGroup})`}
                                className="w-12 rounded border border-border bg-background px-1 py-0.5 text-center text-xs outline-none focus:border-lime"
                              />
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleSlot(activeAgeGroup, wd, hour)}
                              className="rounded border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground hover:border-lime hover:text-navy"
                            >
                              +
                            </button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {activeCount} slot{activeCount !== 1 ? "s" : ""} selected for {AGE_GROUP_LABELS[activeAgeGroup]}
            {" · "}
            {Object.keys(customSlots).length} total across all age groups
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Sort order">
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-lime"
          />
        </Field>
        <label className="flex items-center gap-2 pt-7">
          <input
            type="checkbox"
            checked={popular}
            onChange={(e) => setPopular(e.target.checked)}
            className="h-5 w-5 accent-lime"
          />
          <span className="text-sm font-medium text-navy">Most popular</span>
        </label>
        <label className="flex items-center gap-2 pt-7">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="h-5 w-5 accent-lime"
          />
          <span className="text-sm font-medium text-navy">Published</span>
        </label>
      </div>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-navy hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-lime px-5 py-2 text-sm font-bold text-lime-foreground hover:bg-lime/90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save Package"}
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Field({
  label,
  children,
  required,
}: {
  label: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <div>
      <span className="block text-sm font-semibold text-navy">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </span>
      {children}
    </div>
  )
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10">
      <div className="w-full max-w-3xl rounded-xl bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-bold text-navy">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-navy"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

