"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
// lucide-react icons used in this file
import { Check, ChevronRight } from "lucide-react"
import { formatSlot } from "@/lib/slots"
import type { Club } from "@/lib/db/schema"
import type { PublicPackage } from "@/app/actions/packages"
import { SlotPicker, type SelectedSlot } from "@/components/slot-picker"
import { PackageSlotPicker } from "@/components/package-slot-picker"
import { DobPicker } from "@/components/dob-picker"
import type { AgeGroup } from "@/lib/db/schema"
import { SignaturePad } from "@/components/signature-pad"
import { CONSENT_TERMS_LABEL, CONSENT_MEDIA_LABEL, TERMS_TITLE, TERMS_SECTIONS } from "@/lib/terms"
import { authClient } from "@/lib/auth-client"
import { createEnrollment } from "@/app/actions/enrollment"

const STEPS = ["Child", "Club & Schedule", "Parent Account", "Debit Order", "Preferences", "Review"]

const BANKS = [
  "Absa",
  "Capitec",
  "Discovery Bank",
  "FNB",
  "Investec",
  "Nedbank",
  "Standard Bank",
  "TymeBank",
  "African Bank",
  "Other",
]

type Prefs = {
  prefEmail: boolean
  prefWhatsapp: boolean
  prefSessionReminders: boolean
  prefAnnouncements: boolean
  prefEvents: boolean
  prefHolidayClinics: boolean
}

type DebitOrder = {
  accountHolder: string
  bankName: string
  accountNumber: string
  accountType: string
  debitDay: string
}

