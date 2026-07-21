import { redirect } from "next/navigation"
import { getCurrentCoach } from "@/lib/coach-auth"
import { CoachLoginForm } from "@/components/coach/coach-login-form"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Coach Login | Next Gen Padel",
}

export default async function CoachLoginPage() {
  if (await getCurrentCoach()) {
    redirect("/coach")
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm rounded-card border border-border bg-card p-8 shadow-lg">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lime">
            <svg className="h-6 w-6 text-lime-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422A12.083 12.083 0 0112 21.5a12.083 12.083 0 01-6.16-10.922L12 14z" />
            </svg>
          </div>
          <h1 className="mt-4 text-center text-2xl font-extrabold text-navy">Coach Portal</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">Next Gen Padel Academy</p>
        </div>
        <CoachLoginForm />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Need access? Contact your academy administrator.
        </p>
      </div>
    </main>
  )
}
