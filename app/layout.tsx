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
  title: "Does AI Rank Me? - AI Discoverability Testing",
  description:
    "Test how discoverable your website is to AI assistants like ChatGPT, Gemini, and Perplexity. Get your AI discoverability score in minutes.",
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
