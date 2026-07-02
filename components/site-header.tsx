"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { useState } from "react"
import { Menu, X } from "lucide-react"

const NAV = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Enroll", href: "/enrollment" },
  { label: "Clubs", href: "/clubs" },
  { label: "Schools", href: "/schools" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const accountLink = session?.user
    ? { label: "My Dashboard", href: "/dashboard" }
    : { label: "Parent Login", href: "/sign-in" }

  return (
    <header className="sticky top-0 z-50 bg-navy text-navy-foreground shadow-lg">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0" onClick={() => setOpen(false)}>
          <Image
            src="/images/tennis-ball.png"
            alt="Next Gen Padel"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="hidden font-extrabold text-lime lg:inline text-sm leading-tight">
            Next Gen<br />
            <span className="text-white">Padel Academy</span>
          </span>
        </Link>

        {/* Desktop nav — visible only on large screens */}
        <ul className="hidden lg:flex items-center gap-0.5 xl:gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`rounded-full px-3 py-2 text-xs font-bold transition-all xl:px-4 xl:text-sm ${
                    active
                      ? "bg-lime text-lime-foreground shadow-sm"
                      : "text-navy-foreground/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
          <li className="ml-1.5">
            <Link
              href={accountLink.href}
              className="rounded-full bg-lime px-3 py-2 text-xs font-bold text-lime-foreground transition-all hover:bg-lime/80 btn-wiggle xl:px-4 xl:text-sm"
            >
              {accountLink.label}
            </Link>
          </li>
        </ul>

        {/* Mobile / tablet right side — hamburger shown below lg */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href={accountLink.href}
            className="rounded-full bg-lime px-3 py-1.5 text-xs font-bold text-lime-foreground"
            onClick={() => setOpen(false)}
          >
            {session?.user ? "Dashboard" : "Login"}
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile / tablet dropdown — shown below lg */}
      {open && (
        <div className="border-t border-white/10 bg-navy pb-4 lg:hidden">
          <ul className="flex flex-col gap-1 px-4 pt-2">
            {NAV.map((item) => {
              const active = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                      active
                        ? "bg-lime text-lime-foreground"
                        : "text-navy-foreground/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </header>
  )
}
