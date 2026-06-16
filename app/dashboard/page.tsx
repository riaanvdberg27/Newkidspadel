import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getMyEnrollments } from "@/app/actions/enrollment"
import { SignOutButton } from "@/components/sign-out-button"
import { ChangeSlot } from "@/components/change-slot"
import { EditProfile } from "@/components/edit-profile"
import { CalendarDays, Mail, Phone, ShieldCheck, User } from "lucide-react"

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  active: "bg-lime/20 text-navy",
  confirmed: "bg-lime/20 text-navy",
  cancelled: "bg-muted text-muted-foreground",
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const enrollments = await getMyEnrollments()
  // Use parent mobile from first enrollment as a default (may be empty for new accounts)
  const mobile = enrollments[0]?.parentMobile ?? ""

  return (
    <main className="min-h-[70vh] bg-background">
      {/* Hero */}
      <section className="bg-navy text-navy-foreground">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:py-10">
          <div>
            <h1 className="text-xl font-extrabold sm:text-3xl">
              Welcome back, {session.user.name}
            </h1>
            <p className="mt-1 text-sm text-navy-foreground/80">{session.user.email}</p>
          </div>
          <SignOutButton />
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-8 space-y-10 sm:py-10 sm:space-y-12">
        {/* Profile section */}
        <section>
          <h2 className="text-lg font-bold text-navy">My Profile</h2>
          <EditProfile name={session.user.name} mobile={mobile} />
        </section>

        {/* Enrollments section */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-navy">My Enrollments</h2>
            <a
              href="/enrollment"
              className="rounded-md bg-lime px-4 py-2 text-sm font-bold text-lime-foreground transition-colors hover:bg-lime/90"
            >
              Enroll Another Child
            </a>
          </div>

          {enrollments.length === 0 ? (
            <div className="mt-8 rounded-card border border-dashed border-border bg-card p-10 text-center">
              <p className="text-muted-foreground">You don&apos;t have any enrollments yet.</p>
              <a
                href="/enrollment"
                className="mt-4 inline-block rounded-md bg-lime px-5 py-2.5 font-bold text-lime-foreground transition-colors hover:bg-lime/90"
              >
                Start an Enrollment
              </a>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {enrollments.map((e) => (
                <article key={e.id} className="rounded-card border border-border bg-card p-4 shadow-sm sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-navy">{e.childName}</h3>
                      <p className="text-sm text-muted-foreground">{e.packageName}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                        STATUS_STYLES[e.status] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {e.status}
                    </span>
                  </div>

                  <dl className="mt-4 space-y-2 text-sm">
                    <Detail icon={ShieldCheck} label="Reference" value={e.referenceNumber} />
                    <Detail icon={CalendarDays} label="Club" value={e.club} />
                    <ChangeSlot
                      enrollmentId={e.id}
                      clubId={e.clubId}
                      weekday={e.slotWeekday}
                      hour={e.slotHour != null ? parseFloat(String(e.slotHour)) : null}
                      ageGroup={(e.slotAgeGroup as import("@/lib/db/schema").AgeGroup) ?? null}
                    />
                    <Detail icon={User} label="Age" value={`${e.childAge} years`} />
                    <Detail icon={Mail} label="Email" value={e.parentEmail} />
                    <Detail icon={Phone} label="Mobile" value={e.parentMobile} />
                    {e.emergencyContactName && (
                      <Detail
                        icon={Phone}
                        label="Emergency"
                        value={`${e.emergencyContactName} — ${e.emergencyContactPhone}`}
                      />
                    )}
                  </dl>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-2 last:border-0 last:pb-0">
      <dt className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 text-lime" />
        {label}
      </dt>
      <dd className="text-right font-semibold text-navy">{value}</dd>
    </div>
  )
}
