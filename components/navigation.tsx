"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/clubs", label: "Affiliated Clubs" },
  { href: "/enrollment", label: "Enrollment" },
  { href: "/contact", label: "Contact" },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="w-full bg-primary">
      <ul className="flex flex-wrap justify-center gap-0.5 md:gap-2 py-2 px-2 md:px-4">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "px-2 md:px-4 py-2 rounded-lg font-semibold text-xs md:text-base whitespace-nowrap transition-colors",
                pathname === item.href
                  ? "bg-secondary text-primary"
                  : "text-primary-foreground hover:bg-secondary hover:text-primary"
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
