import { createFileRoute } from "@tanstack/react-router";
import { LocationPage, locationHead } from "@/components/location-page";

export const Route = createFileRoute("/elektricien-amsterdam-zuid")({
  head: () => locationHead("/elektricien-amsterdam-zuid"),
  component: () => <LocationPage path="/elektricien-amsterdam-zuid" />,
});
