"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { updateContactDetails, updatePreferences } from "@/app/actions/portal"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

type Prefs = {
  prefEmail: boolean
  prefWhatsapp: boolean
  prefSessionReminders: boolean
  prefAnnouncements: boolean
  prefHolidayClinics: boolean
  prefEvents: boolean
}

const PREF_FIELDS: { key: keyof Prefs; label: string; description: string }[] = [
  { key: "prefEmail", label: "Email updates", description: "Receive academy updates by email." },
  { key: "prefWhatsapp", label: "WhatsApp messages", description: "Get confirmations and reminders on WhatsApp." },
  { key: "prefSessionReminders", label: "Session reminders", description: "Reminders before each coaching session." },
  { key: "prefAnnouncements", label: "Academy announcements", description: "General news from the academy." },
  { key: "prefHolidayClinics", label: "Holiday clinics", description: "Be first to hear about holiday programmes." },
  { key: "prefEvents", label: "Events & tournaments", description: "Invitations to events and junior tournaments." },
]

export function ProfileView({
  email,
  parentName,
  parentMobile,
  emergencyContactName,
  emergencyContactPhone,
  prefs,
}: {
  email: string
  parentName: string
  parentMobile: string
  emergencyContactName: string
  emergencyContactPhone: string
  prefs: Prefs
}) {
  const [contactPending, startContact] = useTransition()
  const [prefsState, setPrefsState] = useState<Prefs>(prefs)
  const [prefsPending, startPrefs] = useTransition()

  function handleContact(formData: FormData) {
    startContact(async () => {
      const res = await updateContactDetails(formData)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Contact details updated")
    })
  }

  function savePrefs() {
    startPrefs(async () => {
      await updatePreferences(prefsState)
      toast.success("Preferences saved")
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Contact details</CardTitle>
          <CardDescription>Keep your phone numbers up to date.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleContact}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="parentName">Parent / guardian</FieldLabel>
                <Input id="parentName" value={parentName} disabled />
                <FieldDescription>Contact the academy to change your name.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" value={email} disabled />
              </Field>
              <Field>
                <FieldLabel htmlFor="parentMobile">Mobile number</FieldLabel>
                <Input id="parentMobile" name="parentMobile" defaultValue={parentMobile} />
              </Field>
              <Field>
                <FieldLabel htmlFor="emergencyContactName">Emergency contact name</FieldLabel>
                <Input id="emergencyContactName" name="emergencyContactName" defaultValue={emergencyContactName} />
              </Field>
              <Field>
                <FieldLabel htmlFor="emergencyContactPhone">Emergency contact phone</FieldLabel>
                <Input id="emergencyContactPhone" name="emergencyContactPhone" defaultValue={emergencyContactPhone} />
              </Field>
              <Button type="submit" disabled={contactPending} className="w-fit">
                {contactPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
                Save changes
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Communication preferences</CardTitle>
          <CardDescription>Choose what you want to hear about.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {PREF_FIELDS.map((f, i) => (
            <div key={f.key}>
              {i > 0 && <Separator className="my-1" />}
              <div className="flex items-center justify-between gap-4 py-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{f.label}</span>
                  <span className="text-sm text-muted-foreground">{f.description}</span>
                </div>
                <Switch
                  checked={prefsState[f.key]}
                  onCheckedChange={(v) => setPrefsState((p) => ({ ...p, [f.key]: v }))}
                  aria-label={f.label}
                />
              </div>
            </div>
          ))}
          <Button onClick={savePrefs} disabled={prefsPending} className="mt-3 w-fit">
            {prefsPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
            Save preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
