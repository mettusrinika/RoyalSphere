import type React from "react"
import type { Metadata } from "next"
import { Playfair_Display, Poppins } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const playfairDisplay = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] })

export const metadata: Metadata = {
  title: "Royal Sphere – Trusted Lifestyle & Event Platform",
  description:
    "Royal Sphere is your trusted lifestyle and event platform for weddings, fashion, beauty, and more. Connect with verified vendors and make every moment royal.",
  keywords:
    "event planning, wedding vendors, makeup artists, fashion stylists, photographers, Royal Sphere, lifestyle platform",
  generator: "v0.app",
  metadataBase: new URL("https://royalsphere.com"),
  openGraph: {
    title: "Royal Sphere – Trusted Lifestyle & Event Platform",
    description: "One Platform, Infinite Possibilities. Find trusted vendors for every celebration.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.className} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