export function OnboardingWizard({ clubs, packages }: { clubs: Club[]; packages: PublicPackage[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialPackage = packages.find((p) => p.slug === searchParams.get("package")) ?? null

  const [selectedPackage, setSelectedPackage] = useState<PublicPackage | null>(initialPackage)
  const [step, setStep] = useState(0)

  // Step data
  const [clubId, setClubId] = useState<number | null>(null)
  const [slot, setSlot] = useState<SelectedSlot | null>(null)
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null)
  const [child, setChild] = useState({ name: "", dob: "" })
  const [parent, setParent] = useState({ name: "", email: "", mobile: "", password: "" })
  const [emergency, setEmergency] = useState({ name: "", phone: "" })
  const [debit, setDebit] = useState<DebitOrder>({
    accountHolder: "",
    bankName: "",
    accountNumber: "",
    accountType: "Cheque",
    debitDay: "1",
  })
  const [prefs, setPrefs] = useState<Prefs>({
    prefEmail: true,
    prefWhatsapp: false,
    prefSessionReminders: true,
    prefAnnouncements: true,
    prefEvents: false,
    prefHolidayClinics: false,
  })

  // Terms, consent & signature
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [consentMedia, setConsentMedia] = useState(false)
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [showTerms, setShowTerms] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reference, setReference] = useState<string | null>(null)

  const selectedClub = clubs.find((c) => c.id === clubId) ?? null

  if (!selectedPackage) {
    return <PackagePicker packages={packages} onSelect={setSelectedPackage} />
  }

  if (reference) {
    return <Confirmation packageName={selectedPackage.name} reference={reference} />
  }

  async function handleSubmit() {
    if (!selectedPackage) return
    setError(null)
    setSubmitting(true)
    try {
      // 1. Create the parent account (Better Auth, auto sign-in)
      const { error: signUpError } = await authClient.signUp.email({
        email: parent.email,
        password: parent.password,
        name: parent.name,
      })
      if (signUpError) {
        setError(signUpError.message ?? "Could not create your account.")
        setSubmitting(false)
        return
      }

      // 2. Persist the enrollment scoped to the new user
      const { referenceNumber } = await createEnrollment({
        parentName: parent.name,
        parentEmail: parent.email,
        parentMobile: parent.mobile,
        childName: child.name,
        childDob: child.dob,
        childAge: child.dob ? Math.floor((Date.now() - new Date(child.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : 0,
        packageName: selectedPackage.name,
        packagePrice: selectedPackage.price,
        club: selectedClub?.name ?? "",
        clubId: clubId,
        slotWeekday: slot?.weekday ?? null,
        slotHour: slot?.hour ?? null,
        slotAgeGroup: ageGroup,
        debitAccountHolder: debit.accountHolder,
        debitBankName: debit.bankName,
        debitAccountNumber: debit.accountNumber,
        debitAccountType: debit.accountType,
        debitDay: Number(debit.debitDay),
        emergencyContactName: emergency.name,
        emergencyContactPhone: emergency.phone,
        agreedTerms,
        consentMedia,
        signatureData,
        signedName: parent.name,
        ...prefs,
      })

      setReference(referenceNumber)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      {/* Selected package banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-card p-4 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Selected Package</p>
          <p className="font-bold text-navy">
            {selectedPackage.name} — R{selectedPackage.price.toLocaleString()}
            {selectedPackage.period === "once-off" ? " (once off)" : "/month"}
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedPackage(null)
            setStep(0)
          }}
          className="rounded-2xl border border-border px-4 py-2 text-sm font-bold text-navy transition-colors hover:bg-muted"
        >
          Change Package
        </button>
      </div>

      {/* Stepper */}
      <ol className="mt-8 flex items-center justify-between gap-1">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 flex-col items-center text-center">
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                i <= step ? "bg-lime text-lime-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </span>
            <span className={`mt-2 hidden text-xs font-semibold sm:block ${i <= step ? "text-navy" : "text-muted-foreground"}`}>
              {label}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-10">
        {step === 0 ? (
          /* ── Step 0: Child details + age group ── */
          <div>
            <h2 className="text-xl font-bold text-navy">Your Child&apos;s Details</h2>
            <p className="mt-1 text-sm text-muted-foreground">Tell us who will be joining the academy</p>
            <div className="mt-6 space-y-5">
              <Field label="Child's Full Name" value={child.name} onChange={(v) => setChild({ ...child, name: v })} />

              <div>
                <p className="mb-2 text-sm font-semibold text-navy">Date of Birth</p>
                <DobPicker value={child.dob} onChange={(v) => setChild({ ...child, dob: v })} />
              </div>
            </div>

            {/* Age-group category selector */}
            <div className="mt-6">
              <p className="text-sm font-semibold text-navy">Age Category</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Select the age group that best fits your child — this determines which time slots are available.
              </p>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {(["5-8", "9-13", "14-18"] as const).map((ag) => (
                  <button
                    key={ag}
                    type="button"
                    onClick={() => {
                      setAgeGroup(ag)
                      setSlot(null)
                    }}
                    className={`rounded-2xl border-2 p-4 text-center transition-all ${
                      ageGroup === ag
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

            <StepNav
              onNext={() => setStep(1)}
              nextDisabled={!child.name || !child.dob || !ageGroup}
            />
          </div>
        ) : step === 1 ? (
          /* ── Step 1: Club + time slot (filtered by age group) ── */
          <div>
            <h2 className="text-xl font-bold text-navy">Choose Your Club &amp; Schedule</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Showing slots available for ages{" "}
              <span className="font-semibold text-navy">{ageGroup}</span>
            </p>
            <div className="mt-6 space-y-3">
              {clubs.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setClubId(c.id)
                    setSlot(null)
                  }}
                  className={`w-full rounded-card border p-4 text-left transition-colors ${
                    clubId === c.id ? "border-lime bg-lime/10" : "border-border bg-card hover:border-lime/50"
                  }`}
                >
                  <h3 className="font-bold text-navy">{c.name}</h3>
                  <p className="text-sm text-muted-foreground">{c.location}</p>
                </button>
              ))}
            </div>
            {clubId && selectedPackage?.slotType === "custom" ? (
              <div className="mt-6">
                <p className="block text-sm font-semibold text-navy">Available Time Slots</p>
                <p className="mb-3 text-xs text-muted-foreground">
                  This package runs at fixed times. Pick a slot below.
                </p>
                <PackageSlotPicker packageId={selectedPackage.id} ageGroup={ageGroup ?? "5-8"} selected={slot} onSelect={setSlot} />
              </div>
            ) : clubId && ageGroup ? (
              <div className="mt-6">
                <p className="block text-sm font-semibold text-navy">Available Time Slots</p>
                <p className="mb-3 text-xs text-muted-foreground">
                  Only times with open places for ages {ageGroup} are shown.
                </p>
                <SlotPicker clubId={clubId} ageGroup={ageGroup} selected={slot} onSelect={setSlot} />
              </div>
            ) : null}
            <StepNav onBack={() => setStep(0)} onNext={() => setStep(2)} nextDisabled={!clubId || !slot} />
          </div>
        ) : step === 2 ? (
          <div>
            <h2 className="text-xl font-bold text-navy">Parent / Guardian Account</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We&apos;ll create your account so you can track sessions and manage your enrollment.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Parent / Guardian Name" value={parent.name} onChange={(v) => setParent({ ...parent, name: v })} />
              <Field label="Mobile Number" type="tel" value={parent.mobile} onChange={(v) => setParent({ ...parent, mobile: v })} />
              <Field label="Email" type="email" value={parent.email} onChange={(v) => setParent({ ...parent, email: v })} />
              <Field
                label="Password"
                type="password"
                value={parent.password}
                onChange={(v) => setParent({ ...parent, password: v })}
                placeholder="At least 8 characters"
              />
            </div>
            <div className="mt-6 rounded-card border border-border bg-muted/40 p-4">
              <p className="text-sm font-semibold text-navy">Emergency Contact</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Field label="Contact Name" value={emergency.name} onChange={(v) => setEmergency({ ...emergency, name: v })} />
                <Field label="Contact Phone" type="tel" value={emergency.phone} onChange={(v) => setEmergency({ ...emergency, phone: v })} />
              </div>
            </div>
            <StepNav
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
              nextDisabled={
                !parent.name || !parent.email || !parent.mobile || parent.password.length < 8 || !emergency.name || !emergency.phone
              }
            />
          </div>
        ) : step === 3 ? (
          <div>
            <h2 className="text-xl font-bold text-navy">Debit Order Details</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Monthly fees are collected by debit order. Please provide the account to be debited.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field
                label="Account Holder Name"
                value={debit.accountHolder}
                onChange={(v) => setDebit({ ...debit, accountHolder: v })}
              />
              <label className="block">
                <span className="block text-sm font-semibold text-navy">Bank Name</span>
                <select
                  value={debit.bankName}
                  onChange={(e) => setDebit({ ...debit, bankName: e.target.value })}
                  className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 outline-none focus:border-lime"
                >
                  <option value="">Select your bank</option>
                  {BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>
              <Field
                label="Account Number"
                type="text"
                value={debit.accountNumber}
                onChange={(v) => setDebit({ ...debit, accountNumber: v.replace(/[^0-9]/g, "") })}
                placeholder="Digits only"
              />
              <label className="block">
                <span className="block text-sm font-semibold text-navy">Account Type</span>
                <select
                  value={debit.accountType}
                  onChange={(e) => setDebit({ ...debit, accountType: e.target.value })}
                  className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 outline-none focus:border-lime"
                >
                  <option value="Cheque">Cheque / Current</option>
                  <option value="Savings">Savings</option>
                </select>
              </label>
              <label className="block">
                <span className="block text-sm font-semibold text-navy">Day of Debit Order</span>
                <select
                  value={debit.debitDay}
                  onChange={(e) => setDebit({ ...debit, debitDay: e.target.value })}
                  className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 outline-none focus:border-lime"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={String(d)}>
                      {d}
                      {d === 1 || d === 21 ? "st" : d === 2 || d === 22 ? "nd" : d === 3 || d === 23 ? "rd" : "th"} of each
                      month
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <StepNav
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
              nextDisabled={!debit.accountHolder || !debit.bankName || debit.accountNumber.length < 5}
            />
          </div>
        ) : step === 4 ? (
          <div>
            <h2 className="text-xl font-bold text-navy">Communication Preferences</h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose how you&apos;d like to hear from us</p>
            <div className="mt-6 space-y-2">
              <PrefToggle label="Email updates" checked={prefs.prefEmail} onChange={(v) => setPrefs({ ...prefs, prefEmail: v })} />
              <PrefToggle label="WhatsApp messages" checked={prefs.prefWhatsapp} onChange={(v) => setPrefs({ ...prefs, prefWhatsapp: v })} />
              <PrefToggle
                label="Session reminders"
                checked={prefs.prefSessionReminders}
                onChange={(v) => setPrefs({ ...prefs, prefSessionReminders: v })}
              />
              <PrefToggle
                label="Academy announcements"
                checked={prefs.prefAnnouncements}
                onChange={(v) => setPrefs({ ...prefs, prefAnnouncements: v })}
              />
              <PrefToggle label="Events & tournaments" checked={prefs.prefEvents} onChange={(v) => setPrefs({ ...prefs, prefEvents: v })} />
              <PrefToggle
                label="Holiday clinics"
                checked={prefs.prefHolidayClinics}
                onChange={(v) => setPrefs({ ...prefs, prefHolidayClinics: v })}
              />
            </div>
            <StepNav onBack={() => setStep(3)} onNext={() => setStep(5)} />
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold text-navy">Review &amp; Confirm</h2>
            <p className="mt-1 text-sm text-muted-foreground">Check your details, then create your account to finish.</p>
            <dl className="mt-6 space-y-2 rounded-card border border-border bg-card p-5 text-sm shadow-sm">
              <Row label="Package" value={`${selectedPackage.name} (R${selectedPackage.price}/month)`} />
              <Row label="Club" value={selectedClub?.name ?? ""} />
              <Row label="Time Slot" value={slot ? formatSlot(slot.weekday, slot.hour) : ""} />
              <Row label="Child" value={`${child.name} (born ${child.dob})`} />
              <Row label="Parent" value={parent.name} />
              <Row label="Email" value={parent.email} />
              <Row label="Mobile" value={parent.mobile} />
              <Row label="Emergency Contact" value={`${emergency.name} — ${emergency.phone}`} />
              <Row
                label="Debit Order"
                value={`${debit.bankName} ••${debit.accountNumber.slice(-4)} (${debit.accountType}), day ${debit.debitDay}`}
              />
            </dl>

            {/* Terms & consent */}
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
                  Please sign below to confirm your agreement ({parent.name || "parent/guardian"}).
                </p>
                <SignaturePad value={signatureData} onChange={setSignatureData} />
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive" role="alert">
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
                {submitting ? "Creating account…" : "Create Account & Enroll"}
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
        )}
      </div>

      <div className="relative mx-auto mt-12 aspect-[3/4] w-full max-w-xs overflow-hidden">
        <Image src="/images/mascots.png" alt="Next Gen Padel Academy Mascots" fill className="object-contain" />
      </div>
    </section>
  )
}

function PackagePicker({ packages, onSelect }: { packages: PublicPackage[]; onSelect: (p: PublicPackage) => void }) {
  const CARD_COLORS = [
    "from-navy to-[#0d3070]",
    "from-[#1a4a1a] to-[#2d6e2d]",
    "from-[#3a1a5c] to-[#5a2d8c]",
    "from-[#1a3a4a] to-[#0a2a3a]",
  ]

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h2 className="text-center text-2xl font-black text-navy">Choose Your Package</h2>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Pick the plan that suits your child — swipe or scroll to explore
      </p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {packages.map((pkg, i) => {
          const gradient = CARD_COLORS[i % CARD_COLORS.length]
          return (
            <button
              key={pkg.id}
              onClick={() => onSelect(pkg)}
              className="group block w-full overflow-hidden rounded-2xl shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl text-left"
            >
              {/* Coloured header */}
              <div className={`relative bg-gradient-to-br ${gradient} p-5 text-white overflow-hidden`}>
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/5" />
                {pkg.popular && (
                  <span className="mb-2 inline-block rounded-full bg-lime px-3 py-0.5 text-xs font-black text-navy">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-black leading-tight">{pkg.name}</h3>
                {pkg.tagline && <p className="mt-1 text-xs text-white/70">{pkg.tagline}</p>}
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-4xl font-black text-lime">R{pkg.price.toLocaleString()}</span>
                  {pkg.period === "once-off" ? (
                    <span className="mb-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">once off</span>
                  ) : (
                    <span className="mb-1 text-sm text-white/60">/month</span>
                  )}
                </div>
              </div>
              {/* White body */}
              <div className="bg-card p-5">
                {pkg.features.length > 0 && (
                  <ul className="space-y-2">
                    {pkg.features.slice(0, 4).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-lime/20">
                          <Check className="h-2.5 w-2.5 text-lime-foreground" />
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <span className="mt-5 flex items-center justify-center gap-1.5 rounded-xl bg-lime py-3 text-sm font-black text-lime-foreground transition-all group-hover:bg-navy group-hover:text-white">
                  Select &amp; Continue
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

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

function PrefToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-2 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold text-navy">{value}</dd>
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

function Confirmation({ packageName, reference }: { packageName: string; reference: string }) {
  return (
    <section className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-card border border-lime bg-lime/10 p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lime text-lime-foreground">
          <Check className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-2xl font-extrabold text-navy">Welcome to Next Gen Padel!</h2>
        <p className="mt-2 text-muted-foreground">
          Your account is ready and your enrollment in the {packageName} has been received.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">Your reference number</p>
        <p className="text-lg font-extrabold tracking-wide text-navy">{reference}</p>
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
