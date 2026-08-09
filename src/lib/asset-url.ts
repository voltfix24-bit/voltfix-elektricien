/**
 * Cache-busting voor CDN-assets.
 *
 * Elke nieuwe upload krijgt een nieuw asset_id (en dus een nieuwe URL), maar
 * proxies, service workers en browsers kunnen een oude respons vasthouden op
 * hetzelfde pad. Door een versie-token uit het pointer-bestand toe te voegen
 * krijgt elke assetversie automatisch een unieke URL.
 */
export type AssetPointer = {
  url: string;
  asset_id?: string;
  created_at?: string;
};

export function assetUrl(asset: AssetPointer): string {
  const token = (asset.asset_id ?? asset.created_at ?? "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
  if (!token) return asset.url;
  return `${asset.url}${asset.url.includes("?") ? "&" : "?"}v=${token}`;
}
