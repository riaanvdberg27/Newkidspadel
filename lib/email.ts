import { Resend } from "resend"
import { ACADEMY } from "./academy"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Resend's shared sandbox sender works without domain verification.
const FROM = "Next Gen Padel Academy <onboarding@resend.dev>"

function shell(content: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f4f6f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c2620;">
    <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
      <div style="background:#0f3d2e;border-radius:16px 16px 0 0;padding:28px 32px;">
        <div style="color:#d9f24a;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Next Gen Padel Academy</div>
        <div style="color:#ffffff;font-size:14px;margin-top:2px;opacity:.8;">Play. Learn. Grow.</div>
      </div>
      <div style="background:#ffffff;border-radius:0 0 16px 16px;padding:32px;">
        ${content}
        <hr style="border:none;border-top:1px solid #e7ebe6;margin:28px 0;" />
        <p style="font-size:12px;color:#7a857d;line-height:1.6;margin:0;">
          Next Gen Padel Academy &middot; ${ACADEMY.supportEmail} &middot; ${ACADEMY.supportPhone}<br/>
          You are receiving this email because an enrollment was submitted with this address.
        </p>
      </div>
    </div>
  </body>
</html>`
}

function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:#0f3d2e;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:10px;">${label}</a>`
}

type SendResult = { ok: boolean; simulated?: boolean; error?: string }

async function send(to: string, subject: string, html: string): Promise<SendResult> {
  if (!resend) {
    console.log(`[v0] Email simulated (no RESEND_API_KEY) -> ${to}: ${subject}`)
    return { ok: true, simulated: true }
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html })
    if (error) {
      console.log("[v0] Resend error:", error)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (e) {
    console.log("[v0] Resend exception:", e)
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

export async function sendWelcomeEmail(opts: {
  to: string
  parentName: string
  childName: string
  packageName: string
  club: string
  reference: string
  activationUrl: string
}): Promise<SendResult> {
  const content = `
    <h1 style="font-size:22px;margin:0 0 8px;color:#0f3d2e;">Welcome to the Academy, ${opts.parentName.split(" ")[0]}!</h1>
    <p style="font-size:15px;line-height:1.6;color:#3a463e;margin:0 0 20px;">
      We're thrilled to have <strong>${opts.childName}</strong> join Next Gen Padel Academy.
      Your enrollment has been received and is being processed by our team.
    </p>
    <div style="background:#f4f6f3;border-radius:12px;padding:18px 20px;margin:0 0 22px;">
      <table style="width:100%;font-size:14px;color:#3a463e;border-collapse:collapse;">
        <tr><td style="padding:4px 0;color:#7a857d;">Reference</td><td style="padding:4px 0;text-align:right;font-weight:600;">${opts.reference}</td></tr>
        <tr><td style="padding:4px 0;color:#7a857d;">Player</td><td style="padding:4px 0;text-align:right;font-weight:600;">${opts.childName}</td></tr>
        <tr><td style="padding:4px 0;color:#7a857d;">Programme</td><td style="padding:4px 0;text-align:right;font-weight:600;">${opts.packageName}</td></tr>
        <tr><td style="padding:4px 0;color:#7a857d;">Club</td><td style="padding:4px 0;text-align:right;font-weight:600;">${opts.club}</td></tr>
      </table>
    </div>
    <p style="font-size:15px;line-height:1.6;color:#3a463e;margin:0 0 22px;">
      Activate your Parent Portal to manage sessions, update details, and stay in the loop.
    </p>
    <p style="margin:0 0 8px;">${button(opts.activationUrl, "Activate Your Parent Portal")}</p>
    <p style="font-size:12px;color:#7a857d;margin:14px 0 0;">This activation link expires in 7 days.</p>
  `
  return send(opts.to, `Welcome to Next Gen Padel Academy, ${opts.childName}!`, shell(content))
}

export async function sendActivationEmail(opts: {
  to: string
  parentName: string
  activationUrl: string
}): Promise<SendResult> {
  const content = `
    <h1 style="font-size:22px;margin:0 0 8px;color:#0f3d2e;">Activate your Parent Portal</h1>
    <p style="font-size:15px;line-height:1.6;color:#3a463e;margin:0 0 22px;">
      Hi ${opts.parentName.split(" ")[0]}, click below to set your password and access your Parent Portal.
    </p>
    <p style="margin:0 0 8px;">${button(opts.activationUrl, "Activate Account")}</p>
    <p style="font-size:12px;color:#7a857d;margin:14px 0 0;">This link expires in 7 days.</p>
  `
  return send(opts.to, "Activate your Next Gen Padel Parent Portal", shell(content))
}
