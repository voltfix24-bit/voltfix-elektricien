import { createFileRoute } from "@tanstack/react-router";
import { LocationPage, locationHead } from "@/components/location-page";

export const Route = createFileRoute("/elektricien-amstelveen")({
  head: () => locationHead("/elektricien-amstelveen"),
  component: () => <LocationPage path="/elektricien-amstelveen" />,
});
