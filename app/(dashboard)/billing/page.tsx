import type { Metadata } from "next"
import { BillingPage } from "@/components/billing-page"

export const metadata: Metadata = {
  title: "Billing",
  description: "Manage your Does AI Rank Me subscription and billing details.",
  robots: { index: false, follow: false },
}

export default function BillingRoute() {
  return <BillingPage />
}
