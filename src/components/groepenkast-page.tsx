import { useState } from 'react';
import { ArrowRight, Camera, Check, ShieldCheck } from 'lucide-react';
import heroImg from '@/assets/voltfix-groepenkast-abb-modern.webp.asset.json';
import { Button } from '@/components/ui/button';
import { GroepenkastBooking } from '@/components/groepenkast-booking';
import { ServiceFaq } from '@/components/service-faq';
import { Testimonials } from '@/components/testimonials';
import { groupDisclaimer, groupFaqs, groupMoney, groupPackages, groupTrust, type GroupLocale, type PackageId } from '@/lib/groepenkast';
import { prices } from '@/lib/pricing';
import { useTrackConversion } from '@/lib/analytics';

export function GroepenkastPage({ lang }: { lang: GroupLocale }) {
  const en = lang === 'en';
  const [packageId, setPackageId] = useState<PackageId | ''>('');
  const [step, setStep] = useState(1);
  const track = useTrackConversion();
  function openBooking(id?: PackageId, photo = false) {
    if (id) setPackageId(id);
    setStep(photo ? 3 : id ? 2 : 1);
    track('quote', photo ? 'groepenkast-photo-check' : 'groepenkast-price-calculation');
    document.getElementById('installatiemoment')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }
  return <div className="groepenkast-page bg-background text-foreground">
    <section className="relative isolate overflow-hidden border-b border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-8 sm:pt-16 sm:pb-12">
        <div className="relative z-10 max-w-2xl lg:max-w-[65%]">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary"><ShieldCheck className="size-4" />VoltFix · {en ? 'Amsterdam & surrounding area' : 'Amsterdam en omgeving'}</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">{en ? 'Fuse box replacement in Amsterdam' : 'Groepenkast vervangen in Amsterdam'}</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed">{en ? `Fixed all-in packages from ${groupMoney(prices.groepenkastFrom, lang)}, including materials, installation and 21% VAT.` : `Vaste all-in pakketten vanaf ${groupMoney(prices.groepenkastFrom, lang)} incl. materiaal, montage en 21% btw.`}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap"><Button size="xl" onClick={() => openBooking()} className="h-auto min-h-12 whitespace-normal px-5 py-3">{en ? 'Calculate my fixed price' : 'Bereken mijn vaste prijs'}<ArrowRight /></Button><Button variant="outline" size="xl" onClick={() => openBooking('unknown', true)} className="h-auto min-h-12 whitespace-normal px-5 py-3"><Camera />{en ? 'Send photo for price check' : 'Stuur foto voor prijscontrole'}</Button></div>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">{groupDisclaimer[lang]}</p>
        </div>
        <img src={heroImg.url} alt={en ? 'ABB fuse box with circuit breakers and RCD protection' : 'ABB-groepenkast met installatieautomaten en aardlekbeveiliging'} width={600} height={800} fetchPriority="high" className="mx-auto mt-5 h-52 w-full object-contain lg:absolute lg:right-4 lg:top-10 lg:-z-10 lg:mt-0 lg:h-96 lg:w-[30%]" />
        <div className="relative mt-7 grid gap-2 border-t border-border pt-5 sm:grid-cols-3">{groupPackages.map(p => <Button key={p.id} variant="ghost" className="h-auto min-h-16 justify-between gap-2 whitespace-normal rounded-md px-2 text-left" onClick={() => openBooking(p.id)}><span><span className="block text-sm font-semibold">{p[lang]}</span><span className="block text-xs text-muted-foreground">{p.circuits} {en ? 'circuits' : 'groepen'}</span></span><span className="text-xl font-bold text-primary">{groupMoney(p.price, lang)}</span></Button>)}</div>
      </div>
    </section>
    <section id="prijzen" className="scroll-mt-24 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-sm font-semibold text-primary">{en ? 'One clear price. Properly installed.' : 'Eén heldere prijs. Netjes geregeld.'}</p>
        <h2 className="mt-2 text-3xl font-bold">{en ? `All-in packages from ${groupMoney(prices.groepenkastFrom, lang)}` : `All-in pakketten vanaf ${groupMoney(prices.groepenkastFrom, lang)}`}</h2>
        <div className="mt-7 grid gap-4 md:grid-cols-3">{groupPackages.map(p => <article key={p.id} className="flex flex-col rounded-lg border border-border bg-card p-5 sm:p-6"><h3 className="text-xl font-bold">{p[lang]}</h3><p className="mt-2 text-muted-foreground">{p.circuits} {en ? 'circuits' : 'groepen'}</p><p className="mt-5 text-4xl font-bold text-primary">{groupMoney(p.price, lang)}</p><p className="mt-2 text-sm text-muted-foreground">{en ? 'All-in guide price · incl. 21% VAT' : 'All-in richtprijs · incl. 21% btw'}</p><Button className="mt-6 min-h-12 whitespace-normal" onClick={() => openBooking(p.id)}>{en ? 'Choose this package' : 'Kies dit pakket'}<ArrowRight /></Button></article>)}</div>
        <ul className="mt-7 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">{groupTrust[lang].map(text => <li key={text} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" /><span>{text}</span></li>)}</ul>
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">{groupDisclaimer[lang]}</p>
      </div>
    </section>
    <GroepenkastBooking lang={lang} packageId={packageId} setPackageId={setPackageId} step={step} setStep={setStep} />
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
      <div className="mt-10 max-w-3xl border-t border-border pt-8"><h3 className="text-xl font-bold">{en ? 'Replacing an old wire-fuse box or upgrading for induction?' : 'Oude stoppenkast vervangen of overstappen op inductie?'}</h3><p className="mt-3 leading-relaxed text-muted-foreground">{en ? 'An old wire-fuse box, too few circuits or new appliances can be a reason to replace your consumer unit. Choose additions for induction cooking or solar panels with your package. We confirm which combination suits your home. A grid-connection upgrade, if needed, is handled and billed separately by the grid operator.' : 'Een oude stoppenkast, te weinig groepen of nieuwe apparaten kunnen aanleiding zijn om je groepenkast te vervangen. Kies uitbreidingen voor inductie of zonnepanelen bij je pakket. We bevestigen welke combinatie bij je woning past. Een eventuele verzwaring van de netaansluiting loopt apart via de netbeheerder en valt niet onder het pakket.'}</p><p className="mt-3 leading-relaxed text-muted-foreground">{en ? 'Available throughout Amsterdam and the surrounding area, including Centrum, West, Zuid, Oost, Noord, De Pijp and IJburg.' : 'In heel Amsterdam en omgeving, waaronder Centrum, West, Zuid, Oost, Noord, De Pijp en IJburg.'}</p></div>
    </section>
    <Testimonials category="groepenkast" />
    <ServiceFaq faqs={groupFaqs(lang)} title={en ? 'Questions about fuse box replacement' : 'Veelgestelde vragen over groepenkast vervangen'} />
    <section className="border-t border-border bg-muted/40 py-10"><div className="mx-auto max-w-6xl px-4"><h2 className="text-2xl font-bold">{en ? 'Ready for your fixed-price check?' : 'Klaar voor je vaste prijscontrole?'}</h2><p className="mt-3 text-muted-foreground">{groupDisclaimer[lang]}</p><Button size="xl" className="mt-5 h-auto min-h-12 whitespace-normal px-4 py-3" onClick={() => openBooking()}>{en ? 'Calculate my fixed price' : 'Bereken mijn vaste prijs'}<ArrowRight /></Button></div></section>
  </div>;
}
