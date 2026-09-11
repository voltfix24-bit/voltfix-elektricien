import { Check } from 'lucide-react';
import { PlanningPreferenceFields } from '@/components/booking/planning-preference';
import type { AppointmentPurpose, PlanningPreference } from '@/lib/booking/planning';
import type { GroupLocale } from '@/lib/groepenkast';
import { cn } from '@/lib/utils';

const inputClass = 'mt-2 h-12 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** Alleen de adresvelden: herbruikbaar in de stap én in het inline overzicht. */
export function AddressFields({ lang, fields, setField, onLookup, lookup, confirmed }: {
  lang: GroupLocale;
  fields: { postalCode: string; houseNumber: string; street: string; city: string };
  setField: (key: 'postalCode' | 'houseNumber' | 'street' | 'city', value: string) => void;
  onLookup: () => void;
  lookup: string;
  confirmed: { key: string; street: string; city: string } | null;
}) {
  const en = lang === 'en';
  const addressKey = `${fields.postalCode.replace(/\s/g, '').toUpperCase()}-${parseInt(fields.houseNumber, 10)}`;
  const streetConfirmed = confirmed?.key === addressKey && confirmed.street === fields.street;
  const cityConfirmed = confirmed?.key === addressKey && confirmed.city === fields.city;

  return <div className="grid min-w-0 gap-3">
    <div className="grid grid-cols-2 gap-3">
      <label className="min-w-0 text-sm font-semibold">Postcode<input required pattern="[1-9][0-9]{3}\s?[A-Za-z]{2}" maxLength={7} autoComplete="postal-code" value={fields.postalCode} onChange={e => setField('postalCode', e.target.value.toUpperCase())} onBlur={onLookup} className={inputClass} /></label>
      <label className="min-w-0 text-sm font-semibold">{en ? 'House number' : 'Huisnummer'}<input required maxLength={18} pattern="[0-9]{1,5}.*" autoComplete="address-line1" value={fields.houseNumber} onChange={e => setField('houseNumber', e.target.value)} onBlur={onLookup} className={inputClass} /></label>
    </div>
    {lookup && <p className={cn('text-sm', confirmed ? 'text-success' : 'text-muted-foreground')} role="status">{lookup}</p>}
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block min-w-0 text-sm font-semibold">{en ? 'Street' : 'Straat'}<span className="relative block"><input required minLength={2} maxLength={120} autoComplete="address-line1" value={fields.street} onChange={e => setField('street', e.target.value)} className={cn(inputClass, 'pr-10', streetConfirmed && 'border-success focus-visible:ring-success')} />{streetConfirmed && <Check className="absolute right-3 top-[calc(50%+0.25rem)] size-5 -translate-y-1/2 text-success" aria-hidden />}</span></label>
      <label className="block min-w-0 text-sm font-semibold">{en ? 'City' : 'Woonplaats'}<span className="relative block"><input required minLength={2} maxLength={80} autoComplete="address-level2" value={fields.city} onChange={e => setField('city', e.target.value)} className={cn(inputClass, 'pr-10', cityConfirmed && 'border-success focus-visible:ring-success')} />{cityConfirmed && <Check className="absolute right-3 top-[calc(50%+0.25rem)] size-5 -translate-y-1/2 text-success" aria-hidden />}</span></label>
    </div>
  </div>;
}

/** Gedeelde adres- en planningsstap: adres plus de gedeelde datum/dagdeelvoorkeur. */
export function AddressStep({
  lang, fields, setField, onLookup, lookup, confirmed, planning, setPlanning, purpose, planningIssue, routeNotice,
}: {
  lang: GroupLocale;
  fields: { postalCode: string; houseNumber: string; street: string; city: string };
  setField: (key: 'postalCode' | 'houseNumber' | 'street' | 'city', value: string) => void;
  onLookup: () => void;
  lookup: string;
  confirmed: { key: string; street: string; city: string } | null;
  planning: PlanningPreference;
  setPlanning: (next: PlanningPreference) => void;
  purpose: AppointmentPurpose;
  planningIssue?: string;
  routeNotice?: string;
}) {
  return <div className="grid min-w-0 gap-3">
    <AddressFields lang={lang} fields={fields} setField={setField} onLookup={onLookup} lookup={lookup} confirmed={confirmed} />
    <PlanningPreferenceFields
      lang={lang}
      planning={planning}
      setPlanning={setPlanning}
      purpose={purpose}
      error={planningIssue}
      routeNotice={routeNotice}
    />
  </div>;
}

