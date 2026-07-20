import { BadgeCheck, MapPin, ShieldCheck, Zap } from "lucide-react";

import { useT } from "@/lib/i18n";

const icons = [MapPin, Zap, BadgeCheck, ShieldCheck];

export function TrustRow({ onBrand }: { onBrand?: boolean }) {
  const t = useT();
  return (
    <ul
      className={
        onBrand
          ? "flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm"
          : "flex flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-2xl bg-butter px-5 py-3 text-sm shadow-[0_10px_30px_-18px_color-mix(in_oklab,var(--iris-deep)_50%,transparent)] ring-1 ring-[color:var(--iris-deep)]/10"
      }
    >
      {t.trust.map((label, i) => {
        const Icon = icons[i] ?? ShieldCheck;
        return (
          <li
            key={label}
            className={`flex items-center gap-2 ${onBrand ? "text-white/85" : "text-butter-foreground"}`}
          >
            <Icon className={`h-4 w-4 ${onBrand ? "text-butter" : "text-butter-foreground"}`} />
            <span className={`font-semibold ${onBrand ? "text-white" : "text-butter-foreground"}`}>
              {label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
