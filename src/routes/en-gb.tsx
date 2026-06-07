import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout route for the English (/en-gb) section. Children render in the Outlet.
export const Route = createFileRoute("/en-gb")({
  component: () => <Outlet />,
});
