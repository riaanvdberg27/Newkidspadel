"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import { activateAccount } from "@/app/actions/activation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import Link from "next/link"

export function ActivationForm({
  token,
  email,
  parentName,
  childName,
  alreadyUsed,
}: {
  token: string
  email: string
  parentName: string
  childName: string
  alreadyUsed: boolean
}) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)

  if (alreadyUsed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Already activated</CardTitle>
          <CardDescription>This account has been set up. Please sign in to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/sign-in">Go to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) return toast.error("Password must be at least 8 characters.")
    if (password !== confirm) return toast.error("Passwords do not match.")

    setLoading(true)
    const result = await activateAccount(token, password)
    setLoading(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success("Account activated! Welcome to your portal.")
    router.push("/portal")
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <Badge variant="secondary" className="mb-1 w-fit">
          Activating for {childName}
        </Badge>
        <CardTitle className="font-heading text-2xl">Set your password</CardTitle>
        <CardDescription>
          Welcome {parentName.split(" ")[0]}! Create a password to unlock your parent portal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" value={email} readOnly className="bg-muted" />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoFocus
              />
              <FieldDescription>Choose a strong password you&apos;ll remember.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm">Confirm password</FieldLabel>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
              />
            </Field>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 data-icon="inline-start" className="animate-spin" />}
              {loading ? "Activating..." : "Activate & enter portal"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
