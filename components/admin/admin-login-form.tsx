"use client"

import { useActionState } from "react"
import { adminLogin } from "@/app/actions/admin"

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(adminLogin, undefined)

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <label className="block">
        <span className="block text-sm font-semibold text-navy">Username</span>
        <input
          name="username"
          type="text"
          autoComplete="username"
          required
          className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 outline-none focus:border-lime"
        />
      </label>
      <label className="block">
        <span className="block text-sm font-semibold text-navy">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 outline-none focus:border-lime"
        />
      </label>

      {state?.error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-lime px-4 py-2.5 font-bold text-lime-foreground transition-colors hover:bg-lime/90 disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign In"}
      </button>
    </form>
  )
}
