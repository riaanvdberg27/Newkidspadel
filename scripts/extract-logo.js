const sharp = require("sharp")
;(async () => {
  // Remove the navy box from logo.png, keeping only bright graphics
  // (white text, lime green, tennis ball, brushstroke). This drops the
  // grunge "light strip" frame entirely since it's part of the box edge.
  const { data, info } = await sharp("public/images/logo.png")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const out = Buffer.from(data)
  for (let i = 0; i < width * height; i++) {
    const o = i * channels
    const r = data[o], g = data[o + 1], b = data[o + 2], a = data[o + 3]
    if (a < 20) { out[o + 3] = 0; continue }
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    // The grunge strips are saturated BLUE-GREY (blue is the dominant
    // channel). Reject them outright so they never reach the panel.
    const isBluish = b >= max && b - r > 6 && max - min > 8
    // White text is NEUTRAL (r≈g≈b).
    const neutral = max - min < 28
    const isWhite = lum > 150 && neutral && !isBluish
    const isLime = g > 120 && g >= r && b < 140 && r > 60 && !isBluish
    const isBallYellow = r > 150 && g > 150 && b < 150
    if (isWhite || isLime || isBallYellow) {
      out[o + 3] = a // keep
    } else if (isBluish) {
      out[o + 3] = 0 // grunge strip / brushstroke frame -> fully transparent
    } else {
      // navy box / dark areas -> transparent, with soft edge based on brightness
      if (max < 90) out[o + 3] = 0
      else {
        // transition zone: fade alpha by how dark it is
        const t = Math.min(1, Math.max(0, (max - 90) / 90))
        out[o + 3] = Math.round(a * t)
      }
    }
  }
  await sharp(out, { raw: { width, height, channels } })
    .png()
    .toFile("public/images/logo-text.png")
  // trim to content bbox
  const trimmed = await sharp("public/images/logo-text.png")
    .trim({ threshold: 1 })
    .toBuffer({ resolveWithObject: true })
  await sharp(trimmed.data).toFile("public/images/logo-text-trim.png")
  const m = await sharp("public/images/logo-text-trim.png").metadata()
  console.log("logo-text-trim", m.width + "x" + m.height, "ratio", (m.width / m.height).toFixed(3))
})()
