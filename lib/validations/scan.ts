import { z } from "zod"

const providerEnum = z.enum(["gemini", "openai", "perplexity"])

export const createScanSchema = z
  .object({
    url: z.string().url("Please enter a valid URL"),
    provider: providerEnum.optional(),
    providers: z.array(providerEnum).optional(),
    queryCount: z.number().int().min(3).max(20).default(10),
  })
  .refine((data) => data.provider || (data.providers && data.providers.length > 0), {
    message: "At least one provider is required",
  })

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})
