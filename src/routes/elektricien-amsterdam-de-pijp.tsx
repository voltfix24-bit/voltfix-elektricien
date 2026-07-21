import { createFileRoute } from "@tanstack/react-router";
import { LocationPage, locationHead } from "@/components/location-page";

export const Route = createFileRoute("/elektricien-amsterdam-de-pijp")({
  head: () => locationHead("/elektricien-amsterdam-de-pijp"),
  component: () => <LocationPage path="/elektricien-amsterdam-de-pijp" />,
});
