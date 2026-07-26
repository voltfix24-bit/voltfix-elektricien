import { Clock, MapPin } from "lucide-react";

type Region = {
  name: string;
  neighborhoods: string;
  eta: string;
  note: string;
};

const regions: Region[] = [
  {
    name: "Amsterdam Centrum & Zuid",
    neighborhoods: "Grachtengordel, Jordaan, De Pijp, Rivierenbuurt, Oud-Zuid",
    eta: "20 – 40 min",
    note: "Onze thuisbasis — vaak binnen het half uur.",
  },
  {
    name: "Amsterdam West & Oost",
    neighborhoods: "Oud-West, Bos en Lommer, Watergraafsmeer, Indische Buurt",
    eta: "30 – 50 min",
    note: "Snel bereikbaar via ring A10.",
  },
  {
    name: "Amsterdam Noord",
    neighborhoods: "NDSM, Buiksloot, Nieuwendam, Tuindorp Oostzaan",
    eta: "35 – 55 min",
    note: "Via IJtunnel of Coentunnel — houd rekening met spits.",
  },
  {
    name: "IJburg & Zeeburg",
    neighborhoods: "Steigereiland, Haveneiland, KNSM-eiland, Zeeburgereiland",
    eta: "35 – 55 min",
    note: "Directe route via IJburglaan.",
  },
  {
    name: "Amsterdam Zuidoost",
    neighborhoods: "Bijlmer, Gaasperdam, Reigersbos",
    eta: "40 – 60 min",
    note: "Via A2 / Gooiseweg.",
  },
  {
    name: "Amstelveen & Diemen",
    neighborhoods: "Amstelveen, Diemen-Zuid, Duivendrecht",
    eta: "40 – 60 min",
    note: "Randgemeenten — ook 's avonds bereikbaar.",
  },
];

export function ResponseTimes() {
  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-5xl px-4 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Clock className="h-3.5 w-3.5" /> Indicatieve responstijden
          </span>
          <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Hoe snel zijn we bij u?</h2>
          <p className="mt-3 text-base font-semibold text-foreground">
            Onze belofte: bij spoed binnen 60 minuten in heel Amsterdam.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Hieronder de richttijden overdag per regio — allemaal binnen die 60 minuten. 's Nachts,
            in het weekend en bij extreme spits kan het iets langer duren; u hoort altijd binnen 5
            minuten een reële ETA.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold sm:px-6">Regio</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">Wijken</th>
                <th className="px-4 py-3 text-right font-semibold sm:px-6">Streeftijd</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {regions.map((r) => (
                <tr key={r.name} className="align-top">
                  <td className="px-4 py-4 sm:px-6">
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div>
                        <div className="font-semibold text-foreground">{r.name}</div>
                        <div className="mt-1 text-xs text-muted-foreground md:hidden">
                          {r.neighborhoods}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">{r.note}</div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-4 text-muted-foreground md:table-cell">
                    {r.neighborhoods}
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-primary sm:px-6">{r.eta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Responstijden zijn indicatief en afhankelijk van tijdstip, verkeer en drukte. VoltFix ·
          Jacob van Lennepkade 142, 1053 MV Amsterdam.
        </p>
      </div>
    </section>
  );
}
