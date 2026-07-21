import { createFileRoute } from "@tanstack/react-router";
import { LocationPage, locationHead } from "@/components/location-page";

const path = "/elektricien-haarlem";

export const Route = createFileRoute(path)({
  head: () => locationHead(path),
  component: () => <LocationPage path={path} />,
});
