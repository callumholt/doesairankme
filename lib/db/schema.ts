import { relations } from "drizzle-orm"
import { boolean, integer, jsonb, pgTable, primaryKey, real, text, timestamp } from "drizzle-orm/pg-core"

// ============================================================================
// AUTH TABLES (NextAuth.js v5)
// ============================================================================

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
  password: text("password"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),
  plan: text("plan").notNull().default("free"),
  rateLimitExempt: integer("rate_limit_exempt").notNull().default(0),
  planExpiresAt: timestamp("plan_expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compositePk: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
)

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
})

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires").notNull(),
  },
  (vt) => ({
    compositePk: primaryKey({
      columns: [vt.identifier, vt.token],
    }),
  }),
)

// ============================================================================
// APPLICATION TABLES
// ============================================================================

export const scans = pgTable("scans", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  anonToken: text("anon_token"),
  anonIp: text("anon_ip"),
  url: text("url").notNull(),
  domain: text("domain").notNull(),
  provider: text("provider").notNull().default("gemini"),
  queryCount: integer("query_count").notNull().default(10),
  status: text("status").notNull().default("pending"),
  score: real("score"),
  appearanceRate: real("appearance_rate"),
  avgPosition: real("avg_position"),
  contentSource: text("content_source"),
  totalTokens: integer("total_tokens"),
  error: text("error"),
  isPublic: boolean("is_public").notNull().default(false),
  publicSlug: text("public_slug").unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
})

export const scanResults = pgTable("scan_results", {
  id: text("id").primaryKey(),
  scanId: text("scan_id")
    .notNull()
    .references(() => scans.id, { onDelete: "cascade" }),
  query: text("query").notNull(),
  position: integer("position"),
  sources: jsonb("sources").$type<Array<{ url: string; title: string }>>(),
  searchQueries: jsonb("search_queries").$type<string[]>(),
  responseSnippet: text("response_snippet"),
  responseText: text("response_text"),
  citedSnippet: text("cited_snippet"),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  totalTokens: integer("total_tokens"),
  error: text("error"),
  sentiment: text("sentiment").$type<"positive" | "neutral" | "negative" | "not_mentioned">(),
  sentimentConfidence: real("sentiment_confidence"),
  sentimentSummary: text("sentiment_summary"),
  sentimentConcerns: jsonb("sentiment_concerns").$type<string[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const siteAudits = pgTable("site_audits", {
  id: text("id").primaryKey(),
  scanId: text("scan_id").references(() => scans.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  domain: text("domain").notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  overallScore: integer("overall_score").notNull(),
  results: jsonb("results").$type<import("@/lib/audit").AuditResults>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  scans: many(scans),
}))

export const scansRelations = relations(scans, ({ one, many }) => ({
  user: one(users, { fields: [scans.userId], references: [users.id] }),
  results: many(scanResults),
  audit: one(siteAudits, { fields: [scans.id], references: [siteAudits.scanId] }),
}))

export const scanResultsRelations = relations(scanResults, ({ one }) => ({
  scan: one(scans, { fields: [scanResults.scanId], references: [scans.id] }),
}))

export const siteAuditsRelations = relations(siteAudits, ({ one }) => ({
  scan: one(scans, { fields: [siteAudits.scanId], references: [scans.id] }),
  user: one(users, { fields: [siteAudits.userId], references: [users.id] }),
}))

// Types
export type User = typeof users.$inferSelect
export type Scan = typeof scans.$inferSelect
export type ScanResult = typeof scanResults.$inferSelect
export type SiteAudit = typeof siteAudits.$inferSelect
