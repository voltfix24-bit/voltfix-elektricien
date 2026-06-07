import { BadgeCheck, MapPin, ShieldCheck, Zap } from "lucide-react";

const items = [
  { icon: MapPin, label: "Lokaal in Amsterdam" },
  { icon: Zap, label: "Snelle service" },
  { icon: BadgeCheck, label: "Transparante tarieven" },
  { icon: ShieldCheck, label: "Vakkundig werk" },
];

export function TrustRow() {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
      {items.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">{label}</span>
        </li>
      ))}
    </ul>
  );
}
