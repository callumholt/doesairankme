import { GoogleGenAI } from "@google/genai"

export type SentimentResult = {
  sentiment: "positive" | "neutral" | "negative" | "not_mentioned"
  confidence: number // 0-1
  summary: string // Brief explanation, e.g. "AI describes the site as a reliable source for..."
  concerns: string[] // Any negative points mentioned
  totalTokens: number
}

type GeminiSentimentResponse = {
  sentiment: "positive" | "neutral" | "negative" | "not_mentioned"
  confidence: number
  summary: string
  concerns: string[]
}

/**
 * Analyses the sentiment of an AI response towards a specific domain.
 * Uses Gemini Flash to classify the sentiment as positive, neutral, negative, or not_mentioned.
 * Returns a fallback result on error so sentiment failures never block a scan.
 */
export async function analyseSentiment(responseText: string, domain: string): Promise<SentimentResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return fallbackResult("not_mentioned")
  }

  if (!responseText || !responseText.trim()) {
    return fallbackResult("not_mentioned")
  }

  try {
    const ai = new GoogleGenAI({ apiKey })

    const prompt = `You are analysing how an AI assistant response portrays a specific website domain.

Domain to analyse: ${domain}

AI response text:
"""
${responseText}
"""

Analyse the response and return a JSON object with these fields:
- "sentiment": one of "positive", "neutral", "negative", or "not_mentioned"
  - "positive": the domain is mentioned and portrayed favourably (recommended, praised, cited as authoritative, etc.)
  - "neutral": the domain is mentioned but without clear positive or negative framing
  - "negative": the domain is mentioned with concerns, criticism, or negative framing
  - "not_mentioned": the domain does not appear in the response at all
- "confidence": a number from 0 to 1 indicating your confidence in the sentiment classification
- "summary": a single sentence describing how the domain is portrayed (or "Domain not mentioned in response" if not_mentioned)
- "concerns": an array of strings listing any specific negative points, concerns, or criticisms mentioned about the domain (empty array if none)

Return ONLY the JSON object, no other text.`

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    })

    const text = response.text?.trim() || ""
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return fallbackResult("not_mentioned")
    }

    const parsed = JSON.parse(jsonMatch[0]) as GeminiSentimentResponse

    // Validate the parsed result
    const validSentiments = ["positive", "neutral", "negative", "not_mentioned"]
    if (!validSentiments.includes(parsed.sentiment)) {
      return fallbackResult("not_mentioned")
    }

    // biome-ignore lint/suspicious/noExplicitAny: Gemini SDK types are incomplete
    const usageMetadata = (response as any).usageMetadata
    const totalTokens = usageMetadata?.totalTokenCount || 0

    return {
      sentiment: parsed.sentiment,
      confidence: typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5,
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      concerns: Array.isArray(parsed.concerns) ? parsed.concerns.filter((c) => typeof c === "string") : [],
      totalTokens,
    }
  } catch {
    return fallbackResult("not_mentioned")
  }
}

function fallbackResult(sentiment: SentimentResult["sentiment"]): SentimentResult {
  return {
    sentiment,
    confidence: 0,
    summary: "",
    concerns: [],
    totalTokens: 0,
  }
}
