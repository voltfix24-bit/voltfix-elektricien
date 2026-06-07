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
  klus: z.string().min(1, "Kies een soort klus"),
  bericht: z.string().trim().max(1000).optional(),
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
      `Soort klus: ${values.klus}%0A` +
      `Bericht: ${values.bericht ?? "-"}`;
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

      <Field label="Bericht (optioneel)" error={errors.bericht?.message}>
        <Textarea
          rows={3}
          placeholder="Omschrijf kort wat er aan de hand is…"
          {...register("bericht")}
        />
      </Field>

      <Button
        type="submit"
        variant="gold"
        size="xl"
        className="gtm-form-submit w-full"
        data-gtm="form-submit"
        data-gtm-location="contact-form"
        disabled={isSubmitting}
      >
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
