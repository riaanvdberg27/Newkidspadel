"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { coachLogout } from "@/app/actions/coach"

const LINKS = [
  { href: "/coach", label: "Dashboard" },
  { href: "/coach/calendar", label: "Calendar" },
  { href: "/coach/players", label: "Players" },
  { href: "/coach/profile", label: "Profile" },
]

export function CoachNav({ coachName }: { coachName: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  function isActive(href: string) {
    if (href === "/coach") return pathname === "/coach"
    return pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-navy">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lime">
            <svg className="h-4 w-4 text-lime-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            </svg>
          </div>
          <div className="leading-tight">
            <p className="text-xs font-semibold text-lime">Coach Portal</p>
            <p className="text-[10px] text-white/60">Next Gen Padel</p>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                isActive(l.href) ? "bg-lime text-lime-foreground" : "text-white/80 hover:bg-white/10"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <span className="text-sm text-white/70">{coachName}</span>
          <form action={coachLogout}>
            <button className="rounded-md border border-white/20 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-white/10">
              Log out
            </button>
          </form>
        </div>

        {/* Mobile toggle */}
        <button
          className="rounded-md p-2 text-white md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="flex flex-col gap-1 border-t border-white/10 px-4 py-3 md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                isActive(l.href) ? "bg-lime text-lime-foreground" : "text-white/80 hover:bg-white/10"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-3">
            <span className="text-sm text-white/70">{coachName}</span>
            <form action={coachLogout}>
              <button className="rounded-md border border-white/20 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/10">
                Log out
              </button>
            </form>
          </div>
        </nav>
      )}
    </header>
  )
}
