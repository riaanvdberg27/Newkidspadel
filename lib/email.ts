import { Resend } from "resend"

const apiKey = process.env.RESEND_API_KEY
const FROM = process.env.RESEND_FROM_EMAIL || "NextGen Padel Academy <onboarding@resend.dev>"
// Where admin notifications are sent — defaults to the FROM address if not set separately
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.RESEND_FROM_EMAIL || ""

const resend = apiKey ? new Resend(apiKey) : null

export type WelcomeEmailData = {
  to: string
  parentName: string
  childName: string
  packageName: string
  packagePrice: number
  clubName: string
  slotLabel: string
  referenceNumber: string
  contractPdf?: Uint8Array | null
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.log("[v0] RESEND_API_KEY not set — skipping welcome email")
    return { ok: false, error: "RESEND_API_KEY not configured" }
  }

  const name = escapeHtml(data.parentName)
  const child = escapeHtml(data.childName)
  const pkg = escapeHtml(data.packageName)
  const club = escapeHtml(data.clubName)
  const slot = escapeHtml(data.slotLabel)
  const ref = escapeHtml(data.referenceNumber)

  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #0d1c3d;">
    <div style="background:#0d1c3d; padding: 24px; border-radius: 12px 12px 0 0;">
      <h1 style="color:#ffffff; margin:0; font-size: 22px;">Welcome to NextGen Padel Academy!</h1>
    </div>
    <div style="border:1px solid #e5e7eb; border-top:none; padding: 24px; border-radius: 0 0 12px 12px;">
      <p>Hi ${name},</p>
      <p>Thank you for enrolling <strong>${child}</strong> with NextGen Padel Academy. We're thrilled to have you join us! Here are your enrollment details:</p>
      <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding:6px 0; color:#6b7280;">Reference</td><td style="padding:6px 0; text-align:right; font-weight:bold;">${ref}</td></tr>
        <tr><td style="padding:6px 0; color:#6b7280;">Package</td><td style="padding:6px 0; text-align:right;">${pkg} (R${data.packagePrice}/month)</td></tr>
        <tr><td style="padding:6px 0; color:#6b7280;">Club</td><td style="padding:6px 0; text-align:right;">${club}</td></tr>
        <tr><td style="padding:6px 0; color:#6b7280;">Time slot</td><td style="padding:6px 0; text-align:right;">${slot}</td></tr>
      </table>
      <p>A copy of your signed enrollment contract is attached to this email for your records.</p>
      <p>You can view and manage your enrollment any time by signing in to your account.</p>
      <p style="margin-top: 24px;">See you on the court!<br/><strong>The NextGen Padel Academy Team</strong></p>
    </div>
  </div>`

  try {
    const attachments = data.contractPdf
      ? [
          {
            filename: `NextGenPadel-Contract-${data.referenceNumber}.pdf`,
            content: Buffer.from(data.contractPdf).toString("base64"),
          },
        ]
      : undefined

    const { error } = await resend.emails.send({
      from: FROM,
      to: data.to,
      subject: `Welcome to NextGen Padel Academy — ${data.referenceNumber}`,
      html,
      attachments,
    })

    if (error) {
      console.log("[v0] Resend error:", error)
      return { ok: false, error: String(error) }
    }
    return { ok: true }
  } catch (err) {
    console.log("[v0] sendWelcomeEmail threw:", err)
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

// ---------------------------------------------------------------------------
// Admin notification — sent to the academy inbox on every new signup
// ---------------------------------------------------------------------------

export type AdminNotificationEmailData = {
  parentName: string
  parentEmail: string
  parentMobile: string
  childName: string
  childAge: number
  packageName: string
  packagePrice: number
  clubName: string
  slotLabel: string
  referenceNumber: string
}

export async function sendAdminNotificationEmail(
  data: AdminNotificationEmailData,
): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.log("[v0] RESEND_API_KEY not set — skipping admin notification email")
    return { ok: false, error: "RESEND_API_KEY not configured" }
  }
  if (!ADMIN_EMAIL) {
    console.log("[v0] ADMIN_NOTIFICATION_EMAIL not set — skipping admin notification email")
    return { ok: false, error: "ADMIN_NOTIFICATION_EMAIL not configured" }
  }

  const e = escapeHtml
  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #0d1c3d;">
    <div style="background:#c8e600; padding: 20px 24px; border-radius: 12px 12px 0 0;">
      <h1 style="color:#0d1c3d; margin:0; font-size: 20px;">New Sign-up Received</h1>
      <p style="color:#0d1c3d; margin:4px 0 0; font-size:13px;">Reference: <strong>${e(data.referenceNumber)}</strong></p>
    </div>
    <div style="border:1px solid #e5e7eb; border-top:none; padding: 24px; border-radius: 0 0 12px 12px;">
      <h3 style="margin:0 0 12px; font-size:15px; color:#0d1c3d;">Child</h3>
      <table style="width:100%; border-collapse:collapse; font-size:14px;">
        <tr><td style="padding:5px 0; color:#6b7280; width:140px;">Name</td><td style="padding:5px 0; font-weight:600;">${e(data.childName)}</td></tr>
        <tr><td style="padding:5px 0; color:#6b7280;">Age</td><td style="padding:5px 0;">${data.childAge}</td></tr>
      </table>

      <h3 style="margin:20px 0 12px; font-size:15px; color:#0d1c3d;">Parent / Guardian</h3>
      <table style="width:100%; border-collapse:collapse; font-size:14px;">
        <tr><td style="padding:5px 0; color:#6b7280; width:140px;">Name</td><td style="padding:5px 0; font-weight:600;">${e(data.parentName)}</td></tr>
        <tr><td style="padding:5px 0; color:#6b7280;">Email</td><td style="padding:5px 0;"><a href="mailto:${e(data.parentEmail)}" style="color:#0d1c3d;">${e(data.parentEmail)}</a></td></tr>
        <tr><td style="padding:5px 0; color:#6b7280;">Mobile</td><td style="padding:5px 0;">${e(data.parentMobile)}</td></tr>
      </table>

      <h3 style="margin:20px 0 12px; font-size:15px; color:#0d1c3d;">Programme</h3>
      <table style="width:100%; border-collapse:collapse; font-size:14px;">
        <tr><td style="padding:5px 0; color:#6b7280; width:140px;">Package</td><td style="padding:5px 0;">${e(data.packageName)} — R${data.packagePrice}</td></tr>
        <tr><td style="padding:5px 0; color:#6b7280;">Club</td><td style="padding:5px 0;">${e(data.clubName)}</td></tr>
        <tr><td style="padding:5px 0; color:#6b7280;">Time slot</td><td style="padding:5px 0;">${e(data.slotLabel)}</td></tr>
      </table>

      <div style="margin-top:24px; padding:12px 16px; background:#f9fafb; border-radius:8px; font-size:13px; color:#6b7280;">
        Log in to the admin panel to view the full enrollment, download the contract, or update details.
      </div>
    </div>
  </div>`

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `New sign-up: ${data.childName} (${data.referenceNumber})`,
      html,
    })
    if (error) {
      console.log("[v0] Admin notification Resend error:", error)
      return { ok: false, error: String(error) }
    }
    return { ok: true }
  } catch (err) {
    console.log("[v0] sendAdminNotificationEmail threw:", err)
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}
