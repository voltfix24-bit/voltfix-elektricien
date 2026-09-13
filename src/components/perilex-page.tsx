import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowRight, Camera, Phone, ShieldCheck } from 'lucide-react';

import heroImg560 from '@/assets/voltfix-perilex-stekker-amsterdam-560.webp.asset.json';
import heroImg1120 from '@/assets/voltfix-perilex-stekker-amsterdam-1120.webp.asset.json';
import { Button } from '@/components/ui/button';
import { PerilexBooking } from '@/components/perilex-booking';
import { ServiceFaq } from '@/components/service-faq';
import { Testimonials } from '@/components/testimonials';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { NeighborhoodLinks } from '@/components/neighborhood-links';
import { RelatedServices } from '@/components/related-services';
import { business, telHref, whatsappHref } from '@/lib/business';
import { isBookingServiceActive } from '@/lib/booking/activation';
import { trackBooking } from '@/lib/booking/analytics';
import { setBookingActive } from '@/lib/booking-active';
import { onPerilexBookingRequest, setPerilexStickyVisible } from '@/lib/perilex-sticky';
import {
  ctaLabel,
  perilexAmount,
  perilexAvailabilityLine,
  perilexCta,
  perilexFaqs,
  perilexHeroConditionLine,
  perilexSituations,
  perilexSteps,
  type PerilexCtaId,
} from '@/lib/perilex-content';
import { perilexDeductibleNote } from '@/lib/booking/perilex-routing';
import type { GroupLocale } from '@/lib/groepenkast';

/**
 * Publieke Perilexpagina (NL/EN) \u2014 fase 6.
 *
 * Alle bedragen komen uit `perilexCatalog` via `perilex-content.ts` en worden
 * excl. btw getoond. Iedere CTA opent de centrale booking-engine met alleen de
 * werkelijk gekozen intentie. Zolang de dienst niet is geactiveerd, valt de
 * pagina terug op bellen/WhatsApp \u2014 de pagina zelf blijft indexeerbaar.
 */
