import { GoogleGenAI } from "@google/genai"
import type { TokenUsage } from "@/lib/providers/types"

export interface GenerateQueriesResult {
  queries: string[]
  tokenUsage: TokenUsage | null
}

/**
 * Generates realistic search queries based on scraped site content.
 * Uses Gemini Flash as a single, provider-agnostic query generator.
 * These queries are then tested against each AI provider.
 */
export async function generateQueries(content: string, count: number): Promise<GenerateQueriesResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY is required for query generation")

  const ai = new GoogleGenAI({ apiKey })

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `You are helping test AI discoverability for a business. Based on the following content, generate ${count} realistic questions that a potential customer might ask an AI assistant when looking for these kinds of services.

CRITICAL RULES:
- Do NOT mention the business name, brand name, product names, or any proprietary terms from the content
- These should be generic queries from someone who does NOT know this business exists yet
- Think about what problem the customer has, not what solution this business offers
- Mix broad category queries with specific problem-based queries
- Include location-specific queries where relevant based on the business's actual location

Return a JSON array of strings only, no other text.

Content:
${content}`,
  })

  const text = response.text?.trim() || ""
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error("Failed to parse query list from model response")

  // biome-ignore lint/suspicious/noExplicitAny: Gemini SDK types are incomplete
  const usageMetadata = (response as any).usageMetadata
  const tokenUsage = usageMetadata
    ? {
        inputTokens: usageMetadata.promptTokenCount || 0,
        outputTokens: usageMetadata.candidatesTokenCount || 0,
        totalTokens: usageMetadata.totalTokenCount || 0,
      }
    : null

  return { queries: JSON.parse(jsonMatch[0]), tokenUsage }
}
