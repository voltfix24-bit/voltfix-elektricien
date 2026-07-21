import { createFileRoute } from "@tanstack/react-router";
import { LocationPage, locationHead } from "@/components/location-page";

export const Route = createFileRoute("/elektricien-amsterdam-west")({
  head: () => locationHead("/elektricien-amsterdam-west"),
  component: () => <LocationPage path="/elektricien-amsterdam-west" />,
});
