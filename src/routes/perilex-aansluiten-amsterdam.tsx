import { createFileRoute, redirect } from "@tanstack/react-router";

// Oude URL — content is verhuisd naar de scorende URL /perilex-amsterdam.
export const Route = createFileRoute("/perilex-aansluiten-amsterdam")({
  beforeLoad: () => {
    throw redirect({ to: "/perilex-amsterdam", statusCode: 301 });
  },
});