export function PerilexPage({ lang }: { lang: GroupLocale }) {
  const en = lang === 'en';
  const path = en ? '/en-gb/perilex-amsterdam' : '/perilex-amsterdam';
  // Online aanvragen blijft uit tot de dienst officieel wordt geactiveerd.
  // In de lokale ontwikkelomgeving is de flow wel te testen; de server weigert
  // een aanvraag hoe dan ook via dezelfde activatiecontrole.
  const canBook = isBookingServiceActive('perilex') || import.meta.env.DEV;

  const [open, setOpen] = useState(false);
  const [request, setRequest] = useState<{ answers: Record<string, unknown>; nonce: number } | null>(null);
  const heroCta = useRef<HTMLDivElement>(null);
  const nonce = useRef(0);

  useEffect(() => () => { setBookingActive(false); setPerilexStickyVisible(false); }, []);
  useEffect(() => {
    const node = heroCta.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => {
      setPerilexStickyVisible(!entries[0]?.isIntersecting);
    }, { rootMargin: '-72px 0px 0px 0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  // De mobiele sticky knop vraagt dezelfde primaire actie aan als de hero.
  useEffect(() => onPerilexBookingRequest(() => start('hero_primary')));

  function start(id: PerilexCtaId) {
    const cta = perilexCta(id);
    trackBooking('cta_clicked', {
      service: 'perilex',
      sourcePage: path,
      status: cta.priceStatus,
      priceStatus: cta.priceStatus,
      priceRuleId: cta.priceRuleId,
      stepId: cta.position,
      answers: Object.fromEntries(Object.entries(cta.answers).map(([key, value]) => [key, (value as string) ?? null])),
    });
    if (!canBook) {
      document.getElementById('aanvragen')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    nonce.current += 1;
    setRequest({ answers: cta.answers, nonce: nonce.current });
    setOpen(true);
    setBookingActive(true, { initialService: 'perilex', initialIntent: cta.priceRuleId === 'site_survey' ? 'survey' : 'price', sourcePage: path });
  }
  function close() { setOpen(false); setBookingActive(false); }

  const waMessage = en
    ? 'Hi VoltFix, I would like to have a Perilex connection / hob connected in Amsterdam.'
    : 'Hallo VoltFix, ik wil een Perilex-aansluiting / kookplaat laten aansluiten in Amsterdam.';
  const wa = whatsappHref(waMessage, { campaign: path, content: 'perilex-page', term: lang });
  const standard = perilexAmount('existing_connection_standard', lang);
  const priority = perilexAmount('existing_connection_priority_24h', lang);
  const survey = perilexAmount('site_survey', lang);

  const PrimaryCta = ({ id, className = '' }: { id: PerilexCtaId; className?: string }) =>
    <Button variant="cta" size="xl" onClick={() => start(id)} className={`h-auto min-h-12 whitespace-normal px-5 py-3 ${className}`}>
      {ctaLabel(id, lang)}<ArrowRight aria-hidden />
    </Button>;

  return <div className="bg-background text-foreground">
    {/* HERO \u2014 ongekaderd, tekst en beeld binnen dezelfde contentbreedte */}
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-4 pb-10 pt-8 sm:pt-12">
        <p className="flex items-center gap-2 text-sm font-semibold text-primary">
          <ShieldCheck className="size-4" aria-hidden />VoltFix · {en ? 'Amsterdam and surrounding area' : 'Amsterdam en omgeving'}
        </p>
        <h1 className="mt-3 text-[2rem] font-bold leading-tight sm:text-4xl lg:text-5xl">
          {en ? 'Perilex connection in Amsterdam' : 'Perilex aansluiten in Amsterdam'}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">
          {en
            ? 'Help with connecting a hob, cooker or oven, and with preparing a connection point for induction cooking.'
            : 'Hulp bij het aansluiten van een kookplaat, fornuis of oven en bij het voorbereiden van een inductieaansluiting.'}
        </p>

        <div className="mt-5 max-w-2xl border-l-2 border-primary pl-4">
          <p className="text-lg font-bold tabular-nums">
            {en ? `Connecting the Perilex plug to your appliance: ${standard}` : `Perilex-stekker op je apparaat aansluiten: ${standard}`}
          </p>
          <p className="mt-1 text-base text-muted-foreground">{perilexHeroConditionLine[en ? 'en' : 'nl']}</p>
        </div>

        <div ref={heroCta} className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <PrimaryCta id="hero_primary" />
          <Button variant="outline" size="xl" onClick={() => start('hero_assess')} className="h-auto min-h-12 whitespace-normal px-5 py-3">
            <Camera aria-hidden />{ctaLabel('hero_assess', lang)}
          </Button>
        </div>

        <ul className="mt-6 grid gap-2 text-base text-muted-foreground sm:grid-cols-3">
          <li>{perilexAvailabilityLine[en ? 'en' : 'nl']}</li>
          <li>{en ? 'Amounts excl. VAT, confirmed before we start.' : 'Bedragen excl. btw, bevestigd voordat we beginnen.'}</li>
          <li>{en ? 'Work to NEN 1010 \u2014 the Dutch installation standard.' : 'Werk volgens NEN 1010 \u2014 de Nederlandse installatienorm.'}</li>
        </ul>

        <img
          src={heroImg560.url}
          srcSet={`${heroImg560.url} 560w, ${heroImg1120.url} 1120w`}
          sizes="(min-width: 1024px) 900px, 100vw"
          width={1120}
          height={1120}
          alt={en
            ? 'Product photo of a five-pin Perilex plug, the connection type used for hobs and cookers in the Netherlands'
            : 'Productfoto van een vijfpolige Perilex-stekker, de aansluiting die in Nederland voor kookplaten en fornuizen wordt gebruikt'}
          className="mt-8 aspect-[16/9] w-full rounded-lg border border-border bg-card object-contain p-4"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        <p className="mt-2 text-sm text-muted-foreground">
          {en ? 'Product photo of a Perilex plug \u2014 not a photo of a VoltFix project.' : 'Productfoto van een Perilex-stekker \u2014 geen foto van een uitgevoerd VoltFix-project.'}
        </p>

        <nav aria-label={en ? 'On this page' : 'Op deze pagina'} className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-5 text-base">
          <a href="#tarieven" className="font-semibold text-primary underline underline-offset-4">{en ? 'Rates' : 'Tarieven'}</a>
          <a href="#werkwijze" className="font-semibold text-primary underline underline-offset-4">{en ? 'How it works' : 'Werkwijze'}</a>
          <a href="#vragen" className="font-semibold text-primary underline underline-offset-4">{en ? 'Questions' : 'Vragen'}</a>
        </nav>
      </div>
    </section>

    {/* KORT ANTWOORD */}
    <section id="kosten" className="scroll-mt-28 border-b border-border">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="text-2xl font-bold sm:text-3xl">
          {en ? 'What does connecting a Perilex costs in Amsterdam?' : 'Wat kost Perilex aansluiten in Amsterdam?'}
        </h2>
        <p className="mt-4 text-base leading-relaxed sm:text-lg">
          {en
            ? `Connecting the Perilex plug to your appliance costs ${standard}. That rate applies when an existing, suitable Perilex socket and a working, suitable circuit are already in place. ${priority} is the total rate for exactly the same job with priority within 24 hours, only after we confirm availability \u2014 it is not a surcharge.`
            : `Het aansluiten van de Perilex-stekker op je apparaat kost ${standard}. Dat tarief geldt wanneer er een bestaande geschikte Perilex-wandcontactdoos en een werkende geschikte groep aanwezig zijn. ${priority} is het totale tarief voor exact dezelfde klus met voorrang binnen 24 uur, uitsluitend na bevestigde beschikbaarheid \u2014 het is geen toeslag.`}
        </p>
        <p className="mt-3 text-base leading-relaxed sm:text-lg">
          {en
            ? `A new cable, a new circuit, a socket outlet, a change to the consumer unit, relocation or building work is assessed and quoted. A site visit with advice costs ${survey} and is deducted in full from the final invoice when VoltFix carries out the quoted work.`
            : `Een nieuwe kabel, nieuwe groep, wandcontactdoos, groepenkastaanpassing, verplaatsing of bouwkundig werk wordt beoordeeld en geoffreerd. Een schouw met advies op locatie kost ${survey} en wordt volledig verrekend op de eindfactuur wanneer VoltFix de geoffreerde werkzaamheden uitvoert.`}
        </p>
      </div>
    </section>

    {/* SITUATIES */}
    <section id="situaties" className="scroll-mt-28 border-b border-border">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-2xl font-bold sm:text-3xl">{en ? 'Which situation matches yours?' : 'Welke situatie herken je?'}</h2>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">
          {en ? 'You do not need to work out how many phases you have. We check that.' : 'Je hoeft zelf niet vast te stellen hoeveel fasen je hebt. Dat controleren wij.'}
        </p>
        <div className="mt-7 grid gap-5 md:grid-cols-2">
          {perilexSituations.map(situation => {
            const copy = situation[en ? 'en' : 'nl'];
            return <article key={situation.ctaId} className="flex flex-col rounded-lg border border-border bg-card p-5 sm:p-6">
              <h3 className="text-lg font-bold">{copy.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{copy.body}</p>
              <p className="mt-3 text-base leading-relaxed">{copy.step}</p>
              <Button variant="outline" size="lg" onClick={() => start(situation.ctaId)} className="mt-5 h-auto min-h-12 w-fit whitespace-normal px-4 py-3">
                {ctaLabel(situation.ctaId, lang)}
              </Button>
            </article>;
          })}
        </div>
        <p className="mt-6 rounded-lg border border-border bg-card p-5 text-base leading-relaxed">
          {en ? 'A tripping circuit, a warm connection, a burning smell or sparks? Do not use the appliance and call us: ' : 'Slaat de groep af, wordt de aansluiting warm, ruik je een brandlucht of zie je vonken? Gebruik het apparaat niet en bel ons: '}
          <a href={telHref} className="font-semibold text-primary underline underline-offset-4">{business.phoneDisplay}</a>.
        </p>
      </div>
    </section>

    {/* TARIEVEN */}
    <section id="tarieven" className="scroll-mt-28 border-b border-border">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-2xl font-bold sm:text-3xl">{en ? 'Rates and site visit' : 'Tarieven en schouw'}</h2>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">
          {en ? 'Two rates for the same straightforward job, plus a separate route when the situation has to be assessed first.' : 'Twee tarieven voor dezelfde eenvoudige klus, plus een aparte route wanneer de situatie eerst beoordeeld moet worden.'}
        </p>
        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <article className="flex flex-col rounded-lg border border-border bg-card p-5 sm:p-6">
            <h3 className="text-lg font-bold">{en ? 'Connect the appliance' : 'Apparaat aansluiten'}</h3>
            <p className="mt-2 text-2xl font-bold tabular-nums">{standard}</p>
            <p className="mt-2 text-base text-muted-foreground">{perilexHeroConditionLine[en ? 'en' : 'nl']}</p>
            <Button variant="cta" size="lg" onClick={() => start('rate_standard')} className="mt-5 h-auto min-h-12 w-fit whitespace-normal px-4 py-3">{ctaLabel('rate_standard', lang)}</Button>
          </article>
          <article className="flex flex-col rounded-lg border border-border bg-card p-5 sm:p-6">
            <h3 className="text-lg font-bold">{en ? 'Same job, priority within 24 hours' : 'Dezelfde klus, voorrang binnen 24 uur'}</h3>
            <p className="mt-2 text-2xl font-bold tabular-nums">{priority}</p>
            <p className="mt-2 text-base text-muted-foreground">
              {en ? 'Total rate, not a surcharge. Only after we have confirmed availability.' : 'Totaaltarief, geen toeslag. Uitsluitend na bevestigde beschikbaarheid.'}
            </p>
            <Button variant="outline" size="lg" onClick={() => start('rate_priority')} className="mt-5 h-auto min-h-12 w-fit whitespace-normal px-4 py-3">{ctaLabel('rate_priority', lang)}</Button>
          </article>
        </div>
        <div className="mt-5 rounded-lg border border-border bg-card p-5 sm:p-6">
          <h3 className="text-lg font-bold">{en ? 'Site visit and advice' : 'Schouw en advies op locatie'}</h3>
          <p className="mt-2 text-2xl font-bold tabular-nums">{survey}</p>
          <p className="mt-2 max-w-2xl text-base text-muted-foreground">
            {perilexDeductibleNote[en ? 'en' : 'nl']} {en
              ? 'You only book a site visit when you choose it here explicitly; assessing your situation from a photo or the model details is free.'
              : 'Je boekt een schouw alleen als je hier expliciet voor kiest; je situatie laten beoordelen op basis van een foto of modelgegevens is gratis.'}
          </p>
          <Button variant="outline" size="lg" onClick={() => start('rate_survey')} className="mt-5 h-auto min-h-12 w-fit whitespace-normal px-4 py-3">{ctaLabel('rate_survey', lang)}</Button>
        </div>
        <p className="mt-4 text-base text-muted-foreground">
          {en
            ? 'A new cable, new circuit, socket outlet, consumer unit change, relocation or building work is assessed and quoted separately.'
            : 'Een nieuwe kabel, nieuwe groep, wandcontactdoos, groepenkastaanpassing, verplaatsing of bouwkundig werk wordt apart beoordeeld en geoffreerd.'}
        </p>
      </div>
    </section>

    {/* WERKWIJZE */}
    <section id="werkwijze" className="scroll-mt-28 border-b border-border">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-2xl font-bold sm:text-3xl">{en ? 'How it works' : 'Zo werkt het'}</h2>
        <div className="mt-7 grid gap-5 md:grid-cols-3">
          {perilexSteps[en ? 'en' : 'nl'].map(([number, title, body]) =>
            <div key={number}>
              <span className="text-sm font-bold text-primary tabular-nums">{number}</span>
              <h3 className="mt-2 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">{body}</p>
            </div>)}
        </div>
        <div className="mt-7"><PrimaryCta id="closing_primary" /></div>
      </div>
    </section>

    {/* BEWIJS \u2014 bestaande, controleerbare reviews */}
    <Testimonials category="perilex" />

    {/* INHOUDELIJKE UITLEG */}
    <section id="uitleg" className="scroll-mt-28 border-y border-border">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="text-2xl font-bold sm:text-3xl">{en ? 'Plug, socket, cooking circuit and mains supply' : 'Stekker, wandcontactdoos, kookgroep en netaansluiting'}</h2>
        <div className="mt-5 space-y-4 text-base leading-relaxed">
          <p>{en
            ? 'The plug is the part on your appliance cable. The socket is the connection point in the wall. The cooking circuit is the separate, heavier circuit in the consumer unit that protects that point. The mains supply is what the grid operator brings into the building. These are four different things, and each one can be the reason a job is simple or not.'
            : 'De stekker zit aan de kabel van je apparaat. De wandcontactdoos is het aansluitpunt in de muur. De kookgroep is de aparte, zwaardere groep in de groepenkast die dat punt beveiligt. De netaansluiting is wat de netbeheerder het pand in brengt. Dat zijn vier verschillende dingen, en elk ervan kan bepalen of een klus eenvoudig is of niet.'}</p>
          <p>{en
            ? 'A Perilex socket does not prove how it is wired. The same socket shape occurs on a single-phase installation with one heavier cooking circuit and on an installation where two or three phases are actually connected. "Two phases" is therefore not automatically 400 V, and the wattage on the appliance box does not by itself decide which connection you need.'
            : 'Een Perilex-stopcontact bewijst niet hoe het is aangesloten. Dezelfde stopcontactvorm komt voor bij een eenfase-installatie met \u00e9\u00e9n zwaardere kookgroep en bij een installatie waar werkelijk twee of drie fasen zijn aangesloten. \u201e2-fase\u201d betekent dus niet automatisch 400 V, en het wattage op de doos van je apparaat bepaalt op zichzelf niet welke aansluiting je nodig hebt.'}</p>
          <p>{en
            ? 'What does decide it: the manufacturer\u2019s connection diagram for your appliance, the wiring and circuit actually present, and a check on site. That is why we never ask you to measure anything live or to remove any cover. Send what you can see, or let us assess it.'
            : 'Wat het w\u00e9l bepaalt: het aansluitschema van de fabrikant van jouw apparaat, de werkelijk aanwezige bedrading en groep, en een controle ter plaatse. Daarom vragen wij je nooit zelf onder spanning te meten of een afdekking te verwijderen. Stuur wat je kunt zien, of laat het ons beoordelen.'}</p>
          <p>{en ? 'More background: ' : 'Meer achtergrond: '}
            <Link to="/perilex-stekker" className="font-semibold text-primary underline underline-offset-4">{en ? 'about the Perilex plug' : 'over de Perilex-stekker'}</Link>
            {en ? ', ' : ', '}
            <Link to="/3-fase-aansluiting-amsterdam" className="font-semibold text-primary underline underline-offset-4">{en ? 'three-phase connection' : '3-fase aansluiting'}</Link>
            {en ? ' and ' : ' en '}
            <Link to="/groepenkast-amsterdam" className="font-semibold text-primary underline underline-offset-4">{en ? 'fuse box replacement' : 'groepenkast vervangen'}</Link>.
          </p>
        </div>
      </div>
    </section>

    {/* FAQ */}
    <div id="vragen" className="scroll-mt-28"><ServiceFaq faqs={perilexFaqs(lang)} /></div>

    {/* WERKGEBIED + INTERNE LINKS */}
    <NeighborhoodLinks
      title={en ? 'Perilex connections across Amsterdam' : 'Perilex aansluiten in heel Amsterdam'}
      intro={en ? 'We work in Amsterdam and the surrounding area.' : 'We werken in Amsterdam en omgeving.'}
    />
    <RelatedServices currentPath={path} />

    {/* AFSLUITENDE AANVRAAG */}
    <section id="aanvragen" className="scroll-mt-28 border-t border-border">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="text-2xl font-bold sm:text-3xl">{en ? 'Start your request' : 'Start je aanvraag'}</h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">{perilexAvailabilityLine[en ? 'en' : 'nl']}</p>
        {canBook
          ? <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap"><PrimaryCta id="closing_primary" /><Button variant="outline" size="xl" onClick={() => start('card_unsure')} className="h-auto min-h-12 whitespace-normal px-5 py-3"><Camera aria-hidden />{ctaLabel('card_unsure', lang)}</Button></div>
          : <>
            <p className="mt-4 text-base leading-relaxed">
              {en ? 'Online requests for this service are not open yet. Call or message us and we will arrange it directly.' : 'Online aanvragen staat voor deze dienst nog niet open. Bel of app ons, dan regelen we het direct.'}
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="cta" size="xl" className="h-auto min-h-12 whitespace-normal px-5 py-3"><a href={telHref}><Phone aria-hidden />{en ? `Call ${business.phoneDisplay}` : `Bel ${business.phoneDisplay}`}</a></Button>
              <Button asChild variant="whatsapp" size="xl" className="h-auto min-h-12 whitespace-normal px-5 py-3"><a href={wa} target="_blank" rel="noopener noreferrer"><WhatsAppIcon className="size-5" ariaLabel="WhatsApp" />WhatsApp</a></Button>
            </div>
          </>}
      </div>
    </section>

    {canBook && <PerilexBooking lang={lang} open={open} onClose={close} sourcePage={path} request={request as never} />}
  </div>;
}
