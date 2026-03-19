import type { Metadata } from "next"
import { DM_Sans, JetBrains_Mono } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL("https://doesairankme.com"),
  title: {
    default: "Does AI Rank Me? - AI Discoverability Testing",
    template: "%s | Does AI Rank Me?",
  },
  description:
    "Test how discoverable your website is to AI assistants like ChatGPT, Perplexity, and Gemini. Get your AI visibility score in under 2 minutes.",
  openGraph: {
    title: "Does AI Rank Me? - AI Discoverability Testing",
    description:
      "Test how discoverable your website is to AI assistants like ChatGPT, Perplexity, and Gemini. Get your AI visibility score in under 2 minutes.",
    url: "https://doesairankme.com",
    siteName: "Does AI Rank Me?",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Does AI Rank Me? - AI Discoverability Testing",
    description:
      "Test how discoverable your website is to AI assistants like ChatGPT, Perplexity, and Gemini. Get your AI visibility score in under 2 minutes.",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
