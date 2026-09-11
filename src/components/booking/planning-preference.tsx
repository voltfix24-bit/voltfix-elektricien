import { useId, useMemo } from 'react';
import { CalendarDays, Phone, Sun, Sunset, Zap } from 'lucide-react';
import { enGB, nl } from 'date-fns/locale';

import { Calendar } from '@/components/ui/calendar';
import { telHref, business } from '@/lib/business';
import type { GroupLocale } from '@/lib/groepenkast';
import { cn } from '@/lib/utils';
import {
  amsterdamToday,
  dateFromKey,
  dateKey,
  daypartLabels,
  dayparts,
  emptyPlanning,
  isCalendarDate,
  planningSummary,
  preferenceKindLabels,
  purposeLabel,
  type AppointmentPurpose,
  type Daypart,
  type PlanningPreference,
  type PreferenceKind,
} from '@/lib/booking/planning';

const daypartIcons = { morning: Sun, afternoon: Sunset, any: CalendarDays } as const;

/**
 * Gedeelde datum- en dagdeelvoorkeur binnen de bestaande stap 'Adres & moment'.
 * Er is geen gekoppelde agenda: alles wat hier gekozen wordt is een voorkeur
 * die VoltFix na beoordeling bevestigt. Geen beschikbaarheid, geen toeslag.
 */
export function PlanningPreferenceFields({
  lang, planning, setPlanning, purpose, error, routeNotice,
}: {
  lang: GroupLocale;
  planning: PlanningPreference;
  setPlanning: (next: PlanningPreference) => void;
  purpose: AppointmentPurpose;
  error?: string;
  routeNotice?: string;
}) {
  const en = lang === 'en';
  const groupName = useId();
  const today = amsterdamToday();
  const todayDate = useMemo(() => dateFromKey(today) ?? new Date(), [today]);
  const selected = dateFromKey(planning.date);
  const kindLabels = preferenceKindLabels[lang];

  function chooseKind(kind: PreferenceKind) {
    if (kind === planning.kind) return;
    if (kind === 'specific_date') {
      setPlanning({ ...emptyPlanning, kind: 'specific_date', date: null, daypart: planning.daypart ?? null });
      return;
    }
    setPlanning({ ...emptyPlanning, kind });
  }

  const heading = purpose === 'survey'
    ? (en ? 'When would a site inspection suit you?' : 'Wanneer komt een schouw uit?')
    : (en ? 'When would it suit you?' : 'Wanneer komt het jou uit?');

  return <section className="grid gap-3" aria-labelledby={`${groupName}-heading`}>
    <div>
      <h3 id={`${groupName}-heading`} className="text-base font-bold">{heading}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{en
        ? 'Let us know your preference. We confirm the moment after reviewing your request.'
        : 'Geef je voorkeur door. We bevestigen het moment na beoordeling van je aanvraag.'}</p>
    </div>

    {routeNotice && <p role="status" className="rounded-md border border-primary/40 bg-primary/5 p-3 text-sm">{routeNotice}</p>}

    <div role="radiogroup" aria-label={heading} className="grid gap-2">
      {(['specific_date', 'flexible'] as const).map(kind => <label
        key={kind}
        className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-border bg-background p-3 has-[:checked]:border-primary has-[:checked]:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
      >
        <input type="radio" name={groupName} value={kind} checked={planning.kind === kind} onChange={() => chooseKind(kind)} className="size-5 shrink-0 accent-primary" />
        <span className="min-w-0 text-sm font-semibold leading-snug">{kindLabels[kind]}
          {kind === 'flexible' && <span className="block font-normal text-muted-foreground">{en ? 'We plan the moment together by phone.' : 'We plannen het moment samen telefonisch.'}</span>}
        </span>
      </label>)}
      <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-amber-500/50 bg-amber-50 p-3 text-amber-950 has-[:checked]:border-primary has-[:checked]:bg-accent has-[:checked]:text-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
        <input type="radio" name={groupName} value="asap" checked={planning.kind === 'asap'} onChange={() => chooseKind('asap')} className="size-5 shrink-0 accent-primary" />
        <Zap className="size-5 shrink-0 text-amber-600" aria-hidden />
        <span className="min-w-0 text-sm font-semibold leading-snug">{kindLabels.asap}
          <span className="block font-normal opacity-80">{en ? 'We look at what is possible first.' : 'We kijken wat het eerst mogelijk is.'}</span>
        </span>
      </label>
    </div>

    {planning.kind === 'specific_date' && <div className="grid gap-3">
      <div className="rounded-md border border-border p-1">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={date => setPlanning({ ...planning, date: date ? dateKey(date) : null })}
          defaultMonth={selected ?? todayDate}
          disabled={{ before: todayDate }}
          weekStartsOn={1}
          locale={en ? enGB : nl}
          className="mx-auto w-full p-2 [--cell-size:2.35rem]"
          classNames={{ month: 'flex w-full flex-col gap-3', root: 'w-full' }}
          aria-label={en ? 'Preferred date' : 'Voorkeursdatum'}
        />
      </div>
      <label className="block text-sm font-semibold">{en ? 'Or type a date' : 'Of typ een datum'}
        <input
          type="date"
          min={today}
          value={planning.date && isCalendarDate(planning.date) ? planning.date : ''}
          onChange={event => setPlanning({ ...planning, date: event.target.value || null })}
          className="mt-2 h-12 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      <fieldset className="grid gap-2">
        <legend className="pb-1 text-sm font-semibold">{en ? 'Preferred part of the day' : 'Gewenst dagdeel'}</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {dayparts.map(part => {
            const Icon = daypartIcons[part];
            return <label key={part} className="flex min-h-12 cursor-pointer items-center gap-2 rounded-md border border-border bg-background p-3 has-[:checked]:border-primary has-[:checked]:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
              <input type="radio" name={`${groupName}-daypart`} value={part} checked={planning.daypart === part} onChange={() => setPlanning({ ...planning, daypart: part as Daypart })} className="size-5 shrink-0 accent-primary" />
              <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0 text-sm font-semibold leading-snug">{daypartLabels[lang][part]}</span>
            </label>;
          })}
        </div>
      </fieldset>
    </div>}

    <p className={cn('rounded-md border border-border bg-muted/40 p-3 text-sm', error && 'sr-only')} aria-live="polite">
      {planning.kind === 'specific_date' && !planning.date
        ? `${purposeLabel(purpose, lang)}: ${en ? 'choose a date below.' : 'kies hieronder een datum.'}`
        : planningSummary(planning, purpose, lang)}
    </p>
    {error && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

    <p className="text-sm text-muted-foreground">
      <a href={telHref} className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline">
        <Phone className="size-4" aria-hidden />{en ? `Urgent fault? Call VoltFix ${business.phoneDisplay}` : `Acute storing? Bel VoltFix ${business.phoneDisplay}`}
      </a>
    </p>
  </section>;
}
