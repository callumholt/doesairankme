import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MDXRemote } from "next-mdx-remote/rsc"
import { mdxComponents, ScanCTA } from "@/components/mdx-components"
import { TableOfContents } from "@/components/toc"
import { Button } from "@/components/ui/button"
import { type BlogPost, formatDate, getAllPosts, getPostBySlug, getRelatedPosts } from "@/lib/blog"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  let post: BlogPost
  try {
    post = getPostBySlug(slug)
  } catch {
    return {}
  }

  return {
    title: `${post.title} | Does AI Rank Me?`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.updatedAt ?? post.date,
      authors: [post.author],
      ...(post.image ? { images: [post.image] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params

  let post: BlogPost
  try {
    post = getPostBySlug(slug)
  } catch {
    notFound()
  }

  const relatedPosts = getRelatedPosts(slug, 3)

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updatedAt ?? post.date,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organisation",
      name: "Does AI Rank Me?",
      url: "https://doesairankme.com",
    },
  }

  return (
    <>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is safe static content */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        {/* Back link */}
        <div className="mb-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Blog
          </Link>
        </div>

        <div className="xl:grid xl:grid-cols-[1fr_220px] xl:gap-12">
          {/* Main content */}
          <div className="min-w-0">
            {/* Post header */}
            <header className="mb-10">
              {post.tags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-primary/20 bg-primary/[0.06] px-2.5 py-1 font-mono text-xs text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight mb-5">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground font-mono">
                <span>{post.author}</span>
                <span>{formatDate(post.date)}</span>
                <span>{post.readingTime}</span>
              </div>
            </header>

            {/* Mobile TOC */}
            <TableOfContents content={post.content} />

            {/* MDX content */}
            <article className="prose-custom">
              <MDXRemote source={post.content} components={{ ...mdxComponents, ScanCTA }} />
            </article>

            {/* CTA */}
            <div className="mt-12">
              <ScanCTA />
            </div>

            {/* Related posts */}
            {relatedPosts.length > 0 && (
              <section className="mt-14 pt-10 border-t border-border/50">
                <h2 className="mb-6 text-xl font-bold text-foreground">Related articles</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedPosts.map((related) => (
                    <Link
                      key={related.slug}
                      href={`/blog/${related.slug}`}
                      className="group rounded-lg border border-border/50 bg-card/30 p-4 transition-all hover:border-primary/30 hover:bg-primary/[0.03]"
                    >
                      <h3 className="mb-1.5 text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                        {related.title}
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono">{related.readingTime}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Desktop TOC sidebar */}
          <aside className="hidden xl:block">
            <div className="sticky top-24">
              <TableOfContents content={post.content} />

              <div className="mt-8 rounded-lg border border-primary/20 bg-primary/[0.04] p-4">
                <p className="mb-1 font-mono text-xs uppercase tracking-widest text-primary">Free tool</p>
                <p className="mb-3 text-sm text-foreground font-medium">Check your AI visibility</p>
                <Button
                  asChild
                  size="sm"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs"
                >
                  <Link href="/">Scan your site</Link>
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
