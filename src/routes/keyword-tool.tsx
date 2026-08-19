import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Download, Loader2, Minus, Search, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DATABASES,
  DUTCH_CITIES,
  formatCpc,
  formatVolume,
  toCsv,
  type KeywordReport,
  type KeywordResult,
} from "@/lib/keyword-research";
import { researchKeywordsFn } from "@/lib/keyword-research.functions";

export const Route = createFileRoute("/keyword-tool")({
  head: () => ({
    meta: [
      { title: "Keyword Research Tool — VoltFix" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: KeywordToolPage,
});

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <span className="text-muted-foreground text-xs">—</span>;
  const max = Math.max(...values) || 1;
  return (
    <div className="flex h-6 items-end gap-[2px]" aria-hidden="true">
      {values.map((v, i) => (
        <span
          key={i}
          className="w-[3px] rounded-sm bg-primary/60"
          style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

function TrendBadge({ row }: { row: KeywordResult }) {
  const map = {
    stijgend: { Icon: TrendingUp, className: "border-green-300 bg-green-50 text-green-800" },
    dalend: { Icon: TrendingDown, className: "border-red-300 bg-red-50 text-red-800" },
    stabiel: { Icon: Minus, className: "border-slate-300 bg-slate-50 text-slate-700" },
  } as const;
  const { Icon, className } = map[row.trendDirection];
  return (
    <Badge className={`gap-1 border ${className}`}>
      <Icon className="h-3 w-3" />
      {row.trendDirection}
      {row.trendChange != null && ` ${row.trendChange > 0 ? "+" : ""}${row.trendChange.toFixed(0)}%`}
    </Badge>
  );
}

function CompetitionBadge({ row }: { row: KeywordResult }) {
  const className =
    row.competitionLevel === "hoog"
      ? "border-red-300 bg-red-50 text-red-800"
      : row.competitionLevel === "gemiddeld"
        ? "border-amber-300 bg-amber-50 text-amber-900"
        : "border-green-300 bg-green-50 text-green-800";
  return (
    <Badge className={`border ${className}`}>
      {row.competitionLevel}
      {row.competition != null && ` (${row.competition.toFixed(2)})`}
    </Badge>
  );
}

function ResultTable({ rows, title }: { rows: KeywordResult[]; title: string }) {
  if (rows.length === 0) return null;
  const maxVolume = Math.max(...rows.map((r) => r.volume), 1);

  return (
    <Card className="mt-6 overflow-hidden">
      <div className="border-b px-4 py-3 text-sm font-semibold">{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Zoekwoord</th>
              <th className="px-4 py-3 font-medium">Volume / maand</th>
              <th className="px-4 py-3 font-medium">CPC</th>
              <th className="px-4 py-3 font-medium">Competitie</th>
              <th className="px-4 py-3 font-medium">Trend (12 mnd)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.keyword} className="border-t align-middle">
                <td className="px-4 py-3 font-medium">{row.keyword}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums">{formatVolume(row.volume)}</span>
                    <span className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-muted sm:block">
                      <span
                        className="block h-full rounded-full bg-primary"
                        style={{ width: `${(row.volume / maxVolume) * 100}%` }}
                      />
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 tabular-nums">{formatCpc(row.cpc)}</td>
                <td className="px-4 py-3">
                  <CompetitionBadge row={row} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Sparkline values={row.trend} />
                    <TrendBadge row={row} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function KeywordToolPage() {
  const research = useServerFn(researchKeywordsFn);
  const [input, setInput] = useState("elektricien amsterdam");
  const [database, setDatabase] = useState("nl");
  const [withCities, setWithCities] = useState(false);

  const mutation = useMutation<KeywordReport, Error, void>({
    mutationFn: async () => {
      const base = input
        .split(/[\n,]/)
        .map((k) => k.trim())
        .filter(Boolean);
      const keywords = withCities
        ? [
            ...base,
            ...base.flatMap((k) =>
              DUTCH_CITIES.filter((c) => !k.toLowerCase().includes(c)).map((c) => `${k} ${c}`),
            ),
          ]
        : base;
      return research({ data: { keywords, database, relatedLimit: 15 } }) as Promise<KeywordReport>;
    },
  });

  const report = mutation.data;

  function exportCsv() {
    if (!report) return;
    const blob = new Blob([`\uFEFF${toCsv(report)}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `keywords-${report.database}-${report.fetchedAt.slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">Keyword Research Tool</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Zoekvolume, CPC, competitie en trend per zoekwoord. Data via Semrush (Nederlandse
        database) — sterk richtinggevend voor zowel Google als Bing.
      </p>

      <Card className="mt-6 p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
          <div>
            <Label htmlFor="keywords">Zoekwoord(en)</Label>
            <Textarea
              id="keywords"
              rows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={"elektricien amsterdam\ngroepenkast vervangen"}
              className="mt-2"
            />
            <p className="text-muted-foreground mt-1 text-xs">
              Meerdere zoekwoorden: één per regel of gescheiden door komma's (max. 25).
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="database">Land</Label>
              <Select value={database} onValueChange={setDatabase}>
                <SelectTrigger id="database" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATABASES.map((d) => (
                    <SelectItem key={d.code} value={d.code}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start gap-3 rounded-md border p-3">
              <Switch id="cities" checked={withCities} onCheckedChange={setWithCities} />
              <Label htmlFor="cities" className="text-xs leading-snug font-normal">
                Lokale varianten toevoegen (Amsterdam, Amstelveen, Diemen…)
              </Label>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || input.trim() === ""}
            className="gap-2"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {mutation.isPending ? "Bezig met onderzoeken…" : "Onderzoek zoekwoorden"}
          </Button>
          <Button variant="outline" onClick={exportCsv} disabled={!report} className="gap-2">
            <Download className="h-4 w-4" />
            Exporteer CSV
          </Button>
        </div>
      </Card>

      {mutation.error && (
        <Card className="mt-6 border-red-300 bg-red-50 p-4 text-sm text-red-800">
          {mutation.error.message}
        </Card>
      )}

      {report && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="p-4">
              <div className="text-2xl font-bold">{report.keywords.length}</div>
              <div className="text-muted-foreground text-xs">Zoekwoorden met data</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">
                {formatVolume(report.keywords.reduce((s, r) => s + r.volume, 0))}
              </div>
              <div className="text-muted-foreground text-xs">Totaal volume / maand</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">
                {formatCpc(
                  report.keywords.length
                    ? report.keywords.reduce((s, r) => s + (r.cpc ?? 0), 0) /
                        report.keywords.length
                    : null,
                )}
              </div>
              <div className="text-muted-foreground text-xs">Gemiddelde CPC</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">{report.related.length}</div>
              <div className="text-muted-foreground text-xs">Gerelateerde termen</div>
            </Card>
          </div>

          <ResultTable rows={report.keywords} title="Vergelijking van je zoekwoorden" />
          <ResultTable rows={report.related} title="Gerelateerde zoekwoorden" />

          {report.notFound.length > 0 && (
            <Card className="mt-6 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              Geen data gevonden voor: {report.notFound.join(", ")}. Deze zoekwoorden hebben te
              weinig zoekvolume om te meten.
            </Card>
          )}

          <p className="text-muted-foreground mt-4 text-center text-xs">
            Opgehaald: {new Date(report.fetchedAt).toLocaleString("nl-NL")} · bron: Semrush (
            {report.database})
          </p>
        </>
      )}
    </div>
  );
}
