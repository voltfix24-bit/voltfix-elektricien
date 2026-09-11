import type { ReactNode, RefObject } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GroupLocale } from '@/lib/groepenkast';

/**
 * Compacte samenvattingsregel met een potloodknop die uitsluitend dat
 * onderdeel inline opent. Bedragen blijven berekende waarden; er wordt geen
 * tweede modal geopend en de klant blijft op het overzicht.
 */
export function SummaryRow({
  lang, label, value, editLabel, open, onEdit, onSave, onCancel, buttonRef, children, error,
}: {
  lang: GroupLocale;
  label: string;
  value: ReactNode;
  editLabel: string;
  open: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  buttonRef: RefObject<HTMLButtonElement | null>;
  children: ReactNode;
  error?: string;
}) {
  const en = lang === 'en';
  return <div className="min-w-0 py-2.5">
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
      <div className="min-w-0">
        <dt className="text-sm font-semibold">{label}</dt>
        <dd className="mt-0.5 min-w-0 break-words text-sm leading-snug text-muted-foreground">{value}</dd>
      </div>
      <Button
        type="button"
        ref={buttonRef}
        variant="ghost"
        size="icon"
        aria-label={editLabel}
        aria-expanded={open}
        onClick={onEdit}
        className="h-11 w-11 shrink-0 text-primary"
      >
        <Pencil className="size-4" />
      </Button>
    </div>
    {open && <div className="mt-3 grid min-w-0 gap-3 border-l-2 border-primary/40 pl-3">
      {children}
      {error && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" className="min-h-11" onClick={onSave}>{en ? 'Save' : 'Opslaan'}</Button>
        <Button type="button" variant="outline" className="min-h-11" onClick={onCancel}>{en ? 'Cancel' : 'Annuleren'}</Button>
      </div>
    </div>}
  </div>;
}
