import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Send, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { INDEXNOW_KEY_LOCATION, type IndexNowResult } from "@/lib/indexnow";
import { pingIndexNowFn } from "@/lib/indexnow.functions";
import { SITE_ENTRIES } from "@/lib/site-urls";

export const Route = createFileRoute("/indexnow")({
  head: () => ({
    meta: [
      { title: "IndexNow — Bing indexatie | VoltFix" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: IndexNowPage,
});

function IndexNowPage() {
  const ping = useServerFn(pingIndexNowFn);
  const [input, setInput] = useState("");

  const mutation = useMutation<IndexNowResult, Error, string[] | undefined>({
    mutationFn: async (urls) => (await ping({ data: { urls } })) as IndexNowResult,
  });

  const result = mutation.data;

  function submitSelection() {
    const urls = input
      .split(/[\n,\s]+/)
      .map((u) => u.trim())
      .filter(Boolean);
    mutation.mutate(urls.length > 0 ? urls : undefined);
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">IndexNow — directe indexatie bij Bing</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Meldt gewijzigde pagina's direct bij Bing (en Yandex, Seznam, Naver). Bing haalt de
        pagina daarna meestal binnen minuten op in plaats van bij de volgende crawl.
      </p>

      <Card className="mt-6 p-4 sm:p-6">
        <Label htmlFor="urls">Specifieke pagina's (optioneel)</Label>
        <Textarea
          id="urls"
          rows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={"/groepenkast-amsterdam\n/spoed-elektricien-amsterdam"}
          className="mt-2"
        />
        <p className="text-muted-foreground mt-1 text-xs">
          Eén pad of volledige URL per regel. Laat leeg om alle {SITE_ENTRIES.length} pagina's
          uit de sitemap aan te bieden.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={submitSelection} disabled={mutation.isPending} className="gap-2">
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {input.trim() ? "Ping deze pagina's" : "Ping alle pagina's"}
          </Button>
          <Button
            variant="outline"
            onClick={() => mutation.mutate(undefined)}
            disabled={mutation.isPending}
          >
            Volledige sitemap aanbieden
          </Button>
        </div>
      </Card>

      {mutation.error && (
        <Card className="mt-6 border-red-300 bg-red-50 p-4 text-sm text-red-800">
          {mutation.error.message}
        </Card>
      )}

      {result && (
        <Card
          className={`mt-6 border p-4 text-sm ${
            result.accepted
              ? "border-green-300 bg-green-50 text-green-900"
              : "border-red-300 bg-red-50 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {result.accepted ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            {result.submitted} URL{result.submitted === 1 ? "" : "'s"} aangeboden · status{" "}
            {result.status}
          </div>
          <p className="mt-1">{result.message}</p>
          <p className="mt-2 text-xs opacity-80">
            {new Date(result.submittedAt).toLocaleString("nl-NL")}
          </p>
        </Card>
      )}

      <p className="text-muted-foreground mt-6 text-xs">
        Verificatiesleutel:{" "}
        <a href={INDEXNOW_KEY_LOCATION} className="underline" rel="noreferrer">
          {INDEXNOW_KEY_LOCATION}
        </a>{" "}
        — dit bestand moet bereikbaar blijven, anders weigert Bing de meldingen.
      </p>
    </div>
  );
}
