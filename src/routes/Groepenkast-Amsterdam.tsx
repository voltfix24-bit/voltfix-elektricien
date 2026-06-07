import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/Groepenkast-Amsterdam")({
  beforeLoad: () => {
    throw redirect({ to: "/groepenkast-vervangen-amsterdam", statusCode: 301 });
  },
});
