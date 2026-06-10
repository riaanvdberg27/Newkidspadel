import { redirect } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { AdminLoginForm } from "@/components/admin/admin-login-form"

export const metadata = {
  title: "Admin Login | Next Gen Padel",
}

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) {
    redirect("/admin")
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm rounded-card border border-border bg-card p-8 shadow-lg">
        <h1 className="text-center text-2xl font-extrabold text-navy">Admin Login</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">Next Gen Padel Academy</p>
        <AdminLoginForm />
      </div>
    </main>
  )
}
