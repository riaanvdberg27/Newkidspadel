"use client"

import { useState, useTransition } from "react"
import { Save, Check } from "lucide-react"
import type { ContactSettings } from "@/app/actions/contact-settings"
import { updateContactSettings } from "@/app/actions/contact-settings"

export function AdminContactManager({
  initialSettings,
}: {
  initialSettings: ContactSettings
}) {
  const [settings, setSettings] = useState<ContactSettings>(initialSettings)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function set(key: keyof ContactSettings, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const res = await updateContactSettings(settings)
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError("Save failed. Please try again.")
      }
    })
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-navy">Contact Details</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Update coach contact information. Changes are reflected immediately on the website footer and contact page.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        {([
          { prefix: "coach1" as const, label: "Coach 1" },
          { prefix: "coach2" as const, label: "Coach 2" },
        ] as const).map(({ prefix, label }) => (
          <fieldset key={prefix} className="rounded-card border border-border bg-card p-6 shadow-sm">
            <legend className="mb-4 px-1 text-sm font-bold text-navy">{label}</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <input
                  value={settings[`${prefix}_name`]}
                  onChange={(e) => set(`${prefix}_name`, e.target.value)}
                  required
                  className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
                />
              </Field>
              <Field label="Role / title">
                <input
                  value={settings[`${prefix}_role`]}
                  onChange={(e) => set(`${prefix}_role`, e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
                />
              </Field>
              <Field label="Phone number">
                <input
                  value={settings[`${prefix}_phone`]}
                  onChange={(e) => set(`${prefix}_phone`, e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
                />
              </Field>
              <Field label="Email address">
                <input
                  type="email"
                  value={settings[`${prefix}_email`]}
                  onChange={(e) => set(`${prefix}_email`, e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
                />
              </Field>
            </div>
          </fieldset>
        ))}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-md bg-lime px-5 py-2.5 text-sm font-bold text-lime-foreground transition-colors hover:bg-lime/90 disabled:opacity-50"
          >
            {saved ? (
              <><Check className="h-4 w-4" />Saved</>
            ) : (
              <><Save className="h-4 w-4" />{pending ? "Saving..." : "Save changes"}</>
            )}
          </button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </form>
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
