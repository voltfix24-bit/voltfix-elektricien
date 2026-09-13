/**
 * Rechtenmatrix voor de interne Perilex-beoordeling (fase 5A quality gate).
 *
 * Waarom een aparte module: de rollen die dit platform kent staan in de
 * database-enum `app_role` en zijn nu uitsluitend `admin` en `user`. Er is
 * bewust géén nieuwe rol toegevoegd en RLS is niet verbreed. Deze matrix maakt
 * expliciet wie wat mag, zodat een latere uitbreiding (bijvoorbeeld een
 * monteursrol) één plek heeft en aantoonbaar getest kan worden.
 *
 * Belangrijk: dit is de tweede sluis, niet de eerste. RLS op
 * `quote_request_assessments`, `quote_request_assessment_events` en
 * `attachment_access_log` staat al op `has_role(auth.uid(), 'admin')`.
 */

/** Rollen zoals de database-enum `app_role` ze kent. */
export const appRoles = ['admin', 'user'] as const;
export type AppRole = (typeof appRoles)[number];

/** Alles wat een actor binnen de beoordeling kan willen doen. */
export const perilexPermissions = [
  'assessment.read',
  'assessment.write',
  'assessment.decide',
  'assessment.status',
  'assessment.confirm_availability',
  'assessment.read_internal_notes',
  'assessment.read_pricing_decision',
  'attachment.view',
  'attachment.download',
  'attachment.read_access_log',
] as const;
export type PerilexPermission = (typeof perilexPermissions)[number];

const adminPermissions: readonly PerilexPermission[] = perilexPermissions;

/**
 * De matrix. `user` is een ingelogde niet-beheerder en mag binnen de
 * beoordeling niets — ook niet lezen.
 */
export const perilexPermissionMatrix: Record<AppRole, readonly PerilexPermission[]> = {
  admin: adminPermissions,
  user: [],
};

/**
 * Wat een klantlink (toekomstige fase 5B) hoogstens zou mogen zien. Nu nog
 * niet in gebruik; vastgelegd zodat interne notities en prijsbeslissingen
 * daar per definitie buiten vallen.
 */
export const customerLinkForbidden: readonly PerilexPermission[] = [
  'assessment.read_internal_notes',
  'assessment.read_pricing_decision',
  'assessment.write',
  'assessment.decide',
  'assessment.status',
  'assessment.confirm_availability',
  'attachment.read_access_log',
];

export function hasPerilexPermission(role: AppRole | null | undefined, permission: PerilexPermission): boolean {
  if (!role) return false;
  return (perilexPermissionMatrix[role] ?? []).includes(permission);
}

/** Gooit met een stabiele melding wanneer de rol het recht niet heeft. */
export function assertPerilexPermission(role: AppRole | null | undefined, permission: PerilexPermission): void {
  if (!hasPerilexPermission(role, permission)) throw new Error('Geen beheerdersrechten.');
}
