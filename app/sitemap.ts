import type { MetadataRoute } from "next"
import { getAllPosts } from "@/lib/blog"

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts()

  const blogPostUrls: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `https://doesairankme.com/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt ?? post.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  return [
    {
      url: "https://doesairankme.com",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://doesairankme.com/login",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: "https://doesairankme.com/signup",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://doesairankme.com/blog",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...blogPostUrls,
    {
      url: "https://doesairankme.com/feed.xml",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.3,
    },
  ]
}
