import type React from "react"
import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans, Inter } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700", "800"],
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
})

export const metadata: Metadata = {
  title: "Next Gen Padel Academy — Parent Portal",
  description:
    "Enroll your child, manage sessions, and stay connected with Next Gen Padel Academy. Play. Learn. Grow.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#0f3d2e",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-background">
      <body className={`${jakarta.variable} ${inter.variable} font-body antialiased`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
