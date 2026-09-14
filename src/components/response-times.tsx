import { Clock, MapPin } from "lucide-react";
import { useLocale } from "@/lib/i18n";

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
  const en = useLocale() === "en";
  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-5xl px-4 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 t-meta font-semibold text-primary">
            <Clock className="h-3.5 w-3.5" /> {en ? "Indicative response times" : "Indicatieve responstijden"}
          </span>
          <h2 className="mt-4 text-2xl font-bold sm:text-3xl">{en ? "How quickly can we reach you?" : "Hoe snel zijn we bij je?"}</h2>
          <p className="mt-3 text-base font-semibold text-foreground">
            {en ? "Our promise: on site within 60 minutes for emergencies across Amsterdam." : "Onze belofte: bij spoed binnen 60 minuten in heel Amsterdam."}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {en ? "These are daytime targets by area. At night, weekends or in severe traffic it may take longer; we always give you a realistic arrival time on the phone." : "Hieronder staan de richttijden overdag per regio. 's Nachts, in het weekend en bij extreme spits kan het langer duren; je hoort aan de telefoon altijd een reële aankomsttijd."}
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full table-fixed text-left text-sm">
            <thead className="bg-background t-meta uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-2/3 px-3 py-3 font-semibold sm:px-6">{en ? "Area" : "Regio"}</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">{en ? "Neighbourhoods" : "Wijken"}</th>
                <th className="w-1/3 break-words px-3 py-3 text-right font-semibold sm:px-6">{en ? "Target" : "Streeftijd"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {regions.map((r) => (
                <tr key={r.name} className="align-top">
                   <td className="min-w-0 break-words px-3 py-4 sm:px-6">
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div>
                        <div className="font-semibold text-foreground">{r.name}</div>
                        <div className="mt-1 t-meta text-muted-foreground md:hidden">
                          {r.neighborhoods}
                        </div>
                        <div className="mt-1 t-meta text-muted-foreground">{r.note}</div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-4 text-muted-foreground md:table-cell">
                    {r.neighborhoods}
                  </td>
                   <td className="break-words px-3 py-4 text-right font-bold text-primary sm:px-6">{r.eta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-center t-meta text-muted-foreground">
          {en ? "Response times are indicative and depend on time, traffic and availability." : "Responstijden zijn indicatief en afhankelijk van tijdstip, verkeer en drukte."} VoltFix · Jacob Van Lennepkade 142, 1053 MV Amsterdam.
        </p>
      </div>
    </section>
  );
}
