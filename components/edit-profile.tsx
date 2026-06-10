"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Pencil, X } from "lucide-react"
import { updateProfile } from "@/app/actions/enrollment"

export function EditProfile({
  name,
  mobile,
}: {
  name: string
  mobile: string
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [newName, setNewName] = useState(name)
  const [newMobile, setNewMobile] = useState(mobile)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function open() {
    setNewName(name)
    setNewMobile(mobile)
    setError(null)
    setEditing(true)
  }

  function cancel() {
    setEditing(false)
    setError(null)
  }

  function save() {
    setError(null)
    startTransition(async () => {
      try {
        await updateProfile({ name: newName, mobile: newMobile })
        setEditing(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save profile.")
      }
    })
  }

  if (!editing) {
    return (
      <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-border bg-card px-4 py-3">
        <div>
          <p className="text-sm font-bold text-navy">{name}</p>
          {mobile && <p className="text-xs text-muted-foreground">{mobile}</p>}
        </div>
        <button
          onClick={open}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:bg-muted"
        >
          <Pencil className="h-4 w-4 text-lime" />
          Edit profile
        </button>
      </div>
    )
  }

  return (
    <div className="mt-4 rounded-md border border-lime bg-card px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-navy">Edit Profile</p>
        <button onClick={cancel} className="text-muted-foreground hover:text-navy">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="block text-xs font-semibold text-navy">Full Name</span>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
          />
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-navy">Mobile Number</span>
          <input
            type="tel"
            value={newMobile}
            onChange={(e) => setNewMobile(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
          />
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={cancel}
          className="rounded-md border border-border px-4 py-1.5 text-sm font-semibold text-navy hover:bg-muted"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={!newName.trim() || pending}
          className="inline-flex items-center gap-1.5 rounded-md bg-lime px-4 py-1.5 text-sm font-bold text-lime-foreground transition-colors hover:bg-lime/90 disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  )
}
