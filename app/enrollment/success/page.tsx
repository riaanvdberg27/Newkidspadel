import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Enrolment Confirmed | NextGen Padel Academy",
  description: "Your child's padel enrolment is confirmed. Welcome to NextGen Padel Academy.",
  robots: { index: false, follow: false },
}

type Props = {
  searchParams: Promise<{ ref?: string; name?: string }>
}

export default async function EnrollmentSuccessPage({ searchParams }: Props) {
  const { ref, name } = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="rounded-card border border-lime bg-lime/10 p-8 text-center shadow-sm">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime text-lime-foreground">
            <CheckCircle className="h-8 w-8" />
          </span>

          <h1 className="mt-5 text-2xl font-extrabold text-navy">Payment Received!</h1>
          <p className="mt-2 text-muted-foreground">
            Welcome to Next Gen Padel Academy{name ? `, ${name}` : ""}. Your enrollment has been successfully
            processed and your account is ready.
          </p>

          {ref && (
            <div className="mt-5 rounded-md border border-border bg-card px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Reference Number
              </p>
              <p className="mt-1 text-lg font-extrabold tracking-wide text-navy">{ref}</p>
            </div>
          )}

          <p className="mt-4 text-sm text-muted-foreground">
            A welcome email with your contract has been sent to your inbox. Please check your spam folder
            if you don&apos;t see it within a few minutes.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-2xl bg-lime px-6 py-2.5 font-bold text-lime-foreground transition-colors hover:bg-lime/90"
            >
              Go to My Dashboard
            </Link>
            <Link
              href="/"
              className="rounded-2xl border border-border px-6 py-2.5 font-semibold text-navy transition-colors hover:bg-muted"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
