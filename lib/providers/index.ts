import type { ScanProvider } from "./types"
import { createGeminiProvider } from "./gemini"
import { createOpenRouterProvider } from "./openrouter"

export function getProvider(name: string): ScanProvider {
  switch (name) {
    case "gemini": {
      const key = process.env.GEMINI_API_KEY
      if (!key) throw new Error("GEMINI_API_KEY environment variable is required")
      return createGeminiProvider(key)
    }
    case "perplexity-sonar":
    case "perplexity-sonar-pro": {
      const key = process.env.OPENROUTER_API_KEY
      if (!key) throw new Error("OPENROUTER_API_KEY environment variable is required")
      return createOpenRouterProvider(key, name)
    }
    default:
      throw new Error(`Unknown provider "${name}". Supported: gemini, perplexity-sonar, perplexity-sonar-pro`)
  }
}
