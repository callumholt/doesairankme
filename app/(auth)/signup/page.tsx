import type { Metadata } from "next"
import { SignupForm } from "@/components/signup-form"

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create a free Does AI Rank Me account and start testing your website's AI visibility in under 2 minutes.",
}

export default function SignupPage() {
  return <SignupForm />
}
