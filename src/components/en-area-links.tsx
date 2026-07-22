import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

const EN_AREAS = [
  { to: "/en-gb/electrician-amsterdam-zuid", label: "Amsterdam Zuid" },
  { to: "/en-gb/electrician-amsterdam-west", label: "Amsterdam West" },
  { to: "/en-gb/electrician-amsterdam-centre", label: "Amsterdam Centre" },
  { to: "/en-gb/electrician-amstelveen", label: "Amstelveen" },
] as const;

type Props = { currentPath?: string; heading?: string };

export function EnAreaLinks({
  currentPath,
  heading = "English-speaking electrician by neighbourhood",
}: Props) {
  const items = EN_AREAS.filter((a) => a.to !== currentPath);
  if (items.length === 0) return null;
  return (
    <section className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold sm:text-3xl">{heading}</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Local, certified and English-speaking — VoltFix covers Amsterdam and the surrounding area.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="group inline-flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <MapPin className="h-4 w-4 text-primary" />
              Electrician {a.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
