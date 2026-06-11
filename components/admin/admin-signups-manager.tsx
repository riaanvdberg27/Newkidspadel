"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { FileText, Mail, RefreshCw, Check, X, Pencil, ChevronDown, ChevronUp } from "lucide-react"
import {
  type AdminSignup,
  type UpdateSignupInput,
  regenerateContract,
  resendWelcome,
  updateSignup,
} from "@/app/actions/admin-signups"

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8) // 08-18
const STATUS_OPTIONS = ["active", "pending", "cancelled", "on-hold"]

export function AdminSignupsManager({ initialSignups }: { initialSignups: AdminSignup[] }) {
  const router = useRouter()
  const [signups, setSignups] = useState(initialSignups)
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<number | null>(null)
  const [toast, setToast] = useState<{ id: number; ok: boolean; msg: string } | null>(null)
  const [editing, setEditing] = useState<AdminSignup | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)

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
            ? `${WEEKDAYS[input.slotWeekday]} ${String(input.slotHour).padStart(2, "0")}:00`
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
                  slotWeekday: input.slotWeekday,
                  slotHour: input.slotHour,
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
      <h2 className="text-xl font-bold text-navy">Sign-ups ({signups.length})</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Every enrollment with its signed contract. Edit details, download the PDF, or resend the welcome email.
      </p>

      <div className="mt-6 overflow-x-auto rounded-card border border-border bg-card shadow-sm">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Child / Parent</th>
              <th className="px-4 py-3">Package &amp; Club</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {signups.map((s) => (
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
                    <td colSpan={5} className="px-6 py-4">
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
            {signups.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No sign-ups yet.
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
          onSave={(input) => handleSaveEdit(editing, input)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Edit modal
// ---------------------------------------------------------------------------

function EditModal({
  signup,
  pending,
  onSave,
  onClose,
}: {
  signup: AdminSignup
  pending: boolean
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
      parentName,
      parentEmail,
      parentMobile,
      childName,
      childDob,
      childAge: Number(childAge) || 0,
      packageName,
      club,
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
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-navy">Edit Sign-up</h2>
            <p className="text-xs text-muted-foreground">{signup.referenceNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-navy"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 px-6 py-5">
          {/* Parent / guardian */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-bold text-navy">Parent / Guardian</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Full name" required>
                <input
                  type="text"
                  required
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
                />
              </Field>
              <Field label="Email" required>
                <input
                  type="email"
                  required
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
                />
              </Field>
              <Field label="Mobile" required>
                <input
                  type="tel"
                  required
                  value={parentMobile}
                  onChange={(e) => setParentMobile(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
                />
              </Field>
            </div>
          </fieldset>

          {/* Child */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-bold text-navy">Child</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Full name" required>
                <input
                  type="text"
                  required
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
                />
              </Field>
              <Field label="Date of birth">
                <input
                  type="date"
                  value={childDob}
                  onChange={(e) => setChildDob(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
                />
              </Field>
              <Field label="Age">
                <input
                  type="number"
                  min={1}
                  max={17}
                  value={childAge}
                  onChange={(e) => setChildAge(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
                />
              </Field>
            </div>
          </fieldset>

          {/* Programme */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-bold text-navy">Programme</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Package">
                <input
                  type="text"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
                />
              </Field>
              <Field label="Club">
                <input
                  type="text"
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
                />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Session day">
                <select
                  value={slotWeekday}
                  onChange={(e) => setSlotWeekday(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
                >
                  <option value="">— not set —</option>
                  {WEEKDAYS.map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
              </Field>
              <Field label="Session time">
                <select
                  value={slotHour}
                  onChange={(e) => setSlotHour(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
                >
                  <option value="">— not set —</option>
                  {HOURS.map((h) => (
                    <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                  ))}
                </select>
              </Field>
            </div>
          </fieldset>

          {/* Emergency contact */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-bold text-navy">Emergency Contact</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name">
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
                />
              </Field>
              <Field label="Phone">
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
                />
              </Field>
            </div>
          </fieldset>

          {/* Status */}
          <Field label="Enrollment status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
          </Field>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-navy hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-lime px-5 py-2 text-sm font-bold text-lime-foreground hover:bg-lime/90 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
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
    <span
      className={`mr-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        ok ? "bg-lime/15 text-navy" : "bg-muted text-muted-foreground"
      }`}
    >
      {ok ? <Check className="h-3 w-3 text-lime" /> : <X className="h-3 w-3" />}
      {label}
    </span>
  )
}
