import { redirect } from "next/navigation"
import { getCoachId } from "@/lib/coach-auth"
import { CoachLoginForm } from "@/components/coach/coach-login-form"

export const metadata = {
  title: "Coach Login | Next Gen Padel",
}

export default async function CoachLoginPage() {
  if (await getCoachId()) {
    redirect("/coach")
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm rounded-card border border-border bg-card p-8 shadow-lg">
        <h1 className="text-center text-2xl font-extrabold text-navy">Coach Portal</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">Next Gen Padel Academy</p>
        <CoachLoginForm />
      </div>
    </main>
  )
}
