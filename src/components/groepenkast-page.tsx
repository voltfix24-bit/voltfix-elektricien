import { useEffect, useState } from 'react';
import { setBookingActive } from '@/lib/booking-active';
import { ArrowRight, Camera, Check, ClipboardList, ShieldCheck } from 'lucide-react';
import heroImg from '@/assets/voltfix-groepenkast-abb-modern.webp.asset.json';
import { Button } from '@/components/ui/button';
import { GroepenkastBooking } from '@/components/groepenkast-booking';
import { ServiceFaq } from '@/components/service-faq';
import { Testimonials } from '@/components/testimonials';
import { groupChips, groupDisclaimer, groupFaqs, groupMoney, groupOptions, groupPackages, groupSections, groupShortAnswer, groupSurveyNote, groupTrust, type GroupLocale, type PackageId } from '@/lib/groepenkast';
import { prices } from '@/lib/pricing';
import { GroepenkastCosts2026, GroepenkastExtraWork, GroepenkastNotIncluded, GroepenkastPhotoRoute, GroepenkastReviewSource, GroepenkastReviews, GroepenkastServiceArea, GroepenkastSurcharges, GroepenkastTechnician, GroepenkastWorkPhotos, groepenkastPriceChecked } from '@/components/groepenkast-trust';
import { business, telHref } from '@/lib/business';
import { Phone } from 'lucide-react';
import { useTrackConversion } from '@/lib/analytics';

