import type { Metadata } from "next"
import { HomePage } from "@/components/home-page"

export const metadata: Metadata = {
  title: "Does AI Rank Me? - Test Your AI Visibility",
  description:
    "Test how discoverable your website is to AI assistants like ChatGPT, Perplexity, and Gemini. Get your AI visibility score in under 2 minutes.",
  openGraph: {
    title: "Does AI Rank Me? - Test Your AI Visibility",
    description:
      "Test how discoverable your website is to AI assistants like ChatGPT, Perplexity, and Gemini. Get your AI visibility score in under 2 minutes.",
    url: "https://doesairankme.com",
  },
}

const organisationSchema = {
  "@context": "https://schema.org",
  "@type": "Organisation",
  name: "Does AI Rank Me",
  url: "https://doesairankme.com",
  description:
    "Test how discoverable your website is to AI assistants like ChatGPT, Perplexity, and Gemini. Get your AI visibility score in under 2 minutes.",
}

const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Does AI Rank Me",
  url: "https://doesairankme.com",
  applicationCategory: "SEO Tool",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free plan available — no credit card required.",
  },
}

export default function MarketingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organisationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }} />
      <HomePage />
    </>
  )
}
