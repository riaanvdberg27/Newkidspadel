"use client"

import Image from "next/image"
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Check } from "lucide-react"
import { PACKAGES, ENROLLMENT_CLUBS, type Package } from "@/lib/site-data"

const STEPS = ["Select Club", "Age & Time", "Sign Up", "Pay Now"]

const TIME_SLOTS = [
  "Weekday Afternoon (15:00 - 17:00)",
  "Weekday Evening (17:00 - 19:00)",
  "Saturday Morning (08:00 - 12:00)",
  "Saturday Afternoon (12:00 - 16:00)",
]

export function EnrollmentWizard() {
  const searchParams = useSearchParams()
  const initialPackage = PACKAGES.find((p) => p.id === searchParams.get("package")) ?? null

  const [selectedPackage, setSelectedPackage] = useState<Package | null>(initialPackage)
  const [step, setStep] = useState(0)
  const [club, setClub] = useState<string | null>(null)
  const [age, setAge] = useState("")
  const [timeSlot, setTimeSlot] = useState<string | null>(null)
  const [form, setForm] = useState({ parentName: "", childName: "", email: "", phone: "" })
  const [submitted, setSubmitted] = useState(false)

  if (!selectedPackage) {
    return <PackagePicker onSelect={setSelectedPackage} />
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
      <ol className="mt-8 flex items-center justify-between">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 flex-col items-center text-center">
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                i <= step ? "bg-lime text-lime-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </span>
            <span className={`mt-2 text-xs font-semibold ${i <= step ? "text-navy" : "text-muted-foreground"}`}>
              {label}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-10">
        {submitted ? (
          <Confirmation packageName={selectedPackage.name} price={selectedPackage.price} />
        ) : step === 0 ? (
          <div>
            <h2 className="text-xl font-bold text-navy">Step 1: Select Your Club</h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose the affiliated club nearest to you</p>
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
            <StepNav onNext={() => setStep(1)} nextDisabled={!club} />
          </div>
        ) : step === 1 ? (
          <div>
            <h2 className="text-xl font-bold text-navy">Step 2: Age & Preferred Time</h2>
            <p className="mt-1 text-sm text-muted-foreground">Tell us a bit about your child&apos;s schedule</p>
            <div className="mt-6 space-y-5">
              <div>
                <label htmlFor="age" className="block text-sm font-semibold text-navy">
                  Child&apos;s Age
                </label>
                <input
                  id="age"
                  type="number"
                  min={5}
                  max={17}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Ages 5-17"
                  className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 outline-none focus:border-lime"
                />
              </div>
              <div>
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
            </div>
            <StepNav onBack={() => setStep(0)} onNext={() => setStep(2)} nextDisabled={!age || !timeSlot} />
          </div>
        ) : step === 2 ? (
          <div>
            <h2 className="text-xl font-bold text-navy">Step 3: Sign Up</h2>
            <p className="mt-1 text-sm text-muted-foreground">Enter your details to create your enrollment</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Parent / Guardian Name" value={form.parentName} onChange={(v) => setForm({ ...form, parentName: v })} />
              <Field label="Child's Name" value={form.childName} onChange={(v) => setForm({ ...form, childName: v })} />
              <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <Field label="Phone Number" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            </div>
            <StepNav
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
              nextDisabled={!form.parentName || !form.childName || !form.email || !form.phone}
            />
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold text-navy">Step 4: Pay Now</h2>
            <p className="mt-1 text-sm text-muted-foreground">Review your enrollment and complete payment</p>
            <dl className="mt-6 space-y-2 rounded-card border border-border bg-card p-5 text-sm shadow-sm">
              <Row label="Package" value={selectedPackage.name} />
              <Row label="Monthly Fee" value={`R${selectedPackage.price}/month`} />
              <Row label="Club" value={club ?? ""} />
              <Row label="Child's Age" value={age} />
              <Row label="Preferred Time" value={timeSlot ?? ""} />
              <Row label="Parent" value={form.parentName} />
              <Row label="Child" value={form.childName} />
            </dl>
            <StepNav
              onBack={() => setStep(2)}
              onNext={() => setSubmitted(true)}
              nextLabel={`Pay R${selectedPackage.price} & Enroll`}
            />
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
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-navy">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 outline-none focus:border-lime"
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

function Confirmation({ packageName, price }: { packageName: string; price: number }) {
  return (
    <div className="rounded-card border border-lime bg-lime/10 p-8 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lime text-lime-foreground">
        <Check className="h-7 w-7" />
      </span>
      <h2 className="mt-4 text-2xl font-extrabold text-navy">Enrollment Complete!</h2>
      <p className="mt-2 text-muted-foreground">
        Thank you for enrolling in the {packageName} (R{price}/month). Our team will be in touch shortly to confirm your
        first session.
      </p>
    </div>
  )
}
