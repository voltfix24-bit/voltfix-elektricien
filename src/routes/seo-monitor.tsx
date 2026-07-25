import { createFileRoute, useServerFn } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ExternalLink, RefreshCw, XCircle } from "lucide-react";
import { inspectImportantUrls, type IndexRow } from "@/lib/gsc.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/seo-monitor")({
  head: () => ({
    meta: [
      { title: "SEO Monitor — VoltFix" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SeoMonitorPage,
});

function statusStyle(row: IndexRow) {
  if (row.error) return { color: "bg-red-100 text-red-800 border-red-300", Icon: XCircle };
  if (row.isWarning) return { color: "bg-amber-100 text-amber-900 border-amber-300", Icon: AlertTriangle };
  if (row.verdict === "PASS")
    return { color: "bg-green-100 text-green-800 border-green-300", Icon: CheckCircle2 };
  return { color: "bg-slate-100 text-slate-700 border-slate-300", Icon: CheckCircle2 };
}

function SeoMonitorPage() {
  const inspect = useServerFn(inspectImportantUrls);
  const { data, isFetching, refetch, error } = useQuery({
    queryKey: ["seo-monitor"],
    queryFn: () => inspect(),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 30,
  });

  const rows = data?.rows ?? [];
  const warnings = rows.filter((r) => r.isWarning && !r.error);
  const errors = rows.filter((r) => r.error);
  const ok = rows.filter((r) => !r.isWarning && !r.error);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">SEO Monitor</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Live indexstatus van kernpagina's via Google Search Console.
          </p>
        </div>
        <Button onClick={() => refetch()} disabled={isFetching} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          {isFetching ? "Ophalen…" : "Vernieuwen"}
        </Button>
      </div>

      {error && (
        <Card className="p-4 mb-4 border-red-300 bg-red-50 text-red-800">
          {(error as Error).message}
        </Card>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-700">{ok.length}</div>
          <div className="text-xs text-muted-foreground">Geïndexeerd / OK</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-amber-700">{warnings.length}</div>
          <div className="text-xs text-muted-foreground">Waarschuwingen</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-700">{errors.length}</div>
          <div className="text-xs text-muted-foreground">Fouten</div>
        </Card>
      </div>

      {warnings.length > 0 && (
        <Card className="p-4 mb-6 border-amber-300 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-700 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-900">
                {warnings.length} pagina('s) hebben aandacht nodig
              </div>
              <ul className="text-sm text-amber-900 mt-2 list-disc pl-5 space-y-1">
                {warnings.map((w) => (
                  <li key={w.url}>
                    <strong>{w.label}</strong> — {w.coverageState}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-amber-800 mt-3">
                Vraag handmatige indexering aan via Search Console → URL-inspectie → "Request indexing".
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Pagina</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Laatste crawl</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && isFetching && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Bezig met inspecteren van {24} URL's… (~30-60s)
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const { color, Icon } = statusStyle(row);
              return (
                <tr key={row.url} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.label}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[320px]">
                      {row.url.replace("https://www.voltfix.nl", "")}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`gap-1 border ${color}`}>
                      <Icon className="h-3 w-3" />
                      {row.error ? "Fout" : row.coverageState}
                    </Badge>
                    {row.error && (
                      <div className="text-xs text-red-700 mt-1">{row.error}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {row.lastCrawlTime
                      ? new Date(row.lastCrawlTime).toLocaleDateString("nl-NL")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={`https://search.google.com/search-console/inspect?resource_id=sc-domain:voltfix.nl&id=${encodeURIComponent(row.url)}`}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      GSC <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {data?.checkedAt && (
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Laatst gecontroleerd: {new Date(data.checkedAt).toLocaleString("nl-NL")}
        </p>
      )}
    </div>
  );
}
