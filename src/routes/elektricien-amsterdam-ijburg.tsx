import { createFileRoute } from "@tanstack/react-router";
import { LocationPage, locationHead } from "@/components/location-page";

export const Route = createFileRoute("/elektricien-amsterdam-ijburg")({
  head: () => locationHead("/elektricien-amsterdam-ijburg"),
  component: () => <LocationPage path="/elektricien-amsterdam-ijburg" />,
});
