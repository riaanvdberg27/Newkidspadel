import { CoachShell } from "@/components/coach/coach-shell"
import { requireCoach } from "@/lib/coach-auth"
import { CoachProfileForm } from "@/components/coach/coach-profile-form"

export const dynamic = "force-dynamic"

export default async function CoachProfilePage() {
  const coach = await requireCoach()

  return (
    <CoachShell>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy">My Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your contact details.</p>
      </div>

      <div className="mb-5 flex items-center gap-4 rounded-card border border-border bg-card p-5">
        {coach.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coach.imageUrl || "/placeholder.svg"} alt={coach.name} className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lime text-2xl font-extrabold text-lime-foreground">
            {coach.name.charAt(0)}
          </div>
        )}
        <div>
          <p className="text-lg font-bold text-navy">{coach.name}</p>
          <p className="text-sm text-muted-foreground">{coach.role || "Coach"}</p>
          <p className="text-xs text-muted-foreground">{coach.email}</p>
        </div>
      </div>

      <CoachProfileForm
        initial={{
          mobile: coach.mobile,
          emergencyContactName: coach.emergencyContactName,
          emergencyContactPhone: coach.emergencyContactPhone,
        }}
      />
    </CoachShell>
  )
}
