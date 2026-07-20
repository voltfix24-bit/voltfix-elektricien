import { BadgeCheck, MapPin, ShieldCheck, Zap } from "lucide-react";

import { useT } from "@/lib/i18n";

const icons = [MapPin, Zap, BadgeCheck, ShieldCheck];

type Variant = "pill" | "brand" | "band";

export function TrustRow({ onBrand, variant }: { onBrand?: boolean; variant?: Variant }) {
  const t = useT();
  const mode: Variant = variant ?? (onBrand ? "brand" : "pill");
  const listClass =
    mode === "brand"
      ? "flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm"
      : mode === "band"
        ? "flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm"
        : "flex flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-2xl bg-butter px-5 py-3 text-sm shadow-[0_10px_30px_-18px_color-mix(in_oklab,var(--iris-deep)_50%,transparent)] ring-1 ring-[color:var(--iris-deep)]/10";
  return (
    <ul className={listClass}>
      {t.trust.map((label, i) => {
        const Icon = icons[i] ?? ShieldCheck;
        const itemClass =
          mode === "brand" ? "text-white/85" : "text-butter-foreground";
        const iconClass =
          mode === "brand" ? "text-butter" : "text-butter-foreground";
        const textClass =
          mode === "brand" ? "text-white" : "text-butter-foreground";
        return (
          <li key={label} className={`flex items-center gap-2 ${itemClass}`}>
            <Icon className={`h-4 w-4 ${iconClass}`} />
            <span className={`font-semibold ${textClass}`}>{label}</span>
          </li>
        );
      })}
    </ul>
  );
}
