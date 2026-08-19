import { createFileRoute, redirect } from "@tanstack/react-router";

// Haarlem is geen servicegebied meer — 301 naar de algemene elektricienpagina.
export const Route = createFileRoute("/elektricien-haarlem")({
  beforeLoad: () => {
    throw redirect({ to: "/elektricien-amsterdam", statusCode: 301 });
  },
});
