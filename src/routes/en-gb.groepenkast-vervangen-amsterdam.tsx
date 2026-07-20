import { createFileRoute, redirect } from "@tanstack/react-router";

// Content moved to /en-gb/Groepenkast-Amsterdam.
export const Route = createFileRoute("/en-gb/groepenkast-vervangen-amsterdam")({
  beforeLoad: () => {
    throw redirect({ to: "/en-gb/Groepenkast-Amsterdam", statusCode: 301 });
  },
});
