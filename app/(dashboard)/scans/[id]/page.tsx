import type { Metadata } from "next"
import { ScanDetail } from "@/components/scan-detail"

export const metadata: Metadata = {
  title: "Scan Results",
  description: "View AI visibility scan results for your website.",
  robots: { index: false, follow: false },
}

export default function ScanDetailPage() {
  return <ScanDetail />
}
