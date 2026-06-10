import { Resend } from "resend"

const apiKey = process.env.RESEND_API_KEY
const FROM = process.env.RESEND_FROM_EMAIL || "NextGen Padel Academy <onboarding@resend.dev>"

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
