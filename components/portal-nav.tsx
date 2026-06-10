"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Bell, User, MessageSquare, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const links = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/notifications", label: "Notifications", icon: Bell },
  { href: "/portal/requests", label: "Requests", icon: MessageSquare },
  { href: "/portal/documents", label: "Documents", icon: FileText },
  { href: "/portal/profile", label: "Profile & settings", icon: User },
]

export function PortalNav({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const active = pathname === link.href
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            )}
          >
            <link.icon className="size-4.5 shrink-0" />
            <span className="flex-1">{link.label}</span>
            {link.href === "/portal/notifications" && unread > 0 && (
              <Badge className="bg-accent text-accent-foreground hover:bg-accent">{unread}</Badge>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
