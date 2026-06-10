"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { completeOnboarding } from "@/app/actions/portal"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  PartyPopper,
  Bell,
  Mail,
  MessageCircle,
  CalendarClock,
  Megaphone,
  Sparkles,
  Loader2,
} from "lucide-react"

type Prefs = {
  prefEmail: boolean
  prefWhatsapp: boolean
  prefSessionReminders: boolean
  prefAnnouncements: boolean
  prefHolidayClinics: boolean
  prefEvents: boolean
}

const channelToggles: { key: keyof Prefs; label: string; desc: string; icon: typeof Mail }[] = [
  { key: "prefEmail", label: "Email updates", desc: "Receive academy updates by email.", icon: Mail },
  { key: "prefWhatsapp", label: "WhatsApp messages", desc: "Quick confirmations and reminders.", icon: MessageCircle },
]

const topicToggles: { key: keyof Prefs; label: string; desc: string; icon: typeof Bell }[] = [
  { key: "prefSessionReminders", label: "Session reminders", desc: "Never miss a coaching session.", icon: CalendarClock },
  { key: "prefAnnouncements", label: "Academy announcements", desc: "Important news and updates.", icon: Megaphone },
  { key: "prefHolidayClinics", label: "Holiday clinics", desc: "Early access to clinic bookings.", icon: Sparkles },
  { key: "prefEvents", label: "Events & tournaments", desc: "Invitations to special events.", icon: PartyPopper },
]

export function OnboardingWizard({
  childName,
  packageName,
  club,
  reference,
  initialPrefs,
}: {
  childName: string
  packageName: string
  club: string
  reference: string
  initialPrefs: Prefs
}) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [prefs, setPrefs] = useState<Prefs>(initialPrefs)

  const toggle = (key: keyof Prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }))

  const total = 3
  const progress = ((step + 1) / total) * 100

  async function finish() {
    setSaving(true)
    await completeOnboarding(prefs)
    setSaving(false)
    toast.success("You're all set! Welcome to your portal.")
    router.refresh()
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <Progress value={progress} className="h-1.5" />
        <p className="mt-2 text-sm text-muted-foreground">
          Step {step + 1} of {total}
        </p>
      </div>

      {step === 0 && (
        <Card>
          <CardHeader>
            <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <PartyPopper className="size-6" />
            </div>
            <CardTitle className="font-heading text-2xl">Welcome to the academy!</CardTitle>
            <CardDescription>
              Your account is active. Here&apos;s a quick look at {childName}&apos;s enrollment.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-secondary/30 p-4">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Player</dt>
                  <dd className="font-medium">{childName}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Reference</dt>
                  <dd className="font-medium">{reference}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Programme</dt>
                  <dd className="font-medium">{packageName}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Club</dt>
                  <dd className="font-medium">{club}</dd>
                </div>
              </dl>
            </div>
            <Button onClick={() => setStep(1)} className="w-full">
              Let&apos;s get started
              <ChevronRight data-icon="inline-end" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <Badge variant="secondary" className="mb-1 w-fit">
              Communication
            </Badge>
            <CardTitle className="font-heading text-2xl">How should we reach you?</CardTitle>
            <CardDescription>Choose the channels you&apos;d like to hear from us on.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {channelToggles.map((t) => (
              <ToggleRow key={t.key} {...t} checked={prefs[t.key]} onChange={() => toggle(t.key)} />
            ))}
            <div className="mt-2 flex gap-3">
              <Button variant="ghost" onClick={() => setStep(0)}>
                <ChevronLeft data-icon="inline-start" />
                Back
              </Button>
              <Button onClick={() => setStep(2)} className="flex-1">
                Continue
                <ChevronRight data-icon="inline-end" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <Badge variant="secondary" className="mb-1 w-fit">
              Topics
            </Badge>
            <CardTitle className="font-heading text-2xl">What matters to you?</CardTitle>
            <CardDescription>Pick the updates you&apos;d like to receive. Change these anytime.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {topicToggles.map((t) => (
              <ToggleRow key={t.key} {...t} checked={prefs[t.key]} onChange={() => toggle(t.key)} />
            ))}
            <div className="mt-2 flex gap-3">
              <Button variant="ghost" onClick={() => setStep(1)} disabled={saving}>
                <ChevronLeft data-icon="inline-start" />
                Back
              </Button>
              <Button onClick={finish} className="flex-1" disabled={saving}>
                {saving && <Loader2 data-icon="inline-start" className="animate-spin" />}
                {saving ? "Saving..." : "Finish & enter portal"}
                {!saving && <CheckCircle2 data-icon="inline-end" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ToggleRow({
  label,
  desc,
  icon: Icon,
  checked,
  onChange,
}: {
  label: string
  desc: string
  icon: typeof Mail
  checked: boolean
  onChange: () => void
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors",
        checked ? "border-primary/40 bg-primary/5" : "border-border",
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
        <Icon className="size-5" />
      </div>
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}
