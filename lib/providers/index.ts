import { createGeminiProvider } from "./gemini"
import { createOpenAIProvider } from "./openai"
import { createOpenRouterProvider } from "./openrouter"
import type { ScanProvider } from "./types"

export function getProvider(name: string): ScanProvider {
  switch (name) {
    case "gemini": {
      const key = process.env.GEMINI_API_KEY
      if (!key) throw new Error("GEMINI_API_KEY environment variable is required")
      return createGeminiProvider(key)
    }
    case "openai": {
      const key = process.env.OPENAI_API_KEY
      if (!key) throw new Error("OPENAI_API_KEY environment variable is required")
      return createOpenAIProvider(key)
    }
    case "perplexity-sonar":
    case "perplexity-sonar-pro": {
      const key = process.env.OPENROUTER_API_KEY
      if (!key) throw new Error("OPENROUTER_API_KEY environment variable is required")
      return createOpenRouterProvider(key, name)
    }
    default:
      throw new Error(`Unknown provider "${name}". Supported: gemini, openai, perplexity-sonar, perplexity-sonar-pro`)
  }
}
