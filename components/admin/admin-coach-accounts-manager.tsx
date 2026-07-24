"use client"

import { useState, useTransition } from "react"
import { Save, Check, ChevronDown, KeyRound, Users, Mail, ExternalLink } from "lucide-react"
import { saveCoachAccount, type CoachAccountRow } from "@/app/actions/admin-coach-accounts"

const PORTAL_URL =
  (typeof window !== "undefined" ? window.location.origin : "https://nextgenpadelacademy.co.za") + "/coach/login"

type Option = { id: number; name: string }

function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
}: {
  options: Option[]
  selected: number[]
  onChange: (ids: number[]) => void
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  function toggle(id: number) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])
  }
  const label =
    selected.length === 0
      ? placeholder
      : options.filter((s) => selected.includes(s.id)).map((s) => s.name).join(", ")
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-1.5 flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
      >
        <span className={`truncate ${selected.length === 0 ? "text-muted-foreground" : "text-navy"}`}>{label}</span>
        <ChevronDown className={`ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-card shadow-lg">
          {options.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">None found.</p>
          ) : (
            options.map((s) => (
              <label key={s.id} className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-muted">
                <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} className="h-4 w-4 accent-lime" />
                <span className="text-sm text-navy">{s.name}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="block text-xs font-semibold text-navy">{label}</span>
      {children}
    </div>
  )
}

const inputCls = "mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"

function AccountCard({ coach, allSchools, allClubs }: { coach: CoachAccountRow; allSchools: Option[]; allClubs: Option[] }) {
  const [email, setEmail] = useState(coach.email ?? "")
  const [password, setPassword] = useState("")
  const [mobile, setMobile] = useState(coach.mobile)
  const [qualifications, setQualifications] = useState(coach.qualifications)
  const [employmentStatus, setEmploymentStatus] = useState(coach.employmentStatus)
  const [ecName, setEcName] = useState(coach.emergencyContactName)
  const [ecPhone, setEcPhone] = useState(coach.emergencyContactPhone)
  const [accountStatus, setAccountStatus] = useState(coach.accountStatus)
  const [evalEnabled, setEvalEnabled] = useState(coach.evalEnabled)
  const [schoolIds, setSchoolIds] = useState<number[]>(coach.schoolIds)
  const [clubIds, setClubIds] = useState<number[]>(coach.clubIds)
  const [hasPassword, setHasPassword] = useState(coach.hasPassword)

  const [saving, startSave] = useTransition()
  const [saved, setSaved] = useState(false)
  const [welcomeSent, setWelcomeSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSave() {
    setError(null)
    setSaved(false)
    setWelcomeSent(false)
    startSave(async () => {
      const res = await saveCoachAccount({
        id: coach.id,
        email,
        password: password || undefined,
        mobile,
        qualifications,
        employmentStatus,
        emergencyContactName: ecName,
        emergencyContactPhone: ecPhone,
        accountStatus,
        evalEnabled,
        schoolIds,
        clubIds,
      })
      if (res.ok) {
        if (password) setHasPassword(true)
        setPassword("")
        setSaved(true)
        if (res.welcomeEmailSent) setWelcomeSent(true)
        setTimeout(() => { setSaved(false); setWelcomeSent(false) }, 5000)
      } else {
        setError(res.error ?? "Save failed.")
      }
    })
  }

  const canLogin = Boolean(email) && hasPassword && accountStatus === "active"

  return (
    <fieldset className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="flex-1 text-sm font-bold text-navy">{coach.name || `Coach #${coach.id}`}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
          <Users className="h-3 w-3" />
          {coach.playerCount} player{coach.playerCount === 1 ? "" : "s"}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
            canLogin ? "bg-lime/20 text-lime-foreground" : "bg-amber-100 text-amber-700"
          }`}
        >
          {canLogin ? "Can log in" : hasPassword ? "Password set" : "No login yet"}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Login email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="coach@example.com" className={inputCls} />
        </Field>
        <Field label={hasPassword ? "Reset password (leave blank to keep)" : "Set password (min 6 chars)"}>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-2.5 top-1/2 mt-[3px] h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={hasPassword ? "••••••••" : "New password"}
              className={inputCls + " pl-8"}
            />
          </div>
        </Field>

        <Field label="Mobile">
          <input value={mobile} onChange={(e) => setMobile(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Employment status">
          <select value={employmentStatus} onChange={(e) => setEmploymentStatus(e.target.value)} className={inputCls}>
            <option value="active">Active</option>
            <option value="part-time">Part-time</option>
            <option value="contractor">Contractor</option>
            <option value="on-leave">On leave</option>
            <option value="terminated">Terminated</option>
          </select>
        </Field>

        <Field label="Emergency contact name">
          <input value={ecName} onChange={(e) => setEcName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Emergency contact phone">
          <input value={ecPhone} onChange={(e) => setEcPhone(e.target.value)} className={inputCls} />
        </Field>

        <Field label="Assigned clubs">
          <MultiSelect options={allClubs} selected={clubIds} onChange={setClubIds} placeholder="No clubs assigned" />
        </Field>
        <Field label="Assigned schools">
          <MultiSelect options={allSchools} selected={schoolIds} onChange={setSchoolIds} placeholder="No schools assigned" />
        </Field>
        <Field label="Account status">
          <select value={accountStatus} onChange={(e) => setAccountStatus(e.target.value)} className={inputCls}>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </Field>

        <Field label="Qualifications">
          <textarea
            value={qualifications}
            onChange={(e) => setQualifications(e.target.value)}
            rows={2}
            placeholder="Certifications, coaching level…"
            className={inputCls + " resize-none sm:col-span-2"}
          />
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-lime px-4 py-2 text-sm font-bold text-lime-foreground hover:bg-lime/90 disabled:opacity-40"
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save account"}
            </>
          )}
        </button>

        {welcomeSent && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <Mail className="h-3.5 w-3.5" />
            Welcome email sent to {email}
          </span>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </fieldset>
  )
}

export function AdminCoachAccountsManager({
  coaches,
  allSchools,
  allClubs,
}: {
  coaches: CoachAccountRow[]
  allSchools: Option[]
  allClubs: Option[]
}) {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-navy">Coach Portal Accounts</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Give coaches secure login access to the Coach Portal, manage their employment details, and assign schools.
            Add or remove the coach profile itself in the <span className="font-semibold">Coaches</span> tab. Players are
            assigned to coaches from the <span className="font-semibold">Sign-ups</span> tab.
          </p>
        </div>
        <a
          href="/coach/login"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-navy hover:bg-muted"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Coach Portal login page
        </a>
      </div>

      {coaches.length === 0 ? (
        <div className="mt-6 rounded-card border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">No coaches yet. Add coaches in the Coaches tab first.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {coaches.map((c) => (
            <AccountCard key={c.id} coach={c} allSchools={allSchools} allClubs={allClubs} />
          ))}
        </div>
      )}
    </div>
  )
}
