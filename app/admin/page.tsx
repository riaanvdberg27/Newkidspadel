import { redirect } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { getAllClubsAdmin, adminLogout } from "@/app/actions/admin"
import { getAllPackagesAdmin } from "@/app/actions/packages"
import { getAllSignups } from "@/app/actions/admin-signups"
import { getContacts } from "@/app/actions/contact-settings"
import { getCoaches } from "@/app/actions/coaches"
import { adminGetAllReferrals, adminGetAllVouchers, adminGetCampaigns } from "@/app/actions/referrals"
import { AdminTabs } from "@/components/admin/admin-tabs"

export const metadata = {
  title: "Admin Dashboard | Next Gen Padel",
}

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login")
  }

  const [clubs, packages, signups, contacts, coaches, referrals, vouchers, campaigns] =
    await Promise.all([
      getAllClubsAdmin(),
      getAllPackagesAdmin(),
      getAllSignups(),
      getContacts(),
      getCoaches(),
      adminGetAllReferrals(),
      adminGetAllVouchers(),
      adminGetCampaigns(),
    ])

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
          packages={packages}
          signups={signups}
          contacts={contacts}
          coaches={coaches}
          referrals={referrals}
          vouchers={vouchers}
          campaigns={campaigns}
        />
      </section>
    </main>
  )
}
