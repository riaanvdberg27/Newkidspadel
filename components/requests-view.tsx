"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { submitRequest } from "@/app/actions/portal"
import { toast } from "sonner"
import { Loader2, MessageSquarePlus } from "lucide-react"

type RequestRow = {
  id: number
  type: string
  subject: string
  message: string
  status: string
  createdAt: Date | string
}

const REQUEST_TYPES = [
  { value: "pause_sessions", label: "Pause sessions" },
  { value: "change_programme", label: "Change programme" },
  { value: "change_club", label: "Change club" },
  { value: "cancel_enrollment", label: "Cancel enrollment" },
  { value: "general_enquiry", label: "General enquiry" },
]

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  open: "secondary",
  in_progress: "default",
  resolved: "outline",
}

export function RequestsView({ requests }: { requests: RequestRow[] }) {
  const router = useRouter()
  const [type, setType] = useState("general_enquiry")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    formData.set("type", type)
    startTransition(async () => {
      const res = await submitRequest(formData)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Request submitted — we'll be in touch soon.")
      router.refresh()
      const form = document.getElementById("request-form") as HTMLFormElement | null
      form?.reset()
      setType("general_enquiry")
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-2 h-fit">
        <CardHeader>
          <CardTitle>New request</CardTitle>
          <CardDescription>Send a request to the academy team.</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="request-form" action={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="type">Request type</FieldLabel>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {REQUEST_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="subject">Subject</FieldLabel>
                <Input id="subject" name="subject" placeholder="Brief summary" />
              </Field>
              <Field>
                <FieldLabel htmlFor="message">Message</FieldLabel>
                <Textarea id="message" name="message" rows={5} placeholder="Tell us a bit more..." />
              </Field>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <MessageSquarePlus data-icon="inline-start" />
                )}
                Submit request
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 lg:col-span-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Your requests
        </h2>
        {requests.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              You have not submitted any requests yet.
            </CardContent>
          </Card>
        ) : (
          requests.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{r.subject}</span>
                  <Badge variant={STATUS_VARIANTS[r.status] ?? "secondary"}>{r.status.replace("_", " ")}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{r.message}</p>
                <span className="text-xs text-muted-foreground">
                  {REQUEST_TYPES.find((t) => t.value === r.type)?.label ?? r.type} ·{" "}
                  {new Date(r.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                </span>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
