import type { Metadata } from "next"
import { GroupScanDetail } from "@/components/group-scan-detail"

export const metadata: Metadata = {
  title: "Multi-Provider Scan Results",
  description: "Compare AI visibility results across multiple providers.",
  robots: { index: false, follow: false },
}

export default function GroupScanPage() {
  return <GroupScanDetail />
}
