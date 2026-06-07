import { BadgeCheck, MapPin, ShieldCheck, Zap } from "lucide-react";

import { useT } from "@/lib/i18n";

const icons = [MapPin, Zap, BadgeCheck, ShieldCheck];

export function TrustRow({ onBrand }: { onBrand?: boolean }) {
  const t = useT();
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
      {t.trust.map((label, i) => {
        const Icon = icons[i] ?? ShieldCheck;
        return (
          <li
            key={label}
            className={`flex items-center gap-2 ${onBrand ? "text-white/80" : "text-muted-foreground"}`}
          >
            <Icon className={`h-4 w-4 ${onBrand ? "text-white" : "text-primary"}`} />
            <span className={`font-medium ${onBrand ? "text-white" : "text-foreground"}`}>
              {label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
