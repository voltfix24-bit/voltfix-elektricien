import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { RankReport } from "./rank-tracking";

export const getRankReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(
  async (): Promise<RankReport> => {
    const { buildRankReport } = await import("./rank-tracking.server");
    return buildRankReport();
  },
);

export const captureRankSnapshotNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(
  async (): Promise<{ weekStart: string; stored: number; withImpressions: number }> => {
    const { captureWeeklySnapshot } = await import("./rank-tracking.server");
    return captureWeeklySnapshot();
  },
);
