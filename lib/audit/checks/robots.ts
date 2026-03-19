const USER_AGENT = "Mozilla/5.0 doesairankme/1.0"
const TIMEOUT_MS = 10000

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    })
    clearTimeout(timer)
    return res
  } catch (err) {
    clearTimeout(timer)
    throw err
  }
}

export type RobotsResult = {
  exists: boolean
  bots: { name: string; allowed: boolean }[]
}

const BOTS_TO_CHECK = ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "ChatGPT-User", "Googlebot"]

function parseRobotsTxt(content: string): Map<string, boolean> {
  const lines = content.split("\n").map((l) => l.trim())
  // Map of user-agent (lowercased) -> allowed
  const result = new Map<string, boolean>()

  let currentAgents: string[] = []
  let inBlock = false

  for (const line of lines) {
    if (line.startsWith("#") || line === "") {
      if (inBlock && currentAgents.length > 0) {
        // End of block
        currentAgents = []
        inBlock = false
      }
      continue
    }

    const colonIdx = line.indexOf(":")
    if (colonIdx === -1) continue

    const directive = line.slice(0, colonIdx).trim().toLowerCase()
    const value = line.slice(colonIdx + 1).trim()

    if (directive === "user-agent") {
      if (inBlock) {
        currentAgents = []
        inBlock = false
      }
      currentAgents.push(value.toLowerCase())
    } else if (directive === "disallow" || directive === "allow") {
      inBlock = true
      const isDisallow = directive === "disallow"
      const isBlock = isDisallow && value !== ""

      for (const agent of currentAgents) {
        // Track which agents are blocked via Disallow: /
        // Only record if we haven't already recorded a definitive state
        if (agent === "*") {
          // Wildcard: affects all bots unless overridden
          if (isBlock && value === "/") {
            if (!result.has("*")) result.set("*", false)
          } else if (!isBlock || value === "") {
            if (!result.has("*")) result.set("*", true)
          }
        } else {
          if (isBlock && value === "/") {
            result.set(agent, false)
          } else if (!isBlock || value === "") {
            result.set(agent, true)
          }
        }
      }
    }
  }

  return result
}

export async function checkRobots(url: string): Promise<RobotsResult> {
  const origin = new URL(url).origin
  const robotsUrl = `${origin}/robots.txt`

  try {
    const res = await fetchWithTimeout(robotsUrl)
    if (!res.ok) {
      return {
        exists: false,
        bots: BOTS_TO_CHECK.map((name) => ({ name, allowed: true })),
      }
    }

    const content = await res.text()
    const parsed = parseRobotsTxt(content)

    const bots = BOTS_TO_CHECK.map((name) => {
      const key = name.toLowerCase()
      // Check if this specific bot is mentioned
      if (parsed.has(key)) {
        return { name, allowed: parsed.get(key) as boolean }
      }
      // Fall back to wildcard
      if (parsed.has("*")) {
        return { name, allowed: parsed.get("*") as boolean }
      }
      // Not mentioned at all — allowed by default
      return { name, allowed: true }
    })

    return { exists: true, bots }
  } catch {
    return {
      exists: false,
      bots: BOTS_TO_CHECK.map((name) => ({ name, allowed: true })),
    }
  }
}
