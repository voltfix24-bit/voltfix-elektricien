import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/elektricien")({
  beforeLoad: () => {
    throw redirect({ to: "/elektricien-amsterdam", statusCode: 301 });
  },
});
