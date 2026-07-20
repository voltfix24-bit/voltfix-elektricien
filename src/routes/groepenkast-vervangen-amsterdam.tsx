import { createFileRoute, redirect } from "@tanstack/react-router";

// Content verhuisd naar /Groepenkast-Amsterdam (behouden URL uit oude site).
export const Route = createFileRoute("/groepenkast-vervangen-amsterdam")({
  beforeLoad: () => {
    throw redirect({ to: "/Groepenkast-Amsterdam", statusCode: 301 });
  },
});
