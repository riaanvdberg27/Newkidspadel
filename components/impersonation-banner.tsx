"use client"

import { useTransition } from "react"
import { ShieldAlert, LogOut } from "lucide-react"
import type { ImpersonationMode } from "@/lib/impersonation"

interface Props {
  parentName: string
  parentEmail: string
  mode: ImpersonationMode
}

export function ImpersonationBanner({ parentName, parentEmail, mode }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleExit() {
    startTransition(async () => {
      await fetch("/api/admin/impersonate/end", { method: "POST" })
      window.location.href = "/admin"
    })
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="sticky top-0 z-50 w-full border-b-2 border-amber-500 bg-amber-400"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-900" aria-hidden="true" />
          <div>
            <p className="text-sm font-extrabold text-amber-900">
              You are viewing this portal as an Administrator.
            </p>
            <p className="text-xs text-amber-800">
              Viewing as <strong>{parentName}</strong> ({parentEmail}) &mdash;{" "}
              <span className="font-semibold capitalize">{mode === "view-only" ? "View Only" : "Full Testing Mode"}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExit}
          disabled={isPending}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border-2 border-amber-900/40 bg-amber-900 px-4 py-1.5 text-sm font-bold text-white transition-colors hover:bg-amber-800 disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" />
          {isPending ? "Exiting..." : "Exit Impersonation"}
        </button>
      </div>
    </div>
  )
}
