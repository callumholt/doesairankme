import type { AuditResults } from "./index"

export type Recommendation = {
  id: string
  category: "technical" | "content" | "off-site"
  severity: "critical" | "important" | "suggestion"
  title: string
  description: string
  impact: string
  howToFix: string
  completed: boolean
}

const AI_BOTS = ["GPTBot", "ClaudeBot", "PerplexityBot"]

export function generateRecommendations(auditResults: AuditResults): Recommendation[] {
  const recs: Recommendation[] = []

  // ─── Critical ──────────────────────────────────────────────────────────────

  // Blocked AI crawlers
  const blockedAiBots = auditResults.robots.bots.filter((b) => AI_BOTS.includes(b.name) && !b.allowed)
  if (blockedAiBots.length > 0) {
    const botNames = blockedAiBots.map((b) => b.name).join(", ")
    recs.push({
      id: "unblock-ai-crawlers",
      category: "technical",
      severity: "critical",
      title: "Unblock AI crawlers in robots.txt",
      description: `Your robots.txt is blocking ${botNames}. These are the crawlers used by ChatGPT, Claude, and Perplexity to index content for citations. Blocking them prevents your site from appearing in AI-generated answers entirely.`,
      impact: "Blocking GPTBot reduces ChatGPT citations by 73%",
      howToFix: `Open your robots.txt file (at yourdomain.com/robots.txt) and remove or update any Disallow: / rules that apply to ${botNames}. To explicitly allow these crawlers, add the following to your robots.txt:\n\nUser-agent: GPTBot\nAllow: /\n\nUser-agent: ClaudeBot\nAllow: /\n\nUser-agent: PerplexityBot\nAllow: /\n\nIf you have a wildcard rule (User-agent: *) that blocks all bots, add these agent-specific Allow blocks above it so they take precedence.`,
      completed: false,
    })
  }

  // Not HTTPS
  if (!auditResults.https.isHttps) {
    recs.push({
      id: "enable-https",
      category: "technical",
      severity: "critical",
      title: "Switch to HTTPS",
      description:
        "Your site is served over HTTP, not HTTPS. AI assistants treat HTTPS as a strong trust signal, and search engine guidelines require secure connections for content to be cited confidently.",
      impact: "AI assistants strongly prefer secure sites. 96.45% of AI citations come from HTTPS pages",
      howToFix:
        "1. Obtain a free TLS certificate via Let's Encrypt (https://letsencrypt.org) or through your hosting provider (Vercel, Netlify, Cloudflare, and most managed hosts provide this automatically).\n2. Configure your server to serve all traffic over HTTPS.\n3. Add a 301 redirect from http:// to https:// so existing links and crawlers are redirected.\n4. Update any internal links and canonical URLs to use https://.",
      completed: false,
    })
  }

  // HTTP error status
  if (auditResults.performance.statusCode !== 0 && auditResults.performance.statusCode >= 400) {
    const code = auditResults.performance.statusCode
    recs.push({
      id: "fix-server-errors",
      category: "technical",
      severity: "critical",
      title: "Fix server errors",
      description: `Your site returned an HTTP ${code} error. AI crawlers will not index pages that return error responses, which means your site cannot be cited in AI-generated answers.`,
      impact: "Pages returning 4xx or 5xx errors are not indexed by AI crawlers and cannot appear in citations",
      howToFix:
        code >= 500
          ? "1. Check your server logs for the cause of the 5xx error.\n2. Ensure your application is running and responding correctly.\n3. Check for configuration errors in your web server (nginx, Apache, etc.).\n4. If using a managed platform (Vercel, Fly.io, etc.), check the deployment status and logs."
          : "1. For a 404 error, verify the URL you submitted is correct and the page exists.\n2. For a 403 error, check that your server is not blocking crawlers via IP filtering or authentication requirements.\n3. Ensure robots.txt and server configuration do not block access to the page.",
      completed: false,
    })
  }

  // Unreachable site
  if (auditResults.performance.statusCode === 0) {
    recs.push({
      id: "fix-unreachable-site",
      category: "technical",
      severity: "critical",
      title: "Ensure your site is reachable",
      description:
        "Your site could not be reached during the audit. AI crawlers will skip sites that time out or refuse connections, making it impossible for your content to be cited.",
      impact: "An unreachable site cannot be indexed by any AI crawler and will not appear in AI-generated answers",
      howToFix:
        "1. Verify the URL you submitted is correct.\n2. Check that your server is running and not experiencing downtime.\n3. Ensure your firewall or CDN is not blocking crawlers.\n4. Check DNS configuration to ensure your domain resolves correctly.",
      completed: false,
    })
  }

  // ─── Important ─────────────────────────────────────────────────────────────

  // No llms.txt
  if (!auditResults.llmsTxt.exists) {
    recs.push({
      id: "create-llms-txt",
      category: "technical",
      severity: "important",
      title: "Create an llms.txt file",
      description:
        "llms.txt is an emerging open standard (similar to robots.txt) that helps AI assistants understand your site's content, purpose, and how you want your brand represented. Sites with llms.txt give AI assistants clearer signals about what to cite and how.",
      impact:
        "llms.txt gives AI assistants explicit guidance about your content, improving citation accuracy and frequency",
      howToFix:
        "1. Create a plain text file at yourdomain.com/llms.txt.\n2. Include the following sections:\n   - A brief description of your site and its purpose\n   - Your key pages and what they cover\n   - Any instructions for how AI assistants should represent your brand\n   - Links to your most important content\n3. Keep it concise — aim for under 500 words.\n4. See https://llmstxt.org for the full specification and examples.",
      completed: false,
    })
  }

  // No schema markup
  if (!auditResults.schema.hasSchema) {
    recs.push({
      id: "add-structured-data",
      category: "technical",
      severity: "important",
      title: "Add structured data markup",
      description:
        "No JSON-LD structured data was found on your page. Schema markup helps AI assistants understand exactly what your organisation does, who you are, and how to reference you accurately in answers.",
      impact: "Sites with proper schema are cited 3.2x more by AI",
      howToFix:
        '1. Add a JSON-LD script block to your HTML <head>:\n\n<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "Organisation",\n  "name": "Your Company Name",\n  "url": "https://yourdomain.com",\n  "description": "A clear description of what your organisation does.",\n  "sameAs": [\n    "https://www.linkedin.com/company/yourcompany",\n    "https://twitter.com/yourhandle"\n  ]\n}\n</script>\n\n2. For content pages, also add Article or WebPage schema.\n3. Validate your markup using Google\'s Rich Results Test (https://search.google.com/test/rich-results).',
      completed: false,
    })
  }

  // Missing high-value schema types
  if (auditResults.schema.hasSchema) {
    const hasFaqSchema = auditResults.schema.types.includes("FAQPage")
    const hasHowToSchema = auditResults.schema.types.includes("HowTo")

    if (!hasFaqSchema && !hasHowToSchema) {
      recs.push({
        id: "add-faq-howto-schema",
        category: "content",
        severity: "important",
        title: "Add FAQ or HowTo schema",
        description:
          "You have structured data, but it does not include FAQ or HowTo schema types. These schema types are particularly valuable for AI citations because they signal question-and-answer content that AI assistants can use directly in responses.",
        impact:
          "FAQ and HowTo schema increases the likelihood of your content appearing in AI-generated answers to specific questions",
        howToFix:
          'Add FAQPage schema to any page with frequently asked questions:\n\n<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "FAQPage",\n  "mainEntity": [\n    {\n      "@type": "Question",\n      "name": "What is [your topic]?",\n      "acceptedAnswer": {\n        "@type": "Answer",\n        "text": "Your answer here."\n      }\n    }\n  ]\n}\n</script>',
        completed: false,
      })
    }
  }

  // No Open Graph tags
  if (!auditResults.metaTags.hasOgTags) {
    recs.push({
      id: "add-og-tags",
      category: "technical",
      severity: "important",
      title: "Add Open Graph meta tags",
      description:
        "No Open Graph (og:) meta tags were found. OG tags are used by AI assistants and social platforms to understand your page's title, description, and image. They improve how your content is represented when cited.",
      impact: "Open Graph tags help AI assistants extract accurate metadata for citations",
      howToFix:
        'Add the following to your HTML <head>:\n\n<meta property="og:title" content="Your Page Title" />\n<meta property="og:description" content="A clear description of your page." />\n<meta property="og:image" content="https://yourdomain.com/og-image.png" />\n<meta property="og:url" content="https://yourdomain.com/your-page" />\n<meta property="og:type" content="website" />\n\nAim for an OG image of 1200x630px. If you use a framework like Next.js, use the metadata API to generate these automatically.',
      completed: false,
    })
  }

  // Non-optimal title
  if (auditResults.metaTags.title.value && !auditResults.metaTags.title.isOptimal) {
    const length = auditResults.metaTags.title.length
    const isTooShort = length < 30
    recs.push({
      id: "optimise-title",
      category: "content",
      severity: "important",
      title: "Optimise your title tag",
      description: `Your title tag is ${length} characters, which is ${isTooShort ? "shorter than" : "longer than"} the optimal range of 30–60 characters. ${isTooShort ? "A title that is too short misses an opportunity to include relevant keywords and context." : "A title that is too long may be truncated in AI responses and search results."}`,
      impact:
        "Well-optimised title tags give AI assistants a clear, concise label for your page, improving citation accuracy",
      howToFix: `Update your <title> tag to be between 30 and 60 characters. ${isTooShort ? "Expand it to include your primary keyword, your brand name, and a clear description of the page's purpose." : "Shorten it by removing filler words and focusing on the most important terms. Move secondary information to the meta description instead."}`,
      completed: false,
    })
  }

  // Missing title entirely
  if (!auditResults.metaTags.title.value) {
    recs.push({
      id: "add-title",
      category: "content",
      severity: "important",
      title: "Add a title tag",
      description:
        "No title tag was found on your page. The title tag is one of the most important signals AI assistants and search engines use to understand what your page is about.",
      impact: "Pages without title tags are significantly less likely to be cited by AI assistants",
      howToFix:
        "Add a descriptive <title> tag inside your HTML <head>:\n\n<title>Primary Keyword — Your Brand Name</title>\n\nAim for 30–60 characters. Include your primary keyword and brand name.",
      completed: false,
    })
  }

  // Non-optimal description
  if (auditResults.metaTags.description.value && !auditResults.metaTags.description.isOptimal) {
    const length = auditResults.metaTags.description.length
    const isTooShort = length < 70
    recs.push({
      id: "optimise-description",
      category: "content",
      severity: "important",
      title: "Optimise your meta description",
      description: `Your meta description is ${length} characters, which is ${isTooShort ? "shorter than" : "longer than"} the optimal range of 70–155 characters. ${isTooShort ? "A short description leaves AI assistants with less context about your page." : "A very long description may be truncated and is harder to use as a citation snippet."}`,
      impact:
        "Meta descriptions between 70–155 characters provide the right amount of context for AI citation snippets",
      howToFix: `Update your <meta name="description"> tag to be between 70 and 155 characters. ${isTooShort ? "Expand it to provide a clear summary of the page, including your primary keyword and a call to action." : "Trim it to focus on the most important information. Each sentence should add value."}`,
      completed: false,
    })
  }

  // Missing description entirely
  if (!auditResults.metaTags.description.value) {
    recs.push({
      id: "add-description",
      category: "content",
      severity: "important",
      title: "Add a meta description",
      description:
        "No meta description was found. AI assistants use the meta description as a quick summary of your page when deciding whether to cite it and what snippet to show.",
      impact: "A clear meta description increases the chance of your page being cited in AI responses",
      howToFix:
        'Add a meta description inside your HTML <head>:\n\n<meta name="description" content="A clear, compelling summary of your page in 70–155 characters." />\n\nWrite it as a sentence that answers what the page is about and why someone should visit.',
      completed: false,
    })
  }

  // No canonical tag
  if (!auditResults.metaTags.hasCanonical) {
    recs.push({
      id: "add-canonical",
      category: "technical",
      severity: "important",
      title: "Add a canonical URL tag",
      description:
        "No canonical link tag was found. The canonical tag tells AI crawlers and search engines which URL is the definitive version of a page, preventing duplicate content issues and consolidating citation signals.",
      impact:
        "Canonical tags prevent citation dilution across duplicate URLs and help AI crawlers identify the authoritative version of your content",
      howToFix:
        'Add a canonical link tag inside your HTML <head>:\n\n<link rel="canonical" href="https://yourdomain.com/your-page" />\n\nThe URL should always be the full, absolute URL of the current page. In Next.js, use the metadata.alternates.canonical option.',
      completed: false,
    })
  }

  // Broken heading hierarchy
  const cs = auditResults.contentStructure
  const hasNoH1 = cs.headings.h1 === 0
  const hasMultipleH1 = cs.headings.h1 > 1
  const hasH3WithoutH2 = cs.headings.h3 > 0 && cs.headings.h2 === 0
  if (hasNoH1 || hasMultipleH1 || hasH3WithoutH2 || !cs.hasProperHierarchy) {
    const issues: string[] = []
    if (hasNoH1) issues.push("no H1 heading found")
    if (hasMultipleH1) issues.push(`${cs.headings.h1} H1 headings found (there should be exactly one)`)
    if (hasH3WithoutH2) issues.push("H3 headings used without any H2 headings")
    recs.push({
      id: "fix-heading-hierarchy",
      category: "content",
      severity: "important",
      title: "Fix heading hierarchy",
      description: `Heading structure issues were detected: ${issues.join("; ")}. A clear, logical heading hierarchy helps AI assistants understand the structure of your content and extract sections accurately for citations.`,
      impact: "Proper heading hierarchy improves how AI assistants parse and cite specific sections of your content",
      howToFix:
        "1. Use exactly one <h1> tag per page for the main page title.\n2. Use <h2> tags for major sections.\n3. Use <h3> tags for sub-sections within an <h2> section — never skip levels.\n4. Do not use headings purely for visual styling; use them to structure content semantically.\n5. Check your page's heading structure using a browser extension or the Accessibility panel in Chrome DevTools.",
      completed: false,
    })
  }

  // ─── Suggestions ───────────────────────────────────────────────────────────

  // Short content sections
  if (cs.avgSectionLength > 0 && cs.avgSectionLength < 120) {
    recs.push({
      id: "expand-content-sections",
      category: "content",
      severity: "suggestion",
      title: "Expand content sections",
      description: `Your average content section length is ${cs.avgSectionLength} words. Sections that are too brief may not provide enough context for AI assistants to confidently cite your content in detailed answers.`,
      impact: "Sections of 120–180 words receive 70% more ChatGPT citations",
      howToFix:
        "1. Review each section of your page and identify where content feels thin.\n2. Expand sections by adding supporting detail, examples, data points, and explanations.\n3. Aim for 120–180 words per section as a target range.\n4. Do not pad with filler — every sentence should add value for the reader.\n5. Consider splitting very long pages into multiple focused pages, each covering one topic in depth.",
      completed: false,
    })
  }

  // Overly long content sections
  if (cs.avgSectionLength > 250) {
    recs.push({
      id: "break-up-content-sections",
      category: "content",
      severity: "suggestion",
      title: "Break up long content sections",
      description: `Your average content section length is ${cs.avgSectionLength} words. Sections that are too long are harder for AI assistants to parse and extract relevant information from. Breaking them up makes your content more scannable and citable.`,
      impact:
        "Well-structured, moderate-length sections are easier for AI assistants to extract and attribute correctly",
      howToFix:
        "1. Identify sections longer than 250 words.\n2. Break them into subsections using <h3> headings.\n3. Use bullet points or numbered lists to summarise key points within long sections.\n4. Aim for 120–180 words per section.\n5. Each section should focus on a single idea or topic.",
      completed: false,
    })
  }

  // No lists
  if (cs.listCount === 0) {
    recs.push({
      id: "add-structured-lists",
      category: "content",
      severity: "suggestion",
      title: "Add structured lists to content",
      description:
        "No ordered or unordered lists were found on your page. Lists are one of the most AI-friendly content formats — they present discrete, extractable pieces of information that AI assistants can cite directly.",
      impact:
        "List-formatted content is significantly easier for AI assistants to extract and present as concise answers",
      howToFix:
        "1. Identify any content that enumerates items, steps, features, or benefits.\n2. Format these as <ul> (unordered) or <ol> (ordered) lists.\n3. Use lists for: feature comparisons, step-by-step instructions, key takeaways, and pros/cons.\n4. Keep list items concise — one idea per bullet.\n5. Add a descriptive heading above each list so AI assistants understand the context.",
      completed: false,
    })
  }

  // No tables
  if (cs.tableCount === 0) {
    recs.push({
      id: "add-comparison-tables",
      category: "content",
      severity: "suggestion",
      title: "Add comparison tables",
      description:
        "No tables were found on your page. Comparison tables are highly effective for AI citations because they present structured, factual information in a format that is easy to extract and summarise.",
      impact: "Comparison tables with structured data see 47% higher AI citation rates",
      howToFix:
        "1. Identify any comparisons, pricing tiers, feature lists, or data sets on your page.\n2. Format these as HTML <table> elements with proper <thead>, <tbody>, and <th> cells.\n3. Keep tables focused — each table should compare one set of related items.\n4. Add a descriptive caption using the <caption> element.\n5. Ensure tables are responsive so they work on mobile devices.",
      completed: false,
    })
  }

  // No FAQ section
  if (!cs.hasFaq) {
    recs.push({
      id: "add-faq-section",
      category: "content",
      severity: "suggestion",
      title: "Add an FAQ section",
      description:
        "No FAQ section was detected. FAQ sections are one of the highest-value content formats for AI visibility because AI assistants are frequently used to answer specific questions — and FAQ content directly matches that use case.",
      impact:
        "Pages with FAQ sections are significantly more likely to appear in AI responses to question-based queries",
      howToFix:
        "1. Research the most common questions your target audience asks about your topic (use Google's People Also Ask, forums, or customer support logs).\n2. Add an FAQ section to your page with clear, concise answers (2–4 sentences each).\n3. Add FAQPage JSON-LD schema (see the structured data recommendation).\n4. Use <h2> or <h3> headings for each question and <p> for the answer.\n5. Aim for at least 5 questions to make the section substantive.",
      completed: false,
    })
  }

  // No sameAs links in schema
  if (auditResults.schema.hasSchema && !auditResults.schema.hasSameAs) {
    recs.push({
      id: "add-same-as-links",
      category: "off-site",
      severity: "suggestion",
      title: "Add sameAs links to your schema",
      description:
        "Your structured data does not include sameAs links. The sameAs property connects your entity in your schema to authoritative external sources (Wikipedia, Wikidata, social profiles), helping AI assistants verify your identity and build confidence in citations.",
      impact:
        "sameAs links help AI assistants confirm your entity's identity, increasing citation confidence and frequency",
      howToFix:
        'Add a sameAs array to your Organisation schema with links to your authoritative profiles:\n\n"sameAs": [\n  "https://www.linkedin.com/company/yourcompany",\n  "https://twitter.com/yourhandle",\n  "https://www.facebook.com/yourpage",\n  "https://en.wikipedia.org/wiki/YourCompany",\n  "https://www.wikidata.org/wiki/Q12345"\n]\n\nPrioritise LinkedIn, Wikipedia, and Wikidata as these are the most trusted sources for AI entity verification.',
      completed: false,
    })
  }

  // Large HTML size
  if (!auditResults.performance.isUnder100KB) {
    const sizeKb = Math.round(auditResults.performance.htmlSizeBytes / 1024)
    recs.push({
      id: "reduce-page-size",
      category: "technical",
      severity: "suggestion",
      title: "Reduce page size",
      description: `Your page's HTML is ${sizeKb}KB, which is above the recommended 100KB limit. AI crawlers have content limits and may not process the full page if it is too large, potentially missing important content.`,
      impact: "AI crawlers may truncate or skip large pages, meaning your most important content might not be indexed",
      howToFix:
        "1. Move inline CSS and JavaScript to external files.\n2. Remove unused CSS classes and scripts.\n3. Compress and optimise images (use WebP format).\n4. Enable server-side compression (gzip or Brotli).\n5. Lazy-load below-the-fold content.\n6. Remove excessive whitespace and comments from HTML in production builds.",
      completed: false,
    })
  }

  // Slow response time
  if (auditResults.performance.responseTimeMs > 3000) {
    const ms = auditResults.performance.responseTimeMs
    recs.push({
      id: "improve-page-speed",
      category: "technical",
      severity: "suggestion",
      title: "Improve page load speed",
      description: `Your page took ${ms.toLocaleString()}ms to respond. Slow pages are less likely to be fully indexed by AI crawlers, which have strict timeout budgets. Faster pages also rank higher with traditional search engines.`,
      impact: "Pages that respond in under 3 seconds are more reliably indexed by AI crawlers and search engines",
      howToFix:
        "1. Enable server-side caching for static content.\n2. Use a CDN (Content Delivery Network) to serve content from locations closer to users.\n3. Optimise database queries if your page is server-rendered.\n4. Minimise the use of blocking JavaScript in the <head>.\n5. Use Next.js's built-in Static Site Generation (SSG) or Incremental Static Regeneration (ISR) where possible.\n6. Monitor your Core Web Vitals using Google's PageSpeed Insights (https://pagespeed.web.dev).",
      completed: false,
    })
  }

  // Sort: critical → important → suggestion
  const severityOrder = { critical: 0, important: 1, suggestion: 2 }
  recs.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  return recs
}
