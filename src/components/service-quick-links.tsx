import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { useT } from "@/lib/i18n";
import { useTrackConversion } from "@/lib/analytics";

/**
 * Mobiele dienst-doorkliks direct onder de hero, naast de bel-CTA.
 * Alleen zichtbaar op mobiel (< sm) — op desktop tonen we de volledige
 * RelatedServices-kaarten verderop de pagina.
 */
export function ServiceQuickLinks({
  currentPath,
  label,
}: {
  currentPath?: string;
  label?: string;
}) {
  const t = useT();
  const track = useTrackConversion();
  const items = t.related.filter((s) => s.to !== currentPath).slice(0, 6);
  if (items.length === 0) return null;

  const shortTitle = (title: string) =>
    title.replace(/\s+Amsterdam$/i, "").replace(/\s+installeren$/i, "");

  return (
    <nav
      aria-label={label ?? t.relatedHeading}
      className="border-b border-border bg-surface sm:hidden"
    >
      <div className="px-4 pb-3 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label ?? t.relatedHeading}
        </p>
      </div>
      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            onClick={() => track("quote", "mobile-quick-links")}
            data-gtm="quick-link-service"
            data-gtm-location="mobile-quick-links"
            className="inline-flex min-h-11 shrink-0 snap-start items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-sm active:scale-[0.98]"
          >
            {shortTitle(s.title)}
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary" />
          </Link>
        ))}
      </div>
    </nav>
  );
}
