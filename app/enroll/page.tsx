import Link from "next/link"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { EnrollmentForm } from "@/components/enrollment-form"

export default async function EnrollPage({
  searchParams,
}: {
  searchParams: Promise<{ package?: string }>
}) {
  const { package: pkg } = await searchParams

  return (
    <div className="flex min-h-dvh flex-col bg-secondary/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Next Gen Padel Academy home">
            <Logo />
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-balance font-heading text-3xl font-extrabold tracking-tight">
            Enroll your child
          </h1>
          <p className="mt-2 text-pretty text-muted-foreground">
            Just a few quick steps. You&apos;ll get instant confirmation and your own parent portal.
          </p>
        </div>
        <EnrollmentForm defaultPackage={pkg} />
      </main>
    </div>
  )
}
