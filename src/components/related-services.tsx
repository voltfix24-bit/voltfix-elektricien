import { Link } from "@tanstack/react-router";
import { ArrowRight, Gauge, Plug, Zap, ZapOff } from "lucide-react";

import { useT } from "@/lib/i18n";

const iconFor: Record<string, typeof Zap> = {
  spoed: ZapOff,
  groepenkast: Gauge,
  perilex: Plug,
  stroomstoring: Zap,
};

function iconForPath(to: string): typeof Zap {
  if (to.includes("spoed")) return iconFor.spoed;
  if (to.includes("groepenkast")) return iconFor.groepenkast;
  if (to.includes("perilex")) return iconFor.perilex;
  return iconFor.stroomstoring;
}

export function RelatedServices({ currentPath }: { currentPath: string }) {
  const t = useT();
  const related = t.related.filter((s) => s.to !== currentPath);

  return (
    <section className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-bold sm:text-3xl">{t.relatedHeading}</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">{t.relatedIntro}</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {related.map(({ to, title, text }) => {
            const Icon = iconForPath(to);
            return (
              <Link
                key={to}
                to={to}
                className="group flex flex-col rounded-xl border border-border bg-background p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-[var(--shadow-gold)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{text}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  {t.relatedMore}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
