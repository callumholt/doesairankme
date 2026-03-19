import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import readingTime from "reading-time"

export type BlogPost = {
  slug: string
  title: string
  description: string
  date: string
  updatedAt?: string
  author: string
  tags: string[]
  image?: string
  readingTime: string
  content: string
}

const BLOG_DIR = path.join(process.cwd(), "content/blog")

function parseFrontmatter(slug: string): BlogPost {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`)
  const raw = fs.readFileSync(filePath, "utf-8")
  const { data, content } = matter(raw)
  const stats = readingTime(content)

  return {
    slug,
    title: data.title as string,
    description: data.description as string,
    date: data.date as string,
    updatedAt: data.updatedAt as string | undefined,
    author: data.author as string,
    tags: (data.tags as string[]) ?? [],
    image: data.image as string | undefined,
    readingTime: stats.text,
    content,
  }
}

export function getPostBySlug(slug: string): BlogPost {
  return parseFrontmatter(slug)
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return []

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"))

  const posts = files.map((file) => {
    const slug = file.replace(/\.mdx$/, "")
    return parseFrontmatter(slug)
  })

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
  const current = getPostBySlug(slug)
  const all = getAllPosts()

  return all
    .filter((post) => post.slug !== slug)
    .filter((post) => post.tags.some((tag) => current.tags.includes(tag)))
    .slice(0, limit)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
