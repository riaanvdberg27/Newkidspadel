const sharp = require("sharp")
;(async () => {
  const BW = 1414
  const BH = 780

  // 1) Court background, cover-cropped to banner size (UNCHANGED design)
  const court = await sharp("public/images/court-bg.png")
    .resize(BW, BH, { fit: "cover", position: "left top" })
    .toBuffer()

  // 2) Navy panel on the right with a soft diagonal + feathered left edge so
  //    it blends into the court rather than looking like a pasted box.
  const PANEL_NAVY = "#0b1d3c"
  const panelStart = 760 // where solid navy begins
  const featherStart = 600 // gradient begins here
  const svgPanel = `
    <svg width="${BW}" height="${BH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fade" x1="${featherStart}" y1="0" x2="${panelStart}" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="${PANEL_NAVY}" stop-opacity="0"/>
          <stop offset="1" stop-color="${PANEL_NAVY}" stop-opacity="1"/>
        </linearGradient>
      </defs>
      <polygon points="${featherStart},0 ${BW},0 ${BW},${BH} ${panelStart - 60},${BH}" fill="url(#fade)"/>
      <rect x="${panelStart}" y="0" width="${BW - panelStart}" height="${BH}" fill="${PANEL_NAVY}"/>
    </svg>`
  const panel = Buffer.from(svgPanel)

  // 3) Logo (clean, no box/strip). Fit within the right navy area with margins
  //    and a clear gap from the mascots.
  const logoMeta = await sharp("public/images/logo-text-trim.png").metadata()
  const areaLeft = panelStart + 20 // gap from where panel solidifies
  const areaRight = BW - 70
  const maxLogoW = areaRight - areaLeft
  const maxLogoH = BH - 120
  let logoW = maxLogoW
  let logoH = Math.round((logoMeta.height / logoMeta.width) * logoW)
  if (logoH > maxLogoH) {
    logoH = maxLogoH
    logoW = Math.round((logoMeta.width / logoMeta.height) * logoH)
  }
  const logo = await sharp("public/images/logo-text-trim.png")
    .resize(logoW, logoH)
    .toBuffer()
  const logoLeft = Math.round(areaLeft + (maxLogoW - logoW) / 2)
  const logoTop = Math.round((BH - logoH) / 2)

  // 4) Mascots — trim transparent padding so the feet sit exactly at the
  //    bottom of the court, then scale to full banner height.
  const mTrimmed = await sharp("public/images/mascots.png")
    .trim({ threshold: 10 })
    .toBuffer({ resolveWithObject: true })
  const mascotH = Math.round(BH * 0.85) // smaller to prevent overlap with logo on the right
  const mascotW = Math.round((mTrimmed.info.width / mTrimmed.info.height) * mascotH)
  const mascots = await sharp(mTrimmed.data).resize(mascotW, mascotH).toBuffer()
  const mascotLeft = 10
  const mascotTop = BH - mascotH // bottom-align: feet touch the court floor

  await sharp(court)
    .composite([
      { input: panel, top: 0, left: 0 },
      { input: mascots, top: mascotTop, left: mascotLeft },
      { input: logo, top: logoTop, left: logoLeft },
    ])
    .png()
    .toFile("public/images/hero-banner-new.png")

  console.log("built", BW + "x" + BH, "| logo", logoW + "x" + logoH, "@", logoLeft + "," + logoTop, "| mascot w", mascotW)
})()
