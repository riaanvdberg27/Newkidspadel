import { redirect } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { getAllClubsAdmin, adminLogout } from "@/app/actions/admin"
import { getAllPackagesAdmin } from "@/app/actions/packages"
import { getAllSchoolsAdmin, getSchoolCoachAssignments } from "@/app/actions/schools"
import { getAllSignups } from "@/app/actions/admin-signups"
import { getContacts } from "@/app/actions/contact-settings"
import { getCoaches } from "@/app/actions/coaches"
import { getCoachOptions, getCoachEnrollments, getCoachAttendance, getCoachAttendanceHistory } from "@/app/actions/coaching-portal"
import { adminGetAllReferrals, adminGetAllVouchers, adminGetCampaigns } from "@/app/actions/referrals"
import { getAllPayments, getAllOrders, getAllSubscriptions, getAllWebhookLogs } from "@/app/actions/payments"
import { getAllMoments } from "@/app/actions/moments"
import { getAllSiteImages } from "@/app/actions/site-images"
import { AdminTabs } from "@/components/admin/admin-tabs"
import { getBillingLedger, getOutstandingReport, getRevenueReport, backfillAllEnrollments } from "@/app/actions/subscription-months"
import { adminGetShopProducts, adminGetShopOrders, adminGetShopCategories } from "@/app/actions/shop"

export const metadata = {
  title: "Admin Dashboard | Next Gen Padel",
}

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login")
  }

  // Auto-backfill billing months for all active enrollments (idempotent)
  await backfillAllEnrollments().catch(() => {})

  const [clubs, schools, schoolCoachAssignments, packages, signups, contacts, coaches, coachOptions, referrals, vouchers, campaigns, allPayments, allOrders, allSubscriptions, webhookLogs, moments, siteImages, billingLedger, billingOutstanding, billingRevenue, shopProducts, shopOrders, shopCategories] =
    await Promise.all([
      getAllClubsAdmin(),
      getAllSchoolsAdmin(),
      getSchoolCoachAssignments().catch(() => ({})),
      getAllPackagesAdmin(),
      getAllSignups(),
      getContacts(),
      getCoaches(),
      getCoachOptions().catch(() => []),
      adminGetAllReferrals(),
      adminGetAllVouchers(),
      adminGetCampaigns(),
      getAllPayments().catch(() => []),
      getAllOrders().catch(() => []),
      getAllSubscriptions().catch(() => []),
      getAllWebhookLogs().catch(() => []),
      getAllMoments().catch(() => []),
      getAllSiteImages().catch(() => []),
      getBillingLedger().catch(() => []),
      getOutstandingReport().catch(() => []),
      getRevenueReport().catch(() => []),
      adminGetShopProducts().catch(() => []),
      adminGetShopOrders().catch(() => []),
      adminGetShopCategories().catch(() => []),
    ])

  // Load initial coaching portal data for the first coach
  const firstCoachId = coachOptions[0]?.id ?? null
  const [initialCoachEnrollments, initialCoachAttendance, initialCoachHistory] =
    firstCoachId
      ? await Promise.all([
          getCoachEnrollments(firstCoachId).catch(() => []),
          getCoachAttendance(firstCoachId, 0).catch(() => []),
          getCoachAttendanceHistory(firstCoachId).catch(() => []),
        ])
      : [[], [], []]

  return (
    <main className="min-h-screen bg-background">
      <header className="bg-navy text-navy-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6">
          <div>
            <h1 className="text-2xl font-extrabold">Admin Dashboard</h1>
            <p className="text-sm text-navy-foreground/80">Manage clubs, packages, slots and signups</p>
          </div>
          <form action={adminLogout}>
            <button
              type="submit"
              className="rounded-md border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-navy-foreground transition-colors hover:bg-white/20"
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <AdminTabs
          clubs={clubs}
          schools={schools}
          schoolCoachAssignments={schoolCoachAssignments}
          packages={packages}
          signups={signups}
          contacts={contacts}
          coaches={coaches}
          coachOptions={coachOptions}
          initialCoachEnrollments={initialCoachEnrollments}
          initialCoachAttendance={initialCoachAttendance}
          initialCoachHistory={initialCoachHistory}
          referrals={referrals}
          vouchers={vouchers}
          campaigns={campaigns}
          allPayments={allPayments}
          allOrders={allOrders}
          allSubscriptions={allSubscriptions}
          webhookLogs={webhookLogs}
          moments={moments}
          siteImages={siteImages}
          billingLedger={billingLedger}
          billingOutstanding={billingOutstanding}
          billingRevenue={billingRevenue}
          shopProducts={shopProducts}
          shopOrders={shopOrders}
          shopCategories={shopCategories}
        />
      </section>
    </main>
  )
}
