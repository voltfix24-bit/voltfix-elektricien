import { Link } from "@tanstack/react-router";
import { MapPin, Zap } from "lucide-react";
import { locations } from "@/data/locations";

type Props = {
  title?: string;
  intro?: string;
  className?: string;
  includeEmergency?: boolean;
};

/**
 * Interne linkblok naar alle wijk- en regiopagina's + spoedpagina.
 * Verhoogt linkkracht naar diepere pagina's en helpt Google met crawlen/indexeren.
 */
export function NeighborhoodLinks({
  title = "Elektricien per wijk en regio",
  intro = "Kies uw wijk of regio voor lokale reactietijden, straten en buurt-specifieke informatie.",
  className = "",
  includeEmergency = true,
}: Props) {
  const amsterdam = locations.filter((l) => l.region === "Amsterdam");
  const regio = locations.filter((l) => l.region === "Regio Amsterdam");

  return (
    <section className={`border-y border-border bg-surface ${className}`}>
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold">{title}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{intro}</p>
        </div>

        {includeEmergency && (
          <Link
            to="/spoed-elektricien-amsterdam"
            className="mb-6 flex items-center justify-between gap-3 rounded-lg border-2 border-red-300 bg-red-50 px-5 py-4 transition hover:border-red-400 hover:bg-red-100"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-red-600 text-white">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-red-900">Spoed elektricien Amsterdam — 24/7</div>
                <div className="text-sm text-red-800">
                  Stroomstoring, kortsluiting of rook uit de meterkast? Bekijk reactietijden per wijk.
                </div>
              </div>
            </div>
            <span aria-hidden className="text-red-700">→</span>
          </Link>
        )}

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Amsterdam
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {amsterdam.map((l) => (
              <li key={l.path}>
                <Link
                  to={l.path}
                  className="group flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2.5 transition hover:border-primary hover:bg-primary/5"
                >
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <div className="truncate font-medium group-hover:text-primary">
                      Elektricien {l.name}
                    </div>
                    {l.neighborhoods && l.neighborhoods.length > 0 && (
                      <div className="truncate text-xs text-muted-foreground">
                        {l.neighborhoods.slice(0, 3).join(" · ")}
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {regio.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Regio Amsterdam
            </h3>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {regio.map((l) => (
                <li key={l.path}>
                  <Link
                    to={l.path}
                    className="group flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2.5 transition hover:border-primary hover:bg-primary/5"
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <div className="truncate font-medium group-hover:text-primary">
                        Elektricien {l.name}
                      </div>
                      {l.neighborhoods && l.neighborhoods.length > 0 && (
                        <div className="truncate text-xs text-muted-foreground">
                          {l.neighborhoods.slice(0, 3).join(" · ")}
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
