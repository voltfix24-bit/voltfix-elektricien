import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowUp, Camera, Minus, TrendingUp } from "lucide-react";
import { getRankReport, captureRankSnapshotNow } from "@/lib/rank-tracking.functions";
import {
  TRACKED_CLUSTERS,
  formatDelta,
  type RankReport,
  type RankRow,
} from "@/lib/rank-tracking";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

function DeltaBadge({ row }: { row: RankRow }) {
  if (row.delta === null) {
    return (
      <Badge className="gap-1 border bg-slate-100 text-slate-600 border-slate-300">
        <Minus className="h-3 w-3" />
        nieuw
      </Badge>
    );
  }
  if (row.delta > 0.2) {
    return (
      <Badge className="gap-1 border bg-green-100 text-green-800 border-green-300">
        <ArrowUp className="h-3 w-3" />
        {formatDelta(row.delta)}
      </Badge>
    );
  }
  if (row.delta < -0.2) {
    return (
      <Badge className="gap-1 border bg-red-100 text-red-800 border-red-300">
        <ArrowDown className="h-3 w-3" />
        {formatDelta(row.delta)}
      </Badge>
    );
  }
  return (
    <Badge className="gap-1 border bg-slate-100 text-slate-700 border-slate-300">
      <Minus className="h-3 w-3" />
      stabiel
    </Badge>
  );
}

function positionColor(position: number | null) {
  if (position === null) return "text-muted-foreground";
  if (position <= 3) return "text-green-700 font-bold";
  if (position <= 10) return "text-emerald-700 font-semibold";
  if (position <= 20) return "text-amber-700 font-semibold";
  return "text-slate-600";
}

export function RankTracker() {
  const fetchReport = useServerFn(getRankReport);
  const capture = useServerFn(captureRankSnapshotNow);
  const [cluster, setCluster] = useState<string>("Alle");

  const { data, isFetching, refetch, error } = useQuery<RankReport>({
    queryKey: ["rank-report"],
    queryFn: () => fetchReport() as Promise<RankReport>,
    refetchOnWindowFocus: false,
  });

  const snapshot = useMutation({
    mutationFn: () => capture() as Promise<{ weekStart: string; withImpressions: number }>,
    onSuccess: () => refetch(),
  });

  const rows = useMemo(() => {
    const all = data?.rows ?? [];
    return cluster === "Alle" ? all : all.filter((r) => r.cluster === cluster);
  }, [data, cluster]);

  const hasData = (data?.weekStart ?? "") !== "";

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Rangtracking
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {hasData
              ? `Meetweek vanaf ${new Date(data!.weekStart).toLocaleDateString("nl-NL")}${
                  data!.previousWeekStart
                    ? ` — vergeleken met ${new Date(data!.previousWeekStart).toLocaleDateString("nl-NL")}`
                    : " — nog geen vergelijkweek"
                }`
              : "Nog geen metingen opgeslagen. Draai de eerste meting hieronder."}
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => snapshot.mutate()}
          disabled={snapshot.isPending}
        >
          <Camera className={`h-4 w-4 ${snapshot.isPending ? "animate-pulse" : ""}`} />
          {snapshot.isPending ? "Meten…" : "Meting nu draaien"}
        </Button>
      </div>

      {(error || snapshot.error) && (
        <Card className="p-4 mb-4 border-red-300 bg-red-50 text-red-800 text-sm">
          {((error ?? snapshot.error) as Error).message}
        </Card>
      )}

      {hasData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-700">{data!.summary.improved}</div>
            <div className="text-xs text-muted-foreground">Gestegen</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-red-700">{data!.summary.declined}</div>
            <div className="text-xs text-muted-foreground">Gedaald</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-slate-700">{data!.summary.stable}</div>
            <div className="text-xs text-muted-foreground">Stabiel</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-amber-700">{data!.summary.unranked}</div>
            <div className="text-xs text-muted-foreground">Geen vertoningen</div>
          </Card>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {["Alle", ...TRACKED_CLUSTERS].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCluster(c)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              cluster === c
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Zoekwoord</th>
              <th className="px-4 py-3 font-medium">Positie</th>
              <th className="px-4 py-3 font-medium">Verschil</th>
              <th className="px-4 py-3 font-medium">Vertoningen</th>
              <th className="px-4 py-3 font-medium">Klikken</th>
              <th className="px-4 py-3 font-medium">Pagina</th>
            </tr>
          </thead>
          <tbody>
            {isFetching && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Rapport laden…
                </td>
              </tr>
            )}
            {!isFetching && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nog geen meetgegevens. Klik op "Meting nu draaien".
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.keyword} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{row.keyword}</div>
                  <div className="text-xs text-muted-foreground">{row.cluster}</div>
                </td>
                <td className={`px-4 py-3 ${positionColor(row.position)}`}>
                  {row.position !== null ? row.position.toFixed(1) : "—"}
                </td>
                <td className="px-4 py-3">
                  <DeltaBadge row={row} />
                </td>
                <td className="px-4 py-3">{row.impressions}</td>
                <td className="px-4 py-3">{row.clicks}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-[220px] truncate">
                  {row.topPage ? row.topPage.replace("https://www.voltfix.nl", "") || "/" : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <p className="text-xs text-muted-foreground mt-3">
        Metingen draaien automatisch elke maandag om 06:00. Search Console loopt ~3 dagen achter,
        dus elke meting beslaat de 7 volledige dagen die 3 dagen geleden eindigden.
      </p>
    </section>
  );
}
