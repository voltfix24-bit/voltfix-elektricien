import { createFileRoute } from "@tanstack/react-router";
import { LocationPage, locationHead } from "@/components/location-page";

export const Route = createFileRoute("/elektricien-amsterdam-oost")({
  head: () => locationHead("/elektricien-amsterdam-oost"),
  component: () => <LocationPage path="/elektricien-amsterdam-oost" />,
});
