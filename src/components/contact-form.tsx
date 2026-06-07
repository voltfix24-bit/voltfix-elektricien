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
import { useFormStrings } from "@/lib/i18n";
import { useTrackConversion } from "@/lib/analytics";

export function ContactForm() {
  const f = useFormStrings();
  const track = useTrackConversion();
  const [submitted, setSubmitted] = useState(false);

  const schema = z.object({
    naam: z.string().trim().min(2, f.errName).max(80),
    telefoon: z
      .string()
      .trim()
      .min(8, f.errPhone)
      .max(20)
      .regex(/^[0-9+()\s-]+$/, f.errPhoneChars),
    email: z.string().trim().email(f.errEmail).max(120),
    postcode: z
      .string()
      .trim()
      .min(4, f.errPostcode)
      .max(10)
      .regex(/^[0-9]{4}\s?[A-Za-z]{0,2}$/, f.errPostcodeFormat),
    klus: z.string().min(1, f.errJob),
    bericht: z.string().trim().max(1000).optional(),
  });

  type FormValues = z.infer<typeof schema>;

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
      `${f.quoteRequest}%0A` +
      `${f.name}: ${values.naam}%0A` +
      `${f.phone}: ${values.telefoon}%0A` +
      `${f.email}: ${values.email}%0A` +
      `${f.postcode}: ${values.postcode}%0A` +
      `${f.job}: ${values.klus}%0A` +
      `${f.message}: ${values.bericht ?? "-"}`;
    setSubmitted(true);
    track("quote", "contact-form");
    toast.success(f.toastSuccess);
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
        <Field label={f.name} error={errors.naam?.message}>
          <Input placeholder={f.namePh} {...register("naam")} />
        </Field>
        <Field label={f.phone} error={errors.telefoon?.message}>
          <Input type="tel" placeholder="06 ..." {...register("telefoon")} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={f.email} error={errors.email?.message}>
          <Input type="email" placeholder={f.emailPh} {...register("email")} />
        </Field>
        <Field label={f.postcode} error={errors.postcode?.message}>
          <Input placeholder={f.postcodePh} {...register("postcode")} />
        </Field>
      </div>

      <Field label={f.job} error={errors.klus?.message}>
        <select
          {...register("klus")}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">{f.jobChoose}</option>
          {f.jobTypes.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </Field>

      <Field label={f.message} error={errors.bericht?.message}>
        <Textarea
          rows={3}
          placeholder={f.messagePh}
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
        <Send /> {f.submit}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <MessageCircle className="h-3.5 w-3.5 text-whatsapp" />
        {submitted ? f.whatsappFallback : f.whatsappNote}
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
