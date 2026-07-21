import { createFileRoute } from "@tanstack/react-router";
import { LocationPage, locationHead } from "@/components/location-page";

export const Route = createFileRoute("/elektricien-haarlem")({
  head: () => locationHead("/elektricien-haarlem"),
  component: () => <LocationPage path="/elektricien-haarlem" />,
});
