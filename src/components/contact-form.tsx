import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Camera, Check, Loader2, MapPin, Phone, Send, Star, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { business, telHref, whatsappHref } from "@/lib/business";
import { aggregateRating } from "@/data/reviews";
import { useFormStrings, useLocale } from "@/lib/i18n";
import { useTrackConversion } from "@/lib/analytics";
import { resolvePrefilledKlus } from "@/lib/job-prefill";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";


type ResolvedAddress = { street: string; city: string; postcode: string; houseNumber: string };

async function lookupAddress(
  postcode: string,
  houseNumber: string,
  signal: AbortSignal,
): Promise<ResolvedAddress | null> {
  const pc = postcode.replace(/\s+/g, "").toUpperCase();
  const hn = houseNumber.trim();
  if (!/^[0-9]{4}[A-Z]{2}$/.test(pc) || !/^[0-9]+/.test(hn)) return null;
  const url = `https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?fq=type:adres&rows=1&q=${encodeURIComponent(
    `postcode:${pc} and huisnummer:${parseInt(hn, 10)}`,
  )}`;
  const res = await fetch(url, { signal });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    response?: { docs?: Array<{ straatnaam?: string; woonplaatsnaam?: string; huis_nlt?: string }> };
  };
  const doc = json.response?.docs?.[0];
  if (!doc?.straatnaam || !doc?.woonplaatsnaam) return null;
  return {
    street: doc.straatnaam,
    city: doc.woonplaatsnaam,
    postcode: `${pc.slice(0, 4)} ${pc.slice(4)}`,
    houseNumber: doc.huis_nlt ?? hn,
  };
}

const MAX_FILES = 3;
const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

type LocalStrings = {
  attachments: string;
  attachHint: string;
  chooseFiles: string;
  submitting: string;
  successTitle: string;
  successBody: string;
  errorTitle: string;
  tooMany: string;
  tooBig: (name: string) => string;
  wrongType: (name: string) => string;
  waLabel: string;
  houseNumber: string;
  houseNumberPh: string;
  addressLookup: string;
  addressFound: string;
  addressNotFound: string;
  errHouseNumber: string;
  headerTitle: string;
  headerSubtitle: string;
  reviewsLabel: string;
  availableNow: string;
  locationGroup: string;
  emergencyLabel: string;
  reassurance: string;
};

const LOCAL_NL: LocalStrings = {
  attachments: "Foto's toevoegen (optioneel)",
  attachHint: "Max 3 foto's, 20 MB per stuk — JPG, PNG, HEIC of WebP.",
  chooseFiles: "Foto's kiezen of maken",
  submitting: "Bezig met versturen…",
  successTitle: "Aanvraag verstuurd!",
  successBody: "We hebben uw aanvraag ontvangen en sturen u een bevestiging per e-mail.",
  errorTitle: "Er ging iets mis",
  tooMany: "Maximaal 3 foto's per aanvraag.",
  tooBig: (n) => `${n} is groter dan 20 MB.`,
  wrongType: (n) => `${n} is geen ondersteunde afbeelding.`,
  waLabel: "Liever direct WhatsApp?",
  houseNumber: "Huisnummer",
  houseNumberPh: "bijv. 142",
  addressLookup: "Adres opzoeken…",
  addressFound: "Adres gevonden",
  addressNotFound: "Geen adres gevonden — controleer postcode en huisnummer.",
  errHouseNumber: "Vul een geldig huisnummer in.",
  headerTitle: "Direct een offerte",
  headerSubtitle: "Reactie binnen 60 minuten",
  reviewsLabel: "reviews",
  availableNow: "Nu beschikbaar voor klussen in Amsterdam",
  locationGroup: "Locatie (adres-check)",
  emergencyLabel: "Spoedgeval? Bel direct:",
  reassurance: "Gratis & vrijblijvend • Reactie binnen 60 minuten",
};

