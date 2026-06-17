"use client"

import { useState, useTransition, useMemo, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  FileText, Mail, RefreshCw, Check, X, Pencil,
  ChevronDown, ChevronUp, Trash2, Plus, Filter, Search, Link2, UserPlus,
} from "lucide-react"
import {
  type AdminSignup,
  type UpdateSignupInput,
  type CreateSignupInput,
  type UserSearchResult,
  regenerateContract,
  resendWelcome,
  updateSignup,
  deleteSignup,
  createSignup,
  searchUsers,
} from "@/app/actions/admin-signups"
import type { CoachRow } from "@/app/actions/coaches"
import type { PublicPackage } from "@/app/actions/packages"
import type { Club } from "@/lib/db/schema"
import { formatSlot } from "@/lib/slots"

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8)
const STATUS_OPTIONS = ["active", "pending", "cancelled", "on-hold"]

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AdminSignupsManager({
  initialSignups,
  allCoaches,
  allPackages,
  allClubs,
}: {
  initialSignups: AdminSignup[]
  allCoaches: CoachRow[]
  allPackages: PublicPackage[]
  allClubs: Club[]
}) {
  const router = useRouter()
  const [signups, setSignups] = useState(initialSignups)
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<number | null>(null)
  const [toast, setToast] = useState<{ id: number; ok: boolean; msg: string } | null>(null)
  const [editing, setEditing] = useState<AdminSignup | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Filters
  const [filterCoach, setFilterCoach] = useState("")
  const [filterPackage, setFilterPackage] = useState("")
  const [filterClub, setFilterClub] = useState("")
  const [filterStatus, setFilterStatus] = useState("")

  function flash(id: number, ok: boolean, msg: string) {
    setToast({ id, ok, msg })
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 4000)
  }

  function openContract(pathname: string) {
    window.open(`/api/admin/contract?pathname=${encodeURIComponent(pathname)}`, "_blank")
  }

  function handleContract(s: AdminSignup) {
    if (s.contractUrl) { openContract(s.contractUrl); return }
    setBusyId(s.id)
    startTransition(async () => {
      try {
        const { pathname } = await regenerateContract(s.id)
        setSignups((prev) => prev.map((p) => (p.id === s.id ? { ...p, contractUrl: pathname } : p)))
        openContract(pathname)
      } catch {
        flash(s.id, false, "Could not generate contract")
      } finally {
        setBusyId(null)
      }
    })
  }

  function handleResend(s: AdminSignup) {
    setBusyId(s.id)
    startTransition(async () => {
      const res = await resendWelcome(s.id)
      flash(s.id, res.ok, res.ok ? "Welcome email sent" : (res.error ?? "Email failed"))
      setBusyId(null)
    })
  }

  function handleSaveEdit(updated: AdminSignup, input: UpdateSignupInput) {
    startTransition(async () => {
      const res = await updateSignup(updated.id, input)
      if (res.ok) {
        const slotLabel =
          input.slotWeekday != null && input.slotHour != null
            ? formatSlot(input.slotWeekday, input.slotHour)
            : updated.slotLabel
        setSignups((prev) =>
          prev.map((p) =>
            p.id === updated.id
              ? {
                  ...p,
                  parentName: input.parentName,
                  parentEmail: input.parentEmail,
                  parentMobile: input.parentMobile,
                  childName: input.childName,
                  childDob: input.childDob,
                  childAge: input.childAge,
                  packageName: input.packageName,
                  club: input.club,
                  coachName: input.coachName,
                  slotWeekday: input.slotWeekday,
                  slotHour: input.slotHour != null ? String(input.slotHour) : null,
                  slotLabel: slotLabel ?? null,
                  emergencyContactName: input.emergencyContactName,
                  emergencyContactPhone: input.emergencyContactPhone,
                  status: input.status,
                }
              : p,
          ),
        )
        flash(updated.id, true, "Details saved")
        setEditing(null)
        router.refresh()
      } else {
        flash(updated.id, false, res.error ?? "Save failed")
      }
    })
  }

  function handleConfirmDelete(id: number) {
    startTransition(async () => {
      const res = await deleteSignup(id)
      if (res.ok) {
        setSignups((prev) => prev.filter((s) => s.id !== id))
        setConfirmDeleteId(null)
        router.refresh()
      } else {
        flash(id, false, res.error ?? "Delete failed")
        setConfirmDeleteId(null)
      }
    })
  }

  function handleCreate(input: CreateSignupInput) {
    startTransition(async () => {
      const res = await createSignup(input)
      if (res.ok && res.id && res.referenceNumber) {
        const newSignup: AdminSignup = {
          id: res.id,
          referenceNumber: res.referenceNumber,
          parentName: input.parentName,
          parentEmail: input.parentEmail,
          parentMobile: input.parentMobile,
          childName: input.childName,
          childDob: input.childDob,
          childAge: input.childAge,
          packageName: input.packageName,
          club: input.club,
          coachName: input.coachName || null,
          slotWeekday: input.slotWeekday,
          slotHour: input.slotHour != null ? String(input.slotHour) : null,
          slotLabel:
            input.slotWeekday != null && input.slotHour != null
              ? formatSlot(input.slotWeekday, input.slotHour)
              : null,
          emergencyContactName: input.emergencyContactName || null,
          emergencyContactPhone: input.emergencyContactPhone || null,
          debitAccountHolder: null,
          debitBankName: null,
          debitAccountNumber: null,
          debitAccountType: null,
          debitDay: null,
          agreedTerms: false,
          consentMedia: false,
          contractUrl: null,
          status: input.status,
          signedAt: null,
          createdAt: new Date().toISOString(),
        }
        setSignups((prev) => [newSignup, ...prev])
        setShowAddModal(false)
        router.refresh()
      } else {
        alert(res.error ?? "Could not create sign-up")
      }
    })
  }

  // Derive unique option lists from live signups data
  const coachOptions = useMemo(() => {
    const names = Array.from(new Set(signups.map((s) => s.coachName).filter(Boolean) as string[]))
    return names.sort()
  }, [signups])

  const packageOptions = useMemo(() => {
    const names = Array.from(new Set(signups.map((s) => s.packageName).filter(Boolean)))
    return names.sort()
  }, [signups])

  const clubOptions = useMemo(() => {
    const names = Array.from(new Set(signups.map((s) => s.club).filter(Boolean) as string[]))
    return names.sort()
  }, [signups])

  const filtered = useMemo(() => {
    return signups.filter((s) => {
      if (filterCoach && s.coachName !== filterCoach) return false
      if (filterPackage && s.packageName !== filterPackage) return false
      if (filterClub && s.club !== filterClub) return false
      if (filterStatus && s.status !== filterStatus) return false
      return true
    })
  }, [signups, filterCoach, filterPackage, filterClub, filterStatus])

  const hasFilters = filterCoach || filterPackage || filterClub || filterStatus

  function statusColor(status: string) {
    switch (status) {
      case "active": return "bg-lime/20 text-navy"
      case "pending": return "bg-amber-100 text-amber-800"
      case "cancelled": return "bg-red-100 text-red-700"
      case "on-hold": return "bg-gray-100 text-gray-600"
      default: return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy">
            Sign-ups ({filtered.length}{hasFilters ? ` of ${signups.length}` : ""})
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every enrollment with its signed contract. Edit details, download the PDF, or resend the welcome email.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-md bg-lime px-4 py-2 text-sm font-bold text-lime-foreground hover:bg-lime/90"
        >
          <Plus className="h-4 w-4" />
          Add sign-up
        </button>
      </div>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          Filter
        </span>

        <FilterSelect
          label="Coach"
          value={filterCoach}
          onChange={setFilterCoach}
          options={coachOptions}
          placeholder="All coaches"
        />
        <FilterSelect
          label="Package"
          value={filterPackage}
          onChange={setFilterPackage}
          options={packageOptions}
          placeholder="All packages"
        />
        <FilterSelect
          label="Club"
          value={filterClub}
          onChange={setFilterClub}
          options={clubOptions}
          placeholder="All clubs"
        />
        <FilterSelect
          label="Status"
          value={filterStatus}
          onChange={setFilterStatus}
          options={STATUS_OPTIONS}
          placeholder="All statuses"
        />

        {hasFilters && (
          <button
            onClick={() => { setFilterCoach(""); setFilterPackage(""); setFilterClub(""); setFilterStatus("") }}
            className="ml-auto text-xs font-semibold text-muted-foreground underline-offset-2 hover:text-navy hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-card border border-border bg-card shadow-sm">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Child / Parent</th>
              <th className="px-4 py-3">Package &amp; Club</th>
              <th className="px-4 py-3">Coach</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <>
                <tr key={s.id} className="border-b border-border last:border-0 align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-navy">{s.referenceNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.signedAt ? new Date(s.signedAt).toLocaleDateString("en-ZA") : "—"}
                    </p>
                    <button
                      onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                      className="mt-1 flex items-center gap-1 text-xs text-lime-foreground hover:underline"
                    >
                      {expanded === s.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {expanded === s.id ? "Less" : "Details"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-navy">
                      {s.childName}
                      {s.childAge != null ? ` (age ${s.childAge})` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">{s.parentName}</p>
                    <p className="text-xs text-muted-foreground">{s.parentEmail}</p>
                    <p className="text-xs text-muted-foreground">{s.parentMobile}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-navy">{s.packageName}</p>
                    <p className="text-xs text-muted-foreground">{s.club ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{s.slotLabel ?? "Slot TBC"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-navy">{s.coachName ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusColor(s.status)}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => setEditing(s)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-navy/90"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleContract(s)}
                        disabled={pending && busyId === s.id}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-muted disabled:opacity-50"
                      >
                        <FileText className="h-3.5 w-3.5 text-lime" />
                        {s.contractUrl ? "View contract" : busyId === s.id ? "Generating…" : "Generate PDF"}
                      </button>
                      <button
                        onClick={() => handleResend(s)}
                        disabled={pending && busyId === s.id}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-muted disabled:opacity-50"
                      >
                        {busyId === s.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5 text-lime" />}
                        Resend welcome
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(s.id)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                      {toast?.id === s.id && (
                        <span className={`text-xs font-semibold ${toast.ok ? "text-lime-foreground" : "text-destructive"}`}>
                          {toast.msg}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Expandable detail row */}
                {expanded === s.id && (
                  <tr key={`${s.id}-detail`} className="border-b border-border bg-muted/20">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="grid gap-4 text-sm sm:grid-cols-3">
                        <dl>
                          <dt className="font-semibold text-navy">Emergency contact</dt>
                          <dd className="text-muted-foreground">{s.emergencyContactName || "—"}</dd>
                          <dd className="text-muted-foreground">{s.emergencyContactPhone || "—"}</dd>
                        </dl>
                        <dl>
                          <dt className="font-semibold text-navy">Debit order</dt>
                          <dd className="text-muted-foreground">{s.debitAccountHolder || "—"}</dd>
                          <dd className="text-muted-foreground">{s.debitBankName || "—"} · {s.debitAccountType || "—"}</dd>
                          <dd className="text-muted-foreground">
                            {s.debitAccountNumber ? `****${s.debitAccountNumber.slice(-4)}` : "—"}
                          </dd>
                          <dd className="text-muted-foreground">Debit day: {s.debitDay ?? "—"}</dd>
                        </dl>
                        <dl>
                          <dt className="font-semibold text-navy">Consents</dt>
                          <dd><Badge ok={s.agreedTerms} label="Terms agreed" /></dd>
                          <dd><Badge ok={s.consentMedia} label="Media consent" /></dd>
                          <dt className="mt-2 font-semibold text-navy">Date of birth</dt>
                          <dd className="text-muted-foreground">{s.childDob || "—"}</dd>
                        </dl>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  {hasFilters ? "No sign-ups match the current filters." : "No sign-ups yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editing && (
        <EditModal
          signup={editing}
          pending={pending}
          allCoaches={allCoaches}
          allPackages={allPackages}
          allClubs={allClubs}
          onSave={(input) => handleSaveEdit(editing, input)}
          onClose={() => setEditing(null)}
        />
      )}

      {/* Add modal */}
      {showAddModal && (
        <AddModal
          pending={pending}
          allCoaches={allCoaches}
          allPackages={allPackages}
          allClubs={allClubs}
          onCreate={handleCreate}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Delete confirmation dialog */}
      {confirmDeleteId != null && (
        <ConfirmDialog
          message="Are you sure you want to permanently remove this sign-up? This cannot be undone."
          confirmLabel="Yes, remove"
          pending={pending}
          onConfirm={() => handleConfirmDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Filter select
// ---------------------------------------------------------------------------

function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-md border px-2 py-1 text-xs font-medium outline-none focus:border-lime ${
          value ? "border-lime bg-lime/10 text-navy" : "border-border bg-background text-muted-foreground"
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Confirm dialog
// ---------------------------------------------------------------------------

function ConfirmDialog({
  message,
  confirmLabel,
  pending,
  onConfirm,
  onCancel,
}: {
  message: string
  confirmLabel: string
  pending: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-2xl">
        <h3 className="text-base font-bold text-navy">Confirm removal</h3>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-navy hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={pending}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {pending ? "Removing…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared form sections (used in both Edit and Add modals)
// ---------------------------------------------------------------------------

const inputCls = "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
const selectCls = "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"

// ---------------------------------------------------------------------------
// Edit modal
// ---------------------------------------------------------------------------

function EditModal({
  signup,
  pending,
  allCoaches,
  allPackages,
  allClubs,
  onSave,
  onClose,
}: {
  signup: AdminSignup
  pending: boolean
  allCoaches: CoachRow[]
  allPackages: PublicPackage[]
  allClubs: Club[]
  onSave: (input: UpdateSignupInput) => void
  onClose: () => void
}) {
  const [parentName, setParentName] = useState(signup.parentName)
  const [parentEmail, setParentEmail] = useState(signup.parentEmail)
  const [parentMobile, setParentMobile] = useState(signup.parentMobile)
  const [childName, setChildName] = useState(signup.childName)
  const [childDob, setChildDob] = useState(signup.childDob ?? "")
  const [childAge, setChildAge] = useState(String(signup.childAge ?? ""))
  const [packageName, setPackageName] = useState(signup.packageName)
  const [club, setClub] = useState(signup.club ?? "")
  const [coachName, setCoachName] = useState(signup.coachName ?? "")
  const [slotWeekday, setSlotWeekday] = useState<string>(
    signup.slotWeekday != null ? String(signup.slotWeekday) : "",
  )
  const [slotHour, setSlotHour] = useState<string>(
    signup.slotHour != null ? String(signup.slotHour) : "",
  )
  const [emergencyName, setEmergencyName] = useState(signup.emergencyContactName ?? "")
  const [emergencyPhone, setEmergencyPhone] = useState(signup.emergencyContactPhone ?? "")
  const [status, setStatus] = useState(signup.status)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      parentName, parentEmail, parentMobile,
      childName, childDob, childAge: Number(childAge) || 0,
      packageName, club, coachName,
      slotWeekday: slotWeekday !== "" ? Number(slotWeekday) : null,
      slotHour: slotHour !== "" ? Number(slotHour) : null,
      emergencyContactName: emergencyName,
      emergencyContactPhone: emergencyPhone,
      status,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10">
      <div className="w-full max-w-2xl rounded-xl bg-card shadow-2xl">
        <ModalHeader title="Edit Sign-up" subtitle={signup.referenceNumber} onClose={onClose} />
        <form onSubmit={submit} className="space-y-5 px-6 py-5">
          <ParentFields
            parentName={parentName} setParentName={setParentName}
            parentEmail={parentEmail} setParentEmail={setParentEmail}
            parentMobile={parentMobile} setParentMobile={setParentMobile}
          />
          <ChildFields
            childName={childName} setChildName={setChildName}
            childDob={childDob} setChildDob={setChildDob}
            childAge={childAge} setChildAge={setChildAge}
          />
          <ProgrammeFields
            packageName={packageName} setPackageName={setPackageName}
            club={club} setClub={setClub}
            coachName={coachName} setCoachName={setCoachName}
            slotWeekday={slotWeekday} setSlotWeekday={setSlotWeekday}
            slotHour={slotHour} setSlotHour={setSlotHour}
            allPackages={allPackages} allClubs={allClubs} allCoaches={allCoaches}
          />
          <EmergencyFields
            emergencyName={emergencyName} setEmergencyName={setEmergencyName}
            emergencyPhone={emergencyPhone} setEmergencyPhone={setEmergencyPhone}
          />
          <Field label="Enrollment status">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </Field>
          <ModalFooter pending={pending} onClose={onClose} submitLabel="Save changes" />
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add modal
// ---------------------------------------------------------------------------

function AddModal({
  pending,
  allCoaches,
  allPackages,
  allClubs,
  onCreate,
  onClose,
}: {
  pending: boolean
  allCoaches: CoachRow[]
  allPackages: PublicPackage[]
  allClubs: Club[]
  onCreate: (input: CreateSignupInput) => void
  onClose: () => void
}) {
  // --- Account link mode ---
  const [linkMode, setLinkMode] = useState<"link" | "new">("link")
  const [userQuery, setUserQuery] = useState("")
  const [userResults, setUserResults] = useState<UserSearchResult[]>([])
  const [linkedUser, setLinkedUser] = useState<UserSearchResult | null>(null)
  const [searching, setSearching] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // --- Enrollment fields ---
  const [parentName, setParentName] = useState("")
  const [parentEmail, setParentEmail] = useState("")
  const [parentMobile, setParentMobile] = useState("")
  const [childName, setChildName] = useState("")
  const [childDob, setChildDob] = useState("")
  const [childAge, setChildAge] = useState("")
  const [packageName, setPackageName] = useState(allPackages[0]?.name ?? "")
  const [club, setClub] = useState(allClubs[0]?.name ?? "")
  const [coachName, setCoachName] = useState("")
  const [slotWeekday, setSlotWeekday] = useState("")
  const [slotHour, setSlotHour] = useState("")
  const [emergencyName, setEmergencyName] = useState("")
  const [emergencyPhone, setEmergencyPhone] = useState("")
  const [status, setStatus] = useState("pending")

  // Debounced user search
  useEffect(() => {
    if (linkMode !== "link" || userQuery.trim().length < 2) {
      setUserResults([])
      return
    }
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await searchUsers(userQuery)
        setUserResults(results)
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [userQuery, linkMode])

  // When a user is selected, auto-fill parent name + email (read-only)
  function selectUser(u: UserSearchResult) {
    setLinkedUser(u)
    setParentName(u.name)
    setParentEmail(u.email)
    setUserResults([])
    setUserQuery("")
  }

  function clearLinkedUser() {
    setLinkedUser(null)
    setParentName("")
    setParentEmail("")
  }

  function switchMode(mode: "link" | "new") {
    setLinkMode(mode)
    setLinkedUser(null)
    setUserQuery("")
    setUserResults([])
    if (mode === "new") {
      setParentName("")
      setParentEmail("")
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    onCreate({
      parentName, parentEmail, parentMobile,
      childName, childDob, childAge: Number(childAge) || 0,
      packageName, club, coachName,
      slotWeekday: slotWeekday !== "" ? Number(slotWeekday) : null,
      slotHour: slotHour !== "" ? Number(slotHour) : null,
      emergencyContactName: emergencyName,
      emergencyContactPhone: emergencyPhone,
      status,
      linkUserId: linkMode === "link" && linkedUser ? linkedUser.id : undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10">
      <div className="w-full max-w-2xl rounded-xl bg-card shadow-2xl">
        <ModalHeader title="Add Sign-up" subtitle="Manually create a new enrollment record" onClose={onClose} />
        <form onSubmit={submit} className="space-y-5 px-6 py-5">

          {/* ── Account link mode toggle ── */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-bold text-navy">Link to account</legend>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => switchMode("link")}
                className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
                  linkMode === "link"
                    ? "border-lime bg-lime/10 text-navy"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                <Link2 className="h-4 w-4" />
                Link existing account
              </button>
              <button
                type="button"
                onClick={() => switchMode("new")}
                className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
                  linkMode === "new"
                    ? "border-lime bg-lime/10 text-navy"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                <UserPlus className="h-4 w-4" />
                New / no account
              </button>
            </div>

            {linkMode === "link" && (
              <div className="space-y-2">
                {linkedUser ? (
                  /* Linked account chip */
                  <div className="flex items-center justify-between rounded-lg border border-lime bg-lime/10 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-bold text-navy">{linkedUser.name}</p>
                      <p className="text-xs text-muted-foreground">{linkedUser.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={clearLinkedUser}
                      className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-navy"
                      aria-label="Remove linked account"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  /* Search box */
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                      <Search className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by name or email…"
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-lime"
                    />
                    {searching && (
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {userResults.length > 0 && (
                      <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg">
                        {userResults.map((u) => (
                          <li key={u.id}>
                            <button
                              type="button"
                              onClick={() => selectUser(u)}
                              className="flex w-full flex-col px-4 py-2.5 text-left hover:bg-muted"
                            >
                              <span className="text-sm font-semibold text-navy">{u.name}</span>
                              <span className="text-xs text-muted-foreground">{u.email}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {userQuery.trim().length >= 2 && !searching && userResults.length === 0 && (
                      <p className="mt-1.5 text-xs text-muted-foreground">No accounts found — switch to &quot;New / no account&quot; to add manually.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </fieldset>

          {/* ── Parent / Guardian ── */}
          <ParentFields
            parentName={parentName} setParentName={setParentName}
            parentEmail={parentEmail} setParentEmail={setParentEmail}
            parentMobile={parentMobile} setParentMobile={setParentMobile}
            readOnly={linkMode === "link" && linkedUser != null}
          />
          <ChildFields
            childName={childName} setChildName={setChildName}
            childDob={childDob} setChildDob={setChildDob}
            childAge={childAge} setChildAge={setChildAge}
          />
          <ProgrammeFields
            packageName={packageName} setPackageName={setPackageName}
            club={club} setClub={setClub}
            coachName={coachName} setCoachName={setCoachName}
            slotWeekday={slotWeekday} setSlotWeekday={setSlotWeekday}
            slotHour={slotHour} setSlotHour={setSlotHour}
            allPackages={allPackages} allClubs={allClubs} allCoaches={allCoaches}
          />
          <EmergencyFields
            emergencyName={emergencyName} setEmergencyName={setEmergencyName}
            emergencyPhone={emergencyPhone} setEmergencyPhone={setEmergencyPhone}
          />
          <Field label="Enrollment status">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </Field>
          <ModalFooter pending={pending} onClose={onClose} submitLabel="Create sign-up" />
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared form sub-components
// ---------------------------------------------------------------------------

function ModalHeader({ title, subtitle, onClose }: { title: string; subtitle: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-border px-6 py-4">
      <div>
        <h2 className="text-lg font-bold text-navy">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-navy" aria-label="Close">
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}

function ModalFooter({ pending, onClose, submitLabel }: { pending: boolean; onClose: () => void; submitLabel: string }) {
  return (
    <div className="flex justify-end gap-2 border-t border-border pt-4">
      <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-navy hover:bg-muted">
        Cancel
      </button>
      <button type="submit" disabled={pending} className="rounded-md bg-lime px-5 py-2 text-sm font-bold text-lime-foreground hover:bg-lime/90 disabled:opacity-50">
        {pending ? "Saving…" : submitLabel}
      </button>
    </div>
  )
}

function ParentFields({ parentName, setParentName, parentEmail, setParentEmail, parentMobile, setParentMobile, readOnly = false }: {
  parentName: string; setParentName: (v: string) => void
  parentEmail: string; setParentEmail: (v: string) => void
  parentMobile: string; setParentMobile: (v: string) => void
  readOnly?: boolean
}) {
  const roClass = readOnly ? "opacity-60 cursor-not-allowed bg-muted" : ""
  return (
    <fieldset className="space-y-3">
      <legend className="flex items-center gap-2 text-sm font-bold text-navy">
        Parent / Guardian
        {readOnly && <span className="rounded-full bg-lime/20 px-2 py-0.5 text-xs font-normal text-navy">auto-filled from account</span>}
      </legend>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Full name" required>
          <input type="text" required readOnly={readOnly} value={parentName} onChange={(e) => setParentName(e.target.value)} className={`${inputCls} ${roClass}`} />
        </Field>
        <Field label="Email" required>
          <input type="email" required readOnly={readOnly} value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} className={`${inputCls} ${roClass}`} />
        </Field>
        <div className="flex flex-col gap-1">
          <Field label="Mobile" required>
            <input
              type="tel"
              required
              value={parentMobile}
              onChange={(e) => setParentMobile(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="0812345678"
              maxLength={10}
              className={inputCls}
            />
          </Field>
          <p className="text-xs text-muted-foreground">Start with 0, no +27 — e.g. 0812345678 (10 digits)</p>
          {parentMobile.length > 0 && !/^0\d{9}$/.test(parentMobile) && (
            <p className="text-xs font-semibold text-destructive">
              {!parentMobile.startsWith("0")
                ? "Must start with 0"
                : `${parentMobile.length}/10 digits`}
            </p>
          )}
        </div>
      </div>
    </fieldset>
  )
}

function ChildFields({ childName, setChildName, childDob, setChildDob, childAge, setChildAge }: {
  childName: string; setChildName: (v: string) => void
  childDob: string; setChildDob: (v: string) => void
  childAge: string; setChildAge: (v: string) => void
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-bold text-navy">Child</legend>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Full name" required>
          <input type="text" required value={childName} onChange={(e) => setChildName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Date of birth">
          <input type="date" value={childDob} onChange={(e) => setChildDob(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Age">
          <input type="number" min={1} max={17} value={childAge} onChange={(e) => setChildAge(e.target.value)} className={inputCls} />
        </Field>
      </div>
    </fieldset>
  )
}

function ProgrammeFields({
  packageName, setPackageName,
  club, setClub,
  coachName, setCoachName,
  slotWeekday, setSlotWeekday,
  slotHour, setSlotHour,
  allPackages, allClubs, allCoaches,
}: {
  packageName: string; setPackageName: (v: string) => void
  club: string; setClub: (v: string) => void
  coachName: string; setCoachName: (v: string) => void
  slotWeekday: string; setSlotWeekday: (v: string) => void
  slotHour: string; setSlotHour: (v: string) => void
  allPackages: PublicPackage[]
  allClubs: Club[]
  allCoaches: CoachRow[]
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-bold text-navy">Programme</legend>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Package">
          <select value={packageName} onChange={(e) => setPackageName(e.target.value)} className={selectCls}>
            {allPackages.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
            {/* Allow free-text fallback if packageName isn't in the list */}
            {packageName && !allPackages.find((p) => p.name === packageName) && (
              <option value={packageName}>{packageName}</option>
            )}
          </select>
        </Field>
        <Field label="Club">
          <select value={club} onChange={(e) => setClub(e.target.value)} className={selectCls}>
            {allClubs.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            {club && !allClubs.find((c) => c.name === club) && (
              <option value={club}>{club}</option>
            )}
          </select>
        </Field>
        <Field label="Coach">
          <select value={coachName} onChange={(e) => setCoachName(e.target.value)} className={selectCls}>
            <option value="">— not assigned —</option>
            {allCoaches.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Session day">
          <select value={slotWeekday} onChange={(e) => setSlotWeekday(e.target.value)} className={selectCls}>
            <option value="">— not set —</option>
            {WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </Field>
        <Field label="Session time">
          <select value={slotHour} onChange={(e) => setSlotHour(e.target.value)} className={selectCls}>
            <option value="">— not set —</option>
            {HOURS.map((h) => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}
          </select>
        </Field>
      </div>
    </fieldset>
  )
}

function EmergencyFields({ emergencyName, setEmergencyName, emergencyPhone, setEmergencyPhone }: {
  emergencyName: string; setEmergencyName: (v: string) => void
  emergencyPhone: string; setEmergencyPhone: (v: string) => void
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-bold text-navy">Emergency Contact</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name">
          <input type="text" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Phone">
          <input type="tel" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} className={inputCls} />
        </Field>
      </div>
    </fieldset>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <span className="block text-xs font-semibold text-navy">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </span>
      {children}
    </div>
  )
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`mr-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${ok ? "bg-lime/15 text-navy" : "bg-muted text-muted-foreground"}`}>
      {ok ? <Check className="h-3 w-3 text-lime" /> : <X className="h-3 w-3" />}
      {label}
    </span>
  )
}
