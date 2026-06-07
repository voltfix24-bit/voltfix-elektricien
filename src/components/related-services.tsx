import { Link } from "@tanstack/react-router";
import { ArrowRight, Gauge, Plug, Zap, ZapOff } from "lucide-react";

type Service = {
  to: string;
  title: string;
  icon: typeof Zap;
  text: string;
};

const allServices: Service[] = [
  {
    to: "/spoed-elektricien-amsterdam",
    title: "Spoed elektricien Amsterdam",
    icon: ZapOff,
    text: "Storing, kortsluiting of stroomuitval? 24/7 snel ter plaatse.",
  },
  {
    to: "/groepenkast-vervangen-amsterdam",
    title: "Groepenkast vervangen Amsterdam",
    icon: Gauge,
    text: "Veilige, moderne groepenkast met extra groepen en aardlekschakelaars.",
  },
  {
    to: "/perilex-aansluiten-amsterdam",
    title: "Perilex aansluiten Amsterdam",
    icon: Plug,
    text: "Kookgroep en perilex stopcontact voor inductie en fornuis.",
  },
  {
    to: "/stroomstoring-amsterdam",
    title: "Stroomstoring Amsterdam",
    icon: Zap,
    text: "Kortsluiting en stroomuitval snel opgespoord en verholpen.",
  },
];

export function RelatedServices({ currentPath }: { currentPath: string }) {
  const related = allServices.filter((s) => s.to !== currentPath);

  return (
    <section className="border-t border-border bg-card/50">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-bold sm:text-3xl">Ook interessant</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Ontdek onze andere diensten als elektricien in Amsterdam. VoltFix helpt
          u met alle elektra in en om huis of bedrijf.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {related.map(({ to, title, icon: Icon, text }) => (
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
                Meer info
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
