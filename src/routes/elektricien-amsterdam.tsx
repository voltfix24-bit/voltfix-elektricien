import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/elektricien-amsterdam")({
  beforeLoad: () => {
    throw redirect({ to: "/", statusCode: 301 });
  },
});
