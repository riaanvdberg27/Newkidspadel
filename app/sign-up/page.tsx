import Link from "next/link"
import { redirect } from "next/navigation"
import { Logo } from "@/components/logo"
import { AuthForm } from "@/components/auth-form"
import { getSession, isAdminEmail } from "@/lib/session"

export default async function SignUpPage() {
  const session = await getSession()
  if (session?.user) {
    redirect(isAdminEmail(session.user.email) ? "/admin" : "/portal")
  }

  return (
    <div className="flex min-h-dvh flex-col bg-secondary/30">
      <header className="mx-auto flex h-16 w-full max-w-md items-center px-4 sm:px-6">
        <Link href="/" aria-label="Next Gen Padel Academy home">
          <Logo />
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-8 sm:px-6">
        <AuthForm mode="sign-up" />
      </main>
    </div>
  )
}
