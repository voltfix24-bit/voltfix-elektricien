import { createFileRoute } from "@tanstack/react-router";
import { LocationPage, locationHead } from "@/components/location-page";

export const Route = createFileRoute("/elektricien-amsterdam-centrum")({
  head: () => locationHead("/elektricien-amsterdam-centrum"),
  component: () => <LocationPage path="/elektricien-amsterdam-centrum" />,
});
