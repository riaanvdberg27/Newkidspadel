import type React from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getSession, isAdminEmail } from "@/lib/session"
import { getUnreadCount } from "@/app/actions/portal"
import { Logo } from "@/components/logo"
import { PortalNav } from "@/components/portal-nav"
import { SignOutButton } from "@/components/sign-out-button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session?.user) redirect("/sign-in")
  if (isAdminEmail(session.user.email)) redirect("/admin")

  const unread = await getUnreadCount()
  const initials = session.user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="flex min-h-dvh bg-secondary/20">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar lg:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border px-5">
          <Link href="/portal" aria-label="Dashboard">
            <Logo inverted />
          </Link>
        </div>
        <div className="flex flex-1 flex-col justify-between p-4">
          <PortalNav unread={unread} />
          <div className="flex items-center justify-between gap-2 rounded-lg bg-sidebar-accent p-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-sidebar-foreground">{session.user.name}</p>
                <p className="truncate text-xs text-sidebar-foreground/60">{session.user.email}</p>
              </div>
            </div>
          </div>
          <div className="mt-2">
            <SignOutButton
              variant="outline"
              className="w-full border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-sidebar px-4 lg:hidden">
          <Link href="/portal" aria-label="Dashboard">
            <Logo inverted />
          </Link>
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <Menu />
                  <span className="sr-only">Open menu</span>
                </Button>
              }
            />
            <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex h-16 items-center border-b border-sidebar-border px-5">
                <Logo inverted />
              </div>
              <div className="flex flex-col gap-4 p-4">
                <PortalNav unread={unread} />
                <SignOutButton
                  variant="outline"
                  className="w-full border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                />
              </div>
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-4xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
