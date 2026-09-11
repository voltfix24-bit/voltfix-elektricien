import { Camera, MapPin, Phone, ShieldCheck, Star } from 'lucide-react';
import { business, telHref, whatsappHref } from '@/lib/business';
import { aggregateRating, reviews } from '@/data/reviews';
import { groupMoney, type GroupLocale } from '@/lib/groepenkast';
import { prices } from '@/lib/pricing';

/**
 * Conversie- en trustblokken voor /groepenkast-amsterdam (NL/EN).
 * Bevat uitsluitend echte, verifieerbare data. Waar echte input ontbreekt
 * (werkfoto's) staan nette placeholders — nooit verzonnen bewijs.
 */

const fmt = (v: number, lang: GroupLocale) => groupMoney(v, lang);

/** Reviewregel met bron + link naar het Google-profiel. */
export function GroepenkastReviewSource({ lang }: { lang: GroupLocale }) {
  const en = lang === 'en';
  const rating = aggregateRating.ratingValue.toLocaleString(en ? 'en-GB' : 'nl-NL');
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <span className="inline-flex items-center gap-1.5 font-semibold">
        <Star className="size-4 shrink-0 fill-current text-primary" aria-hidden />
        {en
          ? `${rating}/5 from ${aggregateRating.reviewCount} Google reviews`
          : `${rating}/5 uit ${aggregateRating.reviewCount} Google-reviews`}
      </span>
      <a
        href={business.googleBusinessProfile}
        target="_blank"
        rel="noopener nofollow"
        className="font-semibold text-primary underline underline-offset-4"
      >
        {en ? 'View Google profile' : 'Bekijk Google-profiel'}
      </a>
    </div>
  );
}

