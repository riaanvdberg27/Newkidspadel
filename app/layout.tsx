import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
})

const SITE_URL = "https://nextgenpadel.co.za"
const SITE_NAME = "NextGen Padel Academy"
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "NextGen Padel Academy | Kids Padel Coaching Pretoria & Gauteng",
    template: "%s | NextGen Padel Academy",
  },
  description:
    "NextGen Padel Academy offers expert padel coaching for kids aged 4–17 in Pretoria and Gauteng. Structured lessons, qualified coaches, and affordable programmes at clubs and schools across South Africa.",
  keywords: [
    "kids padel Pretoria",
    "padel academy Pretoria",
    "junior padel coaching",
    "padel lessons Pretoria",
    "padel classes Pretoria",
    "children padel Gauteng",
    "after school sport Pretoria",
    "padel coaching for beginners",
    "padel for kids South Africa",
    "youth padel academy",
  ],
  authors: [{ name: "NextGen Padel Academy", url: SITE_URL }],
  creator: "NextGen Padel Academy",
  publisher: "NextGen Padel Academy",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "NextGen Padel Academy | Kids Padel Coaching Pretoria & Gauteng",
    description:
      "Structured padel coaching for children aged 4–17 in Pretoria, Centurion, Midrand and across Gauteng. Enrol your child today.",
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "NextGen Padel Academy — Kids Padel Coaching" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "NextGen Padel Academy | Kids Padel Coaching Pretoria",
    description: "Expert padel coaching for kids aged 4–17 across Pretoria and Gauteng, South Africa.",
    images: [DEFAULT_OG_IMAGE],
  },
  alternates: { canonical: SITE_URL },
  category: "sports",
}

export const viewport: Viewport = {
  themeColor: "#0B1C3F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": ["Organization", "SportsOrganization"],
  name: "NextGen Padel Academy",
  url: SITE_URL,
  logo: `${SITE_URL}/images/mk-padel-logo.png`,
  description:
    "NextGen Padel Academy provides structured padel coaching for children aged 4–17 across Pretoria, Centurion, Midrand and Gauteng, South Africa.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Pretoria",
    addressRegion: "Gauteng",
    addressCountry: "ZA",
  },
  areaServed: [
    { "@type": "City", name: "Pretoria" },
    { "@type": "City", name: "Centurion" },
    { "@type": "City", name: "Midrand" },
    { "@type": "State", name: "Gauteng" },
  ],
  sameAs: [],
}

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "NextGen Padel Academy",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-background" data-scroll-behavior="smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className={`${geistSans.variable} font-sans antialiased`}>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
