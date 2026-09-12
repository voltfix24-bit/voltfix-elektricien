/**
 * Foto's van iPhones komen binnen als HEIC/HEIF. Telegram kan die niet als
 * foto tonen ("sendPhoto" weigert of levert een lege preview), maar wél als
 * bestand: dan opent de monteur hem gewoon met de standaard fotoviewer van
 * zijn telefoon. Daarom splitsen we de bijlagen in "toonbaar als foto" en
 * "meesturen als bestand" — zodat een iPhone-foto nooit uit de keten valt.
 */

const HEIC_EXT = /\.(heic|heif)(\?|$)/i

/** True als het opgeslagen pad (of de URL) een HEIC/HEIF-bestand aanwijst. */
export function isHeicPath(path: string): boolean {
  return HEIC_EXT.test(path)
}

/** Splitst bijlagepaden in gewone foto's en HEIC-bestanden (documenten). */
export function splitPhotoKinds(paths: readonly string[]): {
  photos: string[]
  documents: string[]
} {
  const photos: string[] = []
  const documents: string[] = []
  for (const path of paths) (isHeicPath(path) ? documents : photos).push(path)
  return { photos, documents }
}

/** Bestandsnaam voor Telegram; behoudt de HEIC-extensie zodat iOS/Android hem herkent. */
export function documentFileName(path: string, index: number): string {
  const base = path.split('/').pop() || `foto-${index + 1}.heic`
  const clean = base.split('?')[0]!.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-60)
  return isHeicPath(clean) ? clean : `${clean}.heic`
}
