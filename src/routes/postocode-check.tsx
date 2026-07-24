import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/postocode-check")({
  beforeLoad: () => {
    throw redirect({ to: "/contact", hash: "offerte", statusCode: 301 });
  },
});
