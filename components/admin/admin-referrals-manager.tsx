"use client"

import { useState } from "react"
import type {
  AdminReferralRow,
  AdminVoucherRow,
} from "@/app/actions/referrals"
import type { VoucherCampaign } from "@/lib/db/schema"
import {
  adminUpdateCampaign,
  adminCreateCampaign,
  adminDeleteCampaign,
  adminUpdateVoucher,
  adminDeleteVoucher,
  adminUpdateReferral,
  adminDeleteReferral,
  issueBootcampVoucher,
} from "@/app/actions/referrals"

type SubTab = "referrals" | "vouchers" | "campaigns"

export function AdminReferralsManager({
  referrals,
  vouchers,
  campaigns,
}: {
  referrals: AdminReferralRow[]
  vouchers: AdminVoucherRow[]
  campaigns: VoucherCampaign[]
}) {
  const [subTab, setSubTab] = useState<SubTab>("referrals")

  const subTabs: { id: SubTab; label: string }[] = [
    { id: "referrals", label: "Referrals" },
    { id: "vouchers", label: "Vouchers" },
    { id: "campaigns", label: "Campaigns" },
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
      {subTab === "campaigns" && <CampaignsTab campaigns={campaigns} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Referrals sub-tab
// ---------------------------------------------------------------------------

function ReferralsTab({ rows }: { rows: AdminReferralRow[] }) {
  const [referralList, setReferralList] = useState(rows)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<{ status: string; completedAt: string }>({
    status: "pending",
    completedAt: "",
  })
  const [saving, setSaving] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const pending = referralList.filter((r) => r.status === "pending").length
  const complete = referralList.filter((r) => r.status === "complete").length

  function openEdit(r: AdminReferralRow) {
    setEditingId(r.id)
    setEditForm({
      status: r.status,
      completedAt: r.completedAt ? new Date(r.completedAt).toISOString().slice(0, 10) : "",
    })
    setDeleteConfirmId(null)
  }

  async function handleSave() {
    if (!editingId) return
    setSaving(true)
    await adminUpdateReferral(editingId, {
      status: editForm.status,
      completedAt: editForm.completedAt ? new Date(editForm.completedAt) : null,
    })
    setReferralList((prev) =>
      prev.map((r) =>
        r.id === editingId
          ? {
              ...r,
              status: editForm.status,
              completedAt: editForm.completedAt ? new Date(editForm.completedAt) : null,
            }
          : r,
      ),
    )
    setSaving(false)
    setEditingId(null)
  }

  async function handleDelete(id: number) {
    setDeleteError(null)
    const result = await adminDeleteReferral(id)
    if (result.error) {
      setDeleteError(result.error)
      setDeleteConfirmId(null)
    } else {
      setReferralList((prev) => prev.filter((r) => r.id !== id))
      setDeleteConfirmId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <StatCard label="Total Referrals" value={referralList.length} />
        <StatCard label="Pending" value={pending} />
        <StatCard label="Completed" value={complete} />
      </div>

      {deleteError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {deleteError}
          <button type="button" onClick={() => setDeleteError(null)} className="ml-3 text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-card border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Referrer</th>
              <th className="px-4 py-3">Enrollment Ref</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Referred On</th>
              <th className="px-4 py-3">Completed</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {referralList.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No referrals yet.
                </td>
              </tr>
            )}
            {referralList.map((r) => (
              <>
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
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {formatDate(r.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {r.completedAt ? formatDate(r.completedAt) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(r)}
                        className="rounded border border-border px-2 py-1 text-xs font-semibold text-navy hover:bg-muted"
                      >
                        Edit
                      </button>
                      {deleteConfirmId === r.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDelete(r.id)}
                            className="rounded border border-red-300 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setDeleteConfirmId(r.id); setEditingId(null) }}
                          className="rounded border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {/* Inline edit row */}
                {editingId === r.id && (
                  <tr key={`edit-${r.id}`} className="border-b border-border bg-muted/30">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="flex flex-wrap items-end gap-3">
                        <label className="block">
                          <span className="text-xs font-semibold text-navy">Status</span>
                          <select
                            value={editForm.status}
                            onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                            className="mt-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-lime"
                          >
                            <option value="pending">Pending</option>
                            <option value="complete">Complete</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-xs font-semibold text-navy">Completed date</span>
                          <input
                            type="date"
                            value={editForm.completedAt}
                            onChange={(e) => setEditForm((f) => ({ ...f, completedAt: e.target.value }))}
                            className="mt-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-lime"
                          />
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={handleSave}
                            className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                          >
                            {saving ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
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
  const [voucherList, setVoucherList] = useState(rows)
  const [editingVoucherId, setEditingVoucherId] = useState<number | null>(null)
  const [editVoucherForm, setEditVoucherForm] = useState<{
    discountPercent: number
    status: string
    expiresAt: string
  }>({ discountPercent: 0, status: "active", expiresAt: "" })
  const [saving, setSaving] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const filtered =
    filterStatus === "all" ? voucherList : voucherList.filter((v) => v.status === filterStatus)

  const active = voucherList.filter((v) => v.status === "active").length
  const used = voucherList.filter((v) => v.status === "used").length

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

  function openEditVoucher(v: AdminVoucherRow) {
    setEditingVoucherId(v.id)
    setEditVoucherForm({
      discountPercent: v.discountPercent,
      status: v.status,
      expiresAt: v.expiresAt ? new Date(v.expiresAt).toISOString().slice(0, 10) : "",
    })
  }

  async function handleSaveVoucher() {
    if (!editingVoucherId) return
    setSaving(true)
    await adminUpdateVoucher(editingVoucherId, {
      discountPercent: editVoucherForm.discountPercent,
      status: editVoucherForm.status,
      expiresAt: editVoucherForm.expiresAt ? new Date(editVoucherForm.expiresAt) : null,
    })
    setVoucherList((prev) =>
      prev.map((v) =>
        v.id === editingVoucherId
          ? {
              ...v,
              discountPercent: editVoucherForm.discountPercent,
              status: editVoucherForm.status,
              expiresAt: editVoucherForm.expiresAt ? new Date(editVoucherForm.expiresAt) : null,
            }
          : v,
      ),
    )
    setSaving(false)
    setEditingVoucherId(null)
  }

  async function handleDeleteVoucher(id: number) {
    await adminDeleteVoucher(id)
    setVoucherList((prev) => prev.filter((v) => v.id !== id))
    setDeleteConfirmId(null)
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex gap-4">
        <StatCard label="Total Vouchers" value={voucherList.length} />
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
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No vouchers found.
                </td>
              </tr>
            )}
            {filtered.map((v) => (
              <>
                <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-navy">{v.code}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-navy">{v.userName}</p>
                    <p className="text-xs text-muted-foreground">{v.userEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{v.campaignName}</td>
                  <td className="px-4 py-3 font-bold text-lime-foreground">{v.discountPercent}%</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {v.expiresAt ? formatDate(v.expiresAt) : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {v.usedAt ? formatDate(v.usedAt) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditVoucher(v)}
                        className="rounded border border-border px-2 py-1 text-xs font-semibold text-navy hover:bg-muted"
                      >
                        Edit
                      </button>
                      {deleteConfirmId === v.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDeleteVoucher(v.id)}
                            className="rounded border border-red-300 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(v.id)}
                          className="rounded border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {/* Inline edit row */}
                {editingVoucherId === v.id && (
                  <tr key={`edit-${v.id}`} className="border-b border-border bg-muted/30">
                    <td colSpan={8} className="px-4 py-3">
                      <div className="flex flex-wrap items-end gap-3">
                        <label className="block">
                          <span className="text-xs font-semibold text-navy">Discount %</span>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={editVoucherForm.discountPercent}
                            onChange={(e) => setEditVoucherForm((f) => ({ ...f, discountPercent: Number(e.target.value) }))}
                            className="mt-1 w-24 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-lime"
                          />
                        </label>
                        <label className="block">
                          <span className="text-xs font-semibold text-navy">Status</span>
                          <select
                            value={editVoucherForm.status}
                            onChange={(e) => setEditVoucherForm((f) => ({ ...f, status: e.target.value }))}
                            className="mt-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-lime"
                          >
                            <option value="active">Active</option>
                            <option value="used">Used</option>
                            <option value="expired">Expired</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-xs font-semibold text-navy">Expiry date</span>
                          <input
                            type="date"
                            value={editVoucherForm.expiresAt}
                            onChange={(e) => setEditVoucherForm((f) => ({ ...f, expiresAt: e.target.value }))}
                            className="mt-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-lime"
                          />
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={handleSaveVoucher}
                            className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                          >
                            {saving ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingVoucherId(null)}
                            className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
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

function CampaignsTab({ campaigns: initial }: { campaigns: VoucherCampaign[] }) {
  const [campaigns, setCampaigns] = useState(initial)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [newForm, setNewForm] = useState({
    name: "",
    description: "",
    discountPercent: 10,
    appliesTo: "monthly",
    expiryDays: 90 as number | null,
    enabled: true,
  })

  const editForm = campaigns.find((c) => c.id === editingId)

  async function handleSave(c: VoucherCampaign) {
    setSaving(true)
    await adminUpdateCampaign(c.id, {
      name: c.name,
      description: c.description,
      discountPercent: c.discountPercent,
      appliesTo: c.appliesTo,
      expiryDays: c.expiryDays,
      enabled: c.enabled,
    })
    setSaving(false)
    setEditingId(null)
  }

  async function handleCreate() {
    setSaving(true)
    await adminCreateCampaign(newForm)
    setSaving(false)
    setShowNew(false)
    setNewForm({ name: "", description: "", discountPercent: 10, appliesTo: "monthly", expiryDays: 90, enabled: true })
  }

  async function handleDeleteCampaign(id: number) {
    setDeleteError(null)
    const result = await adminDeleteCampaign(id)
    if (result.error) {
      setDeleteError(result.error)
      setDeleteConfirmId(null)
    } else {
      setCampaigns((prev) => prev.filter((c) => c.id !== id))
      setDeleteConfirmId(null)
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

      {deleteError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {deleteError}
          <button type="button" onClick={() => setDeleteError(null)} className="ml-3 text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {/* New campaign form */}
      {showNew && (
        <div className="rounded-card border border-border bg-card p-4 shadow-sm space-y-3">
          <h3 className="font-semibold text-navy">New Campaign</h3>
          <CampaignFields
            values={newForm}
            onChange={(patch) => setNewForm((f) => ({ ...f, ...patch }))}
          />
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
                    <span><strong className="text-navy">{c.discountPercent}%</strong> discount</span>
                    <span>Applies to: <strong className="text-navy capitalize">{c.appliesTo}</strong></span>
                    <span>Expiry: <strong className="text-navy">{c.expiryDays ? `${c.expiryDays} days` : "Never"}</strong></span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setEditingId(c.id); setDeleteConfirmId(null) }}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-navy hover:bg-muted"
                  >
                    Edit
                  </button>
                  {deleteConfirmId === c.id ? (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleDeleteCampaign(c.id)}
                        className="rounded border border-red-300 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                      >
                        Confirm delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        className="rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setDeleteConfirmId(c.id); setEditingId(null) }}
                      className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
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
    discountPercent: number
    appliesTo: string
    expiryDays: number | null
    enabled: boolean
  }
  onChange: (patch: Partial<typeof values>) => void
}) {
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

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
