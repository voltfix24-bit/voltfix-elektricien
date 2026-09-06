// Cloudflare Turnstile (onzichtbare anti-spam) voor het offerteformulier.
// De site key is publiek en mag in code staan; de secret key staat server-side
// als TURNSTILE_SECRET_KEY. Zolang de site key leeg is, rendert de widget niet
// en verifieert de server niets (fail-open tot de sleutels zijn ingesteld).
export const TURNSTILE_SITE_KEY = "0x4AAAAAAEqBMaMfV1xJtQiz";

export const turnstileEnabled = TURNSTILE_SITE_KEY.length > 0;

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          size?: "invisible" | "normal" | "compact";
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
        },
      ) => string;
      execute: (widgetId: string) => void;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (window.turnstile) return resolve();
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Turnstile script laden mislukt"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Rendert een onzichtbare Turnstile-widget in `container` en geeft een functie
 * terug die bij submit een vers token ophaalt. Geeft null terug als Turnstile
 * niet geconfigureerd is.
 */
export async function mountInvisibleTurnstile(
  container: HTMLElement,
): Promise<{ getToken: () => Promise<string>; unmount: () => void } | null> {
  if (!turnstileEnabled) return null;
  await loadScript();
  if (!window.turnstile) return null;

  let resolveToken: ((t: string) => void) | null = null;
  let rejectToken: ((e: Error) => void) | null = null;

  const widgetId = window.turnstile.render(container, {
    sitekey: TURNSTILE_SITE_KEY,
    size: "invisible",
    callback: (token) => {
      resolveToken?.(token);
      resolveToken = null;
      rejectToken = null;
    },
    "error-callback": () => {
      rejectToken?.(new Error("Spam-controle mislukt"));
      resolveToken = null;
      rejectToken = null;
    },
    "expired-callback": () => {
      window.turnstile?.reset(widgetId);
    },
  });

  return {
    getToken: () =>
      new Promise<string>((resolve, reject) => {
        resolveToken = resolve;
        rejectToken = reject;
        window.turnstile?.reset(widgetId);
        window.turnstile?.execute(widgetId);
      }),
    unmount: () => window.turnstile?.remove(widgetId),
  };
}
