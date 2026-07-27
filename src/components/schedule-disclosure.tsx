import { useEffect, useRef, useState, type ReactNode } from "react";
import { Calendar, ChevronDown } from "lucide-react";

import { pushToDataLayer } from "@/lib/analytics";
import { useLocale, usePathname } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
};

const HASH = "#installatiemoment";

export function ScheduleDisclosure({
  id = "installatiemoment",
  title = "Plan direct je afspraak",
  subtitle = "Bekijk vrije momenten — meestal binnen 48 uur in Amsterdam",
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const firedRef = useRef(false);
  const language = useLocale();
  const pagePath = usePathname();
  const contentId = `${id}-panel`;

  const fireOpenEvent = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    pushToDataLayer({
      event: "perilex_schedule_open",
      cta_location: "perilex-schedule-open",
      language,
      page_path: pagePath,
    });
  };

  const openAndTrack = () => {
    fireOpenEvent();
    setOpen(true);
  };

  useEffect(() => {
    const checkHash = () => {
      if (typeof window === "undefined") return;
      if (window.location.hash === HASH) {
        openAndTrack();
        // scroll na open zodat scroll-margin klopt
        requestAnimationFrame(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    };
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggle = () => {
    setOpen((v) => {
      const next = !v;
      if (next) fireOpenEvent();
      return next;
    });
  };

  return (
    <section
      id={id}
      className="scroll-mt-24 overflow-hidden rounded-xl border border-border bg-card"
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 sm:px-5"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Calendar className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold leading-tight text-foreground">
            {title}
          </span>
          <span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">
            {subtitle}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {/* Content blijft altijd in DOM (SEO + state), alleen visueel verborgen. */}
      <div
        id={contentId}
        hidden={!open}
        className="border-t border-border px-4 py-5 sm:px-5"
      >
        {children}
      </div>
    </section>
  );
}
