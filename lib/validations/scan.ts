import { z } from "zod"

export const createScanSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  provider: z.enum(["gemini", "perplexity-sonar", "perplexity-sonar-pro"]).default("gemini"),
  queryCount: z.number().int().min(3).max(20).default(10),
})

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})
