import { GoogleGenAI, Type } from "@google/genai";
import { config } from "./config.js";
import { ReviewSchema, FindingSchema } from "./schemas.js";

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

const reviewSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    findings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          file: { type: Type.STRING },
          line: { type: Type.INTEGER },
          severity: { type: Type.STRING, enum: ["high", "medium", "low"] },
          category: { type: Type.STRING },
          message: { type: Type.STRING },
          suggestion: { type: Type.STRING },
        },
        required: ["file", "line", "severity", "category", "message"],
      },
    },
  },
  required: ["summary", "findings"],
};

const SYSTEM_PROMPT = `You are a senior software engineer reviewing a pull request.
Review only the added lines (starting with +) in the diff.
Report real problems: bugs, security issues, performance issues, missing error handling.
Do not comment on style or formatting. If there are no real problems, return an empty findings list.
For "line", use the line number in the NEW file, calculated from the @@ hunk headers. For "suggestion", provide only the replacement code for that line, not an explanation. Omit it if a code fix doesn't fit on that line.`;

export async function reviewDiff(diff) {
  const response = await ai.models.generateContent({
    model: config.geminiModel,
    contents: `Review this pull request diff:\n\n${diff}`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: reviewSchema,
    },
  });

    const raw = ReviewSchema.parse(JSON.parse(response.text));

  const findings = [];
  for (const item of raw.findings) {
    const result = FindingSchema.safeParse(item);
    if (result.success) {
      findings.push(result.data);
    } else {
      console.warn("Dropped invalid finding:", result.error.issues[0].message);
    }
  }

  return { summary: raw.summary, findings };
};