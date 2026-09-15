import { NextRequest, NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { adminGetCampaignVouchers } from "@/app/actions/referrals"
import { db } from "@/lib/db"
import { voucherCampaigns } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { buildVoucherWorkbook, slugifyFilename } from "@/lib/voucher-export"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 })
  }

  const { id } = await params
  const campaignId = Number(id)
  if (!Number.isInteger(campaignId)) {
    return NextResponse.json({ error: "Invalid campaign id" }, { status: 400 })
  }

  const [campaign] = await db
    .select()
    .from(voucherCampaigns)
    .where(eq(voucherCampaigns.id, campaignId))
    .limit(1)

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
  }

  const rows = await adminGetCampaignVouchers(campaignId)
  const buffer = buildVoucherWorkbook(campaign.name, rows)

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${slugifyFilename(campaign.name)}-codes.xlsx"`,
    },
  })
}
