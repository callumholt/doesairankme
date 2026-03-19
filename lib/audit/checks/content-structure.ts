import * as cheerio from "cheerio"

export type ContentStructureResult = {
  headings: { h1: number; h2: number; h3: number }
  hasProperHierarchy: boolean
  listCount: number
  tableCount: number
  hasFaq: boolean
  avgSectionLength: number
}

export function checkContentStructure(html: string): ContentStructureResult {
  const $ = cheerio.load(html)

  // Remove scripts and styles to avoid counting their text
  $("script, style, noscript").remove()

  const h1Count = $("h1").length
  const h2Count = $("h2").length
  const h3Count = $("h3").length
  const listCount = $("ul, ol").length
  const tableCount = $("table").length

  // Proper hierarchy: exactly one H1, and H2s exist if H3s exist
  const hasProperHierarchy = h1Count === 1 && (h3Count === 0 || h2Count > 0)

  // FAQ detection: look for FAQ-related text in headings or elements with FAQ schema
  const faqKeywords = /\bfaq\b|frequently asked|common questions/i
  let hasFaq = $('script[type="application/ld+json"]')
    .toArray()
    .some((el) => {
      try {
        const content = $(el).html() ?? ""
        return content.includes("FAQPage")
      } catch {
        return false
      }
    })

  if (!hasFaq) {
    $("h1, h2, h3, h4, section, div[class], div[id]").each((_i, el) => {
      const text = $(el).text()
      const id = $(el).attr("id") ?? ""
      const cls = $(el).attr("class") ?? ""
      if (faqKeywords.test(text) || faqKeywords.test(id) || faqKeywords.test(cls)) {
        hasFaq = true
      }
    })
  }

  // Average section length: text between headings
  const headings = $("h1, h2, h3").toArray()
  const sectionLengths: number[] = []

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i]
    // Collect text nodes between this heading and the next
    let textLength = 0
    let node = heading.next

    while (node && !["h1", "h2", "h3"].includes(node.type === "tag" ? node.name : "")) {
      if (node.type === "tag") {
        textLength += $(node).text().replace(/\s+/g, " ").trim().length
      }
      node = node.next
    }

    sectionLengths.push(textLength)
  }

  const avgSectionLength =
    sectionLengths.length > 0 ? Math.round(sectionLengths.reduce((a, b) => a + b, 0) / sectionLengths.length) : 0

  return {
    headings: { h1: h1Count, h2: h2Count, h3: h3Count },
    hasProperHierarchy,
    listCount,
    tableCount,
    hasFaq,
    avgSectionLength,
  }
}
