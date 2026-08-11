import { createFileRoute, redirect } from "@tanstack/react-router";

// Korte URL — doorverwijzen naar de scorende URL /perilex-amsterdam.
export const Route = createFileRoute("/perilex")({
  beforeLoad: () => {
    throw redirect({ to: "/perilex-amsterdam", statusCode: 301 });
  },
});
