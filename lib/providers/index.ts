import type { ScanProvider } from "./types"
import { createGeminiProvider } from "./gemini"

export function getProvider(name: string): ScanProvider {
  switch (name) {
    case "gemini": {
      const key = process.env.GEMINI_API_KEY
      if (!key) throw new Error("GEMINI_API_KEY environment variable is required")
      return createGeminiProvider(key)
    }
    default:
      throw new Error(`Unknown provider "${name}". Supported: gemini`)
  }
}
