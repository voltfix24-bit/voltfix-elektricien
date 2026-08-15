import { createFileRoute, redirect } from "@tanstack/react-router";

// Typefout-URL uit oude vermeldingen: 301 naar de juiste spelling.
export const Route = createFileRoute("/postocode-check")({
  beforeLoad: () => {
    throw redirect({ to: "/postcode-check", statusCode: 301 });
  },
});
