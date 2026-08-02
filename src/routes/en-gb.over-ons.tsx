import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Clock, Heart, MapPin, ShieldCheck, Users } from "lucide-react";

import portraitImg from "@/assets/electrician-portrait.jpg";
import { CtaBand } from "@/components/cta-band";
import { CtaButtons } from "@/components/cta-buttons";
import { TrustRow } from "@/components/trust-row";
import { absoluteUrl, altLinks, ogImage, pageMeta } from "@/lib/seo";

const nlPath = "/over-ons";
const enPath = "/en-gb/over-ons";

export const Route = createFileRoute("/en-gb/over-ons")({
  head: () => ({
    meta: pageMeta({
      title: "About VoltFix | Electrician Amsterdam",
      description:
        "Meet VoltFix, your local English-speaking electrician in Amsterdam. Qualified, quick to reach and honest about the price. Read our story.",
      path: enPath,
      ogDescription: "A serious, local professional with fast service across Amsterdam.",
      locale: "en",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(enPath) }, ...altLinks(nlPath)],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-grid-brand opacity-50" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold text-white">
              Local &amp; qualified
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight text-balance text-white sm:text-5xl">
              Your local electrician in Amsterdam
            </h1>
            <p className="mt-4 text-lg text-white/85">
              VoltFix was founded on one belief: electrical problems deserve a professional who
              arrives fast, is honest about the price and leaves the work tidy. No hassle, just
              reliable craftsmanship across Amsterdam — in English too.
            </p>
            <div className="mt-7">
              <CtaButtons location="about-hero" onBrand />
            </div>
            <div className="mt-8">
              <TrustRow onBrand />
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/20 shadow-[var(--shadow-elegant)]">
            <img
              src={portraitImg}
              alt="Qualified VoltFix electrician in Amsterdam"
              width={1024}
              height={1024}
              className="h-full w-full object-cover"
            loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <div className="space-y-5 text-[0.975rem] leading-relaxed text-muted-foreground">
          <h2 className="text-2xl font-bold text-foreground">The VoltFix story</h2>
          <p>
            VoltFix is an Amsterdam electrical contractor with a passion for the trade. We know the
            city, its characteristic canal houses and the modern apartments on IJburg and in
            Zuidoost. That knowledge makes the difference: we understand how older installations are
            built and how to bring them safely up to today's standards.
          </p>
          <p>
            Whether it's an acute fault in the middle of the night, replacing an outdated fuse box
            or connecting a new induction hob — we tackle every job with the same precision and
            care. We explain what we do, why we do it and what it costs. That keeps you in control.
          </p>
          <h2 className="text-2xl font-bold text-foreground">What we stand for</h2>
          <p>
            Trust isn't earned with big promises, but with actions. That's why we work to the NEN
            1010 standard, provide a warranty on our work and always communicate transparently. We
            leave your home tidy and think along with you about what's truly needed — not about what
            earns the most.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {[
            {
              icon: Clock,
              title: "Always reachable",
              text: "24/7 emergency service. For faults often within 60 minutes.",
            },
            {
              icon: MapPin,
              title: "Truly local",
              text: "No national call centre, but an Amsterdam pro who knows the city.",
            },
            {
              icon: BadgeCheck,
              title: "Transparent",
              text: "Fixed price up front. No surprises on the bill.",
            },
            {
              icon: ShieldCheck,
              title: "Safe & qualified",
              text: "Work to NEN 1010 with a warranty on materials and workmanship.",
            },
            {
              icon: Heart,
              title: "Committed",
              text: "We think along with you and advise honestly on what's needed.",
            },
            {
              icon: Users,
              title: "For everyone",
              text: "Private customers, owners' associations and businesses across Amsterdam.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <CtaBand
        title="Get to know VoltFix"
        text="Questions about a job or curious what we can do for you? Get in touch, no obligation."
      />
    </>
  );
}
