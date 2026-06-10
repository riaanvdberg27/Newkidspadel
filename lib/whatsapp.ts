import { ACADEMY } from "./academy"

// WhatsApp confirmation — simulated for now. Swap this for Twilio later.
export async function sendWhatsAppConfirmation(opts: {
  to: string
  parentName: string
  childName: string
  reference: string
}) {
  const message =
    `Hi ${opts.parentName.split(" ")[0]}! 🎾 ${ACADEMY.name} here. ` +
    `We've received ${opts.childName}'s enrollment (ref ${opts.reference}). ` +
    `Check your email to activate your Parent Portal. Reply here anytime — ${ACADEMY.whatsapp}.`
  console.log(`[v0] WhatsApp simulated -> ${opts.to}: ${message}`)
  return { ok: true, simulated: true, message }
}
