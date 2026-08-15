import { createFileRoute, redirect } from "@tanstack/react-router";

// Shortlink voor postcode-check: gaat naar het offerteformulier.
export const Route = createFileRoute("/postcode-check")({
  beforeLoad: () => {
    throw redirect({ to: "/contact", hash: "offerte", statusCode: 301 });
  },
});
