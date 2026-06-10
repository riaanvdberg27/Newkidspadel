"use client"

import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function SignOutButton({
  variant = "ghost",
  className,
}: {
  variant?: "ghost" | "outline"
  className?: string
}) {
  const router = useRouter()

  async function signOut() {
    await authClient.signOut()
    router.push("/sign-in")
    router.refresh()
  }

  return (
    <Button variant={variant} size="sm" onClick={signOut} className={className}>
      <LogOut data-icon="inline-start" />
      Sign out
    </Button>
  )
}
