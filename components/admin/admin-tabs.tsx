"use client"

import { useState } from "react"
import type { Club } from "@/lib/db/schema"
import { AdminClubManager } from "@/components/admin/admin-club-manager"
import { AdminPackageManager } from "@/components/admin/admin-package-manager"
import { AdminSignupsManager } from "@/components/admin/admin-signups-manager"
import { AdminContactManager } from "@/components/admin/admin-contact-manager"
import { AdminCoachesManager } from "@/components/admin/admin-coaches-manager"
import type { PublicPackage as PackageDTO } from "@/app/actions/packages"
import type { AdminSignup } from "@/app/actions/admin-signups"
import type { ContactPerson } from "@/app/actions/contact-settings"
import type { CoachRow } from "@/app/actions/coaches"

type Tab = "clubs" | "packages" | "signups" | "contact" | "coaches"

export function AdminTabs({
  clubs,
  packages,
  signups,
  contacts,
  coaches,
}: {
  clubs: Club[]
  packages: PackageDTO[]
  signups: AdminSignup[]
  contacts: ContactPerson[]
  coaches: CoachRow[]
}) {
  const [tab, setTab] = useState<Tab>("clubs")

  const tabs: { id: Tab; label: string }[] = [
    { id: "clubs", label: "Clubs" },
    { id: "packages", label: "Packages" },
    { id: "signups", label: "Sign-ups" },
    { id: "coaches", label: "Coaches" },
    { id: "contact", label: "Contact Details" },
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
        {tab === "packages" && <AdminPackageManager initialPackages={packages} allClubs={clubs} />}
        {tab === "signups" && <AdminSignupsManager initialSignups={signups} allCoaches={coaches} allPackages={packages} allClubs={clubs} />}
        {tab === "coaches" && <AdminCoachesManager initialCoaches={coaches} allClubs={clubs} />}
        {tab === "contact" && <AdminContactManager initialContacts={contacts} />}
      </div>
    </div>
  )
}
