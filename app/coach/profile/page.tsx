import { CoachShell } from "@/components/coach/coach-shell"
import { requireCoach } from "@/lib/coach-auth"
import { CoachProfileForm } from "@/components/coach/coach-profile-form"
import { db } from "@/lib/db"
import { coachClubs, coachSchools, clubs, schools } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { LockIcon } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function CoachProfilePage() {
  const coach = await requireCoach()

  // Fetch assigned clubs and schools (read-only — managed by admin only)
  const [assignedClubs, assignedSchools] = await Promise.all([
    db
      .select({ id: clubs.id, name: clubs.name })
      .from(coachClubs)
      .innerJoin(clubs, eq(coachClubs.clubId, clubs.id))
      .where(eq(coachClubs.coachId, coach.id)),
    db
      .select({ id: schools.id, name: schools.name })
      .from(coachSchools)
      .innerJoin(schools, eq(coachSchools.schoolId, schools.id))
      .where(eq(coachSchools.coachId, coach.id)),
  ])

  return (
    <CoachShell>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy">My Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your contact details.</p>
      </div>

      {/* Identity card */}
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

      {/* Editable contact fields */}
      <CoachProfileForm
        initial={{
          mobile: coach.mobile,
          emergencyContactName: coach.emergencyContactName,
          emergencyContactPhone: coach.emergencyContactPhone,
        }}
      />

      {/* Read-only assignments — admin managed */}
      <div className="mt-5 rounded-card border border-border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <LockIcon className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-bold text-navy">Assigned venues</h2>
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            Managed by admin
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Clubs</p>
            {assignedClubs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No clubs assigned yet.</p>
            ) : (
              <ul className="space-y-1">
                {assignedClubs.map((c) => (
                  <li key={c.id} className="rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-navy">
                    {c.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Schools</p>
            {assignedSchools.length === 0 ? (
              <p className="text-sm text-muted-foreground">No schools assigned yet.</p>
            ) : (
              <ul className="space-y-1">
                {assignedSchools.map((s) => (
                  <li key={s.id} className="rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-navy">
                    {s.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </CoachShell>
  )
}
