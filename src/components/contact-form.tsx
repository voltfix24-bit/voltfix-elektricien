import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Camera, Check, Loader2, MapPin, MessageCircle, Send, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { whatsappHref } from "@/lib/business";
import { useFormStrings, useLocale } from "@/lib/i18n";
import { useTrackConversion } from "@/lib/analytics";

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
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { klus: "", hp: "" },
  });

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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)]"
      noValidate
    >
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

      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <Field label={f.postcode} error={errors.postcode?.message}>
          <Input placeholder={f.postcodePh} autoComplete="postal-code" {...register("postcode")} />
        </Field>
        <Field label={l.houseNumber} error={errors.huisnummer?.message}>
          <Input
            placeholder={l.houseNumberPh}
            inputMode="numeric"
            autoComplete="address-line2"
            {...register("huisnummer")}
          />
        </Field>
      </div>

      {addrStatus !== "idle" && (
        <div
          className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
            addrStatus === "found"
              ? "border-green-200 bg-green-50 text-green-800"
              : addrStatus === "notfound"
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-border bg-muted/40 text-muted-foreground"
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

      <Field label={f.message}>
        <Textarea rows={3} placeholder={f.messagePh} {...register("bericht")} />
      </Field>

      <div className="space-y-2">
        <Label className="text-sm font-medium">{l.attachments}</Label>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-input bg-background px-3 py-3 text-sm text-muted-foreground transition hover:bg-muted/40">
          <Camera className="h-4 w-4" />
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

      <Button
        type="submit"
        variant="gold"
        size="xl"
        className="gtm-form-submit w-full"
        data-gtm="form-submit"
        data-gtm-location="contact-form"
        disabled={isSubmitting || state === "sending"}
      >
        <Send /> {state === "sending" ? l.submitting : f.submit}
      </Button>

      {state === "error" && errorMsg && (
        <p className="text-center text-sm text-destructive">
          {l.errorTitle}: {errorMsg}
        </p>
      )}

      <div className="flex flex-col items-center gap-2 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">{l.waLabel}</p>
        <a
          href={whatsappHref(undefined, {
            campaign: "/contact",
            content: "contact-form-fallback",
            medium: "whatsapp",
          })}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-whatsapp hover:underline"
          data-gtm="contact_whatsapp"
          data-gtm-location="contact-form-fallback"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
      </div>
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
