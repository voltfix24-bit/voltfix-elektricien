import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Info, RefreshCw } from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getBidAnalysis } from "@/lib/bid-analysis.functions";
import {
  applyFilters,
  assess,
  COMPETITION_LABEL,
  competitionPressure,
  EMPTY_FILTERS,
  euro,
  MATCH_LABEL,
  NO_DATA,
  number as formatNumber,
  percent,
  QUALITY_LABEL,
  RANGE_DAYS,
  SORT_LABEL,
  sortRows,
  statusLabel,
  summarize,
  TONE_CLASS,
  VERDICT_LABEL,
  type BidAnalysis,
  type Filters,
  type KeywordRow,
  type QualityLabel,
  type RangeDays,
  type SortKey,
  type Verdict,
} from "@/lib/bid-analysis";

export const Route = createFileRoute("/_authenticated/admin/biedingsanalyse")({
  head: () => ({
    meta: [
      { title: "Biedingsanalyse — VoltFix backoffice" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: BidAnalysisPage,
});

function dateTime(iso: string | null): string {
  if (!iso) return NO_DATA;
  return new Date(iso).toLocaleString("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  });
}

function Quality({ value }: { value: QualityLabel }) {
  if (!value) return <span className="text-muted-foreground">{NO_DATA}</span>;
  const tone =
    value === "BOVENGEMIDDELD"
      ? "text-green-800"
      : value === "GEMIDDELD"
        ? "text-slate-700"
        : "text-red-800";
  return <span className={tone}>{QUALITY_LABEL[value]}</span>;
}

function SummaryCard({
  title,
  value,
  hint,
  tone,
}: {
  title: string;
  value: string;
  hint: string;
  tone: "rood" | "oranje" | "groen" | "grijs";
}) {
  return (
    <Card className={`border p-4 ${TONE_CLASS[tone]}`}>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs opacity-80">{hint}</p>
    </Card>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td className="whitespace-nowrap px-3 py-2 align-top tabular-nums">{children}</td>;
}

function Head({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </th>
  );
}

function KeywordTable({ rows, targetCpa }: { rows: KeywordRow[]; targetCpa: number | null }) {
  if (rows.length === 0) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Geen zoekwoorden die aan de gekozen filters voldoen.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1600px] text-sm">
        <thead className="border-b bg-surface-muted">
          <tr>
            <Head>Zoekwoord</Head>
            <Head>Zoektype</Head>
            <Head>Campagne / advertentiegroep</Head>
            <Head>Status</Head>
            <Head>Max. CPC</Head>
            <Head>Gem. CPC</Head>
            <Head>Vertoningen</Head>
            <Head>Klikken</Head>
            <Head>CTR</Head>
            <Head>Kosten</Head>
            <Head>Conversies</Head>
            <Head>Conv.percentage</Head>
            <Head>Kosten/conversie</Head>
            <Head>Quality Score</Head>
            <Head>Verwachte CTR</Head>
            <Head>Adv.relevantie</Head>
            <Head>Landingspagina</Head>
            <Head>Zoekvert.aandeel</Head>
            <Head>Bovenaan</Head>
            <Head>Helemaal bovenaan</Head>
            <Head>Verlies rang</Head>
            <Head>Verlies budget</Head>
            <Head>Zoekvolume p/m</Head>
            <Head>Concurrentie</Head>
            <Head>Bod bovenaan laag</Head>
            <Head>Bod bovenaan hoog</Head>
            <Head>Beoordeling</Head>
            <Head>Aanbevolen actie</Head>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const verdict = assess(row, targetCpa);
            return (
              <tr key={`${row.adGroupId}-${row.criterionId}`} className="border-b align-top">
                <Cell>
                  <span className="font-medium">{row.keyword}</span>
                </Cell>
                <Cell>{MATCH_LABEL[row.matchType]}</Cell>
                <Cell>
                  <span className="block max-w-[260px] truncate" title={row.campaignName}>
                    {row.campaignName}
                  </span>
                  <span
                    className="block max-w-[260px] truncate text-xs text-muted-foreground"
                    title={row.adGroupName}
                  >
                    {row.adGroupName}
                  </span>
                </Cell>
                <Cell>{statusLabel(row.status)}</Cell>
                <Cell>{euro(row.maxCpc)}</Cell>
                <Cell>{euro(row.avgCpc)}</Cell>
                <Cell>{formatNumber(row.impressions)}</Cell>
                <Cell>{formatNumber(row.clicks)}</Cell>
                <Cell>{percent(row.ctr, 2)}</Cell>
                <Cell>{euro(row.cost)}</Cell>
                <Cell>{formatNumber(row.conversions, row.conversions % 1 === 0 ? 0 : 2)}</Cell>
                <Cell>{percent(row.conversionRate, 2)}</Cell>
                <Cell>{euro(row.costPerConversion)}</Cell>
                <Cell>{row.qualityScore ?? <span className="text-muted-foreground">{NO_DATA}</span>}</Cell>
                <Cell><Quality value={row.expectedCtr} /></Cell>
                <Cell><Quality value={row.adRelevance} /></Cell>
                <Cell><Quality value={row.landingPageExperience} /></Cell>
                <Cell>{percent(row.searchImpressionShare)}</Cell>
                <Cell>{percent(row.topImpressionShare)}</Cell>
                <Cell>{percent(row.absoluteTopImpressionShare)}</Cell>
                <Cell>{percent(row.lostRankShare)}</Cell>
                <Cell>{percent(row.lostBudgetShare)}</Cell>
                <Cell>{formatNumber(row.planner.avgMonthlySearches)}</Cell>
                <Cell>
                  {row.planner.competition ? COMPETITION_LABEL[row.planner.competition] : NO_DATA}
                  {row.planner.competitionIndex != null && (
                    <span className="block text-xs text-muted-foreground">
                      index {row.planner.competitionIndex}
                    </span>
                  )}
                </Cell>
                <Cell>{euro(row.planner.lowTopOfPageBid)}</Cell>
                <Cell>{euro(row.planner.highTopOfPageBid)}</Cell>
                <Cell>
                  <Badge className={`border ${TONE_CLASS[verdict.tone]}`}>{verdict.label}</Badge>
                  <p className="mt-1 max-w-[320px] whitespace-normal text-xs text-muted-foreground">
                    {verdict.explanation}
                  </p>
                </Cell>
                <Cell>
                  <span className="block max-w-[260px] whitespace-normal">{verdict.action}</span>
                </Cell>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PressureSection({ rows }: { rows: KeywordRow[] }) {
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold">Concurrentiedruk</h2>
      <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          Dit is een inschatting van de concurrentiedruk op basis van de concurrentie-index van
          Keyword Planner en je eigen vertoningsaandeel. Het zijn <strong>niet</strong> de biedingen
          van concurrenten: Google maakt exacte concurrentiebiedingen niet beschikbaar.
        </span>
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b bg-surface-muted">
            <tr>
              <Head>Zoekwoord</Head>
              <Head>Concurrentie-index</Head>
              <Head>Verlies door rang</Head>
              <Head>Zoekvertoningsaandeel</Head>
              <Head>Bovenaan</Head>
              <Head>Helemaal bovenaan</Head>
              <Head>Druk</Head>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const label = competitionPressure(row);
              const tone =
                label === "Hoog" ? "rood" : label === "Gemiddeld" ? "oranje" : label === "Laag" ? "groen" : "grijs";
              return (
                <tr key={`druk-${row.adGroupId}-${row.criterionId}`} className="border-b">
                  <Cell>{row.keyword}</Cell>
                  <Cell>{row.planner.competitionIndex ?? NO_DATA}</Cell>
                  <Cell>{percent(row.lostRankShare)}</Cell>
                  <Cell>{percent(row.searchImpressionShare)}</Cell>
                  <Cell>{percent(row.topImpressionShare)}</Cell>
                  <Cell>{percent(row.absoluteTopImpressionShare)}</Cell>
                  <Cell>
                    <Badge className={`border ${TONE_CLASS[tone as keyof typeof TONE_CLASS]}`}>{label}</Badge>
                  </Cell>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 rounded-md border border-border bg-surface-muted p-3 text-sm text-muted-foreground">
        Veilinginzichten (domein van concurrent, overlappercentage, percentage hogere positie,
        outranking share) zijn geen rapportbron in de Google Ads API en worden daarom hier niet
        getoond. Die cijfers staan in Google Ads zelf onder “Veilinginzichten”.
      </p>
    </Card>
  );
}

function BidAnalysisPage() {
  const fetchAnalysis = useServerFn(getBidAnalysis);

  const [accountId, setAccountId] = useState<string | null>(null);
  const [campaignId, setCampaignId] = useState<string>("alle");
  const [days, setDays] = useState<RangeDays>(30);
  const [targetCpaInput, setTargetCpaInput] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>("cost");

  const query = useQuery<BidAnalysis>({
    queryKey: ["biedingsanalyse", accountId, campaignId, days],
    queryFn: () =>
      fetchAnalysis({
        data: { accountId, campaignId, days, refresh: false },
      }) as Promise<BidAnalysis>,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const [refreshing, setRefreshing] = useState(false);
  async function refresh() {
    setRefreshing(true);
    try {
      await fetchAnalysis({ data: { accountId, campaignId, days, refresh: true } });
      await query.refetch();
    } finally {
      setRefreshing(false);
    }
  }

  const targetCpa = useMemo(() => {
    const parsed = Number(targetCpaInput.replace(",", "."));
    return targetCpaInput.trim() !== "" && Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [targetCpaInput]);

  const data = query.data;
  const allRows = data?.rows ?? [];
  const campaignRows = useMemo(
    () => (campaignId === "alle" ? allRows : allRows.filter((row) => row.campaignId === campaignId)),
    [allRows, campaignId],
  );
  const visibleRows = useMemo(
    () => sortRows(applyFilters(campaignRows, filters, targetCpa), sortKey),
    [campaignRows, filters, targetCpa, sortKey],
  );
  const summary = useMemo(() => summarize(campaignRows, targetCpa), [campaignRows, targetCpa]);

  const adGroups = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of campaignRows) if (row.adGroupId) map.set(row.adGroupId, row.adGroupName);
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [campaignRows]);

  return (
    <AdminShell
      title="Biedingsanalyse"
      context="Beoordeel per zoekwoord of je bod te laag, passend of onnodig hoog lijkt"
    >
      <div className="space-y-4">
        {/* Bovenbalk: account, campagne, periode, doel-CPA en verversen. */}
        <Card className="p-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-1.5">
              <Label htmlFor="account">Google Ads-account</Label>
              <Select
                value={accountId ?? data?.account.id ?? ""}
                onValueChange={(value) => setAccountId(value)}
              >
                <SelectTrigger id="account">
                  <SelectValue placeholder={data?.account.name ?? "Account laden…"} />
                </SelectTrigger>
                <SelectContent>
                  {(data?.accounts ?? []).map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="campagne">Campagne</Label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger id="campagne">
                  <SelectValue placeholder="Alle campagnes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle campagnes</SelectItem>
                  {(data?.campaigns ?? []).map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Periode</Label>
              <div className="flex gap-2">
                {RANGE_DAYS.map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant={days === option ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setDays(option)}
                  >
                    {option} dagen
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doel-cpa">Doel-CPA (optioneel)</Label>
              <Input
                id="doel-cpa"
                inputMode="decimal"
                placeholder="Bijvoorbeeld 45,00"
                value={targetCpaInput}
                onChange={(event) => setTargetCpaInput(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Gegevens</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={refresh}
                disabled={refreshing || query.isFetching}
              >
                <RefreshCw className={`size-4 ${refreshing || query.isFetching ? "animate-spin" : ""}`} />
                Gegevens vernieuwen
              </Button>
              <p className="text-xs text-muted-foreground">
                Laatste synchronisatie: {dateTime(data?.syncedAt ?? null)}
              </p>
            </div>
          </div>

          {data?.geoTarget && (
            <p className="mt-3 text-xs text-muted-foreground">
              Marktgegevens uit Keyword Planner voor {data.geoTarget}, Nederlands, Google Zoeken.
              Periode van de prestatiecijfers: {data.from} t/m {data.to}.
            </p>
          )}
        </Card>

        {query.error && (
          <Card className="flex items-start gap-3 border-red-300 bg-red-50 p-4 text-sm text-red-900">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{(query.error as Error).message}</span>
          </Card>
        )}

        {data?.plannerNote && (
          <Card className="flex items-start gap-3 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{data.plannerNote}</span>
          </Card>
        )}

        {data && !data.impressionShareAvailable && (
          <Card className="flex items-start gap-3 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Vertoningsaandeel is voor dit account niet opgehaald; die kolommen tonen daarom
              “{NO_DATA}”.
            </span>
          </Card>
        )}

        {/* Vier samenvattingsblokken. */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Waarschijnlijk te laag geboden"
            value={formatNumber(summary.tooLow)}
            hint="Bod onder de bandbreedte én verlies door rang"
            tone={summary.tooLow > 0 ? "rood" : "groen"}
          />
          <SummaryCard
            title="Kwaliteitsproblemen"
            value={formatNumber(summary.quality)}
            hint="Eerst advertentie en landingspagina verbeteren"
            tone={summary.quality > 0 ? "rood" : "groen"}
          />
          <SummaryCard
            title="Beperkt door budget"
            value={formatNumber(summary.budget)}
            hint="Minimaal 20% vertoningen verloren door budget"
            tone={summary.budget > 0 ? "oranje" : "groen"}
          />
          <SummaryCard
            title="Kosten boven doel-CPA"
            value={targetCpa == null ? NO_DATA : euro(summary.wasteAboveTarget)}
            hint={targetCpa == null ? "Vul een doel-CPA in om dit te berekenen" : "Kosten boven je doel-CPA in deze periode"}
            tone={targetCpa == null ? "grijs" : summary.wasteAboveTarget > 0 ? "oranje" : "groen"}
          />
        </div>

        {/* Filters en sortering. */}
        <Card className="p-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="filter-campagne">Campagne</Label>
              <Select
                value={filters.campaignId}
                onValueChange={(value) => setFilters({ ...filters, campaignId: value })}
              >
                <SelectTrigger id="filter-campagne"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle campagnes</SelectItem>
                  {(data?.campaigns ?? []).map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>{campaign.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="filter-adgroep">Advertentiegroep</Label>
              <Select
                value={filters.adGroupId}
                onValueChange={(value) => setFilters({ ...filters, adGroupId: value })}
              >
                <SelectTrigger id="filter-adgroep"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle advertentiegroepen</SelectItem>
                  {adGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="filter-zoektype">Zoektype</Label>
              <Select
                value={filters.matchType}
                onValueChange={(value) => setFilters({ ...filters, matchType: value })}
              >
                <SelectTrigger id="filter-zoektype"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle zoektypes</SelectItem>
                  <SelectItem value="EXACT">Exact</SelectItem>
                  <SelectItem value="PHRASE">Woordgroep</SelectItem>
                  <SelectItem value="BROAD">Breed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="filter-beoordeling">Beoordeling</Label>
              <Select
                value={filters.verdict}
                onValueChange={(value) => setFilters({ ...filters, verdict: value })}
              >
                <SelectTrigger id="filter-beoordeling"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle beoordelingen</SelectItem>
                  {(Object.keys(VERDICT_LABEL) as Verdict[]).map((verdict) => (
                    <SelectItem key={verdict} value={verdict}>{VERDICT_LABEL[verdict]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
            {(
              [
                ["onlyActive", "Alleen actieve zoekwoorden"],
                ["onlyRankLoss", "Alleen met advertentierangverlies"],
                ["onlyAboveTarget", "Alleen boven doel-CPA"],
                ["onlyLowQuality", "Alleen lage Quality Score"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <Switch
                  id={key}
                  checked={filters[key]}
                  onCheckedChange={(checked) => setFilters({ ...filters, [key]: checked })}
                />
                <Label htmlFor={key} className="text-sm font-normal">{label}</Label>
              </div>
            ))}

            <div className="ml-auto flex items-center gap-2">
              <Label htmlFor="sortering" className="text-sm font-normal">Sorteer op</Label>
              <Select value={sortKey} onValueChange={(value) => setSortKey(value as SortKey)}>
                <SelectTrigger id="sortering" className="w-[240px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(SORT_LABEL) as SortKey[]).map((key) => (
                    <SelectItem key={key} value={key}>{SORT_LABEL[key]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-lg font-semibold">Zoekwoorden</h2>
            <p className="text-sm text-muted-foreground">
              {query.isPending ? "Laden…" : `${formatNumber(visibleRows.length)} van ${formatNumber(campaignRows.length)}`}
            </p>
          </div>
          {query.isPending ? (
            <p className="p-6 text-sm text-muted-foreground">Gegevens worden opgehaald bij Google Ads…</p>
          ) : (
            <KeywordTable rows={visibleRows} targetCpa={targetCpa} />
          )}
        </Card>

        {!query.isPending && <PressureSection rows={visibleRows} />}

        <p className="pb-2 text-xs text-muted-foreground">
          Biedingen worden hier niet gewijzigd. Deze pagina is alleen om te beoordelen; een knop om
          een bod toe te passen komt pas met een apart bevestigingsscherm met oud en nieuw bod.
        </p>
      </div>
    </AdminShell>
  );
}
