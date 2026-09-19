import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { BidAnalysis } from "./bid-analysis";

async function assertAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Geen beheerdersrechten.");
}

/**
 * Haalt de biedingsanalyse op. Alleen beheerders; de Google Ads-sleutels
 * blijven volledig server-side.
 */
export const getBidAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      accountId: z.string().nullable().optional(),
      campaignId: z.string().nullable().optional(),
      days: z.union([z.literal(7), z.literal(30), z.literal(90)]),
      refresh: z.boolean().optional(),
    }),
  )
  .handler(async ({ context, data }): Promise<BidAnalysis> => {
    await assertAdmin(context);
    const { buildBidAnalysis } = await import("./bid-analysis.server");
    return buildBidAnalysis({
      supabase: context.supabase,
      accountId: data.accountId ?? null,
      campaignId: data.campaignId && data.campaignId !== "alle" ? data.campaignId : null,
      days: data.days,
      refresh: data.refresh ?? false,
    });
  });
