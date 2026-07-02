// Shared constants and types for impersonation — no "use server" directive,
// safe to import from both server actions and client components.

export const IMPERSONATION_COOKIE = "ngp_impersonate"

export type ImpersonationMode = "view-only" | "full"

export type ParentSearchResult = {
  id: string
  name: string
  email: string
  createdAt: Date
}

export type ActiveImpersonation = {
  parentId: string
  parentName: string
  parentEmail: string
  mode: ImpersonationMode
  logId: number
}
