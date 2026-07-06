"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, ChevronRight, Pencil, Tag, X } from "lucide-react"
import { formatSlot } from "@/lib/slots"
import type { Club, School, CartItem } from "@/lib/db/schema"
import type { PublicPackage } from "@/app/actions/packages"
import { SlotPicker, type SelectedSlot } from "@/components/slot-picker"
import { PackageSlotPicker } from "@/components/package-slot-picker"
import { DobPicker } from "@/components/dob-picker"
import type { AgeGroup } from "@/lib/db/schema"
import { SignaturePad } from "@/components/signature-pad"
import { CONSENT_TERMS_LABEL, CONSENT_MEDIA_LABEL, TERMS_TITLE, TERMS_SECTIONS } from "@/lib/terms"
import { authClient } from "@/lib/auth-client"
import { createCartEnrollments } from "@/app/actions/enrollment"
import { blobUrl } from "@/lib/blob"
import { validateVoucherCode } from "@/app/actions/referrals"

// ---------------------------------------------------------------------------
// Step labels
// ---------------------------------------------------------------------------
const STEPS = ["Children", "Child Details", "Club & Schedule", "Parent Account", "Preferences", "Review"]
const SCHOOL_STEPS = ["Children", "Child Details", "School", "Parent Account", "Preferences", "Review"]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ChildBasic = { firstName: string; lastName: string; dob: string }

/** Per-child club/slot/package configuration (step 2). */
type ChildConfig = {
  clubId: number | null
  slot: SelectedSlot | null
  ageGroup: AgeGroup | null
  pkg: PublicPackage | null
  schoolId: number | null
}

type Prefs = {
  prefEmail: boolean
  prefWhatsapp: boolean
  prefSessionReminders: boolean
  prefAnnouncements: boolean
  prefEvents: boolean
  prefHolidayClinics: boolean
}

function emptyConfig(): ChildConfig {
  return { clubId: null, slot: null, ageGroup: null, pkg: null, schoolId: null }
}

