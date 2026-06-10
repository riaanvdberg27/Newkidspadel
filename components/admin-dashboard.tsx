"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { setEnrollmentStatus, resolveRequest, broadcastAnnouncement } from "@/app/actions/admin"
import { getClubById } from "@/lib/academy"
import { toast } from "sonner"
import { Users, ClipboardList, Megaphone, Activity, Loader2, CheckCircle2 } from "lucide-react"

type Enrollment = {
  id: number
  referenceNumber: string
  parentName: string
  parentEmail: string
  parentMobile: string
  childName: string
  childAge: number
  club: string
  packageName: string
  status: string
  accountStatus: string
  createdAt: Date | string
}

type RequestRow = {
  id: number
  type: string
  subject: string
  message: string
  status: string
  createdAt: Date | string
}

type ActivityRow = {
  id: number
  userId: string
  action: string
  detail: string | null
  createdAt: Date | string
}

type Announcement = { id: number; title: string; body: string; createdAt: Date | string }

const STATUSES = ["processing", "active", "paused", "cancelled"]
const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  active: "default",
  processing: "secondary",
  paused: "outline",
  cancelled: "destructive",
}

export function AdminDashboard({
  enrollments,
  requests,
  activity,
  announcements,
}: {
  enrollments: Enrollment[]
  requests: RequestRow[]
  activity: ActivityRow[]
  announcements: Announcement[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState("")

  const activeCount = enrollments.filter((e) => e.status === "active").length
  const pendingCount = enrollments.filter((e) => e.accountStatus !== "active").length
  const openRequests = requests.filter((r) => r.status !== "resolved").length

  const filtered = enrollments.filter((e) => {
    const q = query.toLowerCase()
    return (
      e.childName.toLowerCase().includes(q) ||
      e.parentName.toLowerCase().includes(q) ||
      e.parentEmail.toLowerCase().includes(q) ||
      e.referenceNumber.toLowerCase().includes(q)
    )
  })

  function changeStatus(id: number, status: string) {
    startTransition(async () => {
      await setEnrollmentStatus(id, status)
      toast.success("Enrollment status updated")
      router.refresh()
    })
  }

  function resolve(id: number) {
    startTransition(async () => {
      await resolveRequest(id)
      toast.success("Request resolved")
      router.refresh()
    })
  }

  function broadcast(formData: FormData) {
    startTransition(async () => {
      const res = await broadcastAnnouncement(formData)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(`Announcement sent to ${res.recipients} parent${res.recipients === 1 ? "" : "s"}`)
      router.refresh()
      const form = document.getElementById("broadcast-form") as HTMLFormElement | null
      form?.reset()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">Academy admin</h1>
        <p className="text-muted-foreground">Manage enrollments, requests and academy-wide communication.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total enrollments" value={enrollments.length} icon={Users} />
        <StatCard label="Active" value={activeCount} icon={CheckCircle2} />
        <StatCard label="Pending activation" value={pendingCount} icon={ClipboardList} />
        <StatCard label="Open requests" value={openRequests} icon={Activity} />
      </div>

      <Tabs defaultValue="enrollments">
        <TabsList>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="enrollments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Enrollments</CardTitle>
              <CardDescription>Search and manage every registered player.</CardDescription>
              <div className="pt-2">
                <Input
                  placeholder="Search by name, email or reference..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Club</TableHead>
                      <TableHead>Programme</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                          No enrollments found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{e.childName}</span>
                              <span className="text-xs text-muted-foreground">
                                {e.childAge}y · {e.referenceNumber}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{e.parentName}</span>
                              <span className="text-xs text-muted-foreground">{e.parentEmail}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{getClubById(e.club)?.name ?? e.club}</TableCell>
                          <TableCell className="text-sm">{e.packageName}</TableCell>
                          <TableCell>
                            <Badge variant={e.accountStatus === "active" ? "default" : "secondary"}>
                              {e.accountStatus === "active" ? "Activated" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select value={e.status} onValueChange={(v) => changeStatus(e.id, v)} disabled={isPending}>
                              <SelectTrigger className="w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {STATUSES.map((s) => (
                                    <SelectItem key={s} value={s}>
                                      {s.charAt(0).toUpperCase() + s.slice(1)}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Parent requests</CardTitle>
              <CardDescription>Pause, change and enquiry requests from parents.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {requests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No requests yet.</p>
              ) : (
                requests.map((r) => (
                  <div key={r.id} className="flex flex-col gap-2 rounded-lg border border-border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{r.subject}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={r.status === "resolved" ? "outline" : "secondary"}>
                          {r.status.replace("_", " ")}
                        </Badge>
                        {r.status !== "resolved" && (
                          <Button size="sm" variant="outline" onClick={() => resolve(r.id)} disabled={isPending}>
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.message}</p>
                    <span className="text-xs text-muted-foreground">
                      {r.type.replace("_", " ")} ·{" "}
                      {new Date(r.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="broadcast" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Send an announcement</CardTitle>
                <CardDescription>Posts to every activated parent&apos;s notification inbox.</CardDescription>
              </CardHeader>
              <CardContent>
                <form id="broadcast-form" action={broadcast}>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="title">Title</FieldLabel>
                      <Input id="title" name="title" placeholder="e.g. Holiday clinic bookings open" />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="body">Message</FieldLabel>
                      <Textarea id="body" name="body" rows={5} placeholder="Write your announcement..." />
                    </Field>
                    <Button type="submit" disabled={isPending}>
                      {isPending ? (
                        <Loader2 data-icon="inline-start" className="animate-spin" />
                      ) : (
                        <Megaphone data-icon="inline-start" />
                      )}
                      Broadcast
                    </Button>
                  </FieldGroup>
                </form>
              </CardContent>
            </Card>
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Recent announcements</CardTitle>
                <CardDescription>Latest academy-wide posts.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {announcements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No announcements yet.</p>
                ) : (
                  announcements.map((a) => (
                    <div key={a.id} className="rounded-lg border border-border p-3">
                      <p className="font-medium">{a.title}</p>
                      <p className="text-sm text-muted-foreground">{a.body}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity log</CardTitle>
              <CardDescription>Recent system and parent activity.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
              ) : (
                activity.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{a.action.replace(/_/g, " ")}</span>
                      {a.detail && <span className="text-sm text-muted-foreground">{a.detail}</span>}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleString(undefined, {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="font-heading text-2xl font-bold">{value}</span>
        </div>
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  )
}
