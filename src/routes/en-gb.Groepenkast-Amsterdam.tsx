import { createFileRoute, redirect } from "@tanstack/react-router";

// Old capitalised URL: permanent 301 to the lowercase variant.
export const Route = createFileRoute("/en-gb/Groepenkast-Amsterdam")({
  beforeLoad: () => {
    throw redirect({ to: "/en-gb/groepenkast-amsterdam", statusCode: 301 });
  },
});
