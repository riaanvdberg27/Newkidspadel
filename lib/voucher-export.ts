import * as XLSX from "xlsx"
import type { AdminCampaignVoucherRow } from "@/app/actions/referrals"

/**
 * Builds an .xlsx workbook of promo codes for a single campaign, ready to
 * download and distribute to a school/event/group.
 */
export function buildVoucherWorkbook(
  campaignName: string,
  rows: AdminCampaignVoucherRow[],
): Buffer {
  const sheetRows = rows.map((r) => ({
    Code: r.code,
    "Discount %": r.discountPercent,
    Status: r.status,
    "Assigned To": r.userEmail ?? "Unassigned",
    "Redeemed At": r.usedAt ? new Date(r.usedAt).toLocaleString("en-ZA") : "",
    "Expires At": r.expiresAt ? new Date(r.expiresAt).toLocaleDateString("en-ZA") : "Never",
  }))

  const worksheet = XLSX.utils.json_to_sheet(sheetRows)
  worksheet["!cols"] = [
    { wch: 18 }, // Code
    { wch: 10 }, // Discount %
    { wch: 10 }, // Status
    { wch: 28 }, // Assigned To
    { wch: 20 }, // Redeemed At
    { wch: 14 }, // Expires At
  ]

  const workbook = XLSX.utils.book_new()
  const sheetName = campaignName.slice(0, 31) || "Codes" // Excel sheet-name limit
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer
}

/** Sanitizes a campaign name into a safe filename fragment. */
export function slugifyFilename(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "campaign"
  )
}
