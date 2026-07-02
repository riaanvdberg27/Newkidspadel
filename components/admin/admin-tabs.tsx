"use client"

import { useState } from "react"
import type { Club, VoucherCampaign } from "@/lib/db/schema"
import { AdminClubManager } from "@/components/admin/admin-club-manager"
import { AdminPackageManager } from "@/components/admin/admin-package-manager"
import { AdminSignupsManager } from "@/components/admin/admin-signups-manager"
import { AdminContactManager } from "@/components/admin/admin-contact-manager"
import { AdminCoachesManager } from "@/components/admin/admin-coaches-manager"
import { AdminReferralsManager } from "@/components/admin/admin-referrals-manager"
import { AdminPaymentsManager } from "@/components/admin/admin-payments-manager"
import type { PublicPackage as PackageDTO } from "@/app/actions/packages"
import type { AdminSignup } from "@/app/actions/admin-signups"
import type { ContactPerson } from "@/app/actions/contact-settings"
import type { CoachRow } from "@/app/actions/coaches"
import type { AdminReferralRow, AdminVoucherRow } from "@/app/actions/referrals"
import type { Order, Payment, Subscription, WebhookLog } from "@/lib/db/schema"

type Tab = "clubs" | "packages" | "signups" | "contact" | "coaches" | "referrals" | "payments"

export function AdminTabs({
  clubs,
  packages,
  signups,
  contacts,
  coaches,
  referrals,
  vouchers,
  campaigns,
  allPayments,
  allOrders,
  allSubscriptions,
  webhookLogs,
}: {
  clubs: Club[]
  packages: PackageDTO[]
  signups: AdminSignup[]
  contacts: ContactPerson[]
  coaches: CoachRow[]
  referrals: AdminReferralRow[]
  vouchers: AdminVoucherRow[]
  campaigns: VoucherCampaign[]
  allPayments: Payment[]
  allOrders: Order[]
  allSubscriptions: Subscription[]
  webhookLogs: WebhookLog[]
}) {
  const [tab, setTab] = useState<Tab>("clubs")

  const tabs: { id: Tab; label: string }[] = [
    { id: "clubs", label: "Clubs" },
    { id: "packages", label: "Packages" },
    { id: "signups", label: "Sign-ups" },
    { id: "coaches", label: "Coaches" },
    { id: "payments", label: "Payments" },
    { id: "referrals", label: "Referrals & Vouchers" },
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
        {tab === "payments" && (
          <AdminPaymentsManager
            initialPayments={allPayments}
            initialOrders={allOrders}
            initialSubscriptions={allSubscriptions}
            initialWebhookLogs={webhookLogs}
          />
        )}
        {tab === "referrals" && <AdminReferralsManager referrals={referrals} vouchers={vouchers} campaigns={campaigns} />}
        {tab === "contact" && <AdminContactManager initialContacts={contacts} />}
      </div>
    </div>
  )
}
