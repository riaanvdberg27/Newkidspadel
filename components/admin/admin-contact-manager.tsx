"use client"

import { useState, useTransition } from "react"
import { Save, Check, Plus, Trash2 } from "lucide-react"
import type { ContactPerson } from "@/app/actions/contact-settings"
import { updateContacts } from "@/app/actions/contact-settings"

const SHOW_OPTIONS: { value: ContactPerson["showOn"]; label: string }[] = [
  { value: "both", label: "Footer & Contact page" },
  { value: "footer", label: "Footer only" },
  { value: "contact", label: "Contact page only" },
]

function makeId() {
  return `person_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function emptyPerson(): ContactPerson {
  return { id: makeId(), name: "", role: "", phone: "", email: "", showOn: "both" }
}

export function AdminContactManager({
  initialSettings,
  initialContacts,
}: {
  /** @deprecated legacy prop kept for compatibility — ignored if initialContacts present */
  initialSettings?: unknown
  initialContacts: ContactPerson[]
}) {
  const [contacts, setContacts] = useState<ContactPerson[]>(initialContacts)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function update(id: string, field: keyof ContactPerson, value: string) {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    )
  }

  function addPerson() {
    setContacts((prev) => [...prev, emptyPerson()])
  }

  function removePerson(id: string) {
    setContacts((prev) => prev.filter((c) => c.id !== id))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const res = await updateContacts(contacts)
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
        Add as many people as you like. For each person choose where they appear: footer, contact page, or both.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {contacts.map((person, idx) => (
          <fieldset
            key={person.id}
            className="rounded-card border border-border bg-card p-4 shadow-sm sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <legend className="text-sm font-bold text-navy">
                Person {idx + 1}
              </legend>
              <button
                type="button"
                onClick={() => removePerson(person.id)}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <input
                  value={person.name}
                  onChange={(e) => update(person.id, "name", e.target.value)}
                  required
                  placeholder="e.g. Gareth Nunes"
                  className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
                />
              </Field>
              <Field label="Role / title">
                <input
                  value={person.role}
                  onChange={(e) => update(person.id, "role", e.target.value)}
                  placeholder="e.g. Head Coach"
                  className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
                />
              </Field>
              <Field label="Phone number">
                <input
                  value={person.phone}
                  onChange={(e) => update(person.id, "phone", e.target.value)}
                  placeholder="e.g. 066 352 7053"
                  className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
                />
              </Field>
              <Field label="Email address">
                <input
                  type="email"
                  value={person.email}
                  onChange={(e) => update(person.id, "email", e.target.value)}
                  placeholder="e.g. gareth@nextgenpadel.co.za"
                  className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
                />
              </Field>
            </div>

            {/* Show on toggle */}
            <div className="mt-4">
              <span className="block text-xs font-semibold text-navy mb-2">Show on</span>
              <div className="flex flex-wrap gap-2">
                {SHOW_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update(person.id, "showOn", opt.value)}
                    className={[
                      "rounded-full border px-3 py-1.5 text-xs font-bold transition-colors",
                      person.showOn === opt.value
                        ? "border-lime bg-lime text-lime-foreground"
                        : "border-border bg-muted text-muted-foreground hover:border-lime/50",
                    ].join(" ")}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </fieldset>
        ))}

        {/* Add person */}
        <button
          type="button"
          onClick={addPerson}
          className="flex w-full items-center justify-center gap-2 rounded-card border-2 border-dashed border-border py-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-lime hover:text-lime"
        >
          <Plus className="h-4 w-4" />
          Add person
        </button>

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
