import { requireCoach } from "@/lib/coach-auth"
import { CoachNav } from "@/components/coach/coach-nav"

export async function CoachShell({ children }: { children: React.ReactNode }) {
  const coach = await requireCoach()
  return (
    <div className="min-h-screen bg-background">
      <CoachNav coachName={coach.name} />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}
