"use client"

import { useState, useTransition } from "react"
import { FileText, Mail, RefreshCw, Check, X } from "lucide-react"
import { type AdminSignup, regenerateContract, resendWelcome } from "@/app/actions/admin-signups"

export function AdminSignupsManager({ initialSignups }: { initialSignups: AdminSignup[] }) {
  const [signups, setSignups] = useState(initialSignups)
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<number | null>(null)
  const [toast, setToast] = useState<{ id: number; ok: boolean; msg: string } | null>(null)

  function flash(id: number, ok: boolean, msg: string) {
    setToast({ id, ok, msg })
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 4000)
  }

  function handleContract(s: AdminSignup) {
    if (s.contractUrl) {
      window.open(s.contractUrl, "_blank")
      return
    }
    setBusyId(s.id)
    startTransition(async () => {
      try {
        const { url } = await regenerateContract(s.id)
        setSignups((prev) => prev.map((p) => (p.id === s.id ? { ...p, contractUrl: url } : p)))
        window.open(url, "_blank")
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
      flash(s.id, res.ok, res.ok ? "Welcome email sent" : res.error ?? "Email failed")
      setBusyId(null)
    })
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-navy">Sign-ups ({signups.length})</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Every enrollment with its signed contract. Download the PDF or resend the welcome email.
      </p>

      <div className="mt-6 overflow-x-auto rounded-card border border-border bg-card shadow-sm">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Child / Parent</th>
              <th className="px-4 py-3">Package</th>
              <th className="px-4 py-3">Club &amp; Slot</th>
              <th className="px-4 py-3">Consents</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {signups.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0 align-top">
                <td className="px-4 py-3">
                  <p className="font-semibold text-navy">{s.referenceNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.signedAt ? new Date(s.signedAt).toLocaleDateString("en-ZA") : "—"}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-navy">
                    {s.childName}
                    {s.childAge != null ? ` (${s.childAge})` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.parentName}</p>
                  <p className="text-xs text-muted-foreground">{s.parentEmail}</p>
                </td>
                <td className="px-4 py-3 text-navy">{s.packageName}</td>
                <td className="px-4 py-3">
                  <p className="text-navy">{s.club ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{s.slotLabel ?? "—"}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge ok={s.agreedTerms} label="Terms" />
                  <Badge ok={s.consentMedia} label="Media" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-end gap-2">
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
                      <span className={`text-xs font-semibold ${toast.ok ? "text-lime" : "text-destructive"}`}>
                        {toast.msg}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {signups.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No sign-ups yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
