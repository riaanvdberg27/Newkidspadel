"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Plus, CalendarClock, X } from "lucide-react"
import type { Club } from "@/lib/db/schema"
import { createClub, updateClub, deleteClub, type ClubInput } from "@/app/actions/admin"
import { ClubForm } from "@/components/admin/club-form"
import { SlotEditor } from "@/components/admin/slot-editor"

export function AdminClubManager({ initialClubs }: { initialClubs: Club[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<Club | null>(null)
  const [creating, setCreating] = useState(false)
  const [slotClub, setSlotClub] = useState<Club | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSave(input: ClubInput, id?: number) {
    startTransition(async () => {
      if (id) {
        await updateClub(id, input)
      } else {
        await createClub(input)
      }
      setEditing(null)
      setCreating(false)
      router.refresh()
    })
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      await deleteClub(id)
      setDeletingId(null)
      router.refresh()
    })
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-navy">Clubs ({initialClubs.length})</h2>
        <button
          onClick={() => {
            setCreating(true)
            setEditing(null)
          }}
          className="inline-flex items-center gap-2 rounded-md bg-lime px-4 py-2 text-sm font-bold text-lime-foreground transition-colors hover:bg-lime/90"
        >
          <Plus className="h-4 w-4" />
          Add Club
        </button>
      </div>

      <div className="mt-6 grid gap-4">
        {initialClubs.map((club) => (
          <article key={club.id} className="rounded-card border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-navy">{club.name}</h3>
                  {!club.published && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-lime">{club.location}</p>
                <p className="mt-1 text-sm text-muted-foreground">{club.address}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSlotClub(club)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:bg-muted"
                >
                  <CalendarClock className="h-4 w-4 text-lime" />
                  Slots
                </button>
                <button
                  onClick={() => {
                    setEditing(club)
                    setCreating(false)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:bg-muted"
                >
                  <Pencil className="h-4 w-4 text-lime" />
                  Edit
                </button>
                <button
                  onClick={() => setDeletingId(club.id)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 px-3 py-1.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>

            {deletingId === club.id && (
              <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-4">
                <p className="text-sm font-semibold text-destructive">
                  Delete {club.name}? This also removes its slot setup. Existing enrollments are kept.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleDelete(club.id)}
                    disabled={pending}
                    className="rounded-md bg-destructive px-4 py-1.5 text-sm font-bold text-destructive-foreground disabled:opacity-50"
                  >
                    {pending ? "Deleting…" : "Yes, delete"}
                  </button>
                  <button
                    onClick={() => setDeletingId(null)}
                    className="rounded-md border border-border px-4 py-1.5 text-sm font-semibold text-navy hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}
        {initialClubs.length === 0 && (
          <p className="rounded-card border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
            No clubs yet. Click &quot;Add Club&quot; to create your first one.
          </p>
        )}
      </div>

      {/* Create / Edit modal */}
      {(creating || editing) && (
        <Modal
          title={editing ? `Edit ${editing.name}` : "Add New Club"}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
        >
          <ClubForm
            club={editing}
            pending={pending}
            onSubmit={(input) => handleSave(input, editing?.id)}
            onCancel={() => {
              setCreating(false)
              setEditing(null)
            }}
          />
        </Modal>
      )}

      {/* Slot editor modal */}
      {slotClub && (
        <Modal title={`Slots — ${slotClub.name}`} onClose={() => setSlotClub(null)} wide>
          <SlotEditor clubId={slotClub.id} />
        </Modal>
      )}
    </div>
  )
}

function Modal({
  title,
  children,
  onClose,
  wide,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
  wide?: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className={`my-8 w-full rounded-card bg-card p-6 shadow-xl ${wide ? "max-w-3xl" : "max-w-lg"}`}>
        <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
          <h3 className="text-lg font-bold text-navy">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-navy"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}
