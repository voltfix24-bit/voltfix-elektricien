import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { KeywordReport } from "./keyword-research";

export const researchKeywordsFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      keywords: z.array(z.string()).min(1),
      database: z.string().min(2),
      relatedLimit: z.number().int().optional(),
    }),
  )
  .handler(async ({ data }): Promise<KeywordReport> => {
    const { researchKeywords } = await import("./keyword-research.server");
    return researchKeywords({
      keywords: data.keywords,
      database: data.database,
      relatedLimit: data.relatedLimit ?? 15,
    });
  });
