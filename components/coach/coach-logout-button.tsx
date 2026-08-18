"use client"

import { LogOut } from "lucide-react"
import { coachLogout } from "@/app/actions/coach-auth"

export function CoachLogoutButton() {
  return (
    <form action={coachLogout}>
      <button
        type="submit"
        className="flex items-center gap-1.5 rounded-md border border-white/20 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </form>
  )
}
