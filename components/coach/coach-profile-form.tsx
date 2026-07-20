"use client"

import { useState, useTransition } from "react"
import { updateCoachProfile } from "@/app/actions/coach"

export function CoachProfileForm({
  initial,
}: {
  initial: { mobile: string; emergencyContactName: string; emergencyContactPhone: string }
}) {
  const [mobile, setMobile] = useState(initial.mobile)
  const [ecName, setEcName] = useState(initial.emergencyContactName)
  const [ecPhone, setEcPhone] = useState(initial.emergencyContactPhone)
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function submit() {
    setSaved(false)
    startTransition(async () => {
      await updateCoachProfile({ mobile, emergencyContactName: ecName, emergencyContactPhone: ecPhone })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  return (
    <div className="space-y-4 rounded-card border border-border bg-card p-5">
      <label className="block">
        <span className="text-sm font-semibold text-navy">Mobile number</span>
        <input
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-lime"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-navy">Emergency contact name</span>
          <input
            value={ecName}
            onChange={(e) => setEcName(e.target.value)}
            className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-lime"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-navy">Emergency contact phone</span>
          <input
            value={ecPhone}
            onChange={(e) => setEcPhone(e.target.value)}
            className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-lime"
          />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={pending}
          className="rounded-md bg-lime px-4 py-2.5 font-bold text-lime-foreground hover:bg-lime/90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save Changes"}
        </button>
        {saved && <span className="text-sm font-semibold text-lime-700">Saved</span>}
      </div>
    </div>
  )
}
