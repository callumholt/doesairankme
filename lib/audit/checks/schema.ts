import * as cheerio from "cheerio"

export type SchemaResult = {
  hasSchema: boolean
  types: string[]
  hasSameAs: boolean
}

const SCHEMA_TYPES_OF_INTEREST = [
  "Organisation",
  "Organization",
  "Article",
  "Product",
  "FAQPage",
  "HowTo",
  "Review",
  "BreadcrumbList",
  "WebSite",
  "WebPage",
]

export function checkSchema(html: string): SchemaResult {
  const $ = cheerio.load(html)
  const types: Set<string> = new Set()
  let hasSameAs = false

  $('script[type="application/ld+json"]').each((_i, el) => {
    try {
      const raw = $(el).html()
      if (!raw) return
      const data = JSON.parse(raw)

      function extract(node: unknown): void {
        if (!node || typeof node !== "object") return

        if (Array.isArray(node)) {
          for (const item of node) extract(item)
          return
        }

        const obj = node as Record<string, unknown>

        if (obj["@type"]) {
          const t = obj["@type"]
          if (typeof t === "string") {
            // Normalise: use our preferred spelling
            const normalised = t === "Organization" ? "Organisation" : t
            if (SCHEMA_TYPES_OF_INTEREST.includes(t) || SCHEMA_TYPES_OF_INTEREST.includes(normalised)) {
              types.add(normalised)
            }
          } else if (Array.isArray(t)) {
            for (const type of t) {
              if (typeof type === "string") {
                const normalised = type === "Organization" ? "Organisation" : type
                if (SCHEMA_TYPES_OF_INTEREST.includes(type) || SCHEMA_TYPES_OF_INTEREST.includes(normalised)) {
                  types.add(normalised)
                }
              }
            }
          }
        }

        if (obj.sameAs) {
          hasSameAs = true
        }

        // Recurse into nested objects
        for (const value of Object.values(obj)) {
          if (value && typeof value === "object") {
            extract(value)
          }
        }
      }

      extract(data)
    } catch {
      // Malformed JSON-LD — skip
    }
  })

  return {
    hasSchema: types.size > 0,
    types: Array.from(types),
    hasSameAs,
  }
}
