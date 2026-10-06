import * as XLSX from "xlsx"
import type { AdminCampaignVoucherRow } from "@/app/actions/referrals"

export interface VoucherExportCampaign {
  name: string
  sharedCode: string | null
  sharedCodeMaxUses: number | null
}

function formatDiscount(type: string, percent: number, randCents: number): string {
  return type === "rand" ? `R${(randCents / 100).toLocaleString("en-ZA")}` : `${percent}%`
}

/**
 * Builds an .xlsx workbook of promo codes for a single campaign, ready to
 * download and distribute to a school/event/group.
 *
 * Campaigns with a shared code get a "Shared code" sheet (the one printable
 * code plus who has redeemed it); individual codes stay on the codes sheet.
 */
export function buildVoucherWorkbook(
  campaign: VoucherExportCampaign,
  rows: AdminCampaignVoucherRow[],
): Buffer {
  const workbook = XLSX.utils.book_new()

  const sharedRows = rows.filter((r) => r.viaSharedCode)
  const individualRows = rows.filter((r) => !r.viaSharedCode)

  if (campaign.sharedCode) {
    const sample = sharedRows[0] ?? individualRows[0]
    const redeemed = sharedRows.filter((r) => r.status === "used")
    const summary = [
      {
        "Shared Code": campaign.sharedCode,
        Discount: sample
          ? formatDiscount(sample.discountType, sample.discountPercent, sample.discountRandCents)
          : "",
        "Max Redemptions": campaign.sharedCodeMaxUses ?? "Unlimited",
        Redeemed: redeemed.length,
        Remaining:
          campaign.sharedCodeMaxUses != null
            ? Math.max(0, campaign.sharedCodeMaxUses - redeemed.length)
            : "Unlimited",
      },
    ]
    const summarySheet = XLSX.utils.json_to_sheet(summary)
    summarySheet["!cols"] = [{ wch: 16 }, { wch: 10 }, { wch: 16 }, { wch: 10 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Shared code")

    const redemptions = sharedRows.map((r) => ({
      Email: r.userEmail ?? "",
      Status: r.status === "used" ? "Redeemed" : "Applied, not yet paid",
      "Redeemed At": r.usedAt ? new Date(r.usedAt).toLocaleString("en-ZA") : "",
    }))
    const redemptionSheet = XLSX.utils.json_to_sheet(redemptions)
    redemptionSheet["!cols"] = [{ wch: 32 }, { wch: 22 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(workbook, redemptionSheet, "Redemptions")
  }

  if (!campaign.sharedCode || individualRows.length > 0) {
    const sheetRows = individualRows.map((r) => ({
      Code: r.code,
      Discount: formatDiscount(r.discountType, r.discountPercent, r.discountRandCents),
      Status: r.status,
      "Assigned To": r.userEmail ?? "Unassigned",
      "Redeemed At": r.usedAt ? new Date(r.usedAt).toLocaleString("en-ZA") : "",
      "Expires At": r.expiresAt ? new Date(r.expiresAt).toLocaleDateString("en-ZA") : "Never",
    }))

    const worksheet = XLSX.utils.json_to_sheet(sheetRows)
    worksheet["!cols"] = [
      { wch: 18 }, // Code
      { wch: 10 }, // Discount
      { wch: 10 }, // Status
      { wch: 28 }, // Assigned To
      { wch: 20 }, // Redeemed At
      { wch: 14 }, // Expires At
    ]
    const sheetName = campaign.sharedCode ? "Individual codes" : campaign.name.slice(0, 31) || "Codes" // Excel sheet-name limit
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  }

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
