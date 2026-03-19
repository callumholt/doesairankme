import * as cheerio from "cheerio"

export type MetaTagsResult = {
  title: { value: string | null; length: number; isOptimal: boolean }
  description: { value: string | null; length: number; isOptimal: boolean }
  hasOgTags: boolean
  hasTwitterCard: boolean
  hasCanonical: boolean
}

export function checkMetaTags(html: string): MetaTagsResult {
  const $ = cheerio.load(html)

  const titleValue = $("title").first().text().trim() || null
  const titleLength = titleValue?.length ?? 0
  const titleIsOptimal = titleLength >= 30 && titleLength <= 60

  const descriptionValue = $('meta[name="description"]').attr("content")?.trim() ?? null
  const descriptionLength = descriptionValue?.length ?? 0
  const descriptionIsOptimal = descriptionLength >= 70 && descriptionLength <= 155

  const hasOgTitle = !!$('meta[property="og:title"]').attr("content")
  const hasOgDescription = !!$('meta[property="og:description"]').attr("content")
  const hasOgImage = !!$('meta[property="og:image"]').attr("content")
  const hasOgTags = hasOgTitle || hasOgDescription || hasOgImage

  const hasTwitterCard = !!$('meta[name="twitter:card"]').attr("content")

  const canonicalHref = $('link[rel="canonical"]').attr("href")
  const hasCanonical = !!canonicalHref && canonicalHref.trim() !== ""

  return {
    title: { value: titleValue, length: titleLength, isOptimal: titleIsOptimal },
    description: {
      value: descriptionValue,
      length: descriptionLength,
      isOptimal: descriptionIsOptimal,
    },
    hasOgTags,
    hasTwitterCard,
    hasCanonical,
  }
}
