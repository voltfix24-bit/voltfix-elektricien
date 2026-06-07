import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { whatsappHref } from "@/lib/business";

const klusTypes = [
  "Spoed / storing",
  "Groepenkast vervangen",
  "Perilex / kookgroep",
  "Stroomstoring of kortsluiting",
  "Stopcontacten / verlichting",
  "Laadpaal",
  "Anders",
];

const schema = z.object({
  naam: z.string().trim().min(2, "Vul uw naam in").max(80),
  telefoon: z
    .string()
    .trim()
    .min(8, "Vul een geldig telefoonnummer in")
    .max(20)
    .regex(/^[0-9+()\s-]+$/, "Alleen cijfers en + ( ) - zijn toegestaan"),
  email: z.string().trim().email("Vul een geldig e-mailadres in").max(120),
  postcode: z
    .string()
    .trim()
    .min(4, "Vul uw postcode in")
    .max(10)
    .regex(/^[0-9]{4}\s?[A-Za-z]{0,2}$/, "Bijv. 1012 AB"),
  klus: z.string().min(1, "Kies een soort klus"),
  bericht: z.string().trim().min(5, "Omschrijf kort uw klus").max(1000),
});

type FormValues = z.infer<typeof schema>;

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { klus: "" },
  });

  function onSubmit(values: FormValues) {
    const message =
      `Offerte-aanvraag VoltFix%0A` +
      `Naam: ${values.naam}%0A` +
      `Telefoon: ${values.telefoon}%0A` +
      `E-mail: ${values.email}%0A` +
      `Postcode: ${values.postcode}%0A` +
      `Soort klus: ${values.klus}%0A` +
      `Bericht: ${values.bericht}`;
    setSubmitted(true);
    toast.success("Bedankt! We openen WhatsApp om uw aanvraag te versturen.");
    window.open(
      whatsappHref(decodeURIComponent(message)),
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)]"
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Naam" error={errors.naam?.message}>
          <Input placeholder="Uw naam" {...register("naam")} />
        </Field>
        <Field label="Telefoon" error={errors.telefoon?.message}>
          <Input type="tel" placeholder="06 ..." {...register("telefoon")} />
        </Field>
        <Field label="E-mail" error={errors.email?.message}>
          <Input type="email" placeholder="naam@email.nl" {...register("email")} />
        </Field>
        <Field label="Postcode" error={errors.postcode?.message}>
          <Input placeholder="1012 AB" {...register("postcode")} />
        </Field>
      </div>

      <Field label="Soort klus" error={errors.klus?.message}>
        <select
          {...register("klus")}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Kies een optie…</option>
          {klusTypes.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Bericht" error={errors.bericht?.message}>
        <Textarea
          rows={4}
          placeholder="Omschrijf kort wat er aan de hand is…"
          {...register("bericht")}
        />
      </Field>

      <Button type="submit" variant="gold" size="xl" className="w-full" disabled={isSubmitting}>
        <Send /> Verstuur aanvraag
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <MessageCircle className="h-3.5 w-3.5 text-whatsapp" />
        {submitted
          ? "Geen WhatsApp geopend? Bel ons gerust direct."
          : "Uw aanvraag wordt via WhatsApp verstuurd voor het snelste antwoord."}
      </p>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
