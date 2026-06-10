"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

export function SignInForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await authClient.signIn.email({ email, password })
    setLoading(false)

    if (error) {
      setError(error.message ?? "Invalid email or password.")
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-sm rounded-card border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-navy">Parent Sign In</h1>
        <p className="mt-1 text-sm text-muted-foreground">Access your enrollment dashboard</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="block">
            <span className="block text-sm font-semibold text-navy">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 outline-none focus:border-lime"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-semibold text-navy">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 outline-none focus:border-lime"
            />
          </label>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-lime px-6 py-2.5 font-bold text-lime-foreground transition-colors hover:bg-lime/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/enrollment" className="font-semibold text-navy underline-offset-4 hover:underline">
            Enroll your child
          </Link>
        </p>
      </div>
    </main>
  )
}
