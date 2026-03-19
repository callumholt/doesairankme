import type { Metadata } from "next"
import { LoginForm } from "@/components/login-form"

export const metadata: Metadata = {
	title: "Sign In",
	description: "Sign in to your Does AI Rank Me account to view your AI visibility scores and scan history.",
}

export default function LoginPage() {
	return <LoginForm />
}
