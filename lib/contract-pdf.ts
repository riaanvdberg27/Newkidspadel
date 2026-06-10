import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib"
import {
  TERMS_TITLE,
  TERMS_SECTIONS,
  CONSENT_TERMS_LABEL,
  CONSENT_MEDIA_LABEL,
  TERMS_VERSION,
} from "@/lib/terms"

export type ContractData = {
  referenceNumber: string
  packageName: string
  packagePrice: number
  clubName: string
  slotLabel: string
  childName: string
  childAge: number | string
  parentName: string
  parentEmail: string
  parentMobile: string
  emergencyName?: string | null
  emergencyPhone?: string | null
  agreedTerms: boolean
  consentMedia: boolean
  signedName?: string | null
  signedAt?: Date | null
  signatureDataUrl?: string | null // data:image/png;base64,...
}

const MARGIN = 50
const PAGE_W = 595.28 // A4
const PAGE_H = 841.89
const NAVY = rgb(0.05, 0.11, 0.24)
const GRAY = rgb(0.35, 0.38, 0.45)
const LIME = rgb(0.42, 0.78, 0.18)

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(trial, size) > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = trial
    }
  }
  if (current) lines.push(current)
  return lines
}

export async function generateContractPdf(data: ContractData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  let page = doc.addPage([PAGE_W, PAGE_H])
  let y = PAGE_H - MARGIN

  const contentWidth = PAGE_W - MARGIN * 2

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN) {
      page = doc.addPage([PAGE_W, PAGE_H])
      y = PAGE_H - MARGIN
    }
  }

  const drawText = (text: string, size: number, f: PDFFont, color = NAVY, gap = 4) => {
    const lines = wrapText(text, f, size, contentWidth)
    for (const line of lines) {
      ensureSpace(size + gap)
      page.drawText(line, { x: MARGIN, y, size, font: f, color })
      y -= size + gap
    }
  }

  // Header
  page.drawText("NEXTGEN PADEL ACADEMY", { x: MARGIN, y, size: 20, font: bold, color: NAVY })
  y -= 26
  page.drawText("Enrollment Contract & Indemnity Agreement", { x: MARGIN, y, size: 12, font, color: GRAY })
  y -= 16
  page.drawRectangle({ x: MARGIN, y: y - 2, width: contentWidth, height: 2, color: LIME })
  y -= 22

  // Enrollment summary box
  const rows: [string, string][] = [
    ["Reference", data.referenceNumber],
    ["Package", `${data.packageName} (R${data.packagePrice}/month)`],
    ["Club", data.clubName],
    ["Time Slot", data.slotLabel],
    ["Child", `${data.childName} (age ${data.childAge})`],
    ["Parent / Guardian", data.parentName],
    ["Email", data.parentEmail],
    ["Mobile", data.parentMobile],
    ["Emergency Contact", `${data.emergencyName ?? "—"}${data.emergencyPhone ? ` (${data.emergencyPhone})` : ""}`],
  ]
  drawText("Enrollment Details", 13, bold, NAVY, 8)
  for (const [label, value] of rows) {
    ensureSpace(16)
    page.drawText(`${label}:`, { x: MARGIN, y, size: 10, font: bold, color: GRAY })
    const valueLines = wrapText(value, font, 10, contentWidth - 150)
    valueLines.forEach((line, i) => {
      if (i > 0) {
        ensureSpace(14)
        y -= 14
      }
      page.drawText(line, { x: MARGIN + 150, y, size: 10, font, color: NAVY })
    })
    y -= 16
  }
  y -= 8

  // Terms
  drawText(TERMS_TITLE, 13, bold, NAVY, 8)
  for (const section of TERMS_SECTIONS) {
    ensureSpace(18)
    drawText(section.heading, 10.5, bold, NAVY, 3)
    drawText(section.body, 9.5, font, GRAY, 4)
    y -= 4
  }
  y -= 8

  // Consents
  ensureSpace(24)
  drawText("Consents", 13, bold, NAVY, 8)
  drawText(`[${data.agreedTerms ? "X" : " "}] ${CONSENT_TERMS_LABEL}`, 9.5, font, NAVY, 4)
  drawText(`[${data.consentMedia ? "X" : " "}] ${CONSENT_MEDIA_LABEL}`, 9.5, font, NAVY, 4)
  y -= 12

  // Signature
  ensureSpace(140)
  drawText("Signature", 13, bold, NAVY, 8)
  y -= 6

  if (data.signatureDataUrl && data.signatureDataUrl.startsWith("data:image/png")) {
    try {
      const base64 = data.signatureDataUrl.split(",")[1] ?? ""
      const bytes = Uint8Array.from(Buffer.from(base64, "base64"))
      const png = await doc.embedPng(bytes)
      const sigW = 200
      const sigH = (png.height / png.width) * sigW
      ensureSpace(sigH + 10)
      page.drawImage(png, { x: MARGIN, y: y - sigH, width: sigW, height: sigH })
      y -= sigH + 6
    } catch {
      // ignore malformed signature image
    }
  }

  page.drawRectangle({ x: MARGIN, y: y - 2, width: 240, height: 1, color: GRAY })
  y -= 16
  page.drawText(`Signed by: ${data.signedName ?? data.parentName}`, { x: MARGIN, y, size: 10, font, color: NAVY })
  y -= 14
  const signedAt = data.signedAt ? new Date(data.signedAt) : new Date()
  page.drawText(`Date: ${signedAt.toLocaleString("en-ZA", { dateStyle: "long", timeStyle: "short" })}`, {
    x: MARGIN,
    y,
    size: 10,
    font,
    color: NAVY,
  })
  y -= 14
  page.drawText(`Terms version: ${TERMS_VERSION}`, { x: MARGIN, y, size: 8, font, color: GRAY })

  return doc.save()
}
