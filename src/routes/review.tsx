import { createFileRoute, redirect } from "@tanstack/react-router";

import { reviewHref } from "@/lib/business";

// Korte, makkelijk te onthouden URL voor op facturen, WhatsApp en QR-stickers:
// https://www.voltfix.nl/review -> Google reviewformulier (met UTM-tracking).
export const Route = createFileRoute("/review")({
  beforeLoad: ({ location }) => {
    const source = new URLSearchParams(location.search).get("src") ?? "shortlink";
    throw redirect({
      href: reviewHref({ source, content: "review-shortlink" }),
      statusCode: 302,
    });
  },
});
