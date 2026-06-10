import { getMyRequests } from "@/app/actions/portal"
import { RequestsView } from "@/components/requests-view"

export default async function RequestsPage() {
  const requests = await getMyRequests()
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">Requests &amp; enquiries</h1>
        <p className="text-muted-foreground">
          Ask to pause sessions, change your programme, or send the academy a question.
        </p>
      </div>
      <RequestsView requests={requests} />
    </div>
  )
}