export function GroepenkastPage({ lang }: { lang: GroupLocale }) {
  const en = lang === 'en';
  const [packageId, setPackageId] = useState<PackageId | ''>('');
  const [step, setStep] = useState(1);
  const [surveyRequest, setSurveyRequest] = useState(0);
  const track = useTrackConversion();
  useEffect(() => () => setBookingActive(false), []);
  function openBooking(id?: PackageId, photo = false) {
    if (id) setPackageId(id);
    setStep(photo ? 3 : id ? 2 : 1);
    setBookingActive(true);
    track('quote', photo ? 'groepenkast-photo-check' : 'groepenkast-price-calculation');
    document.getElementById('installatiemoment')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }
  function openSurvey() {
    setPackageId('unknown');
    setStep(3);
    setSurveyRequest(n => n + 1);
    setBookingActive(true);
    track('quote', 'groepenkast-survey');
    document.getElementById('installatiemoment')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }
  return <div className="groepenkast-page bg-background text-foreground">
    {/* Hero — conversiegericht, in lijn met de ads-pagina */}
    <section className="relative isolate overflow-hidden border-b border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-8 sm:pt-16 sm:pb-12">
        <div className="relative z-10 max-w-2xl lg:max-w-[65%]">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary"><ShieldCheck className="size-4" />VoltFix · {en ? 'Amsterdam & surrounding area' : 'Amsterdam en omgeving'}</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">{en ? 'Fuse box replacement in Amsterdam' : 'Groepenkast vervangen in Amsterdam'}</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed">{en ? `All-in packages from ${groupMoney(prices.groepenkastFrom, lang)} including installation, materials and 21% VAT.` : `All-in pakketten vanaf ${groupMoney(prices.groepenkastFrom, lang)} incl. montage, materiaal en 21% btw.`}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button variant="cta" size="xl" onClick={() => openBooking()} className="h-auto min-h-12 whitespace-normal px-5 py-3">{en ? 'Calculate my fixed price' : 'Bereken mijn vaste prijs'}<ArrowRight /></Button>
            <Button variant="outline" size="xl" onClick={() => openBooking('unknown', true)} className="h-auto min-h-12 whitespace-normal px-5 py-3"><Camera />{en ? 'Send photo for price check' : 'Stuur foto voor prijscontrole'}</Button>
            <a href={telHref} onClick={() => track('call', 'groepenkast-hero')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-border px-5 py-3 text-base font-semibold sm:hidden"><Phone className="size-4" aria-hidden />{en ? `Call ${business.phoneDisplay}` : `Bel ${business.phoneDisplay}`}</a>
          </div>
          <ul className="mt-6 flex flex-wrap gap-2">{groupChips[lang].map((chip, i) => <li key={chip} className={`items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold sm:text-sm ${i < 3 ? 'inline-flex' : 'hidden sm:inline-flex'}`}><Check className="size-3.5 shrink-0 text-primary" />{chip}</li>)}</ul>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">{groupDisclaimer[lang]}</p>
          <GroepenkastServiceArea lang={lang} />
        </div>
        <img src={heroImg.url} alt={en ? 'ABB fuse box with circuit breakers and RCD protection' : 'ABB-groepenkast met installatieautomaten en aardlekbeveiliging'} width={600} height={800} fetchPriority="high" className="mx-auto mt-5 h-52 w-full object-contain lg:absolute lg:right-4 lg:top-10 lg:-z-10 lg:mt-0 lg:h-96 lg:w-[30%]" />
        <div className="relative mt-7 grid gap-2 border-t border-border pt-5 sm:grid-cols-3">{groupPackages.map(p => <Button key={p.id} variant="ghost" className="h-auto min-h-16 justify-between gap-2 whitespace-normal rounded-md px-2 text-left" onClick={() => openBooking(p.id)}><span><span className="block text-sm font-semibold">{p[lang]}</span><span className="block text-xs text-muted-foreground">{p.circuits} {en ? 'circuits' : 'groepen'}</span></span><span className="whitespace-nowrap text-xl font-bold text-primary">{groupMoney(p.price, lang)}</span></Button>)}</div>
      </div>
    </section>

    {/* Kort antwoord — direct citeerbaar voor zoek- en AI-machines */}
    <section aria-label={en ? 'Short answer' : 'Kort antwoord'} className="border-b border-border bg-muted/40">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <p className="text-base leading-relaxed">{groupShortAnswer[lang]}</p>
      </div>
    </section>

    <section id="prijzen" className="scroll-mt-24 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-sm font-semibold text-primary">{en ? 'One clear price. Properly installed.' : 'Eén heldere prijs. Netjes geregeld.'}</p>
        <h2 className="mt-2 text-3xl font-bold">{en ? `All-in packages from ${groupMoney(prices.groepenkastFrom, lang)}` : `All-in pakketten vanaf ${groupMoney(prices.groepenkastFrom, lang)}`}</h2>
        <div className="mt-7 grid gap-4 md:grid-cols-3">{groupPackages.map(p => <article key={p.id} className="flex flex-col rounded-lg border border-border bg-card p-5 sm:p-6"><h3 className="text-xl font-bold">{p[lang]}</h3><p className="mt-2 text-muted-foreground">{p.circuits} {en ? 'circuits' : 'groepen'}</p><p className="mt-5 whitespace-nowrap text-4xl font-bold text-primary">{groupMoney(p.price, lang)}</p><p className="mt-2 text-sm text-muted-foreground">{en ? 'All-in guide price · incl. installation, materials and 21% VAT' : 'All-in richtprijs · incl. montage, materiaal en 21% btw'}</p><Button className="mt-6 min-h-12 whitespace-normal" onClick={() => openBooking(p.id)}>{en ? 'Request fixed price' : 'Vraag vaste prijs aan'}<ArrowRight /></Button></article>)}</div>

        {/* Optietabel — scanbaar op mobiel */}
        <h3 className="mt-10 text-xl font-bold">{en ? 'Options you can add' : 'Opties die je kunt bijkiezen'}</h3>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{groupOptions.map(o => <li key={o.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"><span className="min-w-0 text-sm font-semibold">{o[lang]}</span><span className="whitespace-nowrap text-sm font-bold text-primary">+{groupMoney(o.price, lang)}</span></li>)}</ul>

        <ul className="mt-7 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">{groupTrust[lang].map(text => <li key={text} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" /><span>{text}</span></li>)}</ul>
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">{groupDisclaimer[lang]}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button variant="cta" size="xl" onClick={() => openBooking()} className="h-auto min-h-12 whitespace-normal px-5 py-3">{en ? 'Calculate fixed price' : 'Bereken vaste prijs'}<ArrowRight /></Button>
          <Button variant="outline" size="xl" onClick={() => openBooking('unknown', true)} className="h-auto min-h-12 whitespace-normal px-5 py-3"><Camera />{en ? 'Send a photo of your fuse box' : 'Stuur foto van je groepenkast'}</Button>
          <Button variant="ghost" size="xl" onClick={openSurvey} className="h-auto min-h-12 whitespace-normal px-5 py-3"><ClipboardList />{en ? `Book a site inspection for ${groupMoney(prices.groepenkastSurvey, lang)}` : `Plan schouw van ${groupMoney(prices.groepenkastSurvey, lang)}`}</Button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{groupSurveyNote[lang]}</p>
        <p className="mt-2 text-xs text-muted-foreground">{groepenkastPriceChecked[lang]}</p>
        <div className="mt-4"><GroepenkastReviewSource lang={lang} /></div>
        <GroepenkastPhotoRoute lang={lang} onUpload={() => openBooking('unknown', true)} />
        <GroepenkastNotIncluded lang={lang} />
        <GroepenkastExtraWork lang={lang} />
        <GroepenkastSurcharges lang={lang} />
      </div>
    </section>

    <GroepenkastCosts2026 lang={lang} />

    <GroepenkastBooking lang={lang} packageId={packageId} setPackageId={setPackageId} step={step} setStep={setStep} surveyRequest={surveyRequest} />

    <GroepenkastWorkPhotos lang={lang} />
    <GroepenkastReviews lang={lang} />
    <GroepenkastTechnician lang={lang} />

    <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <h2 className="text-3xl font-bold">{en ? 'Your new fuse box, properly installed' : 'Je nieuwe groepenkast, vakkundig geplaatst'}</h2>
      <div className="mt-8 grid gap-8 md:grid-cols-3">{(en ? [
        ['01', 'Photo or site inspection', 'We check your connection, wiring, earthing and the space in your meter cupboard. You receive the final fixed price before agreeing to the work.'],
        ['02', 'Replacement to NEN 1010', 'We arrange the installation time, safely disconnect the old box and fit the new one with appropriate circuit protection.'],
        ['03', 'Tested, labelled and tidy', 'We test the installation, label the circuits and remove the old box. Includes 12 months’ workmanship warranty and 2 years’ manufacturer warranty.'],
      ] : [
        ['01', 'Foto- of schouwcontrole', 'We controleren je aansluiting, bedrading, aarding en de ruimte in de meterkast. Je ontvangt de definitieve vaste prijs voordat je akkoord geeft.'],
        ['02', 'Vervanging volgens NEN 1010', 'We spreken het installatiemoment af, demonteren de oude kast veilig en plaatsen de nieuwe groepenkast met passende beveiliging.'],
        ['03', 'Getest, gelabeld en opgeruimd', 'We testen de installatie, labelen de groepen en voeren de oude kast af. Met 12 maanden garantie op het werk en 2 jaar fabrieksgarantie.'],
      ]).map(([number, title, description]) => <div key={number}><span className="text-sm font-bold text-primary">{number}</span><h3 className="mt-3 text-xl font-bold">{title}</h3><p className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p></div>)}</div>
    </section>

    {/* Lange informatieve secties — vraagkop, kort antwoord, dan uitleg */}
    <section className="border-t border-border bg-muted/30 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="text-3xl font-bold">{en ? 'Fuse box replacement in Amsterdam, explained' : 'Groepenkast vervangen in Amsterdam, uitgelegd'}</h2>
        <div className="mt-8 space-y-10">{groupSections(lang).map(section => <article key={section.id} id={section.id} className="scroll-mt-24">
          <h3 className="text-xl font-bold">{section.q}</h3>
          <p className="mt-3 font-semibold leading-relaxed">{section.short}</p>
          {section.body.map((paragraph, index) => <p key={index} className="mt-3 leading-relaxed text-muted-foreground">{paragraph}</p>)}
          {section.links && <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">{section.links.map(link => <li key={link.href}><a href={link.href} className="font-semibold text-primary underline underline-offset-4">{link.label}</a></li>)}</ul>}
        </article>)}</div>
        <p className="mt-10 text-sm text-muted-foreground">
          {en ? 'Power failure or a tripping fuse right now? ' : 'Nu een storing of een groep die eruit klapt? '}
          <a href={en ? '/en-gb/spoed-elektricien-amsterdam' : '/spoed-elektricien-amsterdam'} className="font-semibold text-primary underline underline-offset-4">{en ? 'Emergency electrician Amsterdam' : 'Spoed elektricien Amsterdam'}</a>
          {en
            ? ` — emergency diagnosis ${groupMoney(prices.emergencyFirstHour, lang)} first hour all-in. Need more time or materials? The electrician discusses this on site.`
            : ` — spoeddiagnose ${groupMoney(prices.emergencyFirstHour, lang)} eerste uur all-in. Meer tijd of materialen nodig? De elektricien bespreekt dit ter plaatse.`}
        </p>
      </div>
    </section>

    <Testimonials category="groepenkast" />
    <ServiceFaq faqs={groupFaqs(lang)} title={en ? 'Questions about fuse box replacement' : 'Veelgestelde vragen over groepenkast vervangen'} />
    <section className="border-t border-border bg-muted/40 py-10"><div className="mx-auto max-w-6xl px-4"><h2 className="text-2xl font-bold">{en ? 'Ready for your fixed-price check?' : 'Klaar voor je vaste prijscontrole?'}</h2><p className="mt-3 text-muted-foreground">{groupDisclaimer[lang]}</p><div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap"><Button variant="cta" size="xl" className="h-auto min-h-12 whitespace-normal px-4 py-3" onClick={() => openBooking()}>{en ? 'Calculate fixed price' : 'Bereken vaste prijs'}<ArrowRight /></Button><Button variant="outline" size="xl" className="h-auto min-h-12 whitespace-normal px-4 py-3" onClick={() => openBooking('unknown', true)}><Camera />{en ? 'Send a photo of your fuse box' : 'Stuur foto van je groepenkast'}</Button></div></div></section>
  </div>;
}
