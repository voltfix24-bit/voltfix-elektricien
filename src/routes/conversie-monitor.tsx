import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Phone, RefreshCw, CalendarClock, FileText, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getConversionReport } from "@/lib/conversion-report.functions";
import {
  REPORT_RANGES,
  share,
  type ConversionBreakdownRow,
  type ConversionReport,
  type ReportRange,
} from "@/lib/conversion-report";

export const Route = createFileRoute("/conversie-monitor")({
  head: () => ({
    meta: [
      { title: "Conversie Monitor — VoltFix" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ConversionMonitorPage,
});


function BreakdownTable({
  title,
  subtitle,
  rows,
  total,
  keyHeader,
}: {
  title: string;
  subtitle: string;
  rows: ConversionBreakdownRow[];
  total: number;
  keyHeader: string;
}) {
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Nog geen conversies in deze periode.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3 font-medium">{keyHeader}</th>
                <th className="py-2 px-3 text-right font-medium">Totaal</th>
                <th className="py-2 px-3 text-right font-medium">Aandeel</th>
                <th className="py-2 px-3 text-right font-medium">Bellen</th>
                <th className="py-2 px-3 text-right font-medium">WhatsApp</th>
                <th className="py-2 px-3 text-right font-medium">Offerte</th>
                <th className="py-2 pl-3 text-right font-medium">Afspraak</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-medium">{row.label}</td>
                  <td className="py-2 px-3 text-right font-semibold">{row.total}</td>
                  <td className="py-2 px-3 text-right text-muted-foreground">
                    {share(row.total, total)}
                  </td>
                  <td className="py-2 px-3 text-right">{row.call}</td>
                  <td className="py-2 px-3 text-right">{row.whatsapp}</td>
                  <td className="py-2 px-3 text-right">{row.quote}</td>
                  <td className="py-2 pl-3 text-right">{row.schedule}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function ConversionMonitorPage() {
  const [days, setDays] = useState<ReportRange>(30);
  const fetchReport = useServerFn(getConversionReport);

  const { data, isFetching, refetch, error } = useQuery<ConversionReport>({
    queryKey: ["conversion-report", days],
    queryFn: () => fetchReport({ data: { days } }) as Promise<ConversionReport>,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  const totals = data?.totals ?? { total: 0, call: 0, whatsapp: 0, quote: 0, schedule: 0 };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Conversie Monitor</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bel-, WhatsApp-, offerte- en afspraakkliks per apparaat en bron. Eigen meting, los van
            GA4 — werkt ook als bezoekers analytics-cookies weigeren.
          </p>
        </div>
        <Button onClick={() => refetch()} disabled={isFetching} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          {isFetching ? "Ophalen…" : "Vernieuwen"}
        </Button>
      </div>

      <div className="mb-6 flex gap-2">
        {REPORT_RANGES.map((range) => (
          <Button
            key={range}
            variant={days === range ? "default" : "outline"}
            size="sm"
            onClick={() => setDays(range)}
          >
            {range} dagen
          </Button>
        ))}
      </div>

      {error && (
        <Card className="mb-4 border-red-300 bg-red-50 p-4 text-red-800">
          {(error as Error).message}
        </Card>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-6">
        <Card className="p-4">
          <div className="text-2xl font-bold">{totals.total}</div>
          <div className="text-xs text-muted-foreground">Leads totaal (excl. social)</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-2xl font-bold text-red-700">
            <Phone className="h-5 w-5" /> {totals.call}
          </div>
          <div className="text-xs text-muted-foreground">Bellen</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-2xl font-bold text-emerald-700">
            <MessageCircle className="h-5 w-5" /> {totals.whatsapp}
          </div>
          <div className="text-xs text-muted-foreground">WhatsApp</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-2xl font-bold">
            <FileText className="h-5 w-5" /> {totals.quote}
          </div>
          <div className="text-xs text-muted-foreground">Offerte</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-2xl font-bold">
            <CalendarClock className="h-5 w-5" /> {totals.schedule}
          </div>
          <div className="text-xs text-muted-foreground">Afspraak</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-muted-foreground">{totals.social}</div>
          <div className="text-xs text-muted-foreground">Social clicks (engagement)</div>
        </Card>
      </div>


      <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700" />
          <div className="text-sm text-emerald-900">
            <p className="font-semibold">WhatsApp-meting</p>
            <p className="mt-1">
              We meten elke klik op een WhatsApp-knop (zowel op de site als in het conversiedashboard
              hieronder). Of iemand daadwerkelijk een bericht verstuurt in WhatsApp, kun je alleen zien
              via de WhatsApp Business API van Meta.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="p-5">
          <h2 className="text-lg font-semibold">WhatsApp-kliks per knop-locatie</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Welke WhatsApp-knoppen worden het meest aangeklikt? Zo weet je waar je CTA's optimaliseert.
          </p>
          {(data?.whatsappByLocation ?? []).length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Nog geen WhatsApp-kliks in deze periode.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Locatie</th>
                    <th className="py-2 px-3 text-right font-medium">Kliks</th>
                    <th className="py-2 pl-3 text-right font-medium">Aandeel</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.whatsappByLocation.map((row) => (
                    <tr key={row.key} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">{row.label}</td>
                      <td className="py-2 px-3 text-right font-semibold">{row.count}</td>
                      <td className="py-2 pl-3 text-right text-muted-foreground">
                        {share(row.count, totals.whatsapp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <BreakdownTable
          title="Per apparaat"
          subtitle="Spoedklanten bellen vooral mobiel — hier zie je of dat klopt."
          rows={data?.byDevice ?? []}
          total={totals.total}
          keyHeader="Apparaat"
        />
        <BreakdownTable
          title="Per bron"
          subtitle="Waar de bezoeker vandaan kwam: Google, Maps, campagne, social of direct."
          rows={data?.bySource ?? []}
          total={totals.total}
          keyHeader="Bron"
        />
        <BreakdownTable
          title="Top pagina's"
          subtitle="Welke pagina's daadwerkelijk contact opleveren (max. 15)."
          rows={data?.byPage ?? []}
          total={totals.total}
          keyHeader="Pagina"
        />

        <Card className="p-5">
          <h2 className="text-lg font-semibold">Gefilterd bot- en spamverkeer</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Deze hits zijn herkend als crawler, script of referral-spam en tellen niet mee in de
            cijfers hierboven. Zo blijven je conversie- en bouncecijfers realistisch.
          </p>
          {(data?.filteredBots.byReason ?? []).length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Geen bot- of spamhits gefilterd in deze periode.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <p className="mb-3 text-sm">
                Totaal gefilterd:{" "}
                <span className="font-semibold">{data?.filteredBots.total ?? 0}</span> hits
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Reden</th>
                    <th className="py-2 pl-3 text-right font-medium">Hits</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.filteredBots.byReason.map((row) => (
                    <tr key={row.key} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">{row.label}</td>
                      <td className="py-2 pl-3 text-right font-semibold">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}

