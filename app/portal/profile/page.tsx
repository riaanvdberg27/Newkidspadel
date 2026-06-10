import { redirect } from "next/navigation"
import { getDashboardData } from "@/app/actions/portal"
import { ProfileView } from "@/components/profile-view"

export default async function ProfilePage() {
  const data = await getDashboardData()
  if (!data) redirect("/sign-in")
  if (!data.enrollment) {
    return <p className="text-muted-foreground">No enrollment linked to this account.</p>
  }

  const e = data.enrollment
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">Profile &amp; settings</h1>
        <p className="text-muted-foreground">Manage your contact details and communication preferences.</p>
      </div>
      <ProfileView
        email={data.user.email}
        parentName={e.parentName}
        parentMobile={e.parentMobile}
        emergencyContactName={e.emergencyContactName ?? ""}
        emergencyContactPhone={e.emergencyContactPhone ?? ""}
        prefs={{
          prefEmail: e.prefEmail,
          prefWhatsapp: e.prefWhatsapp,
          prefSessionReminders: e.prefSessionReminders,
          prefAnnouncements: e.prefAnnouncements,
          prefHolidayClinics: e.prefHolidayClinics,
          prefEvents: e.prefEvents,
        }}
      />
    </div>
  )
}
