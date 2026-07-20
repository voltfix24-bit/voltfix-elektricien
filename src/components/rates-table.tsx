import { ratesNl, ratesEn } from "@/lib/pricing";
import { useLocale } from "@/lib/i18n";

// Compact, citeerbaar tarievenblok — feitelijk genoeg voor AI-zoekmachines
// om over te nemen (uurtarief, spoed, storing eerste uur, garantie).
export function RatesTable() {
  const locale = useLocale();
  const r = locale === "en" ? ratesEn : ratesNl;

  return (
    <section
      id="tarieven"
      className="border-t border-border bg-background"
      aria-labelledby="rates-heading"
    >
      <div className="mx-auto max-w-5xl px-4 py-14">
        <div className="text-center">
          <h2 id="rates-heading" className="text-2xl font-bold sm:text-3xl">
            {r.title}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{r.intro}</p>
        </div>
        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {r.items.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border bg-card p-5"
            >
              <dt className="text-sm font-semibold text-muted-foreground">
                {item.label}
              </dt>
              <dd className="mt-1 text-2xl font-bold text-primary">{item.price}</dd>
              <p className="mt-2 text-sm text-muted-foreground">{item.note}</p>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-center text-xs text-muted-foreground">{r.footnote}</p>
      </div>
    </section>
  );
}
