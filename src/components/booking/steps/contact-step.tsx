import type { GroupLocale } from '@/lib/groepenkast';

const inputClass = 'mt-2 h-12 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** Gedeelde contactstap: naam, telefoon, e-mail. */
export function ContactStep({ lang, values, setField }: {
  lang: GroupLocale;
  values: { name: string; phone: string; email: string };
  setField: (key: 'name' | 'phone' | 'email', value: string) => void;
}) {
  const en = lang === 'en';
  return <>
    {(['name', 'phone', 'email'] as const).map(key => <label key={key} className="block text-sm font-semibold">
      {{ name: en ? 'Name' : 'Naam', phone: en ? 'Phone' : 'Telefoon', email: 'E-mail' }[key]} *
      <input
        required
        minLength={key === 'name' ? 2 : key === 'phone' ? 8 : undefined}
        maxLength={key === 'name' ? 80 : key === 'phone' ? 20 : 120}
        type={key === 'phone' ? 'tel' : key === 'email' ? 'email' : 'text'}
        autoComplete={key === 'phone' ? 'tel' : key}
        value={values[key]}
        onChange={e => setField(key, e.target.value)}
        className={inputClass}
      />
    </label>)}
    <p className="text-sm text-muted-foreground">{en ? 'We use these details for your price check and confirmation.' : 'We gebruiken deze gegevens voor je prijscontrole en bevestiging.'}</p>
  </>;
}
