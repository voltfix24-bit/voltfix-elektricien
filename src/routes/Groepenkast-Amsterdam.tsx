import { createFileRoute, redirect } from "@tanstack/react-router";

// Oude hoofdletter-URL: permanent 301 naar de kleine-letter-variant.
export const Route = createFileRoute("/Groepenkast-Amsterdam")({
  beforeLoad: () => {
    throw redirect({ to: "/groepenkast-amsterdam", statusCode: 301 });
  },
});
