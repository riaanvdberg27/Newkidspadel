/**
 * Convert a thrown database error into a short, user-facing message.
 *
 * Next.js redacts the real error message from Server Actions in production
 * builds, so any error that escapes a mutating action as a `throw` reaches
 * the client as a generic "An error occurred in the Server Components
 * render" message with no useful detail — and often crashes the whole page.
 *
 * Every mutating admin action (create/update) should catch its own errors
 * and return `{ ok: false, error: toFriendlyDbError(error) }` instead of
 * throwing, so the UI can show a specific, actionable message inline.
 */
export function toFriendlyDbError(
  error: unknown,
  fallback = "Something went wrong while saving. Please try again.",
): string {
  const raw = error instanceof Error ? error.message : String(error)
  const code = (error as { code?: string } | null | undefined)?.code

  if (code === "23505" || /duplicate key value violates unique constraint/i.test(raw)) {
    return "This entry conflicts with an existing one (duplicate name, slug, or code). Please use a different value and try again."
  }
  if (code === "23503" || /violates foreign key constraint/i.test(raw)) {
    return "This action references a record that no longer exists. Please refresh the page and try again."
  }
  if (code === "23502" || /violates not-null constraint/i.test(raw)) {
    return "A required field is missing. Please fill in all required fields and try again."
  }

  return fallback
}
