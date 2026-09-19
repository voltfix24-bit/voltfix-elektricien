import { describe, expect, it } from "vitest";
import {
  applyFilters,
  assess,
  competitionPressure,
  EMPTY_FILTERS,
  euro,
  microsToEuro,
  NO_DATA,
  sortRows,
  summarize,
  type KeywordRow,
} from "./bid-analysis";

function row(overrides: Partial<KeywordRow> = {}): KeywordRow {
  return {
    criterionId: "1",
    keyword: "groepenkast vervangen",
    matchType: "EXACT",
    campaignId: "c1",
    campaignName: "Groepenkast NL",
    adGroupId: "a1",
    adGroupName: "Groepenkast",
    status: "ENABLED",
    maxCpc: 3,
    avgCpc: 2.45,
    impressions: 500,
    clicks: 40,
    ctr: 0.08,
    cost: 98,
    conversions: 2,
    conversionRate: 0.05,
    costPerConversion: 49,
    qualityScore: 8,
    expectedCtr: "GEMIDDELD",
    adRelevance: "BOVENGEMIDDELD",
    landingPageExperience: "GEMIDDELD",
    searchImpressionShare: 0.4,
    topImpressionShare: 0.3,
    absoluteTopImpressionShare: 0.1,
    lostRankShare: 0.38,
    lostBudgetShare: 0,
    planner: {
      avgMonthlySearches: 720,
      competition: "HIGH",
      competitionIndex: 88,
      lowTopOfPageBid: 4.2,
      highTopOfPageBid: 7.8,
      fetchedAt: "2026-01-01T00:00:00.000Z",
    },
    ...overrides,
  };
}

describe("microsToEuro", () => {
  it("rekent micros om naar euro", () => {
    expect(microsToEuro("3000000")).toBe(3);
    expect(microsToEuro(null)).toBeNull();
    expect(microsToEuro("")).toBeNull();
  });
});

describe("euro", () => {
  it("toont ontbrekende waarden niet als nul", () => {
    expect(euro(null)).toBe(NO_DATA);
    expect(euro(3)).toContain("3,00");
  });
});

describe("assess", () => {
  it("noemt een bod onder de bandbreedte met rangverlies waarschijnlijk te laag", () => {
    const result = assess(row(), null);
    expect(result.verdict).toBe("te-laag");
    expect(result.explanation).toContain("38%");
  });

  it("geeft budget voorrang boven een bodadvies", () => {
    expect(assess(row({ lostBudgetShare: 0.7 }), null).verdict).toBe("budget");
  });

  it("adviseert eerst kwaliteit bij een lage Quality Score", () => {
    expect(assess(row({ qualityScore: 4 }), null).verdict).toBe("kwaliteit");
  });

  it("geeft geen stellig advies bij te weinig data", () => {
    expect(assess(row({ impressions: 40, clicks: 3 }), null).verdict).toBe("onvoldoende");
  });

  it("markeert een bod boven de bandbreedte als mogelijk te hoog", () => {
    expect(assess(row({ maxCpc: 9, lostRankShare: 0.05 }), null).verdict).toBe("te-hoog");
  });

  it("noemt een bod binnen de bandbreedte gezond", () => {
    expect(assess(row({ maxCpc: 5, lostRankShare: 0.05 }), null).verdict).toBe("binnen-bereik");
  });

  it("valt terug op onvoldoende gegevens zonder marktbandbreedte", () => {
    const plannerless = row({
      lostRankShare: 0.05,
      planner: { ...row().planner, lowTopOfPageBid: null, highTopOfPageBid: null },
    });
    expect(assess(plannerless, null).verdict).toBe("onvoldoende");
  });
});

describe("competitionPressure", () => {
  it("labelt hoge druk bij hoge index en veel rangverlies", () => {
    expect(competitionPressure(row())).toBe("Hoog");
  });

  it("geeft onvoldoende gegevens zonder signalen", () => {
    const blank = row({
      lostRankShare: null,
      searchImpressionShare: null,
      planner: { ...row().planner, competitionIndex: null },
    });
    expect(competitionPressure(blank)).toBe(NO_DATA);
  });
});

describe("summarize", () => {
  it("telt beoordelingen en verspilling boven doel-CPA", () => {
    const result = summarize([row(), row({ criterionId: "2", lostBudgetShare: 0.5 })], 40);
    expect(result.tooLow).toBe(1);
    expect(result.budget).toBe(1);
    expect(result.wasteAboveTarget).toBeCloseTo((49 - 40) * 2 * 2, 5);
  });
});

describe("applyFilters en sortRows", () => {
  it("filtert op actieve zoekwoorden en rangverlies", () => {
    const rows = [row(), row({ criterionId: "2", status: "PAUSED", lostRankShare: 0.01 })];
    expect(applyFilters(rows, { ...EMPTY_FILTERS, onlyActive: true }, null)).toHaveLength(1);
    expect(applyFilters(rows, { ...EMPTY_FILTERS, onlyRankLoss: true }, null)).toHaveLength(1);
  });

  it("sorteert aflopend op kosten", () => {
    const rows = [row({ cost: 10 }), row({ criterionId: "2", cost: 90 })];
    expect(sortRows(rows, "cost")[0]!.cost).toBe(90);
  });
});