const LOCAL_EN: LocalStrings = {
  attachments: "Add photos (optional)",
  attachHint: "Max 3 photos, 20 MB each — JPG, PNG, HEIC or WebP.",
  chooseFiles: "Choose or take photos",
  submitting: "Sending…",
  successTitle: "Request sent!",
  successBody: "We received your request and are sending a confirmation by email.",
  errorTitle: "Something went wrong",
  tooMany: "Maximum 3 photos per request.",
  tooBig: (n) => `${n} exceeds 20 MB.`,
  wrongType: (n) => `${n} is not a supported image.`,
  waLabel: "Prefer WhatsApp instead?",
  houseNumber: "House number",
  houseNumberPh: "e.g. 142",
  addressLookup: "Looking up address…",
  addressFound: "Address found",
  addressNotFound: "No address found — please check the postcode and house number.",
  errHouseNumber: "Please enter a valid house number.",
  headerTitle: "Get a quote now",
  headerSubtitle: "We reply within 60 minutes",
  reviewsLabel: "reviews",
  availableNow: "Available now for jobs in Amsterdam",
  locationGroup: "Location (address lookup)",
  emergencyLabel: "Emergency? Call directly:",
  reassurance: "Free & no obligation • Reply within 60 minutes",
};

export function ContactForm() {
  const f = useFormStrings();
  const locale = useLocale();
  const l = locale === "en" ? LOCAL_EN : LOCAL_NL;
  const track = useTrackConversion();
  const [files, setFiles] = useState<File[]>([]);
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [address, setAddress] = useState<ResolvedAddress | null>(null);
  const [addrStatus, setAddrStatus] = useState<"idle" | "loading" | "found" | "notfound">("idle");

  const schema = useMemo(
    () =>
      z.object({
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
        huisnummer: z
          .string()
          .trim()
          .min(1, l.errHouseNumber)
          .max(10)
          .regex(/^[0-9]+[a-zA-Z0-9\s-]*$/, l.errHouseNumber),
        klus: z.string().min(1, f.errJob),
        bericht: z.string().trim().max(1000).optional(),
        hp: z.string().max(0).optional(),
      }),
    [f, l],
  );

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { klus: "", hp: "" },
  });

  // Prefill "Soort klus" from ?klus=… or same-origin referrer, once on mount.
  useEffect(() => {
    const prefill = resolvePrefilledKlus(locale);
    if (prefill && f.jobTypes.includes(prefill)) {
      setValue("klus", prefill, { shouldValidate: false, shouldDirty: false });
    }
    // Only run once per locale — user selection wins afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const postcodeVal = watch("postcode");
  const huisnummerVal = watch("huisnummer");

  useEffect(() => {
    const pc = (postcodeVal ?? "").replace(/\s+/g, "").toUpperCase();
    const hn = (huisnummerVal ?? "").trim();
    if (!/^[0-9]{4}[A-Z]{2}$/.test(pc) || !/^[0-9]+/.test(hn)) {
      setAddress(null);
      setAddrStatus("idle");
      return;
    }
    const controller = new AbortController();
    setAddrStatus("loading");
    const timer = setTimeout(async () => {
      try {
        const found = await lookupAddress(pc, hn, controller.signal);
        if (controller.signal.aborted) return;
        if (found) {
          setAddress(found);
          setAddrStatus("found");
        } else {
          setAddress(null);
          setAddrStatus("notfound");
        }
      } catch {
        if (!controller.signal.aborted) {
          setAddress(null);
          setAddrStatus("notfound");
        }
      }
    }, 400);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [postcodeVal, huisnummerVal]);


  function onFilesPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    const merged = [...files];
    for (const file of picked) {
      if (merged.length >= MAX_FILES) {
        toast.error(l.tooMany);
        break;
      }
      if (!ALLOWED.includes(file.type) && !/\.(heic|heif)$/i.test(file.name)) {
        toast.error(l.wrongType(file.name));
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(l.tooBig(file.name));
        continue;
      }
      merged.push(file);
    }
    setFiles(merged.slice(0, MAX_FILES));
    // reset input so the same file can be re-added if removed
    e.target.value = "";
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit(values: FormValues) {
    setState("sending");
    setErrorMsg(null);
    track("quote", "contact-form");

    const fd = new FormData();
    fd.set("name", values.naam);
    fd.set("phone", values.telefoon);
    fd.set("email", values.email);
    fd.set("postalCode", values.postcode);
    fd.set("jobType", values.klus);
    const addressLine = address
      ? `${address.street} ${address.houseNumber}, ${address.postcode} ${address.city}`
      : `${values.postcode} ${values.huisnummer}`;
    const messageWithAddress = `Adres: ${addressLine}${
      values.bericht ? `\n\n${values.bericht}` : ""
    }`;
    fd.set("message", messageWithAddress);
    fd.set("locale", locale);
    fd.set("sourcePath", typeof window !== "undefined" ? window.location.pathname : "/contact");
    fd.set("hp", values.hp ?? "");
    for (const file of files) fd.append("attachments", file, file.name);

    try {
      const res = await fetch("/api/public/quote-request", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Request failed");
      }
      setState("success");
      toast.success(l.successTitle);
      reset();
      setFiles([]);
    } catch (err: any) {
      console.error("Quote submission failed", err);
      setState("error");
      setErrorMsg(err?.message ?? "Unknown error");
      toast.error(l.errorTitle);
    }
  }

  if (state === "success") {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center shadow-[var(--shadow-elegant)]">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
          ✓
        </div>
        <h3 className="text-xl font-bold">{l.successTitle}</h3>
        <p className="mt-2 text-muted-foreground">{l.successBody}</p>
        <Button
          type="button"
          variant="outline"
          className="mt-6"
          onClick={() => setState("idle")}
        >
          {locale === "en" ? "Send another" : "Nog een aanvraag versturen"}
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-elegant)]">
      {/* Header met trust-signals */}
      <div className="bg-primary p-6 text-primary-foreground">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold leading-tight">{l.headerTitle}</h2>
            <p className="mt-1 text-sm font-medium text-[hsl(var(--accent))]">
              {l.headerSubtitle}
            </p>
          </div>
          <div className="shrink-0 rounded-xl border border-white/20 bg-white/10 p-2 text-center backdrop-blur-md">
            <div className="text-lg font-bold leading-none text-[hsl(var(--accent))]">
              {aggregateRating.ratingValue.toFixed(1)}
            </div>
            <div className="my-1 flex justify-center gap-0.5" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="h-2.5 w-2.5 fill-[hsl(var(--accent))] text-[hsl(var(--accent))]"
                />
              ))}
            </div>
            <div className="text-[10px] uppercase tracking-wider opacity-80">
              {aggregateRating.reviewCount} {l.reviewsLabel}
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs opacity-90">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
          </span>
          {l.availableNow}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-6" noValidate>
        {/* honeypot */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
          {...register("hp")}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={f.name} error={errors.naam?.message}>
            <Input placeholder={f.namePh} autoComplete="name" {...register("naam")} />
          </Field>
          <Field label={f.phone} error={errors.telefoon?.message}>
            <Input type="tel" autoComplete="tel" placeholder="06 ..." {...register("telefoon")} />
          </Field>
        </div>

        <Field label={f.email} error={errors.email?.message}>
          <Input type="email" autoComplete="email" placeholder={f.emailPh} {...register("email")} />
        </Field>

        {/* Adres-groep (PDOK) */}
        <div className="rounded-2xl border border-border bg-muted/40 p-4">
          <Label className="mb-3 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            {l.locationGroup}
          </Label>
          <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
            <Field error={errors.postcode?.message}>
              <Input
                placeholder={f.postcodePh}
                autoComplete="postal-code"
                className="bg-background"
                {...register("postcode")}
              />
            </Field>
            <Field error={errors.huisnummer?.message}>
              <Input
                placeholder={l.houseNumberPh}
                inputMode="numeric"
                autoComplete="address-line2"
                className="bg-background"
                {...register("huisnummer")}
              />
            </Field>
          </div>

          {addrStatus !== "idle" && (
            <div
              className={`mt-3 flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                addrStatus === "found"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : addrStatus === "notfound"
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-border bg-background text-muted-foreground"
              }`}
            >
              {addrStatus === "loading" && <Loader2 className="mt-0.5 h-4 w-4 animate-spin" />}
              {addrStatus === "found" && <Check className="mt-0.5 h-4 w-4 text-green-700" />}
              {addrStatus === "notfound" && <MapPin className="mt-0.5 h-4 w-4 text-amber-700" />}
              <div className="min-w-0 leading-tight">
                {addrStatus === "loading" && <span>{l.addressLookup}</span>}
                {addrStatus === "found" && address && (
                  <>
                    <div className="font-medium">{l.addressFound}</div>
                    <div className="truncate">
                      {address.street} {address.houseNumber}, {address.postcode} {address.city}
                    </div>
                  </>
                )}
                {addrStatus === "notfound" && <span>{l.addressNotFound}</span>}
              </div>
            </div>
          )}
        </div>

        <Field label={f.job} error={errors.klus?.message}>
          <select
            {...register("klus")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">{f.jobChoose}</option>
            {f.jobTypes.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </Field>

        <Field label={f.message}>
          <Textarea rows={3} placeholder={f.messagePh} {...register("bericht")} />
        </Field>

        <div className="space-y-2">
          <Label className="text-sm font-medium">{l.attachments}</Label>
          <label className="group flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-background px-3 py-4 text-sm text-muted-foreground transition hover:border-primary hover:bg-muted/40">
            <Camera className="h-4 w-4 group-hover:text-primary" />
            <span>{l.chooseFiles}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
              multiple
              onChange={onFilesPicked}
              className="hidden"
            />
          </label>
          <p className="text-xs text-muted-foreground">{l.attachHint}</p>

          {files.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {files.map((file, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-1.5 text-sm"
                >
                  <span className="truncate">
                    📎 {file.name}{" "}
                    <span className="text-muted-foreground">
                      ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="ml-2 rounded p-1 text-muted-foreground hover:text-destructive"
                    aria-label="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2 pt-1">
          <Button
            type="submit"
            size="xl"
            className="gtm-form-submit w-full rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98]"
            data-gtm="form-submit"
            data-gtm-location="contact-form"
            disabled={isSubmitting || state === "sending"}
          >
            <Send /> {state === "sending" ? l.submitting : f.submit}
          </Button>
          <p className="text-center text-xs text-muted-foreground">{l.reassurance}</p>
          <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
            {locale === "en" ? (
              <>
                We use your data only to handle this request. See our{" "}
                <a href="/en-gb/privacy-policy" className="underline underline-offset-2 hover:text-foreground">
                  privacy policy
                </a>
                .
              </>
            ) : (
              <>
                We gebruiken je gegevens uitsluitend om deze aanvraag te behandelen. Zie ons{" "}
                <a href="/privacybeleid" className="underline underline-offset-2 hover:text-foreground">
                  privacybeleid
                </a>
                .
              </>
            )}
          </p>
        </div>

        {state === "error" && errorMsg && (
          <p className="text-center text-sm text-destructive">
            {l.errorTitle}: {errorMsg}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {l.waLabel}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <a
          href={whatsappHref(undefined, {
            campaign: "/contact",
            content: "contact-form-fallback",
            medium: "whatsapp",
          })}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-whatsapp py-3 font-bold text-whatsapp transition-colors hover:bg-whatsapp/5"
          data-gtm="contact_whatsapp"
          data-gtm-location="contact-form-fallback"
        >
          <WhatsAppIcon className="h-5 w-5" />
          WhatsApp
        </a>

        {/* Spoedstrip */}
        <a
          href={telHref}
          className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-destructive/10 py-2.5 text-xs font-bold uppercase tracking-wide text-destructive transition-colors hover:bg-destructive/15"
          data-gtm="contact_call_emergency"
          data-gtm-location="contact-form-emergency"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-destructive" />
          </span>
          <Phone className="h-3.5 w-3.5" />
          {l.emergencyLabel} {business.phoneDisplay}
        </a>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      {label && <Label className="text-sm font-medium">{label}</Label>}
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
