import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/perilex-amsterdam")({
  beforeLoad: () => {
    throw redirect({ to: "/perilex-aansluiten-amsterdam", statusCode: 301 });
  },
});
