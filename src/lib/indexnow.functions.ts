import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { IndexNowResult } from "./indexnow";

export const pingIndexNowFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ urls: z.array(z.string()).optional() }))
  .handler(async ({ data }): Promise<IndexNowResult> => {
    const { pingIndexNow } = await import("./indexnow.server");
    return pingIndexNow(data.urls);
  });
