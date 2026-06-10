import { getAllEnrollments, getAllRequests, getRecentActivity } from "@/app/actions/admin"
import { getAnnouncements } from "@/app/actions/portal"
import { AdminDashboard } from "@/components/admin-dashboard"

export default async function AdminPage() {
  const [enrollments, requests, activity, announcements] = await Promise.all([
    getAllEnrollments(),
    getAllRequests(),
    getRecentActivity(),
    getAnnouncements(),
  ])

  return (
    <AdminDashboard
      enrollments={enrollments}
      requests={requests}
      activity={activity}
      announcements={announcements}
    />
  )
}
