"use client"

import { useState } from "react"
import type { Club } from "@/lib/db/schema"
import type { ClubInput } from "@/app/actions/admin"

export function ClubForm({
  club,
  pending,
  onSubmit,
  onCancel,
}: {
  club: Club | null
  pending: boolean
  onSubmit: (input: ClubInput) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(club?.name ?? "")
  const [location, setLocation] = useState(club?.location ?? "")
  const [description, setDescription] = useState(club?.description ?? "")
  const [address, setAddress] = useState(club?.address ?? "")
  const [phone, setPhone] = useState(club?.phone ?? "")
  const [hours, setHours] = useState(club?.hours ?? "")
  const [image, setImage] = useState(club?.image ?? "")
  const [featuresText, setFeaturesText] = useState(
    Array.isArray(club?.features) ? (club!.features as string[]).join(", ") : "",
  )
  const [published, setPublished] = useState(club?.published ?? true)

  const valid = name && location && address && phone && hours

  function handleSubmit() {
    onSubmit({
      name: name.trim(),
      location: location.trim(),
      description: description.trim(),
      address: address.trim(),
      phone: phone.trim(),
      hours: hours.trim(),
      image: image.trim() || null,
      features: featuresText
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean),
      published,
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Club Name" value={name} onChange={setName} />
        <TextField label="Location (city, province)" value={location} onChange={setLocation} placeholder="Pretoria, Gauteng" />
      </div>
      <TextField label="Address" value={address} onChange={setAddress} placeholder="Street, suburb, city, code" />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Phone" value={phone} onChange={setPhone} placeholder="012 345 6789" />
        <TextField label="Operating Hours" value={hours} onChange={setHours} placeholder="Mon-Fri: 10:00-16:00" />
      </div>
      <label className="block">
        <span className="block text-sm font-semibold text-navy">Description (optional)</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 outline-none focus:border-lime"
        />
      </label>
      <TextField
        label="Features (comma separated)"
        value={featuresText}
        onChange={setFeaturesText}
        placeholder="6 Indoor Courts, Café, Parking"
      />
      <TextField
        label="Logo / Image path (optional)"
        value={image}
        onChange={setImage}
        placeholder="/images/club-logo.png"
      />

      <label className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="h-5 w-5 accent-lime"
        />
        <span className="text-sm font-medium text-navy">Published (visible on homepage &amp; enrollment)</span>
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onCancel}
          className="rounded-md border border-border px-5 py-2.5 font-semibold text-navy transition-colors hover:bg-muted"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!valid || pending}
          className="rounded-md bg-lime px-6 py-2.5 font-bold text-lime-foreground transition-colors hover:bg-lime/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Saving…" : club ? "Save Changes" : "Create Club"}
        </button>
      </div>
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-navy">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 outline-none focus:border-lime"
      />
    </label>
  )
}
