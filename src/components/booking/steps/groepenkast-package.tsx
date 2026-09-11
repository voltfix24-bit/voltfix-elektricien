import { Camera, Minus, Plus } from 'lucide-react';
import { groupExtraGroupPrice, groupExtraGroupsMax, groupMoney, groupOptions, groupPackages, type GroupLocale, type OptionId, type PackageId } from '@/lib/groepenkast';

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
export function GroepenkastOptionsStep({ lang, options, toggle, extraGroups, setExtraGroups }: {
  lang: GroupLocale;
  options: OptionId[];
  toggle: (id: OptionId, checked: boolean) => void;
  extraGroups: number;
  setExtraGroups: (value: number) => void;
}) {
  const en = lang === 'en';
  const clamp = (value: number) => Math.min(groupExtraGroupsMax, Math.max(0, value));
  return <>
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <span className="min-w-0">
          <span className="block font-bold">{en ? 'Extra circuits' : 'Extra groepen'}</span>
          <span className="block text-sm text-muted-foreground">{en ? `${groupMoney(groupExtraGroupPrice, lang)} per extra circuit, all-in` : `${groupMoney(groupExtraGroupPrice, lang)} per extra groep, all-in`}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => setExtraGroups(clamp(extraGroups - 1))} disabled={extraGroups <= 0} aria-label={en ? 'Remove one extra circuit' : 'Eén extra groep minder'} className="flex size-11 items-center justify-center rounded-md border border-border text-foreground disabled:opacity-40"><Minus className="size-4" /></button>
          <output aria-live="polite" className="w-8 text-center text-lg font-bold tabular-nums">{extraGroups}</output>
          <button type="button" onClick={() => setExtraGroups(clamp(extraGroups + 1))} disabled={extraGroups >= groupExtraGroupsMax} aria-label={en ? 'Add one extra circuit' : 'Eén extra groep meer'} className="flex size-11 items-center justify-center rounded-md border border-primary text-primary disabled:opacity-40"><Plus className="size-4" /></button>
        </span>
      </div>
      {extraGroups > 0 && <p className="mt-2 text-sm font-bold text-primary tabular-nums">+{groupMoney(extraGroups * groupExtraGroupPrice, lang)}</p>}
    </div>
    <p className="text-sm text-muted-foreground">{en ? 'Optional additions, including materials, installation and 21% VAT.' : 'Optionele uitbreidingen, inclusief materiaal, montage en 21% btw.'}</p>
    <div className="grid gap-3 sm:grid-cols-2">{groupOptions.map(o => <label key={o.id} className={choiceClass}>
      <input type="checkbox" checked={options.includes(o.id)} onChange={e => toggle(o.id, e.target.checked)} className="size-5 shrink-0 accent-primary" />
      <span className="min-w-0 font-semibold">{o[lang]}</span>
      <span className="shrink-0 whitespace-nowrap text-sm font-bold text-primary tabular-nums">+{groupMoney(o.price, lang)}</span>
    </label>)}</div>
  </>;
}