function calcAge(dob: string) {
  if (!dob) return 0
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function OnboardingWizard({
  clubs,
  packages,
  schools,
}: {
  clubs: Club[]
  packages: PublicPackage[]
  schools: School[]
}) {
  const searchParams = useSearchParams()
  const initialRefCode = searchParams.get("ref") ?? null

  const [step, setStep] = useState(0)

  // Step 0 — how many children
  const [childCount, setChildCount] = useState(1)

  // Step 1 — child names / DOBs
  const [children, setChildren] = useState<ChildBasic[]>([{ firstName: "", lastName: "", dob: "" }])

  // Step 2 — per-child club + schedule + package config
  const [configs, setConfigs] = useState<ChildConfig[]>([emptyConfig()])
  // Which child's config are we currently editing in step 2?
  const [configIdx, setConfigIdx] = useState(0)

  // Step 3 — parent account
  const [parent, setParent] = useState({ firstName: "", lastName: "", email: "", mobile: "", password: "" })
  const [emergency, setEmergency] = useState({ name: "", phone: "" })

  // Step 4 — preferences
  const [prefs, setPrefs] = useState<Prefs>({
    prefEmail: true,
    prefWhatsapp: false,
    prefSessionReminders: true,
    prefAnnouncements: true,
    prefEvents: false,
    prefHolidayClinics: false,
  })

  // Step 5 — review: voucher, terms, signature
  const [voucherInput, setVoucherInput] = useState("")
  const [voucherValidating, setVoucherValidating] = useState(false)
  const [voucherError, setVoucherError] = useState<string | null>(null)
  const [appliedVoucher, setAppliedVoucher] = useState<{
    id: number
    code: string
    discountPercent: number
    campaignName: string
  } | null>(null)
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [consentMedia, setConsentMedia] = useState(false)
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [showTerms, setShowTerms] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reference, setReference] = useState<string | null>(null)

  // ---------------------------------------------------------------------------
  // Derived helpers
  // ---------------------------------------------------------------------------
  const activeConfig = configs[configIdx] ?? emptyConfig()
  const activeChild = children[configIdx] ?? { firstName: "", lastName: "", dob: "" }

  function setActiveConfig(patch: Partial<ChildConfig>) {
    setConfigs((prev) => prev.map((c, i) => (i === configIdx ? { ...c, ...patch } : c)))
  }

  // Determine if we need to step through school or club flow
  // (school flow: when the selected package for the active child is a school pkg)
  function isSchoolPkg(pkg: PublicPackage | null) {
    if (!pkg) return false
    return pkg.isSchool === true || pkg.slug?.toLowerCase().includes("school")
  }

  // Clubs available for the selected package (or all clubs if no restriction)
  function availableClubsFor(pkg: PublicPackage | null) {
    if (!pkg || pkg.clubIds.length === 0) return clubs
    return clubs.filter((c) => pkg.clubIds.includes(c.id))
  }

  // Overall isSchool flag — any child enrolled at a school
  const anySchool = configs.some((cfg) => isSchoolPkg(cfg.pkg))
  const activeSteps = anySchool ? SCHOOL_STEPS : STEPS

  // Grand total with discount
  const grandTotal = configs.reduce((sum, cfg) => {
    const price = cfg.pkg?.price ?? 0
    const disc = appliedVoucher?.discountPercent ?? 0
    return sum + Math.round(price * (1 - disc / 100))
  }, 0)

  const allConfigsDone = configs.every((cfg) => {
    if (!cfg.pkg) return false
    if (isSchoolPkg(cfg.pkg)) return cfg.schoolId != null
    return cfg.clubId != null && cfg.slot != null
  })

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------
  async function handleSubmit() {
    setError(null)
    setSubmitting(true)
    try {
      // 1. Auth: sign up (or sign in if account already exists)
      const { error: signUpError } = await authClient.signUp.email({
        email: parent.email,
        password: parent.password,
        name: `${parent.firstName} ${parent.lastName}`.trim(),
      })
      if (signUpError) {
        const isExisting =
          signUpError.code === "USER_ALREADY_EXISTS" ||
          (signUpError.message ?? "").toLowerCase().includes("already exists")
        if (isExisting) {
          const { error: signInError } = await authClient.signIn.email({
            email: parent.email,
            password: parent.password,
          })
          if (signInError) {
            setError(
              "An account with this email already exists. If you registered before, please sign in from the dashboard instead.",
            )
            setSubmitting(false)
            return
          }
        } else {
          setError(signUpError.message ?? "Could not create your account.")
          setSubmitting(false)
          return
        }
      }

      // 2. Build cart items
      const cartItems: CartItem[] = configs.map((cfg, i) => {
        const child = children[i]!
        const club = clubs.find((c) => c.id === cfg.clubId)
        const school = schools.find((s) => s.id === cfg.schoolId)
        const price = cfg.pkg?.price ?? 0
        const disc = appliedVoucher?.discountPercent ?? 0
        return {
          childName: `${child.firstName} ${child.lastName}`.trim(),
          childDob: child.dob,
          childAge: calcAge(child.dob),
          packageName: cfg.pkg?.name ?? "",
          packageSlug: cfg.pkg?.slug ?? "",
          packagePrice: Math.round(price * (1 - disc / 100)),
          clubId: cfg.clubId ?? cfg.schoolId ?? 0,
          clubName: isSchoolPkg(cfg.pkg) ? (school?.name ?? "") : (club?.name ?? ""),
          slotWeekday: cfg.slot?.weekday ?? 0,
          slotHour: cfg.slot?.hour ?? 0,
          slotAgeGroup: cfg.ageGroup ?? "4-8",
          discountPercent: disc,
        }
      })

      const { netcashUrl, formFields } = await createCartEnrollments({
        cartItems,
        parentName: `${parent.firstName} ${parent.lastName}`.trim(),
        parentEmail: parent.email,
        parentMobile: parent.mobile,
        emergencyContactName: emergency.name,
        emergencyContactPhone: emergency.phone,
        agreedTerms,
        consentMedia,
        signatureData,
        signedName: `${parent.firstName} ${parent.lastName}`.trim(),
        referralCode: initialRefCode,
        voucherId: appliedVoucher?.id ?? null,
        ...prefs,
      })

      // Auto-POST to Netcash
      const form = document.createElement("form")
      form.method = "POST"
      form.action = netcashUrl
      Object.entries(formFields).forEach(([key, value]) => {
        const inp = document.createElement("input")
        inp.type = "hidden"
        inp.name = key
        inp.value = value
        form.appendChild(inp)
      })
      document.body.appendChild(form)
      form.submit()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setSubmitting(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Show confirmation (post-payment redirect back from Netcash)
  // ---------------------------------------------------------------------------
  if (reference) {
    const childNames = children.map((c) => `${c.firstName} ${c.lastName}`.trim())
    const totalAmt = configs.reduce((s, cfg) => s + (cfg.pkg?.price ?? 0), 0)
    return (
      <Confirmation
        packageName={configs[0]?.pkg?.name ?? ""}
        reference={reference}
        isEft={false}
        childNames={childNames}
        packagePrice={totalAmt}
      />
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      {/* Stepper */}
      <ol className="flex items-center justify-between gap-1">
        {activeSteps.map((label, i) => (
          <li key={label} className="flex flex-1 flex-col items-center text-center">
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                i <= step ? "bg-lime text-lime-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`mt-2 hidden text-xs font-semibold sm:block ${i <= step ? "text-navy" : "text-muted-foreground"}`}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-10">{renderStep()}</div>

      <div className="relative mx-auto mt-12 aspect-[3/4] w-full max-w-xs overflow-hidden">
        <Image src="/images/mascots.png" alt="Next Gen Padel Academy Mascots" fill className="object-contain" />
      </div>
    </section>
  )

  // --------------------------------------------------------------------------
  // Steps
  // --------------------------------------------------------------------------
  function renderStep() {
    // ── Step 0: How many children ──
    if (step === 0)
      return (
        <div>
          <h2 className="text-xl font-bold text-navy">How many children are you enrolling?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You can enrol up to 5 children. Each child picks their own club, schedule, and package.
          </p>
          <div className="mt-6 grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setChildCount(n)
                  setChildren((prev) => {
                    const updated = [...prev]
                    while (updated.length < n) updated.push({ firstName: "", lastName: "", dob: "" })
                    return updated.slice(0, n)
                  })
                  setConfigs((prev) => {
                    const updated = [...prev]
                    while (updated.length < n) updated.push(emptyConfig())
                    return updated.slice(0, n)
                  })
                }}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 py-5 font-black text-3xl transition-all ${
                  childCount === n
                    ? "border-lime bg-lime/10 scale-105 shadow-md text-navy"
                    : "border-border bg-card text-muted-foreground hover:border-lime/50"
                }`}
              >
                {n}
                <span className="mt-1 text-xs font-semibold">{n === 1 ? "child" : "children"}</span>
              </button>
            ))}
          </div>
          <StepNav onNext={() => setStep(1)} />
        </div>
      )

    // ── Step 1: Child names + DOBs ──
    if (step === 1)
      return (
        <div>
          <h2 className="text-xl font-bold text-navy">
            {childCount === 1 ? "Your Child's Details" : "Children's Details"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {childCount === 1
              ? "Tell us who will be joining the academy"
              : `Tell us about all ${childCount} children joining the academy`}
          </p>
          <div className="mt-6 space-y-6">
            {children.map((child, idx) => (
              <div key={idx} className="rounded-card border border-border bg-card p-5 shadow-sm">
                {childCount > 1 && <p className="mb-4 text-sm font-black text-navy">Child {idx + 1}</p>}
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label={childCount > 1 ? `Child ${idx + 1} First Name` : "Child's First Name"}
                      value={child.firstName}
                      onChange={(v) => setChildren((prev) => prev.map((c, i) => (i === idx ? { ...c, firstName: v } : c)))}
                      placeholder="First name"
                    />
                    <Field
                      label="Last Name / Surname"
                      value={child.lastName}
                      onChange={(v) => setChildren((prev) => prev.map((c, i) => (i === idx ? { ...c, lastName: v } : c)))}
                      placeholder="Last name"
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-semibold text-navy">Date of Birth</p>
                    <DobPicker
                      value={child.dob}
                      onChange={(v) => setChildren((prev) => prev.map((c, i) => (i === idx ? { ...c, dob: v } : c)))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <StepNav
            onBack={() => setStep(0)}
            onNext={() => { setConfigIdx(0); setStep(2) }}
            nextDisabled={children.some((c) => !c.firstName || !c.lastName || !c.dob)}
          />
        </div>
      )

    // ── Step 2: Per-child club + schedule + package ──
    if (step === 2) {
      const cfg = configs[configIdx]!
      const childName = `${children[configIdx]?.firstName ?? ""} ${children[configIdx]?.lastName ?? ""}`.trim()
      const availClubs = availableClubsFor(cfg.pkg)
      const schoolMode = isSchoolPkg(cfg.pkg)

      // Progress pills for multi-child
      const ConfigProgress = () =>
        childCount > 1 ? (
          <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
            {children.map((c, i) => {
              const done = (() => {
                const cc = configs[i]!
                if (!cc.pkg) return false
                return isSchoolPkg(cc.pkg) ? cc.schoolId != null : cc.clubId != null && cc.slot != null
              })()
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setConfigIdx(i)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-all ${
                    i === configIdx
                      ? "border-lime bg-lime/10 text-navy"
                      : done
                        ? "border-lime/40 bg-lime/5 text-navy"
                        : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {done && <Check className="h-3 w-3 text-lime-foreground" />}
                  {`${c.firstName || `Child ${i + 1}`}`}
                </button>
              )
            })}
          </div>
        ) : null

      return (
        <div>
          <ConfigProgress />

          <h2 className="text-xl font-bold text-navy">
            {childCount > 1 ? `${childName} — Package & Schedule` : "Choose Your Club & Schedule"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {childCount > 1
              ? "Select a package, club, and time slot for this child."
              : "Pick the package, venue, and time that works best."}
          </p>

          {/* Package picker for this child */}
          <div className="mt-6">
            <p className="text-sm font-semibold text-navy">Package</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {packages.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => {
                    setActiveConfig({
                      pkg,
                      clubId: null,
                      slot: null,
                      ageGroup: null,
                      schoolId: null,
                    })
                  }}
                  className={`rounded-card border-2 p-4 text-left transition-all ${
                    cfg.pkg?.id === pkg.id
                      ? "border-lime bg-lime/10"
                      : "border-border bg-card hover:border-lime/50"
                  }`}
                >
                  <p className="font-bold text-navy">{pkg.name}</p>
                  <p className="text-sm text-muted-foreground">
                    R{pkg.price.toLocaleString()}
                    {pkg.period === "once-off" ? " once off" : "/month"}
                  </p>
                  {pkg.tagline && <p className="mt-1 text-xs text-muted-foreground">{pkg.tagline}</p>}
                </button>
              ))}
            </div>
          </div>

          {/* School picker */}
          {cfg.pkg && schoolMode && (
            <div className="mt-6">
              <label htmlFor={`school-select-${configIdx}`} className="block text-sm font-semibold text-navy mb-2">
                School
              </label>
              {schools.length === 0 ? (
                <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                  No schools are currently listed. Please{" "}
                  <a href="/contact" className="underline">
                    contact us
                  </a>
                  .
                </p>
              ) : (
                <select
                  id={`school-select-${configIdx}`}
                  value={cfg.schoolId ?? ""}
                  onChange={(e) => setActiveConfig({ schoolId: e.target.value ? Number(e.target.value) : null })}
                  className="w-full rounded-2xl border-2 border-border bg-card px-4 py-3 text-sm font-semibold text-navy shadow-sm transition-colors focus:border-lime focus:outline-none"
                >
                  <option value="">— Select a school —</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.location ? ` — ${s.location}` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Age group + club + slot (non-school) */}
          {cfg.pkg && !schoolMode && (
            <>
              {/* Age group */}
              <div className="mt-6">
                <p className="text-sm font-semibold text-navy">Age Category</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  This determines which time slots are shown.
                </p>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {(["4-8", "9-13", "14-17"] as const).map((ag) => (
                    <button
                      key={ag}
                      type="button"
                      onClick={() => setActiveConfig({ ageGroup: ag, slot: null })}
                      className={`rounded-2xl border-2 p-4 text-center transition-all ${
                        cfg.ageGroup === ag
                          ? "border-lime bg-lime/10 scale-105 shadow-md"
                          : "border-border bg-card hover:border-lime/50"
                      }`}
                    >
                      <span className="block text-2xl font-black text-navy">{ag}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">years old</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Club selection */}
              {cfg.ageGroup && (
                <div className="mt-6">
                  <p className="text-sm font-semibold text-navy">Club / Venue</p>
                  {availClubs.length < clubs.length && (
                    <p className="mt-1 mb-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                      The <strong>{cfg.pkg.name}</strong> package is only available at{" "}
                      {availClubs.length === 1 ? "the venue below" : "the venues below"}.
                    </p>
                  )}
                  <div className="mt-3 space-y-3">
                    {availClubs.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setActiveConfig({ clubId: c.id, slot: null })}
                        className={`w-full rounded-card border p-4 text-left transition-colors ${
                          cfg.clubId === c.id ? "border-lime bg-lime/10" : "border-border bg-card hover:border-lime/50"
                        }`}
                      >
                        <h3 className="font-bold text-navy">{c.name}</h3>
                        <p className="text-sm text-muted-foreground">{c.location}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Slot picker */}
              {cfg.clubId && cfg.ageGroup && (
                <div className="mt-6">
                  <p className="block text-sm font-semibold text-navy">Available Time Slots</p>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Only times with open places for ages {cfg.ageGroup} are shown.
                  </p>
                  {cfg.pkg.slotType === "custom" ? (
                    <PackageSlotPicker
                      packageId={cfg.pkg.id}
                      packageName={cfg.pkg.name}
                      ageGroup={cfg.ageGroup}
                      clubId={cfg.clubId}
                      selected={cfg.slot}
                      onSelect={(s) => setActiveConfig({ slot: s })}
                    />
                  ) : (
                    <SlotPicker
                      clubId={cfg.clubId}
                      ageGroup={cfg.ageGroup}
                      selected={cfg.slot}
                      onSelect={(s) => setActiveConfig({ slot: s })}
                    />
                  )}
                </div>
              )}
            </>
          )}

          {/* Navigation */}
          {configIdx < childCount - 1 ? (
            <StepNav
              onBack={configIdx === 0 ? () => setStep(1) : () => setConfigIdx((i) => i - 1)}
              onNext={() => setConfigIdx((i) => i + 1)}
              nextLabel={`Next: ${children[configIdx + 1]?.firstName || `Child ${configIdx + 2}`}`}
              nextDisabled={
                !cfg.pkg ||
                (schoolMode ? !cfg.schoolId : !cfg.clubId || !cfg.slot)
              }
            />
          ) : (
            <StepNav
              onBack={configIdx === 0 ? () => setStep(1) : () => setConfigIdx((i) => i - 1)}
              onNext={() => setStep(3)}
              nextDisabled={!allConfigsDone}
            />
          )}
        </div>
      )
    }

    // ── Step 3: Parent account ──
    if (step === 3)
      return (
        <div>
          <h2 className="text-xl font-bold text-navy">Parent / Guardian Account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We&apos;ll create your account so you can track sessions and manage your enrolment.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field
              label="First Name"
              value={parent.firstName}
              onChange={(v) => setParent({ ...parent, firstName: v })}
              placeholder="First name"
            />
            <Field
              label="Last Name / Surname"
              value={parent.lastName}
              onChange={(v) => setParent({ ...parent, lastName: v })}
              placeholder="Last name"
            />
            <div className="flex flex-col gap-1">
              <Field
                label="Mobile Number"
                type="tel"
                value={parent.mobile}
                onChange={(v) => setParent({ ...parent, mobile: v.replace(/[^\d]/g, "") })}
                placeholder="0812345678"
              />
              <p className="text-xs text-muted-foreground">South African number — start with 0, no spaces. e.g. 0812345678</p>
              {parent.mobile.length > 0 && !/^0\d{9}$/.test(parent.mobile) && (
                <p className="text-xs font-semibold text-destructive">
                  {!parent.mobile.startsWith("0")
                    ? "Must start with 0 — e.g. 0812345678"
                    : `Must be exactly 10 digits (${parent.mobile.length}/10)`}
                </p>
              )}
              {/^0\d{9}$/.test(parent.mobile) && (
                <p className="text-xs font-semibold text-lime-600">Looks good</p>
              )}
            </div>
            <Field
              label="Email"
              type="email"
              value={parent.email}
              onChange={(v) => setParent({ ...parent, email: v })}
            />
            <div className="space-y-1">
              <Field
                label="Password"
                type="password"
                value={parent.password}
                onChange={(v) => setParent({ ...parent, password: v })}
                placeholder="At least 8 characters"
              />
              {parent.password.length > 0 && parent.password.length < 8 && (
                <p className="text-xs font-semibold text-destructive">
                  Password is too short — must be at least 8 characters ({parent.password.length}/8)
                </p>
              )}
              {parent.password.length >= 8 && (
                <p className="text-xs font-semibold text-lime-600">Password looks good</p>
              )}
            </div>
          </div>
          <div className="mt-6 rounded-card border border-border bg-muted/40 p-4">
            <p className="text-sm font-semibold text-navy">Emergency Contact</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field
                label="Contact Name"
                value={emergency.name}
                onChange={(v) => setEmergency({ ...emergency, name: v })}
              />
              <Field
                label="Contact Phone"
                type="tel"
                value={emergency.phone}
                onChange={(v) => setEmergency({ ...emergency, phone: v })}
              />
            </div>
          </div>
          <StepNav
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
            nextDisabled={
              !parent.firstName ||
              !parent.lastName ||
              !parent.email ||
              !/^0\d{9}$/.test(parent.mobile) ||
              parent.password.length < 8 ||
              !emergency.name ||
              !emergency.phone
            }
          />
        </div>
      )

    // ── Step 4: Preferences ──
    if (step === 4)
      return (
        <div>
          <h2 className="text-xl font-bold text-navy">Communication Preferences</h2>
          <p className="mt-1 text-sm text-muted-foreground">Choose how you&apos;d like to hear from us</p>
          <div className="mt-6 space-y-2">
            <PrefToggle label="Email updates" checked={prefs.prefEmail} onChange={(v) => setPrefs({ ...prefs, prefEmail: v })} />
            <PrefToggle label="WhatsApp messages" checked={prefs.prefWhatsapp} onChange={(v) => setPrefs({ ...prefs, prefWhatsapp: v })} />
            <PrefToggle label="Session reminders" checked={prefs.prefSessionReminders} onChange={(v) => setPrefs({ ...prefs, prefSessionReminders: v })} />
            <PrefToggle label="Academy announcements" checked={prefs.prefAnnouncements} onChange={(v) => setPrefs({ ...prefs, prefAnnouncements: v })} />
            <PrefToggle label="Events &amp; tournaments" checked={prefs.prefEvents} onChange={(v) => setPrefs({ ...prefs, prefEvents: v })} />
            <PrefToggle label="Holiday clinics" checked={prefs.prefHolidayClinics} onChange={(v) => setPrefs({ ...prefs, prefHolidayClinics: v })} />
          </div>
          <StepNav onBack={() => setStep(3)} onNext={() => setStep(5)} />
        </div>
      )

    // ── Step 5: Review (cart) ──
    const isOnceOff = configs.every((cfg) => cfg.pkg?.period === "once-off")
    return (
      <div>
        <h2 className="text-xl font-bold text-navy">Review Your Cart</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Check everything below, then confirm to proceed to secure payment.
        </p>

        {/* Cart table */}
        <div className="mt-6 overflow-hidden rounded-card border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-semibold text-navy">Child</th>
                <th className="px-4 py-3 text-left font-semibold text-navy">Package</th>
                <th className="px-4 py-3 text-left font-semibold text-navy hidden sm:table-cell">Venue / Slot</th>
                <th className="px-4 py-3 text-right font-semibold text-navy">Price</th>
                <th className="w-8 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {configs.map((cfg, i) => {
                const child = children[i]!
                const club = clubs.find((c) => c.id === cfg.clubId)
                const school = schools.find((s) => s.id === cfg.schoolId)
                const school_ = isSchoolPkg(cfg.pkg)
                const price = cfg.pkg?.price ?? 0
                const disc = appliedVoucher?.discountPercent ?? 0
                const discounted = Math.round(price * (1 - disc / 100))
                return (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-semibold text-navy">
                      {`${child.firstName} ${child.lastName}`.trim()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {cfg.pkg?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {school_ ? (school?.name ?? "—") : club ? `${club.name}${cfg.slot ? ` · ${formatSlot(cfg.slot.weekday, cfg.slot.hour)}` : ""}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-navy whitespace-nowrap">
                      {disc > 0 && (
                        <span className="mr-1 text-xs text-muted-foreground line-through">
                          R{price.toLocaleString()}
                        </span>
                      )}
                      R{discounted.toLocaleString()}
                    </td>
                    <td className="px-2 py-3">
                      <button
                        type="button"
                        onClick={() => { setConfigIdx(i); setStep(2) }}
                        className="text-muted-foreground hover:text-navy"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/20">
                <td colSpan={3} className="px-4 py-3 font-bold text-navy">
                  Total {isOnceOff ? "(once off)" : "/month"}
                </td>
                <td className="px-4 py-3 text-right font-black text-navy">
                  R{grandTotal.toLocaleString()}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Parent summary */}
        <dl className="mt-4 space-y-2 rounded-card border border-border bg-card p-4 text-sm shadow-sm">
          <Row label="Parent" value={`${parent.firstName} ${parent.lastName}`.trim()} />
          <Row label="Email" value={parent.email} />
          <Row label="Mobile" value={parent.mobile} />
          <Row label="Emergency Contact" value={`${emergency.name} — ${emergency.phone}`} />
        </dl>

        {/* Voucher */}
        <div className="mt-5 rounded-card border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-4 w-4 text-lime-foreground" />
            <p className="font-semibold text-navy text-sm">Have a voucher code?</p>
          </div>
          {appliedVoucher ? (
            <div className="flex items-center justify-between gap-3 rounded-md bg-lime/10 border border-lime/30 px-3 py-2">
              <div>
                <p className="text-sm font-bold text-navy">{appliedVoucher.code}</p>
                <p className="text-xs text-muted-foreground">
                  {appliedVoucher.campaignName} — {appliedVoucher.discountPercent}% off applied
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setAppliedVoucher(null); setVoucherInput(""); setVoucherError(null) }}
                className="text-muted-foreground hover:text-navy"
                aria-label="Remove voucher"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={voucherInput}
                onChange={(e) => { setVoucherInput(e.target.value.toUpperCase()); setVoucherError(null) }}
                placeholder="e.g. NGP-XXXXXXXX"
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
              />
              <button
                type="button"
                disabled={voucherInput.length < 4 || voucherValidating}
                onClick={async () => {
                  setVoucherValidating(true)
                  setVoucherError(null)
                  const result = await validateVoucherCode(
                    voucherInput,
                    isOnceOff ? "once-off" : "monthly",
                  )
                  setVoucherValidating(false)
                  if (result.valid) {
                    setAppliedVoucher(result.voucher)
                  } else {
                    setVoucherError(result.error)
                  }
                }}
                className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {voucherValidating ? "Checking..." : "Apply"}
              </button>
            </div>
          )}
          {voucherError && <p className="mt-2 text-xs text-red-600">{voucherError}</p>}
        </div>

        {/* Payment method badge */}
        <div className="mt-5 rounded-card border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime/20">
              <Check className="h-5 w-5 text-lime-foreground" />
            </div>
            <div>
              <p className="font-bold text-navy">Netcash Pay Now — Secure Online Payment</p>
              <p className="text-xs text-muted-foreground">
                {isOnceOff
                  ? "Pay securely via card or EFT. You will be redirected to Netcash after confirming."
                  : "Set up your monthly subscription via Netcash. You will be redirected to complete payment."}
              </p>
            </div>
          </div>
        </div>

        {/* Terms & signature */}
        <div className="mt-6 rounded-card border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-navy">Terms &amp; Indemnity</h3>
            <button
              type="button"
              onClick={() => setShowTerms((s) => !s)}
              className="text-sm font-semibold text-navy underline-offset-4 hover:underline"
            >
              {showTerms ? "Hide full terms" : "Read full terms"}
            </button>
          </div>
          {showTerms && (
            <div className="mt-3 max-h-56 overflow-y-auto rounded-md border border-border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
              <p className="font-semibold text-navy">{TERMS_TITLE}</p>
              {TERMS_SECTIONS.map((s) => (
                <div key={s.heading} className="mt-3">
                  <p className="font-semibold text-navy">{s.heading}</p>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 space-y-3">
            <ConsentCheck label={CONSENT_TERMS_LABEL} checked={agreedTerms} onChange={setAgreedTerms} required />
            <ConsentCheck label={CONSENT_MEDIA_LABEL} checked={consentMedia} onChange={setConsentMedia} />
          </div>
          <div className="mt-5">
            <p className="text-sm font-semibold text-navy">Signature</p>
            <p className="mb-2 text-xs text-muted-foreground">
              Please sign below to confirm your agreement (
              {`${parent.firstName} ${parent.lastName}`.trim() || "parent/guardian"}).
            </p>
            <SignaturePad value={signatureData} onChange={setSignatureData} />
          </div>
        </div>

        {error && (
          <p
            className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            onClick={() => setStep(4)}
            className="rounded-2xl border-2 border-border px-5 py-3 font-bold text-navy transition-all hover:bg-muted active:scale-95"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !agreedTerms || !signatureData}
            className="rounded-2xl bg-lime px-6 py-3 font-black text-lime-foreground shadow-sm transition-all hover:scale-105 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
          >
            {submitting ? "Redirecting to Netcash…" : "Create Account & Pay via Netcash"}
          </button>
        </div>
        {(!agreedTerms || !signatureData) && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            You must agree to the terms and sign before enrolling.
          </p>
        )}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Already enrolled?{" "}
          <Link href="/sign-in" className="font-semibold text-navy underline-offset-4 hover:underline">
            Sign in to your dashboard
          </Link>
        </p>
      </div>
    )
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StepNav({
  onBack,
  onNext,
  nextDisabled,
  nextLabel = "Continue",
}: {
  onBack?: () => void
  onNext: () => void
  nextDisabled?: boolean
  nextLabel?: string
}) {
  return (
    <div className="mt-8 flex items-center justify-between gap-4">
      {onBack ? (
        <button
          onClick={onBack}
          className="rounded-2xl border-2 border-border px-5 py-3 font-bold text-navy transition-all hover:bg-muted active:scale-95"
        >
          Back
        </button>
      ) : (
        <span />
      )}
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="rounded-2xl bg-lime px-6 py-3 font-black text-lime-foreground shadow-sm transition-all hover:scale-105 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
      >
        {nextLabel}
      </button>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-navy">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 outline-none focus:border-lime"
      />
    </label>
  )
}

function PrefToggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-md border border-border bg-card px-4 py-3">
      <span className="text-sm font-medium text-navy">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 accent-lime"
      />
    </label>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div
      className={`flex justify-between gap-4 border-b border-border pb-2 last:border-0 last:pb-0 ${bold ? "border-t border-border pt-2" : ""}`}
    >
      <dt className={bold ? "font-bold text-navy" : "text-muted-foreground"}>{label}</dt>
      <dd className={`text-right ${bold ? "font-extrabold text-navy" : "font-semibold text-navy"}`}>{value}</dd>
    </div>
  )
}

function ConsentCheck({
  label,
  checked,
  onChange,
  required,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  required?: boolean
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 flex-shrink-0 accent-lime"
      />
      <span className="text-sm leading-relaxed text-navy">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </span>
    </label>
  )
}

function Confirmation({
  packageName,
  reference,
  isEft,
  childNames = [],
  packagePrice,
}: {
  packageName: string
  reference: string
  isEft?: boolean
  childNames?: string[]
  packagePrice?: number
}) {
  const childLabel = childNames.filter(Boolean).join(" & ") || "your child"
  const refs = reference.split(", ")
  return (
    <section className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-card border border-lime bg-lime/10 p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lime text-lime-foreground">
          <Check className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-2xl font-extrabold text-navy">Welcome to Next Gen Padel!</h2>
        <p className="mt-2 text-muted-foreground">
          {childNames.length > 1
            ? `Your account is ready and ${childNames.length} enrolments have been received.`
            : `Your account is ready and your enrolment in the ${packageName} has been received.`}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          {refs.length > 1 ? "Your reference numbers" : "Your reference number"}
        </p>
        {refs.map((r) => (
          <p key={r} className="text-lg font-extrabold tracking-wide text-navy">
            {r}
          </p>
        ))}
        {isEft && (
          <div className="mt-6 rounded-card border border-border bg-card p-5 text-left shadow-sm">
            <p className="text-sm font-bold text-navy">Complete your payment via EFT</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Your enrolment is reserved. Please make payment within 48 hours to confirm your spot.
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4 border-b border-border pb-2">
                <dt className="text-muted-foreground">Account Name</dt>
                <dd className="font-semibold text-navy">NEXT GEN PADEL ACADEMY</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border pb-2">
                <dt className="text-muted-foreground">Bank</dt>
                <dd className="font-semibold text-navy">First National Bank</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border pb-2">
                <dt className="text-muted-foreground">Account Number</dt>
                <dd className="font-semibold text-navy">63214278441</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border pb-2">
                <dt className="text-muted-foreground">Branch Code</dt>
                <dd className="font-semibold text-navy">252445</dd>
              </div>
              {packagePrice !== undefined && (
                <div className="flex justify-between gap-4 border-b border-border pb-2">
                  <dt className="text-muted-foreground">Amount</dt>
                  <dd className="font-semibold text-navy">R{packagePrice.toLocaleString()}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Payment Reference</dt>
                <dd className="font-black text-navy">{childLabel}</dd>
              </div>
            </dl>
            <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold text-amber-800">Important</p>
              <p className="mt-1 text-xs text-amber-700">
                Use <strong>{childLabel}</strong> as the payment reference so we can match your payment.
              </p>
            </div>
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-md bg-lime px-6 py-2.5 font-bold text-lime-foreground transition-colors hover:bg-lime/90"
          >
            Go to My Dashboard
          </Link>
          <Link
            href="/"
            className="rounded-md border border-border px-6 py-2.5 font-semibold text-navy transition-colors hover:bg-muted"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </section>
  )
}
