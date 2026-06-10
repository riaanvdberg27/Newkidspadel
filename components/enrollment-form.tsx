"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { CLUBS, PACKAGES, getClubById } from "@/lib/academy"
import { submitEnrollment } from "@/app/actions/enrollment"
import { toast } from "sonner"
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

type Props = { defaultPackage?: string }

const STEPS = ["Player", "Parent", "Programme", "Review"]

export function EnrollmentForm({ defaultPackage }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    childName: "",
    childDob: "",
    parentName: "",
    parentEmail: "",
    parentMobile: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    club: CLUBS[0].id,
    packageId: defaultPackage && PACKAGES.some((p) => p.id === defaultPackage) ? defaultPackage : PACKAGES[1].id,
  })

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const selectedPackage = PACKAGES.find((p) => p.id === form.packageId)

  function validateStep(): string | null {
    if (step === 0) {
      if (!form.childName.trim()) return "Please enter your child's name."
      if (!form.childDob) return "Please enter your child's date of birth."
    }
    if (step === 1) {
      if (!form.parentName.trim()) return "Please enter your name."
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.parentEmail)) return "Please enter a valid email."
      if (!form.parentMobile.trim()) return "Please enter your mobile number."
    }
    return null
  }

  function next() {
    const err = validateStep()
    if (err) {
      toast.error(err)
      return
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0))
  }

  async function handleSubmit() {
    setSubmitting(true)
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    const result = await submitEnrollment(fd)
    setSubmitting(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }
    const params = new URLSearchParams({ ref: result.reference })
    if (result.activationUrl) params.set("activation", result.activationUrl)
    if (result.emailSimulated) params.set("sim", "1")
    router.push(`/welcome?${params.toString()}`)
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border bg-secondary/40 px-6 py-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-heading text-sm font-semibold">
            Step {step + 1} of {STEPS.length}
          </span>
          <span className="text-sm text-muted-foreground">{STEPS[step]}</span>
        </div>
        <Progress value={progress} className="h-1.5" />
        <div className="mt-3 flex gap-1.5">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center gap-1.5">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  i < step && "bg-primary text-primary-foreground",
                  i === step && "bg-primary text-primary-foreground ring-2 ring-primary/30",
                  i > step && "bg-muted text-muted-foreground",
                )}
              >
                {i < step ? <CheckCircle2 className="size-3.5" /> : i + 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      <CardContent className="p-6">
        {step === 0 && (
          <FieldGroup>
            <div className="mb-1">
              <h2 className="font-heading text-xl font-bold">Tell us about your player</h2>
              <p className="text-sm text-muted-foreground">We&apos;ll tailor the programme to their age.</p>
            </div>
            <Field>
              <FieldLabel htmlFor="childName">Child&apos;s full name</FieldLabel>
              <Input
                id="childName"
                value={form.childName}
                onChange={(e) => set("childName", e.target.value)}
                placeholder="e.g. Emma Williams"
                autoFocus
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="childDob">Date of birth</FieldLabel>
              <Input
                id="childDob"
                type="date"
                value={form.childDob}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => set("childDob", e.target.value)}
              />
              <FieldDescription>Players must be between 3 and 18 years old.</FieldDescription>
            </Field>
          </FieldGroup>
        )}

        {step === 1 && (
          <FieldGroup>
            <div className="mb-1">
              <h2 className="font-heading text-xl font-bold">Parent / guardian details</h2>
              <p className="text-sm text-muted-foreground">Used for your portal account and updates.</p>
            </div>
            <Field>
              <FieldLabel htmlFor="parentName">Your full name</FieldLabel>
              <Input id="parentName" value={form.parentName} onChange={(e) => set("parentName", e.target.value)} placeholder="e.g. Sarah Williams" />
            </Field>
            <Field>
              <FieldLabel htmlFor="parentEmail">Email address</FieldLabel>
              <Input id="parentEmail" type="email" value={form.parentEmail} onChange={(e) => set("parentEmail", e.target.value)} placeholder="you@example.com" />
              <FieldDescription>Your welcome email and portal activation link go here.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="parentMobile">Mobile number</FieldLabel>
              <Input id="parentMobile" type="tel" value={form.parentMobile} onChange={(e) => set("parentMobile", e.target.value)} placeholder="+27 82 000 0000" />
              <FieldDescription>We&apos;ll send a WhatsApp confirmation here.</FieldDescription>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="emergencyContactName">Emergency contact (optional)</FieldLabel>
                <Input id="emergencyContactName" value={form.emergencyContactName} onChange={(e) => set("emergencyContactName", e.target.value)} placeholder="Name" />
              </Field>
              <Field>
                <FieldLabel htmlFor="emergencyContactPhone">Emergency phone (optional)</FieldLabel>
                <Input id="emergencyContactPhone" type="tel" value={form.emergencyContactPhone} onChange={(e) => set("emergencyContactPhone", e.target.value)} placeholder="+27 ..." />
              </Field>
            </div>
          </FieldGroup>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="font-heading text-xl font-bold">Choose a programme &amp; club</h2>
              <p className="text-sm text-muted-foreground">You can change this later from your portal.</p>
            </div>
            <Field>
              <FieldLabel htmlFor="club">Preferred club</FieldLabel>
              <Select value={form.club} onValueChange={(v) => set("club", v)}>
                <SelectTrigger id="club">
                  <SelectValue placeholder="Select a club" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {CLUBS.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <div className="flex flex-col gap-3">
              <Label>Programme</Label>
              {PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => set("packageId", pkg.id)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-4 text-left transition-colors",
                    form.packageId === pkg.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/40 hover:bg-secondary/40",
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-heading font-semibold">{pkg.name}</span>
                    <span className="text-sm text-muted-foreground">{pkg.description}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-heading text-lg font-bold">R{pkg.price}</span>
                    <span className="text-xs text-muted-foreground">/ month</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="font-heading text-xl font-bold">Review &amp; confirm</h2>
              <p className="text-sm text-muted-foreground">Make sure everything looks right before submitting.</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 p-4">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <ReviewRow label="Player" value={form.childName} />
                <ReviewRow label="Date of birth" value={form.childDob} />
                <ReviewRow label="Parent" value={form.parentName} />
                <ReviewRow label="Email" value={form.parentEmail} />
                <ReviewRow label="Mobile" value={form.parentMobile} />
                <ReviewRow label="Club" value={getClubById(form.club)?.name ?? form.club} />
                <ReviewRow label="Programme" value={selectedPackage?.name ?? ""} />
                <ReviewRow label="Monthly fee" value={selectedPackage ? `R${selectedPackage.price}` : ""} />
              </dl>
            </div>
            <Badge variant="secondary" className="w-fit">
              A welcome email &amp; WhatsApp confirmation will be sent on submit
            </Badge>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" onClick={back} disabled={step === 0 || submitting}>
            <ChevronLeft data-icon="inline-start" />
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={next}>
              Continue
              <ChevronRight data-icon="inline-end" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 data-icon="inline-start" className="animate-spin" />}
              {submitting ? "Submitting..." : "Submit enrollment"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value || "—"}</dd>
    </div>
  )
}
