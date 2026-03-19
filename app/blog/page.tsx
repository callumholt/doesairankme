import type { Metadata } from "next"
import Link from "next/link"
import { formatDate, getAllPosts } from "@/lib/blog"

export const metadata: Metadata = {
  title: "Blog | Does AI Rank Me?",
  description: "Insights on AI search visibility and generative engine optimisation.",
  openGraph: {
    title: "Blog | Does AI Rank Me?",
    description: "Insights on AI search visibility and generative engine optimisation.",
    url: "https://doesairankme.com/blog",
  },
}

export default function BlogIndexPage() {
  const posts = getAllPosts()

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <div className="mb-14 text-center">
        <span className="font-mono text-xs uppercase tracking-widest text-primary">Resources</span>
        <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight text-foreground">Blog</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Insights on AI search visibility and generative engine optimisation
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-muted-foreground font-mono text-sm">No posts yet. Check back soon.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-xl border border-border/50 bg-card/30 p-6 transition-all duration-300 hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-[0_0_30px_oklch(0.82_0.17_170_/_6%)]"
            >
              <div className="flex-1">
                <h2 className="mb-2 text-lg font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{post.description}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-border/30">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-mono mb-3">
                  <span>{formatDate(post.date)}</span>
                  <span>{post.readingTime}</span>
                </div>
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-primary/20 bg-primary/[0.06] px-2 py-0.5 font-mono text-xs text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
