import { createFileRoute } from "@tanstack/react-router";
import { LocationPage, locationHead } from "@/components/location-page";

export const Route = createFileRoute("/elektricien-diemen")({
  head: () => locationHead("/elektricien-diemen"),
  component: () => <LocationPage path="/elektricien-diemen" />,
});
