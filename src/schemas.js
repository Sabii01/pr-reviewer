import { z } from "zod";

const CATEGORIES = ["security", "bug", "performance", "error-handling", "other"];

export const FindingSchema = z.object({
  file: z.string().min(1),
  line: z.number().int().positive(),
  severity: z.enum(["high", "medium", "low"]),
  category: z
    .string()
    .transform((c) => c.toLowerCase().replace(/\s+/g, "-"))
    .transform((c) => (CATEGORIES.includes(c) ? c : "other")),
  message: z.string().min(1),
  suggestion: z.string().optional(),
});

export const ReviewSchema = z.object({
  summary: z.string(),
  findings: z.array(z.unknown()),
});