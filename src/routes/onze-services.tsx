import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/onze-services")({
  beforeLoad: () => {
    throw redirect({ to: "/", statusCode: 301 });
  },
});
