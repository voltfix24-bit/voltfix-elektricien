import { createServerFn } from "@tanstack/react-start";
import type { RankReport } from "./rank-tracking";

export const getRankReport = createServerFn({ method: "GET" }).handler(
  async (): Promise<RankReport> => {
    const { buildRankReport } = await import("./rank-tracking.server");
    return buildRankReport();
  },
);

export const captureRankSnapshotNow = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ weekStart: string; stored: number; withImpressions: number }> => {
    const { captureWeeklySnapshot } = await import("./rank-tracking.server");
    return captureWeeklySnapshot();
  },
);
