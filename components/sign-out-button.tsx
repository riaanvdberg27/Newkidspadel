"use client"

import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

export function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    await authClient.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-md border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-navy-foreground transition-colors hover:bg-white/20"
    >
      Sign Out
    </button>
  )
}