/** Compact reviewblok met uitsluitend echte groepenkast-reviews. */
export function GroepenkastReviews({ lang }: { lang: GroupLocale }) {
  const en = lang === 'en';
  const items = reviews.filter(r => r.categories.includes('groepenkast')).slice(0, 3);
  if (items.length === 0) return null;
  return (
    <section aria-label={en ? 'Fuse box reviews' : 'Groepenkast-reviews'} className="border-t border-border bg-muted/30 py-10 sm:py-12">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-2xl font-bold">{en ? 'What customers say about fuse box work' : 'Wat klanten zeggen over groepenkastwerk'}</h2>
        <div className="mt-3"><GroepenkastReviewSource lang={lang} /></div>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {items.map(r => (
            <li key={r.name + r.date} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-1 text-primary" aria-label={en ? '5 out of 5' : '5 van de 5'}>
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="size-4 fill-current" aria-hidden />)}
              </div>
              <p className="mt-3 text-sm leading-relaxed">{en ? r.en : r.nl}</p>
              <p className="mt-3 text-sm font-semibold">{r.name}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Werkfoto's van eigen werk — uitsluitend echte projectfoto's. */
export function GroepenkastWorkPhotos({ lang }: { lang: GroupLocale }) {
  const en = lang === 'en';
  const photos = [
    {
      src: '/images/work/groepenkast-amsterdam-west.jpg',
      caption: en ? 'Fuse box replaced in Amsterdam-West' : 'Groepenkast vervangen in Amsterdam-West',
    },
    {
      src: '/images/work/3-fase-groepenkast-amsterdam-zuid.jpg',
      caption: en ? 'Three-phase fuse box installed in Amsterdam-Zuid' : '3-fase groepenkast geplaatst in Amsterdam-Zuid',
    },
  ];
  return (
    <section aria-label={en ? 'Recent work' : 'Recent werk'} className="border-t border-border py-10 sm:py-12">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-2xl font-bold">{en ? 'Recently replaced fuse boxes in Amsterdam' : 'Recent vervangen groepenkasten in Amsterdam'}</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {en
            ? 'Photos of work carried out by our own engineers in Amsterdam.'
            : 'Foto’s van werk uitgevoerd door onze eigen monteurs in Amsterdam.'}
        </p>
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {photos.map(p => (
            <li key={p.src} className="overflow-hidden rounded-lg border border-border bg-card">
              <img
                src={p.src}
                alt={p.caption}
                loading="lazy"
                width={800}
                height={1000}
                className="h-64 w-full object-cover sm:h-80"
              />
              <p className="p-3 text-sm leading-snug text-muted-foreground">{p.caption}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Meerprijs- en uitzonderingenblok bij het prijsgedeelte. */
export function GroepenkastSurcharges({ lang }: { lang: GroupLocale }) {
  const en = lang === 'en';
  const bullets = en
    ? ['Missing or unsafe earthing.', 'Moving or enlarging the meter cupboard or fuse box.', 'Extra wiring outside the fuse box.', 'Changes to the main supply cable or grid connection.', 'Unsafe or outdated wiring outside the board.', 'Chasing, breaking and making-good work.']
    : ['Ontbrekende of onveilige aarding.', 'Verplaatsen of vergroten van de meterkast/groepenkast.', 'Extra bekabeling buiten de groepenkast.', 'Aanpassing van hoofdleiding of netaansluiting.', 'Onveilige of verouderde bedrading buiten de kast.', 'Hak-, breek- of herstelwerk.'];
  return (
    <div className="mt-10 rounded-lg border border-border bg-card p-5 sm:p-6">
      <h3 className="text-xl font-bold">{en ? 'When can it cost more?' : 'Wanneer kan het duurder worden?'}</h3>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {en
          ? 'The packages are all-in guide prices for a standard replacement. Sometimes extra work is needed. We always tell you beforehand, with a price, before you agree.'
          : 'De pakketten zijn all-in richtprijzen voor een standaard vervanging. Soms is extra werk nodig. Dat melden we altijd vooraf met een prijs, voordat je akkoord geeft.'}
      </p>
      <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        {bullets.map(b => (
          <li key={b} className="flex items-start gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden /><span>{b}</span></li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted-foreground">
        {en
          ? 'Upgrading the grid connection is handled by Liander, the grid operator in Amsterdam.'
          : 'Verzwaring van de netaansluiting loopt via Liander, de netbeheerder in Amsterdam.'}
      </p>
    </div>
  );
}

/** "Wie komt er langs?" — uitsluitend echte monteursdata. */
export function GroepenkastTechnician({ lang }: { lang: GroupLocale }) {
  const en = lang === 'en';
  const tech = business.team.find(t => t.photo && t.careerStartYear);
  return (
    <section aria-label={en ? 'Who will visit?' : 'Wie komt er langs?'} className="border-t border-border bg-muted/30 py-10 sm:py-12">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-2xl font-bold">{en ? 'Who will visit?' : 'Wie komt er langs?'}</h2>
        {tech ? (
          <div className="mt-5 flex flex-col gap-4 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-center">
            <img src={tech.photo} alt={`${tech.name} — ${en ? tech.jobTitleEn : tech.jobTitle} VoltFix`} width={96} height={96} loading="lazy" className="size-20 shrink-0 rounded-full object-cover" />
            <div>
              <p className="text-lg font-bold">{tech.name} · {en ? tech.jobTitleEn : tech.jobTitle}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{en ? tech.bioEn : tech.bioNl}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {en
                  ? 'Your request is reviewed by a VoltFix electrician. We check your photo or plan a site inspection before your final fixed price is confirmed.'
                  : 'Je aanvraag wordt beoordeeld door een VoltFix-elektromonteur. We controleren je foto of plannen een schouw voordat je definitieve vaste prijs wordt bevestigd.'}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {en
              ? 'Your request is reviewed by a VoltFix electrician. We check your photo or plan a site inspection before your final fixed price is confirmed.'
              : 'Je aanvraag wordt beoordeeld door een VoltFix-elektromonteur. We controleren je foto of plannen een schouw voordat je definitieve vaste prijs wordt bevestigd.'}
          </p>
        )}
      </div>
    </section>
  );
}

/** Werkgebied, spoedroute en beschikbaarheid — geen nep-schaarste. */
export function GroepenkastServiceArea({ lang }: { lang: GroupLocale }) {
  const en = lang === 'en';
  return (
    <div className="mt-6 grid gap-3 rounded-lg border border-border bg-card p-4 lg:p-5 text-sm sm:grid-cols-3">
      <p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden /><span>{en ? 'Service area: Amsterdam, Amstelveen, Diemen and the surrounding area.' : 'Werkgebied: Amsterdam, Amstelveen, Diemen en omgeving.'}</span></p>
      <p className="flex items-start gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden /><span>{en ? 'Installation time arranged after the photo review or site inspection.' : 'Installatiemoment in overleg na foto- of schouwcontrole.'}</span></p>
      <p className="flex items-start gap-2">
        <Phone className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <span>
          {en ? 'No power, or a circuit that keeps tripping? Call directly: ' : 'Geen stroom of klapt er steeds een groep uit? Bel direct: '}
          <a href={telHref} className="font-semibold text-primary underline underline-offset-4">{business.phoneDisplay}</a>
          {' · '}
          <a href={en ? '/en-gb/spoed-elektricien-amsterdam' : '/spoed-elektricien-amsterdam'} className="font-semibold text-primary underline underline-offset-4">{en ? 'Emergency' : 'Spoed'}</a>
          <span className="mt-1 block leading-relaxed text-muted-foreground">{en ? `Emergency diagnosis ${groupMoney(prices.emergencyFirstHour, lang)} first hour all-in.` : `Spoeddiagnose ${groupMoney(prices.emergencyFirstHour, lang)} eerste uur all-in.`}</span>
        </span>
      </p>
    </div>
  );
}

/** Citeerbare kostensectie voor zoek- en AI-machines. */
export function GroepenkastCosts2026({ lang }: { lang: GroupLocale }) {
  const en = lang === 'en';
  const rows: [string, number][] = en
    ? [['Single-phase basic, 6–8 circuits', prices.groepenkast1Phase], ['Three-phase basic, 6–8 circuits', prices.groepenkast3Phase], ['Three-phase extended, 10–12 circuits', prices.groepenkast3PhaseExtended]]
    : [['1-fase basis, 6–8 groepen', prices.groepenkast1Phase], ['3-fase basis, 6–8 groepen', prices.groepenkast3Phase], ['3-fase uitgebreid, 10–12 groepen', prices.groepenkast3PhaseExtended]];
  return (
    <section aria-label={en ? 'Fuse box replacement cost 2026' : 'Kosten groepenkast vervangen 2026'} className="border-t border-border py-10 sm:py-12">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="text-2xl font-bold">{en ? 'What does replacing a fuse box in Amsterdam cost in 2026?' : 'Wat kost een groepenkast vervangen in Amsterdam in 2026?'}</h2>
        <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
          {rows.map(([label, price]) => (
            <li key={label} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm font-semibold">{label}</span>
              <span className="whitespace-nowrap text-base font-bold text-primary">{en ? 'from' : 'vanaf'} {fmt(price, lang)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {en
            ? 'All-in guide prices including installation, materials and 21% VAT. Your final fixed price is confirmed after a photo review or site inspection.'
            : 'All-in richtprijzen incl. montage, materiaal en 21% btw. De definitieve vaste prijs volgt na foto- of schouwcontrole.'}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {en
            ? 'We work across Amsterdam, Amstelveen and Diemen: 1930s houses in Zuid and West, walk-up flats with a small meter cupboard, and apartments with a VvE where the private board is separate from the communal installation. Upgrading the main grid connection itself always runs through Liander, the grid operator in Amsterdam.'
            : 'We werken in Amsterdam, Amstelveen en Diemen: jaren-30-woningen in Zuid en West, portiekwoningen met een krappe meterkast, en appartementen met een VvE waar de privékast losstaat van de gezamenlijke installatie. Verzwaring van de hoofdaansluiting loopt altijd via Liander, de netbeheerder in Amsterdam.'}
        </p>
      </div>
    </section>
  );
}

export const groepenkastPriceChecked = {
  nl: 'Prijzen gecontroleerd: september 2026',
  en: 'Prices checked: September 2026',
};

/** Fotoroute met WhatsApp-optie en veiligheidsregel. */
export function GroepenkastPhotoRoute({ lang, onUpload }: { lang: GroupLocale; onUpload: () => void }) {
  const en = lang === 'en';
  const message = en
    ? 'Hi VoltFix 👋 I’m sending a photo of my fuse box for a fixed-price check in Amsterdam.'
    : 'Hallo VoltFix 👋 Ik stuur een foto van mijn groepenkast voor een vaste prijscontrole in Amsterdam.';
  return (
    <div className="mt-6 rounded-lg border border-border bg-card p-5">
      <h3 className="flex items-center gap-2 text-lg font-bold"><Camera className="size-5 shrink-0 text-primary" aria-hidden />{en ? 'Not sure which package you need?' : 'Weet je niet welk pakket je nodig hebt?'}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {en
          ? 'Send a photo of your opened fuse box. We usually reply within 1 hour during opening hours.'
          : 'Stuur een foto van je geopende groepenkast. We reageren meestal binnen 1 uur tijdens openingstijden.'}
      </p>
      <p className="mt-2 flex items-start gap-2 text-sm font-semibold">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <span>{en ? 'Open the cupboard door only. Do not unscrew anything, do not remove seals and do not touch any wiring.' : 'Open alleen het deurtje. Schroef niets los, verwijder geen zegels en raak geen bedrading aan.'}</span>
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={onUpload} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
          <Camera className="size-4" aria-hidden />{en ? 'Upload photo now' : 'Foto nu uploaden'}
        </button>
        <a href={whatsappHref(message, { campaign: '/groepenkast-amsterdam', content: 'photo-route', term: lang })} target="_blank" rel="noopener" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-whatsapp px-4 text-sm font-semibold text-whatsapp-foreground">
          {en ? 'Send photo via WhatsApp' : 'Foto via WhatsApp sturen'}
        </a>
      </div>
    </div>
  );
}

/** Wat zit niet standaard in het pakket. */
export function GroepenkastNotIncluded({ lang }: { lang: GroupLocale }) {
  const en = lang === 'en';
  const bullets = en
    ? ['Upgrading the grid connection; this is handled by Liander.', 'Installing or repairing earthing when it is missing.', 'Moving the meter cupboard or fuse box.', 'Replacing unsafe wiring outside the fuse box.', 'Chasing, breaking and making-good work outside the fuse box.']
    : ['Verzwaring van de netaansluiting; dit loopt via Liander.', 'Aanleggen of herstellen van aarding als dit ontbreekt.', 'Verplaatsen van de meterkast/groepenkast.', 'Vervangen van onveilige bedrading buiten de groepenkast.', 'Hak-, breek- en herstelwerk buiten de groepenkast.'];
  return (
    <div className="mt-8 rounded-lg border border-border bg-card p-5 sm:p-6">
      <h3 className="text-xl font-bold">{en ? 'What is not included as standard?' : 'Wat zit niet standaard in het pakket?'}</h3>
      <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        {bullets.map(b => <li key={b} className="flex items-start gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden /><span>{b}</span></li>)}
      </ul>
      <p className="mt-4 text-sm font-semibold">
        {en ? 'If extra work is needed, you always get a price first, before you agree.' : 'Als extra werk nodig is, krijg je altijd eerst een prijs vóór je akkoord geeft.'}
      </p>
    </div>
  );
}

/** Veelvoorkomend meerwerk — alleen bestaande, bekende richtprijzen. */
export function GroepenkastExtraWork({ lang }: { lang: GroupLocale }) {
  const en = lang === 'en';
  const onQuote = en ? 'Based on photo or site inspection' : 'Op basis van foto/schouw';
  const rows: [string, string][] = en
    ? [
        ['Adding an extra circuit', `${en ? 'from' : 'vanaf'} ${fmt(prices.groepenkastExtraGroupFrom, lang)}`],
        ['Cooker circuit / induction', `+${fmt(prices.groepenkastInduction, lang)}`],
        ['PV / solar circuit', `+${fmt(prices.groepenkastSolar, lang)}`],
        ['Surge protection', `+${fmt(prices.groepenkastSurge, lang)}`],
        ['Installing or repairing earthing', onQuote],
        ['Rewiring or repairs outside the board', onQuote],
      ]
    : [
        ['Extra groep bijplaatsen', `vanaf ${fmt(prices.groepenkastExtraGroupFrom, lang)}`],
        ['Kookgroep / inductie', `+${fmt(prices.groepenkastInduction, lang)}`],
        ['PV / zonnepanelen', `+${fmt(prices.groepenkastSolar, lang)}`],
        ['Overspanningsbeveiliging', `+${fmt(prices.groepenkastSurge, lang)}`],
        ['Aarding aanleggen of herstellen', onQuote],
        ['Bekabeling of herstel buiten de kast', onQuote],
      ];
  return (
    <div className="mt-8 rounded-lg border border-border bg-card p-5 sm:p-6">
      <h3 className="text-xl font-bold">{en ? 'Common additional work' : 'Veelvoorkomend meerwerk'}</h3>
      <ul className="mt-4 divide-y divide-border">
        {rows.map(([label, price]) => (
          <li key={label} className="flex items-center justify-between gap-3 py-2.5">
            <span className="min-w-0 text-sm font-semibold">{label}</span>
            <span className="whitespace-nowrap text-sm font-bold text-primary">{price}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-muted-foreground">
        {en ? 'Guide prices including 21% VAT. Work without a listed price is quoted after the photo review or site inspection, before you agree.' : 'Richtprijzen incl. 21% btw. Werk zonder vermeld bedrag prijzen we na de foto- of schouwcontrole, vóór je akkoord geeft.'}
      </p>
    </div>
  );
}

/** Camera-icoon herexport voor consistente iconografie. */
export { Camera };
