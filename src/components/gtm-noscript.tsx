/**
 * Google Tag Manager noscript fallback.
 *
 * GTM vereist een <noscript><iframe ...></noscript> direct na de openingstag
 * van <body>. Deze component rendert die iframe alleen als VITE_GTM_ID is
 * ingesteld, zodat de preview geen broken iframe toont zonder ID.
 */
export function GtmNoScript() {
  const gtmId = import.meta.env.VITE_GTM_ID as string | undefined;
  if (!gtmId) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
