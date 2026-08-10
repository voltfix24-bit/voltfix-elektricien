import { createFileRoute, redirect } from "@tanstack/react-router";

// Content moved to /en-gb/groepenkast-amsterdam.
export const Route = createFileRoute("/en-gb/groepenkast-vervangen-amsterdam")({
  beforeLoad: () => {
    throw redirect({ to: "/en-gb/groepenkast-amsterdam", statusCode: 301 });
  },
});
