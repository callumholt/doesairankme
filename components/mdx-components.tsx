import Image from "next/image"
import Link from "next/link"
import type { AnchorHTMLAttributes, DetailedHTMLProps, HTMLAttributes, ImgHTMLAttributes } from "react"
import { Button } from "@/components/ui/button"

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim()
}

type ElementWithChildren = { props: { children?: React.ReactNode } }

function extractTextContent(children: React.ReactNode): string {
  if (typeof children === "string") return children
  if (Array.isArray(children)) return children.map(extractTextContent).join("")
  if (typeof children === "object" && children !== null && "props" in (children as ElementWithChildren)) {
    return extractTextContent((children as ElementWithChildren).props.children)
  }
  return ""
}

type HeadingProps = HTMLAttributes<HTMLHeadingElement>

function H1({ children, ...props }: HeadingProps) {
  const text = extractTextContent(children)
  const id = slugifyHeading(text)
  return (
    <h1 id={id} className="group mt-10 mb-4 text-3xl font-bold tracking-tight text-foreground scroll-mt-20" {...props}>
      <a href={`#${id}`} className="no-underline hover:text-primary transition-colors">
        {children}
      </a>
    </h1>
  )
}

function H2({ children, ...props }: HeadingProps) {
  const text = extractTextContent(children)
  const id = slugifyHeading(text)
  return (
    <h2 id={id} className="group mt-10 mb-4 text-2xl font-bold tracking-tight text-foreground scroll-mt-20" {...props}>
      <a href={`#${id}`} className="no-underline hover:text-primary transition-colors">
        {children}
      </a>
    </h2>
  )
}

function H3({ children, ...props }: HeadingProps) {
  const text = extractTextContent(children)
  const id = slugifyHeading(text)
  return (
    <h3 id={id} className="group mt-8 mb-3 text-xl font-semibold text-foreground scroll-mt-20" {...props}>
      <a href={`#${id}`} className="no-underline hover:text-primary transition-colors">
        {children}
      </a>
    </h3>
  )
}

function H4({ children, ...props }: HeadingProps) {
  const text = extractTextContent(children)
  const id = slugifyHeading(text)
  return (
    <h4 id={id} className="group mt-6 mb-2 text-lg font-semibold text-foreground scroll-mt-20" {...props}>
      <a href={`#${id}`} className="no-underline hover:text-primary transition-colors">
        {children}
      </a>
    </h4>
  )
}

function P({ children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className="mb-5 leading-7 text-muted-foreground" {...props}>
      {children}
    </p>
  )
}

function Ul({ children, ...props }: HTMLAttributes<HTMLUListElement>) {
  return (
    <ul className="mb-5 ml-6 list-disc space-y-1.5 text-muted-foreground [&>li]:leading-7" {...props}>
      {children}
    </ul>
  )
}

function Ol({ children, ...props }: HTMLAttributes<HTMLOListElement>) {
  return (
    <ol className="mb-5 ml-6 list-decimal space-y-1.5 text-muted-foreground [&>li]:leading-7" {...props}>
      {children}
    </ol>
  )
}

function Blockquote({ children, ...props }: HTMLAttributes<HTMLQuoteElement>) {
  return (
    <blockquote className="my-6 border-l-2 border-primary/50 pl-5 text-muted-foreground italic [&>p]:mb-0" {...props}>
      {children}
    </blockquote>
  )
}

function Pre({ children, ...props }: HTMLAttributes<HTMLPreElement>) {
  return (
    <pre
      className="mb-5 overflow-x-auto rounded-lg border border-border/50 bg-card/80 p-4 font-mono text-sm leading-6 text-foreground"
      {...props}
    >
      {children}
    </pre>
  )
}

function Code({ children, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <code
      className="rounded bg-card/80 border border-border/50 px-1.5 py-0.5 font-mono text-sm text-primary"
      {...props}
    >
      {children}
    </code>
  )
}

function Table({ children, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="mb-5 overflow-x-auto rounded-lg border border-border/50">
      <table className="w-full text-sm" {...props}>
        {children}
      </table>
    </div>
  )
}

function Th({ children, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className="border-b border-border/50 bg-card/50 px-4 py-2.5 text-left font-semibold text-foreground" {...props}>
      {children}
    </th>
  )
}

function Td({ children, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className="border-b border-border/30 px-4 py-2.5 text-muted-foreground" {...props}>
      {children}
    </td>
  )
}

function Anchor({
  children,
  href,
  ...props
}: DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>) {
  const isExternal = href?.startsWith("http") || href?.startsWith("//")
  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
        {...props}
      >
        {children}
      </a>
    )
  }
  return (
    <Link
      href={href ?? "#"}
      className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
      {...props}
    >
      {children}
    </Link>
  )
}

function Img({ src, alt }: ImgHTMLAttributes<HTMLImageElement>) {
  if (!src || typeof src !== "string") return null
  return (
    <span className="my-6 block">
      <Image
        src={src}
        alt={alt ?? ""}
        width={800}
        height={450}
        className="rounded-lg border border-border/50 w-full object-cover"
      />
    </span>
  )
}

function Hr() {
  return <hr className="my-8 border-border/50" />
}

// Custom components

type CalloutType = "info" | "warning" | "tip"

const calloutStyles: Record<CalloutType, { border: string; bg: string; label: string; labelColor: string }> = {
  info: {
    border: "border-primary/30",
    bg: "bg-primary/5",
    label: "Info",
    labelColor: "text-primary",
  },
  warning: {
    border: "border-yellow-500/30",
    bg: "bg-yellow-500/5",
    label: "Warning",
    labelColor: "text-yellow-400",
  },
  tip: {
    border: "border-green-500/30",
    bg: "bg-green-500/5",
    label: "Tip",
    labelColor: "text-green-400",
  },
}

export function Callout({ type = "info", children }: { type?: CalloutType; children: React.ReactNode }) {
  const styles = calloutStyles[type]
  return (
    <div className={`my-6 rounded-lg border ${styles.border} ${styles.bg} p-4`}>
      <p className={`mb-1 text-xs font-mono font-semibold uppercase tracking-wider ${styles.labelColor}`}>
        {styles.label}
      </p>
      <div className="text-sm text-muted-foreground leading-relaxed [&>p]:mb-0">{children}</div>
    </div>
  )
}

export function ScanCTA() {
  return (
    <div className="my-8 rounded-xl border border-primary/20 bg-primary/[0.04] p-6 text-center">
      <p className="mb-1 font-mono text-xs uppercase tracking-widest text-primary">Free tool</p>
      <h3 className="mb-2 text-lg font-bold text-foreground">Check your site's AI visibility</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Find out if ChatGPT, Gemini, and Perplexity are recommending your website — in under 2 minutes.
      </p>
      <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
        <Link href="/">Scan your site for free</Link>
      </Button>
    </div>
  )
}

export const mdxComponents = {
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  p: P,
  ul: Ul,
  ol: Ol,
  blockquote: Blockquote,
  pre: Pre,
  code: Code,
  table: Table,
  th: Th,
  td: Td,
  a: Anchor,
  img: Img,
  hr: Hr,
  Callout,
  ScanCTA,
}
