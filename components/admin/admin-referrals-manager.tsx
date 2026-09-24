"use client"

import { useEffect, useState } from "react"
import type {
  AdminReferralRow,
  AdminVoucherRow,
} from "@/app/actions/referrals"
import type { VoucherCampaign } from "@/lib/db/schema"
import type { PublicPackage } from "@/app/actions/packages"
import {
  adminUpdateCampaign,
  adminCreateCampaign,
  adminGenerateBulkVouchers,
  issueBootcampVoucher,
} from "@/app/actions/referrals"
import {
  adminGetGroupAccessCodes,
  adminCreateGroupAccessCode,
  adminUpdateGroupAccessCode,
  type GroupAccessCodeRow,
} from "@/app/actions/group-access-codes"

type SubTab = "referrals" | "vouchers" | "campaigns" | "group-codes"

export function AdminReferralsManager({
  referrals,
  vouchers,
  campaigns,
  packages,
}: {
  referrals: AdminReferralRow[]
  vouchers: AdminVoucherRow[]
  campaigns: VoucherCampaign[]
  packages: PublicPackage[]
}) {
  const [subTab, setSubTab] = useState<SubTab>("referrals")

  const subTabs: { id: SubTab; label: string }[] = [
    { id: "referrals", label: "Referrals" },
    { id: "vouchers", label: "Vouchers" },
    { id: "campaigns", label: "Campaigns" },
    { id: "group-codes", label: "Group Codes" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-navy">Referrals &amp; Vouchers</h2>
        <p className="text-sm text-muted-foreground">
          Track referrals, manage discount vouchers, and configure campaigns.
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-border">
        {subTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`-mb-px rounded-t-md border-b-2 px-4 py-2 text-sm font-bold transition-colors ${
              subTab === t.id
                ? "border-lime text-navy"
                : "border-transparent text-muted-foreground hover:text-navy"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === "referrals" && <ReferralsTab rows={referrals} />}
      {subTab === "vouchers" && <VouchersTab rows={vouchers} campaigns={campaigns} />}
      {subTab === "campaigns" && <CampaignsTab campaigns={campaigns} vouchers={vouchers} />}
      {subTab === "group-codes" && <GroupCodesTab packages={packages} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Referrals sub-tab
// ---------------------------------------------------------------------------

function ReferralsTab({ rows }: { rows: AdminReferralRow[] }) {
  const pending = rows.filter((r) => r.status === "pending").length
  const complete = rows.filter((r) => r.status === "complete").length

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <StatCard label="Total Referrals" value={rows.length} />
        <StatCard label="Pending" value={pending} />
        <StatCard label="Completed" value={complete} />
      </div>
      <div className="overflow-x-auto rounded-card border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Referrer</th>
              <th className="px-4 py-3">Enrollment Ref</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Referred On</th>
              <th className="px-4 py-3">Completed</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No referrals yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3">
                  <p className="font-semibold text-navy">{r.referrerName}</p>
                  <p className="text-xs text-muted-foreground">{r.referrerEmail}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {r.enrollmentRef ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(r.createdAt)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {r.completedAt ? formatDate(r.completedAt) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Vouchers sub-tab
// ---------------------------------------------------------------------------

function VouchersTab({
  rows,
  campaigns,
}: {
  rows: AdminVoucherRow[]
  campaigns: VoucherCampaign[]
}) {
  const [issuing, setIssuing] = useState(false)
  const [issueUserId, setIssueUserId] = useState("")
  const [issueResult, setIssueResult] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "used" | "expired">("all")

  const filtered =
    filterStatus === "all" ? rows : rows.filter((v) => v.status === filterStatus)

  const active = rows.filter((v) => v.status === "active").length
  const used = rows.filter((v) => v.status === "used").length

  async function handleIssueBootcamp() {
    if (!issueUserId.trim()) return
    setIssuing(true)
    setIssueResult(null)
    const result = await issueBootcampVoucher(issueUserId.trim())
    setIssuing(false)
    if ("code" in result) {
      setIssueResult(`Voucher issued: ${result.code}`)
      setIssueUserId("")
    } else {
      setIssueResult(`Error: ${result.error}`)
    }
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex gap-4">
        <StatCard label="Total Vouchers" value={rows.length} />
        <StatCard label="Active" value={active} />
        <StatCard label="Redeemed" value={used} />
      </div>

      {/* Issue bootcamp voucher */}
      <div className="rounded-card border border-border bg-card p-4 shadow-sm">
        <h3 className="mb-3 font-semibold text-navy">Issue Boot Camp Voucher</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Manually issue a 40% Boot Camp Reward voucher to a parent. Enter their email address or user ID.
        </p>
        <div className="flex gap-2">
          <input
            value={issueUserId}
            onChange={(e) => setIssueUserId(e.target.value)}
            placeholder="Parent email or user ID"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
          />
          <button
            type="button"
            disabled={issuing || !issueUserId.trim()}
            onClick={handleIssueBootcamp}
            className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {issuing ? "Issuing..." : "Issue"}
          </button>
        </div>
        {issueResult && (
          <p className={`mt-2 text-xs ${issueResult.startsWith("Error") ? "text-red-600" : "text-lime-foreground font-semibold"}`}>
            {issueResult}
          </p>
        )}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filter:</span>
        {(["all", "active", "used", "expired"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${
              filterStatus === s
                ? "bg-navy text-white"
                : "bg-muted text-muted-foreground hover:bg-navy/10"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-card border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Used</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No vouchers found.
                </td>
              </tr>
            )}
            {filtered.map((v) => (
              <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-navy">{v.code}</td>
                <td className="px-4 py-3">
                  {v.userEmail ? (
                    <>
                      <p className="font-semibold text-navy">{v.userName}</p>
                      <p className="text-xs text-muted-foreground">{v.userEmail}</p>
                    </>
                  ) : (
                    <p className="text-xs italic text-muted-foreground">Unassigned</p>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{v.campaignName}</td>
                <td className="px-4 py-3 font-bold text-lime-foreground">
                  {formatDiscount(v.discountType, v.discountPercent, v.discountRandCents)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={v.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {v.expiresAt ? formatDate(v.expiresAt) : "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {v.usedAt ? formatDate(v.usedAt) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Campaigns sub-tab
// ---------------------------------------------------------------------------

const MIN_BULK_CODES = 10
const MAX_BULK_CODES = 1000

function CampaignsTab({
  campaigns: initial,
  vouchers,
}: {
  campaigns: VoucherCampaign[]
  vouchers: AdminVoucherRow[]
}) {
  const [campaigns, setCampaigns] = useState(initial)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [bulkQuantity, setBulkQuantity] = useState<number | "">(50)
  const [generatingId, setGeneratingId] = useState<number | null>(null)
  const [genMessage, setGenMessage] = useState<{ id: number; text: string; isError: boolean } | null>(null)
  const [newForm, setNewForm] = useState({
    name: "",
    description: "",
    discountType: "percent",
    discountPercent: 10,
    discountRandCents: 0,
    appliesTo: "monthly",
    recurrence: "once",
    expiryDays: 90 as number | null,
    enabled: true,
  })

  const editForm = campaigns.find((c) => c.id === editingId)

  const voucherCountsByCampaign = new Map<number, { total: number; used: number }>()
  for (const v of vouchers) {
    const entry = voucherCountsByCampaign.get(v.campaignId) ?? { total: 0, used: 0 }
    entry.total += 1
    if (v.status === "used") entry.used += 1
    voucherCountsByCampaign.set(v.campaignId, entry)
  }

  async function handleSave(c: VoucherCampaign) {
    setSaving(true)
    await adminUpdateCampaign(c.id, {
      name: c.name,
      description: c.description,
      discountType: c.discountType,
      discountPercent: c.discountPercent,
      discountRandCents: c.discountRandCents,
      appliesTo: c.appliesTo,
      recurrence: c.recurrence,
      expiryDays: c.expiryDays,
      enabled: c.enabled,
    })
    setSaving(false)
    setEditingId(null)
  }

  async function handleCreate() {
    setSaving(true)
    const created = await adminCreateCampaign(newForm)
    if (created?.id && typeof bulkQuantity === "number" && bulkQuantity > 0) {
      await adminGenerateBulkVouchers(created.id, bulkQuantity)
    }
    setSaving(false)
    setShowNew(false)
    setNewForm({
      name: "",
      description: "",
      discountType: "percent",
      discountPercent: 10,
      discountRandCents: 0,
      appliesTo: "monthly",
      recurrence: "once",
      expiryDays: 90,
      enabled: true,
    })
    setBulkQuantity(50)
  }

  async function handleGenerateMore(campaignId: number) {
    const input = window.prompt(
      `How many additional promo codes to generate (${MIN_BULK_CODES}-${MAX_BULK_CODES})?`,
      "50",
    )
    if (!input) return
    const quantity = Number(input)
    setGeneratingId(campaignId)
    setGenMessage(null)
    const result = await adminGenerateBulkVouchers(campaignId, quantity)
    setGeneratingId(null)
    if ("error" in result) {
      setGenMessage({ id: campaignId, text: result.error, isError: true })
    } else {
      setGenMessage({ id: campaignId, text: `${result.count} codes generated.`, isError: false })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Configure the discount percentages, expiry windows, and which packages each campaign applies to.
        </p>
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="rounded-md bg-lime px-3 py-1.5 text-xs font-bold text-navy"
        >
          + New Campaign
        </button>
      </div>

      {/* New campaign form */}
      {showNew && (
        <div className="rounded-card border border-border bg-card p-4 shadow-sm space-y-3">
          <h3 className="font-semibold text-navy">New Campaign</h3>
          <CampaignFields
            values={newForm}
            onChange={(patch) => setNewForm((f) => ({ ...f, ...patch }))}
          />
          <label className="block max-w-xs">
            <span className="text-xs font-semibold text-navy">
              Promo codes to generate for this campaign (optional)
            </span>
            <input
              type="number"
              min={MIN_BULK_CODES}
              max={MAX_BULK_CODES}
              placeholder={`${MIN_BULK_CODES}-${MAX_BULK_CODES}, leave blank for none`}
              value={bulkQuantity}
              onChange={(e) =>
                setBulkQuantity(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              Generates that many single-use codes for a school, event, or group — use the
              name/description above to label who they&apos;re for. You can export them to Excel
              afterwards.
            </span>
          </label>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={saving || !newForm.name}
              onClick={handleCreate}
              className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setShowNew(false)}
              className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Campaign cards */}
      <div className="space-y-3">
        {campaigns.map((c) => (
          <div key={c.id} className="rounded-card border border-border bg-card p-4 shadow-sm">
            {editingId === c.id ? (
              <div className="space-y-3">
                <CampaignFields
                  values={c}
                  onChange={(patch) =>
                    setCampaigns((prev) =>
                      prev.map((x) => (x.id === c.id ? { ...x, ...patch } : x)),
                    )
                  }
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSave(campaigns.find((x) => x.id === c.id)!)}
                    className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCampaigns(initial); setEditingId(null) }}
                    className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-navy">{c.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.enabled ? "bg-lime/20 text-lime-foreground" : "bg-muted text-muted-foreground"}`}>
                      {c.enabled ? "Active" : "Disabled"}
                    </span>
                    <span className="rounded-full bg-navy/10 px-2 py-0.5 text-xs font-semibold capitalize text-navy">
                      {c.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                  <div className="flex flex-wrap gap-3 pt-1 text-xs text-muted-foreground">
                    <span>
                      <strong className="text-navy">
                        {formatDiscount(c.discountType, c.discountPercent, c.discountRandCents)}
                      </strong>{" "}
                      discount
                    </span>
                    <span>Applies to: <strong className="text-navy capitalize">{c.appliesTo}</strong></span>
                    <span>Expiry: <strong className="text-navy">{c.expiryDays ? `${c.expiryDays} days` : "Never"}</strong></span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <span className="text-xs text-muted-foreground">
                      Promo codes:{" "}
                      <strong className="text-navy">
                        {voucherCountsByCampaign.get(c.id)?.used ?? 0} /{" "}
                        {voucherCountsByCampaign.get(c.id)?.total ?? 0} used
                      </strong>
                    </span>
                    <button
                      type="button"
                      disabled={generatingId === c.id}
                      onClick={() => handleGenerateMore(c.id)}
                      className="rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-navy hover:bg-muted disabled:opacity-50"
                    >
                      {generatingId === c.id ? "Generating..." : "Generate More Codes"}
                    </button>
                    <a
                      href={`/api/admin/campaigns/${c.id}/export`}
                      className="rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-navy hover:bg-muted"
                    >
                      Download Excel
                    </a>
                  </div>
                  {genMessage?.id === c.id && (
                    <p className={`text-xs ${genMessage.isError ? "text-red-600" : "text-lime-foreground font-semibold"}`}>
                      {genMessage.text}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setEditingId(c.id)}
                  className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-navy hover:bg-muted"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Group Codes sub-tab
// ---------------------------------------------------------------------------

const MIN_GROUP_REDEMPTIONS = 1
const MAX_GROUP_REDEMPTIONS = 1000

function GroupCodesTab({ packages }: { packages: PublicPackage[] }) {
  const [rows, setRows] = useState<GroupAccessCodeRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hiddenFirstPackages = [...packages].sort((a, b) => {
    if (a.visibility === b.visibility) return 0
    return a.visibility === "hidden" ? -1 : 1
  })

  const [newForm, setNewForm] = useState({
    label: "",
    packageId: hiddenFirstPackages[0]?.id ?? 0,
    code: "",
    maxRedemptions: 100,
    expiryDays: null as number | null,
    enabled: true,
  })

  async function refresh() {
    setLoading(true)
    try {
      const data = await adminGetGroupAccessCodes()
      setRows(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load group codes.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleCreate() {
    setError(null)
    if (!newForm.label.trim()) {
      setError("Label is required.")
      return
    }
    if (!newForm.packageId) {
      setError("Select a package.")
      return
    }
    setSaving(true)
    try {
      await adminCreateGroupAccessCode(newForm)
      setShowNew(false)
      setNewForm({
        label: "",
        packageId: hiddenFirstPackages[0]?.id ?? 0,
        code: "",
        maxRedemptions: 100,
        expiryDays: null,
        enabled: true,
      })
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create group code.")
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleEnabled(row: GroupAccessCodeRow) {
    setTogglingId(row.id)
    try {
      await adminUpdateGroupAccessCode(row.id, { enabled: !row.enabled })
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update group code.")
    } finally {
      setTogglingId(null)
    }
  }

  function handleCopy(row: GroupAccessCodeRow) {
    navigator.clipboard?.writeText(row.code)
    setCopiedId(row.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          A single shared code that unlocks a hidden package (like the Family Package) for many
          families, up to a redemption cap you set.
        </p>
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="shrink-0 rounded-md bg-lime px-3 py-1.5 text-xs font-bold text-navy"
        >
          + Create Group Code
        </button>
      </div>

      {showNew && (
        <div className="rounded-card border border-border bg-card p-4 shadow-sm space-y-3">
          <h3 className="font-semibold text-navy">New Group Code</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="col-span-full block">
              <span className="text-xs font-semibold text-navy">Label</span>
              <input
                value={newForm.label}
                onChange={(e) => setNewForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="e.g. Gauteng Homeschool Groups"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-navy">Package</span>
              <select
                value={newForm.packageId}
                onChange={(e) => setNewForm((f) => ({ ...f, packageId: Number(e.target.value) }))}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
              >
                {hiddenFirstPackages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.visibility === "hidden" ? " (hidden)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-navy">Code (optional — blank auto-generates)</span>
              <input
                value={newForm.code}
                onChange={(e) => setNewForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="HOMESCHOOL2026"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:border-lime"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-navy">Max Redemptions</span>
              <input
                type="number"
                min={MIN_GROUP_REDEMPTIONS}
                max={MAX_GROUP_REDEMPTIONS}
                value={newForm.maxRedemptions}
                onChange={(e) => setNewForm((f) => ({ ...f, maxRedemptions: Number(e.target.value) }))}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-navy">Expiry (days, optional)</span>
              <input
                type="number"
                min={1}
                value={newForm.expiryDays ?? ""}
                placeholder="No expiry"
                onChange={(e) =>
                  setNewForm((f) => ({ ...f, expiryDays: e.target.value ? Number(e.target.value) : null }))
                }
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
              />
            </label>
            <label className="flex items-center gap-2 self-end pb-2">
              <input
                type="checkbox"
                checked={newForm.enabled}
                onChange={(e) => setNewForm((f) => ({ ...f, enabled: e.target.checked }))}
                className="h-4 w-4 accent-lime"
              />
              <span className="text-sm font-semibold text-navy">Enabled</span>
            </label>
          </div>
          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={saving}
              onClick={handleCreate}
              className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create"}
            </button>
            <button
              type="button"
              onClick={() => { setShowNew(false); setError(null) }}
              className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-card border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Label</th>
              <th className="px-4 py-3">Package</th>
              <th className="px-4 py-3">Redeemed / Cap</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Expiry</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows === null && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-red-600">
                    {error ?? "Failed to load group codes."}
                  </p>
                  <button
                    type="button"
                    onClick={refresh}
                    className="mt-2 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-navy hover:bg-muted"
                  >
                    Retry
                  </button>
                </td>
              </tr>
            )}
            {!loading && rows !== null && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No group codes yet. Click &quot;Create Group Code&quot; to unlock a hidden package for a group.
                </td>
              </tr>
            )}
            {rows?.map((r) => {
              const expired = r.expiresAt ? r.expiresAt.getTime() < Date.now() : false
              const atCap = r.redemptionCount >= r.maxRedemptions
              const status = !r.enabled ? "disabled" : expired ? "expired" : atCap ? "full" : "active"
              return (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-navy">{r.code}</td>
                  <td className="px-4 py-3 text-navy">{r.label || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.packageName}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.redemptionCount} / {r.maxRedemptions}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {r.expiresAt ? formatDate(r.expiresAt) : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(r)}
                        className="rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-navy hover:bg-muted"
                      >
                        {copiedId === r.id ? "Copied!" : "Copy"}
                      </button>
                      <button
                        type="button"
                        disabled={togglingId === r.id}
                        onClick={() => handleToggleEnabled(r)}
                        className="rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-navy hover:bg-muted disabled:opacity-50"
                      >
                        {togglingId === r.id ? "Saving..." : r.enabled ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function CampaignFields({
  values,
  onChange,
}: {
  values: {
    name: string
    description: string
    discountType: string
    discountPercent: number
    discountRandCents: number
    appliesTo: string
    recurrence: string
    expiryDays: number | null
    enabled: boolean
  }
  onChange: (patch: Partial<typeof values>) => void
}) {
  const isRand = values.discountType === "rand"
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="col-span-full block">
        <span className="text-xs font-semibold text-navy">Name</span>
        <input
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
        />
      </label>
      <label className="col-span-full block">
        <span className="text-xs font-semibold text-navy">Description</span>
        <input
          value={values.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
        />
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-navy">Discount Type</span>
        <select
          value={values.discountType}
          onChange={(e) => onChange({ discountType: e.target.value })}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
        >
          <option value="percent">Percentage (%)</option>
          <option value="rand">Fixed Amount (R)</option>
        </select>
      </label>
      {isRand ? (
        <label className="block">
          <span className="text-xs font-semibold text-navy">Discount (R)</span>
          <input
            type="number"
            min={1}
            step="0.01"
            value={values.discountRandCents / 100}
            onChange={(e) =>
              onChange({ discountRandCents: Math.round(Number(e.target.value) * 100) })
            }
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
          />
        </label>
      ) : (
        <label className="block">
          <span className="text-xs font-semibold text-navy">Discount %</span>
          <input
            type="number"
            min={1}
            max={100}
            value={values.discountPercent}
            onChange={(e) => onChange({ discountPercent: Number(e.target.value) })}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
          />
        </label>
      )}
      <label className="block">
        <span className="text-xs font-semibold text-navy">Applies To</span>
        <select
          value={values.appliesTo}
          onChange={(e) => onChange({ appliesTo: e.target.value })}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
        >
          <option value="monthly">Monthly subscriptions only</option>
          <option value="once-off">Once-off packages only</option>
          <option value="both">Both</option>
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-navy">Discount Duration</span>
        <select
          value={values.recurrence}
          onChange={(e) => onChange({ recurrence: e.target.value })}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
        >
          <option value="once">Once-off (first billing month only)</option>
          <option value="indefinite">Indefinite (every month until cancelled)</option>
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-navy">Expiry (days after issuance)</span>
        <input
          type="number"
          min={1}
          value={values.expiryDays ?? ""}
          placeholder="No expiry"
          onChange={(e) =>
            onChange({ expiryDays: e.target.value ? Number(e.target.value) : null })
          }
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
        />
      </label>
      <label className="flex items-center gap-2 self-end pb-2">
        <input
          type="checkbox"
          checked={values.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="h-4 w-4 accent-lime"
        />
        <span className="text-sm font-semibold text-navy">Campaign enabled</span>
      </label>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 rounded-card border border-border bg-card px-4 py-3 shadow-sm">
      <p className="text-2xl font-extrabold text-navy">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-lime/20 text-lime-foreground",
    complete: "bg-lime/20 text-lime-foreground",
    pending: "bg-amber-100 text-amber-700",
    used: "bg-muted text-muted-foreground",
    expired: "bg-red-100 text-red-700",
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${styles[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  )
}

function formatDiscount(discountType: string, discountPercent: number, discountRandCents: number) {
  return discountType === "rand"
    ? `R${(discountRandCents / 100).toLocaleString("en-ZA")}`
    : `${discountPercent}%`
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
