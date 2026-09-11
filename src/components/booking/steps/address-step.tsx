import { CalendarDays, Check } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';
import { groupMomentIds, groupMoments, type GroupLocale } from '@/lib/groepenkast';
import { cn } from '@/lib/utils';

const inputClass = 'mt-2 h-12 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function dateFromKey(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function displayDate(value: string) {
  return value ? value.split('-').reverse().join('-') : '';
}

/** Gedeelde adres- en planningsstap: datum, postcode/adres en voorkeursmoment. */
export function AddressStep({
  lang, fields, setField, onLookup, lookup, confirmed, preferredDate, setPreferredDate, calendarOpen, setCalendarOpen, moment, setMoment,
}: {
  lang: GroupLocale;
  fields: { postalCode: string; houseNumber: string; street: string; city: string };
  setField: (key: 'postalCode' | 'houseNumber' | 'street' | 'city', value: string) => void;
  onLookup: () => void;
  lookup: string;
  confirmed: { key: string; street: string; city: string } | null;
  preferredDate: string;
  setPreferredDate: (value: string) => void;
  calendarOpen: boolean;
  setCalendarOpen: (open: boolean) => void;
  moment: typeof groupMomentIds[number] | '';
  setMoment: (id: typeof groupMomentIds[number]) => void;
}) {
  const en = lang === 'en';
  const isMobile = useIsMobile();
  const selectedDate = dateFromKey(preferredDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const addressKey = `${fields.postalCode.replace(/\s/g, '').toUpperCase()}-${parseInt(fields.houseNumber, 10)}`;
  const streetConfirmed = confirmed?.key === addressKey && confirmed.street === fields.street;
  const cityConfirmed = confirmed?.key === addressKey && confirmed.city === fields.city;
  const calendar = <Calendar
    mode="single"
    selected={selectedDate}
    onSelect={date => { if (!date) return; setPreferredDate(dateKey(date)); setCalendarOpen(false); }}
    disabled={{ before: today }}
    weekStartsOn={1}
    initialFocus
    className="pointer-events-auto p-3"
  />;

  return <div className="grid gap-3">
    <label className="block text-sm font-semibold">{en ? 'Preferred date' : 'Voorkeursdatum'}
      {isMobile ? <>
        <div className="relative mt-2">
          <input required readOnly aria-haspopup="dialog" aria-expanded={calendarOpen} placeholder={en ? 'dd-mm-yyyy' : 'dd-mm-jjjj'} value={displayDate(preferredDate)} onClick={() => setCalendarOpen(true)} className="h-12 w-full cursor-pointer rounded-md border border-input bg-background px-3 pr-11 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          <CalendarDays className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        </div>
        <Drawer open={calendarOpen} onOpenChange={setCalendarOpen} shouldScaleBackground={false}>
          <DrawerContent className="z-[120] max-h-[90dvh] pb-[env(safe-area-inset-bottom)]">
            <DrawerHeader className="pb-1 text-left"><DrawerTitle>{en ? 'Choose a date' : 'Kies een datum'}</DrawerTitle><DrawerDescription>{en ? 'Your preferred installation date' : 'Je gewenste installatiedatum'}</DrawerDescription></DrawerHeader>
            <div className="mx-auto overflow-auto px-2 pb-4">{calendar}</div>
          </DrawerContent>
        </Drawer>
      </> : <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <div className="relative mt-2">
            <input required readOnly aria-haspopup="dialog" aria-expanded={calendarOpen} placeholder={en ? 'dd-mm-yyyy' : 'dd-mm-jjjj'} value={displayDate(preferredDate)} className="h-12 w-full cursor-pointer rounded-md border border-input bg-background px-3 pr-11 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            <CalendarDays className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          </div>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" sideOffset={6} className="z-[120] w-auto p-0">{calendar}</PopoverContent>
      </Popover>}
    </label>
    <div className="grid grid-cols-2 gap-3">
      <label className="min-w-0 text-sm font-semibold">Postcode<input required pattern="[1-9][0-9]{3}\s?[A-Za-z]{2}" maxLength={7} autoComplete="postal-code" value={fields.postalCode} onChange={e => setField('postalCode', e.target.value.toUpperCase())} onBlur={onLookup} className={inputClass} /></label>
      <label className="min-w-0 text-sm font-semibold">{en ? 'House number' : 'Huisnummer'}<input required maxLength={18} pattern="[0-9]{1,5}.*" autoComplete="address-line1" value={fields.houseNumber} onChange={e => setField('houseNumber', e.target.value)} onBlur={onLookup} className={inputClass} /></label>
    </div>
    {lookup && <p className={cn('text-sm', confirmed ? 'text-success' : 'text-muted-foreground')} role="status">{lookup}</p>}
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block text-sm font-semibold">{en ? 'Street' : 'Straat'}<span className="relative block"><input required minLength={2} maxLength={120} autoComplete="address-line1" value={fields.street} onChange={e => setField('street', e.target.value)} className={cn(inputClass, 'pr-10', streetConfirmed && 'border-success focus-visible:ring-success')} />{streetConfirmed && <Check className="absolute right-3 top-[calc(50%+0.25rem)] size-5 -translate-y-1/2 text-success" aria-hidden />}</span></label>
      <label className="block text-sm font-semibold">{en ? 'City' : 'Woonplaats'}<span className="relative block"><input required minLength={2} maxLength={80} autoComplete="address-level2" value={fields.city} onChange={e => setField('city', e.target.value)} className={cn(inputClass, 'pr-10', cityConfirmed && 'border-success focus-visible:ring-success')} />{cityConfirmed && <Check className="absolute right-3 top-[calc(50%+0.25rem)] size-5 -translate-y-1/2 text-success" aria-hidden />}</span></label>
    </div>
    <p className="font-semibold">{en ? 'Preferred time' : 'Voorkeursmoment'}</p>
    <div className="grid grid-cols-2 gap-2">{groupMomentIds.map((id, index) => <label key={id} className="flex min-h-12 cursor-pointer items-center gap-2 rounded-md border border-border bg-background p-3 has-[:checked]:border-primary has-[:checked]:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"><input type="radio" name="moment" required value={id} checked={moment === id} onChange={() => setMoment(id)} className="size-5 shrink-0 accent-primary" /><span className="min-w-0 text-sm font-semibold leading-snug">{groupMoments[lang][index]}</span></label>)}</div>
    <p className="text-sm text-muted-foreground">{en ? 'This is a preference, not a confirmed appointment.' : 'Dit is een voorkeur, nog geen bevestigde afspraak.'}</p>
  </div>;
}
