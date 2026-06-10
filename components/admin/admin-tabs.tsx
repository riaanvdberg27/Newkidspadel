"use client"

import { useState } from "react"
import type { Club } from "@/lib/db/schema"
import { AdminClubManager } from "@/components/admin/admin-club-manager"
import { AdminPackageManager } from "@/components/admin/admin-package-manager"
import { AdminSignupsManager } from "@/components/admin/admin-signups-manager"
import type { PublicPackage as PackageDTO } from "@/app/actions/packages"
import type { AdminSignup } from "@/app/actions/admin-signups"

type Tab = "clubs" | "packages" | "signups"

export function AdminTabs({
  clubs,
  packages,
  signups,
}: {
  clubs: Club[]
  packages: PackageDTO[]
  signups: AdminSignup[]
}) {
  const [tab, setTab] = useState<Tab>("clubs")

  const tabs: { id: Tab; label: string }[] = [
    { id: "clubs", label: "Clubs" },
    { id: "packages", label: "Packages" },
    { id: "signups", label: "Sign-ups" },
  ]

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px rounded-t-md border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${
              tab === t.id
                ? "border-lime text-navy"
                : "border-transparent text-muted-foreground hover:text-navy"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "clubs" && <AdminClubManager initialClubs={clubs} />}
        {tab === "packages" && <AdminPackageManager initialPackages={packages} />}
        {tab === "signups" && <AdminSignupsManager initialSignups={signups} />}
      </div>
    </div>
  )
}
