"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check } from "lucide-react"
import { PACKAGES, ENROLLMENT_CLUBS, type Package } from "@/lib/site-data"
import { authClient } from "@/lib/auth-client"
import { createEnrollment } from "@/app/actions/enrollment"

const STEPS = ["Club & Schedule", "Child", "Parent Account", "Preferences", "Review"]

const TIME_SLOTS = [
  "Weekday Afternoon (15:00 - 17:00)",
  "Weekday Evening (17:00 - 19:00)",
  "Saturday Morning (08:00 - 12:00)",
  "Saturday Afternoon (12:00 - 16:00)",
]

type Prefs = {
  prefEmail: boolean
  prefWhatsapp: boolean
  prefSessionReminders: boolean
  prefAnnouncements: boolean
  prefEvents: boolean
  prefHolidayClinics: boolean
}

export function OnboardingWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialPackage = PACKAGES.find((p) => p.id === searchParams.get("package")) ?? null

  const [selectedPackage, setSelectedPackage] = useState<Package | null>(initialPackage)
  const [step, setStep] = useState(0)

  // Step data
  const [club, setClub] = useState<string | null>(null)
  const [timeSlot, setTimeSlot] = useState<string | null>(null)
  const [child, setChild] = useState({ name: "", dob: "", age: "" })
  const [parent, setParent] = useState({ name: "", email: "", mobile: "", password: "" })
  const [emergency, setEmergency] = useState({ name: "", phone: "" })
  const [prefs, setPrefs] = useState<Prefs>({
    prefEmail: true,
    prefWhatsapp: false,
    prefSessionReminders: true,
    prefAnnouncements: true,
    prefEvents: false,
    prefHolidayClinics: false,
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reference, setReference] = useState<string | null>(null)

  if (!selectedPackage) {
    return <PackagePicker onSelect={setSelectedPackage} />
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
        childAge: Number(child.age),
        packageName: selectedPackage.name,
        club: club ?? "",
        emergencyContactName: emergency.name,
        emergencyContactPhone: emergency.phone,
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
            {selectedPackage.name} — R{selectedPackage.price}/month
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedPackage(null)
            setStep(0)
          }}
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-muted"
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
          <div>
            <h2 className="text-xl font-bold text-navy">Choose Your Club &amp; Schedule</h2>
            <p className="mt-1 text-sm text-muted-foreground">Select the affiliated club nearest to you</p>
            <div className="mt-6 space-y-3">
              {ENROLLMENT_CLUBS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setClub(c.name)}
                  className={`w-full rounded-card border p-4 text-left transition-colors ${
                    club === c.name ? "border-lime bg-lime/10" : "border-border bg-card hover:border-lime/50"
                  }`}
                >
                  <h3 className="font-bold text-navy">{c.name}</h3>
                  <p className="text-sm text-muted-foreground">{c.location}</p>
                </button>
              ))}
            </div>
            <div className="mt-6">
              <p className="block text-sm font-semibold text-navy">Preferred Time Slot</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setTimeSlot(slot)}
                    className={`rounded-md border p-3 text-left text-sm transition-colors ${
                      timeSlot === slot ? "border-lime bg-lime/10" : "border-border bg-card hover:border-lime/50"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
            <StepNav onNext={() => setStep(1)} nextDisabled={!club || !timeSlot} />
          </div>
        ) : step === 1 ? (
          <div>
            <h2 className="text-xl font-bold text-navy">Your Child&apos;s Details</h2>
            <p className="mt-1 text-sm text-muted-foreground">Tell us who will be joining the academy</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Child's Full Name" value={child.name} onChange={(v) => setChild({ ...child, name: v })} />
              <Field label="Date of Birth" type="date" value={child.dob} onChange={(v) => setChild({ ...child, dob: v })} />
              <Field
                label="Age"
                type="number"
                value={child.age}
                onChange={(v) => setChild({ ...child, age: v })}
                placeholder="Ages 5-17"
              />
            </div>
            <StepNav
              onBack={() => setStep(0)}
              onNext={() => setStep(2)}
              nextDisabled={!child.name || !child.dob || !child.age}
            />
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
            <StepNav onBack={() => setStep(2)} onNext={() => setStep(4)} />
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold text-navy">Review &amp; Confirm</h2>
            <p className="mt-1 text-sm text-muted-foreground">Check your details, then create your account to finish.</p>
            <dl className="mt-6 space-y-2 rounded-card border border-border bg-card p-5 text-sm shadow-sm">
              <Row label="Package" value={`${selectedPackage.name} (R${selectedPackage.price}/month)`} />
              <Row label="Club" value={club ?? ""} />
              <Row label="Preferred Time" value={timeSlot ?? ""} />
              <Row label="Child" value={`${child.name} (age ${child.age})`} />
              <Row label="Parent" value={parent.name} />
              <Row label="Email" value={parent.email} />
              <Row label="Mobile" value={parent.mobile} />
              <Row label="Emergency Contact" value={`${emergency.name} — ${emergency.phone}`} />
            </dl>

            {error && (
              <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <div className="mt-8 flex items-center justify-between gap-4">
              <button
                onClick={() => setStep(3)}
                className="rounded-md border border-border px-5 py-2.5 font-semibold text-navy transition-colors hover:bg-muted"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-md bg-lime px-6 py-2.5 font-bold text-lime-foreground transition-colors hover:bg-lime/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Creating account…" : "Create Account & Enroll"}
              </button>
            </div>
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

function PackagePicker({ onSelect }: { onSelect: (p: Package) => void }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h2 className="text-center text-2xl font-extrabold text-navy">Choose a Monthly Package to Begin</h2>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Select one of our monthly package deals below to start your enrollment.
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {PACKAGES.map((pkg) => (
          <button
            key={pkg.id}
            onClick={() => onSelect(pkg)}
            className={`relative flex flex-col rounded-card border bg-card p-6 text-left shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg ${
              pkg.popular ? "border-lime" : "border-border"
            }`}
          >
            {pkg.popular && (
              <span className="absolute right-4 top-4 rounded-full bg-lime px-3 py-1 text-xs font-bold text-lime-foreground">
                Most Popular
              </span>
            )}
            <h3 className="text-lg font-bold text-navy">
              <span className={pkg.popular ? "pr-24" : undefined}>{pkg.name}</span>
            </h3>
            <p className="mt-1 text-2xl font-extrabold text-lime">R{pkg.price}/month</p>
            <p className="mt-1 text-sm text-muted-foreground">{pkg.tagline}</p>
            <ul className="mt-4 flex-1 space-y-2">
              {pkg.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-lime" />
                  {f}
                </li>
              ))}
            </ul>
            <span className="mt-6 inline-flex items-center justify-center rounded-md bg-lime px-4 py-2.5 text-sm font-bold text-lime-foreground">
              Select &amp; Continue
            </span>
          </button>
        ))}
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
          className="rounded-md border border-border px-5 py-2.5 font-semibold text-navy transition-colors hover:bg-muted"
        >
          Back
        </button>
      ) : (
        <span />
      )}
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="rounded-md bg-lime px-6 py-2.5 font-bold text-lime-foreground transition-colors hover:bg-lime/90 disabled:cursor-not-allowed disabled:opacity-50"
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
