import { createServerFn } from "@tanstack/react-start";

import type { ConversionReport } from "./conversion-report";

export const getConversionReport = createServerFn({ method: "GET" })
  .inputValidator((input: { days?: number } | undefined) => ({
    days: Math.min(Math.max(Math.floor(input?.days ?? 30), 1), 365),
  }))
  .handler(async ({ data }): Promise<ConversionReport> => {
    const { buildConversionReport } = await import("./conversion-report.server");
    return buildConversionReport(data.days);
  });
