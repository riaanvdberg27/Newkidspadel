"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const isSignUp = mode === "sign-up"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (isSignUp) {
        const { error } = await authClient.signUp.email({ email, password, name })
        if (error) throw new Error(error.message)
      } else {
        const { error } = await authClient.signIn.email({ email, password })
        if (error) throw new Error(error.message)
      }
      router.push("/portal")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.")
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-2xl">
          {isSignUp ? "Create your account" : "Welcome back"}
        </CardTitle>
        <CardDescription>
          {isSignUp
            ? "Sign up to access your parent portal."
            : "Sign in to manage your child's padel journey."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {isSignUp && (
              <Field>
                <FieldLabel htmlFor="name">Full name</FieldLabel>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </Field>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 data-icon="inline-start" className="animate-spin" />}
              {isSignUp ? "Create account" : "Sign in"}
            </Button>
          </FieldGroup>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignUp ? (
            <>
              Already have an account?{" "}
              <Link href="/sign-in" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </>
          ) : (
            <>
              New to the academy?{" "}
              <Link href="/enroll" className="font-medium text-primary hover:underline">
                Enroll your child
              </Link>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  )
}
