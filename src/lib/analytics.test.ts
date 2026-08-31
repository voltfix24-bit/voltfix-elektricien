import { beforeEach, describe, expect, it, vi } from "vitest";

import { __resetFiredLeadIds, trackLeadSuccess } from "./analytics";

type DL = Record<string, unknown>[];

function setupWindow() {
  const dataLayer: DL = [];
  const gtag = vi.fn((...args: unknown[]) => {
    // gtag schrijft in werkelijkheid ook naar de dataLayer.
    dataLayer.push({ event: args[1] as string, ...(args[2] as object) });
  });
  const beacon = vi.fn(() => true);
  vi.stubGlobal("window", {
    dataLayer,
    gtag,
    location: { search: "", href: "https://www.voltfix.nl/contact", pathname: "/contact" },
    sessionStorage: { getItem: () => null, setItem: () => undefined },
    localStorage: { getItem: () => null, setItem: () => undefined },
  } as unknown as Window);
  vi.stubGlobal("document", { referrer: "" } as unknown as Document);
  vi.stubGlobal("navigator", {
    userAgent: "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/126 Safari/537.36",
    languages: ["nl-NL"],
    sendBeacon: beacon,
  });
  vi.stubGlobal("Blob", class {});
  return { dataLayer, gtag, beacon };
}

const base = {
  language: "nl" as const,
  pagePath: "/contact",
  location: "contact-form",
};

describe("trackLeadSuccess", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    __resetFiredLeadIds();
  });

  it("vuurt exact één quote_submitted dataLayer-event", () => {
    const { dataLayer } = setupWindow();
    trackLeadSuccess({ type: "quote", leadId: "lead-1", ...base });
    const events = dataLayer.filter((e) => e.event === "quote_submitted");
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      event_category: "contact",
      event_label: "Quote submitted",
      conversion_type: "quote",
      transaction_id: "lead-1",
      lead_id: "lead-1",
      language: "nl",
      language_label: "nl-NL",
      page_path: "/contact",
      cta_location: "contact-form",
    });
    // generate_lead maximaal één keer, onder eigen naam.
    expect(dataLayer.filter((e) => e.event === "generate_lead")).toHaveLength(1);
  });

  it("vuurt exact één schedule_request_success dataLayer-event", () => {
    const { dataLayer } = setupWindow();
    trackLeadSuccess({ type: "schedule", leadId: "lead-2", ...base });
    expect(dataLayer.filter((e) => e.event === "schedule_request_success")).toHaveLength(1);
    expect(dataLayer.filter((e) => e.event === "generate_lead")).toHaveLength(0);
  });

  it("stuurt dezelfde lead-ID niet twee keer", () => {
    const { dataLayer } = setupWindow();
    trackLeadSuccess({ type: "quote", leadId: "lead-3", ...base });
    trackLeadSuccess({ type: "quote", leadId: "lead-3", ...base });
    expect(dataLayer.filter((e) => e.event === "quote_submitted")).toHaveLength(1);
  });

  it("logt de first-party conversie precies één keer", () => {
    const { beacon } = setupWindow();
    trackLeadSuccess({ type: "quote", leadId: "lead-4", ...base });
    trackLeadSuccess({ type: "quote", leadId: "lead-4", ...base });
    expect(beacon).toHaveBeenCalledTimes(1);
  });
});
