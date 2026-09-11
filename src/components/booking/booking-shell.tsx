import type { ReactNode, RefObject } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GroupLocale } from '@/lib/groepenkast';

/**
 * Gedeelde booking shell: modal/fullscreen layout, voortgangsbalk, vaste
 * header en footer, terug/verder-knoppen en statusprijs. De shell kent geen
 * enkele dienst; hij rendert de stappen die de service-module aanlevert.
 */
export function BookingShell({
  open, onOpenChange, lang, title, subtitle, steps, step, done, busy, status, ctaLabel, blockedLabel,
  formId, contentRef, headingRef, widgetRef, doneFooter, children, sectionId, sectionLabel, onBack,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  lang: GroupLocale;
  title: string;
  subtitle: string;
  steps: string[];
  step: number;
  done: boolean;
  busy: boolean;
  status: string;
  ctaLabel: string;
  /** Gezet wanneer verder gaan nog niet mag (bv. geen pakket gekozen). */
  blockedLabel?: string;
  formId: string;
  contentRef: RefObject<HTMLDivElement | null>;
  headingRef: RefObject<HTMLHeadingElement | null>;
  widgetRef: RefObject<HTMLDivElement | null>;
  doneFooter: ReactNode;
  children: ReactNode;
  sectionId: string;
  sectionLabel: string;
  onBack: () => void;
}) {
  const en = lang === 'en';
  const total = steps.length;
  const blocked = Boolean(blockedLabel);
  return <section id={sectionId} className="scroll-mt-28" aria-label={sectionLabel}>
    <div ref={widgetRef} aria-hidden="true" />
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="groepenkast-flow fixed inset-0 z-[100] bg-foreground/45 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby="group-dialog-description"
          onOpenAutoFocus={event => { event.preventDefault(); requestAnimationFrame(() => headingRef.current?.focus()); }}
          className="groepenkast-flow fixed inset-0 z-[101] grid h-[100dvh] w-full grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-background outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:left-1/2 sm:top-1/2 sm:h-[min(860px,calc(100dvh-3rem))] sm:max-w-3xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border sm:border-border sm:shadow-2xl sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95"
        >
          <header className="border-b border-border bg-background px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pt-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <DialogPrimitive.Title className="truncate text-lg font-bold sm:text-xl">{title}</DialogPrimitive.Title>
                <DialogPrimitive.Description id="group-dialog-description" className="mt-1 text-sm text-muted-foreground">{subtitle}</DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close asChild><Button type="button" variant="ghost" size="icon" disabled={busy} aria-label={en ? 'Close price calculation' : 'Sluit prijsberekening'} className="h-11 w-11 shrink-0"><X /></Button></DialogPrimitive.Close>
            </div>
            {!done && <div className="mt-3" aria-label={en ? `Step ${step} of ${total}: ${steps[step - 1]}` : `Stap ${step} van ${total}: ${steps[step - 1]}`}>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${step / total * 100}%` }} /></div>
              <ol className="mt-2 hidden gap-2 text-xs sm:grid" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>{steps.map((name, index) => <li key={name} className={index + 1 <= step ? 'font-semibold text-primary' : 'text-muted-foreground'}>{index + 1}. {name}</li>)}</ol>
            </div>}
          </header>

          <div ref={contentRef} className="min-h-0 overflow-y-auto overscroll-contain px-4 py-5 pb-[calc(120px_+_env(safe-area-inset-bottom))] sm:px-6 sm:py-6 sm:pb-[calc(140px_+_env(safe-area-inset-bottom))]">
            {children}
          </div>

          <footer className="border-t border-border bg-background px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_-20px_color-mix(in_oklab,var(--foreground)_45%,transparent)] sm:px-6 sm:pb-4">
            {done ? doneFooter : <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-fit">
                <span className="hidden text-xs font-semibold text-muted-foreground sm:block">{en ? 'Current status' : 'Actuele status'}</span>
                <strong data-testid="group-total" className="block whitespace-nowrap text-sm font-bold text-primary tabular-nums sm:text-xl">{status}</strong>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {step > 1 && <Button type="button" variant="outline" size="icon" className="h-12 w-12" onClick={onBack} aria-label={en ? 'Back' : 'Terug'}><ArrowLeft /></Button>}
                <Button type="submit" form={formId} size="xl" disabled={busy || blocked} className="h-auto min-h-12 max-w-[13rem] whitespace-normal px-4 py-3 leading-snug sm:max-w-none">
                  {busy ? <Loader2 className="animate-spin" /> : step === total ? <ShieldCheck /> : null}
                  {busy ? (en ? 'Sending…' : 'Versturen…') : blocked ? blockedLabel : ctaLabel}
                  {step < total && !blocked && !busy && <ArrowRight />}
                </Button>
              </div>
            </div>}
          </footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  </section>;
}
