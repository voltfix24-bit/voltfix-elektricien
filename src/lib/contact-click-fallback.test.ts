import { describe, expect, it } from "vitest";

import { withClickRef } from "./contact-click-fallback";
import type { AdClick } from "./ad-click";

const BASE = "https://api.whatsapp.com/send?phone=31612345678&text=" + encodeURIComponent("Hallo VoltFix");

function click(partial: Partial<AdClick>): AdClick {
  return { gclid: null, gbraid: null, wbraid: null, ref: null, at: null, ...partial };
}

describe("withClickRef", () => {
  it("plakt de code én het klik-id onderaan de WhatsApp-tekst", () => {
    const out = withClickRef(BASE, click({ ref: "K7QP", gclid: "TeSter-abc123" }));
    const text = decodeURIComponent(new URL(out).searchParams.get("text") ?? "");
    expect(text).toContain("Hallo VoltFix");
    expect(text).toContain("Ref: K7QP");
    expect(text).toContain("gclid: TeSter-abc123");
  });

  it("gebruikt gbraid of wbraid wanneer er geen gclid is", () => {
    const out = withClickRef(BASE, click({ ref: "K7QP", wbraid: "WB-xyz789" }));
    const text = decodeURIComponent(new URL(out).searchParams.get("text") ?? "");
    expect(text).toContain("gclid: WB-xyz789");
  });

  it("verandert niets zonder advertentieklik", () => {
    expect(withClickRef(BASE, click({}))).toBe(BASE);
  });

  it("voegt de code niet dubbel toe", () => {
    const once = withClickRef(BASE, click({ ref: "K7QP", gclid: "abc123" }));
    const twice = withClickRef(once, click({ ref: "K7QP", gclid: "abc123" }));
    expect(twice).toBe(once);
  });
});
