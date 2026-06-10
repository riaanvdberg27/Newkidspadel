import { redirect } from "next/navigation"
import { getDashboardData } from "@/app/actions/portal"
import { DashboardHome } from "@/components/dashboard-home"
import { OnboardingWizard } from "@/components/onboarding-wizard"
import { getClubById } from "@/lib/academy"

export default async function PortalPage() {
  const data = await getDashboardData()
  if (!data) redirect("/sign-in")

  const { enrollment, notifications, announcements, user } = data
  const firstName = user.name?.split(" ")[0] ?? "there"

  if (!enrollment) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <h1 className="font-heading text-xl font-bold">No enrollment linked yet</h1>
        <p className="mt-2 text-muted-foreground">
          We could not find an enrollment for this account. Please contact the academy.
        </p>
      </div>
    )
  }

  if (!enrollment.onboardingComplete) {
    return (
      <OnboardingWizard
        childName={enrollment.childName}
        packageName={enrollment.packageName}
        club={getClubById(enrollment.club)?.name ?? enrollment.club}
        reference={enrollment.referenceNumber}
        initialPrefs={{
          prefEmail: enrollment.prefEmail,
          prefWhatsapp: enrollment.prefWhatsapp,
          prefSessionReminders: enrollment.prefSessionReminders,
          prefAnnouncements: enrollment.prefAnnouncements,
          prefHolidayClinics: enrollment.prefHolidayClinics,
          prefEvents: enrollment.prefEvents,
        }}
      />
    )
  }

  return (
    <DashboardHome
      enrollment={enrollment}
      notifications={notifications}
      announcements={announcements}
      firstName={firstName}
    />
  )
}
