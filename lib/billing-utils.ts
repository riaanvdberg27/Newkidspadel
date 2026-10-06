/**
 * Pure billing helpers — no server-only code here so this file
 * can be imported by both "use server" action files and client components.
 */

export const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

// Billing began in August 2026 — nothing is ever generated before this.
export const BILLING_START_YEAR = 2026
export const BILLING_START_MONTH = 8  // August

const SA_OFFSET_MS = 2 * 60 * 60 * 1000 // Africa/Johannesburg (UTC+2, no DST)
const DAY_MS = 24 * 60 * 60 * 1000

/** Year and 1-based month of a moment, in South African time. */
function saYearMonth(date: Date): { year: number; month: number } {
  const d = new Date(date.getTime() + SA_OFFSET_MS)
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 }
}

/**
 * The billing year the admin sees by default. It flips to the next year on
 * the last day of December so Jan–Dec of the new year is ready on time.
 */
export function currentBillingYear(now: Date = new Date()): number {
  const { year } = saYearMonth(new Date(now.getTime() + DAY_MS))
  return Math.max(BILLING_START_YEAR, year)
}

/** First (year, month) a client can be billed: their signup month, never before Aug 2026. */
export function firstBillingMonth(signupDate?: Date | null): { year: number; month: number } {
  const floor = { year: BILLING_START_YEAR, month: BILLING_START_MONTH }
  if (!signupDate) return floor
  const s = saYearMonth(signupDate)
  return s.year * 12 + s.month > floor.year * 12 + floor.month ? s : floor
}

/**
 * Months a client is billed for: from their signup month through at least 12
 * months ahead, and always through December of the current billing year, so
 * the ledger rolls over to Jan–Dec of the new year automatically.
 */
export function getBillingWindow(
  signupDate?: Date | null,
  now: Date = new Date(),
): { year: number; month: number }[] {
  const start = firstBillingMonth(signupDate)
  const startIdx = start.year * 12 + (start.month - 1)
  const endIdx = Math.max(startIdx + 11, currentBillingYear(now) * 12 + 11)
  const months: { year: number; month: number }[] = []
  for (let i = startIdx; i <= endIdx; i++) {
    months.push({ year: Math.floor(i / 12), month: (i % 12) + 1 })
  }
  return months
}

export function formatMonth(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`
}

export function getMonthLabel(year: number, month: number): string {
  return formatMonth(year, month)
}
