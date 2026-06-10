import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession, isAdminEmail } from "@/lib/session"
import { Logo } from "@/components/logo"
import { SignOutButton } from "@/components/sign-out-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session?.user) redirect("/sign-in")
  if (!isAdminEmail(session.user.email)) redirect("/portal")

  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <header className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo />
            <Badge variant="secondary">Admin</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button render={<Link href="/portal">Parent view</Link>} variant="ghost" size="sm" />
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  )
}
