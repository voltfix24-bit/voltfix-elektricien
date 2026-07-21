import { createFileRoute } from "@tanstack/react-router";
import { LocationPage, locationHead } from "@/components/location-page";

export const Route = createFileRoute("/elektricien-amsterdam-noord")({
  head: () => locationHead("/elektricien-amsterdam-noord"),
  component: () => <LocationPage path="/elektricien-amsterdam-noord" />,
});
