import { Camera } from 'lucide-react';
import { groupMoney, groupOptions, groupPackages, type GroupLocale, type OptionId, type PackageId } from '@/lib/groepenkast';

const choiceClass = 'grid min-h-20 cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-background p-4 transition-colors has-[:checked]:border-primary has-[:checked]:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring';

/** Dienstspecifiek: pakketkeuze groepenkast. */
export function GroepenkastPackageStep({ lang, packageId, setPackageId }: { lang: GroupLocale; packageId: PackageId | ''; setPackageId: (id: PackageId) => void }) {
  const en = lang === 'en';
  return <div className="grid gap-3">
    {groupPackages.map(p => <label key={p.id} className={choiceClass}>
      <input type="radio" name="package" value={p.id} checked={packageId === p.id} onChange={() => setPackageId(p.id)} className="size-5 shrink-0 accent-primary" />
      <span className="min-w-0"><span className="block font-bold">{p[lang]}</span><span className="text-sm text-muted-foreground">{p.circuits} {en ? 'circuits' : 'groepen'}</span></span>
      <span className="shrink-0 whitespace-nowrap text-lg font-bold tabular-nums">{groupMoney(p.price, lang)}</span>
    </label>)}
    <label className={choiceClass}>
      <input type="radio" name="package" checked={packageId === 'unknown'} onChange={() => setPackageId('unknown')} className="size-5 shrink-0 accent-primary" />
      <span className="min-w-0 font-semibold">{en ? 'I’m not sure, check my photo.' : 'Ik weet het niet, check mijn foto.'}</span>
      <Camera className="shrink-0 text-primary" />
    </label>
  </div>;
}

/** Dienstspecifiek: optionele uitbreidingen groepenkast. */
export function GroepenkastOptionsStep({ lang, options, toggle }: { lang: GroupLocale; options: OptionId[]; toggle: (id: OptionId, checked: boolean) => void }) {
  const en = lang === 'en';
  return <>
    <p className="text-sm text-muted-foreground">{en ? 'Optional additions, including materials, installation and 21% VAT.' : 'Optionele uitbreidingen, inclusief materiaal, montage en 21% btw.'}</p>
    <div className="grid gap-3 sm:grid-cols-2">{groupOptions.map(o => <label key={o.id} className={choiceClass}>
      <input type="checkbox" checked={options.includes(o.id)} onChange={e => toggle(o.id, e.target.checked)} className="size-5 shrink-0 accent-primary" />
      <span className="min-w-0 font-semibold">{o[lang]}</span>
      <span className="shrink-0 whitespace-nowrap text-sm font-bold text-primary tabular-nums">+{groupMoney(o.price, lang)}</span>
    </label>)}</div>
  </>;
}
