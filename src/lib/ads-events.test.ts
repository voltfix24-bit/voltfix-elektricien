import { describe, expect, it } from "vitest";

import { adsClickEvent, adsFormEvent } from "./ads-events";

describe("ads-events", () => {
  it("koppelt bellen en WhatsApp aan de Ads-conversienamen", () => {
    expect(adsClickEvent("call")).toBe("klik_tel");
    expect(adsClickEvent("whatsapp")).toBe("whatsapp_klik");
    expect(adsClickEvent("mail")).toBe("klik_mail");
  });

  it("heeft geen Ads-conversie voor overige klikken", () => {
    expect(adsClickEvent("social")).toBeNull();
    expect(adsClickEvent("schedule")).toBeNull();
  });

  it("scheidt het formulier per taal", () => {
    expect(adsFormEvent("nl")).toBe("ContactformulierNL_ingevuld");
    expect(adsFormEvent("en")).toBe("ContactformulierENG_ingevuld");
  });
});
