"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Affiliated Clubs", href: "/clubs" },
  { label: "Enrollment", href: "/enrollment" },
  { label: "Contact", href: "/contact" },
]

export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 bg-navy text-navy-foreground shadow-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-center px-4">
        <ul className="flex flex-wrap items-center justify-center gap-1 py-3 sm:gap-2">
          {NAV.map((item) => {
            const active = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors sm:text-base ${
                    active
                      ? "bg-lime text-lime-foreground"
                      : "text-navy-foreground/90 hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}
