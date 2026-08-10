import { createFileRoute, redirect } from "@tanstack/react-router";

// Content verhuisd naar /groepenkast-amsterdam (behouden URL uit oude site).
export const Route = createFileRoute("/groepenkast-vervangen-amsterdam")({
  beforeLoad: () => {
    throw redirect({ to: "/groepenkast-amsterdam", statusCode: 301 });
  },
});
