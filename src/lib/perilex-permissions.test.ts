import { describe, expect, it } from 'vitest';
import {
  appRoles,
  assertPerilexPermission,
  customerLinkForbidden,
  hasPerilexPermission,
  perilexPermissionMatrix,
  perilexPermissions,
} from './perilex-permissions';

describe('rechtenmatrix Perilex-beoordeling', () => {
  it('kent alleen de rollen die de database ook kent', () => {
    expect(appRoles).toEqual(['admin', 'user']);
    expect(Object.keys(perilexPermissionMatrix).sort()).toEqual(['admin', 'user']);
  });

  it('geeft de beheerder alle rechten', () => {
    for (const permission of perilexPermissions) {
      expect(hasPerilexPermission('admin', permission)).toBe(true);
    }
  });

  it('geeft een gewone ingelogde gebruiker geen enkel recht', () => {
    for (const permission of perilexPermissions) {
      expect(hasPerilexPermission('user', permission)).toBe(false);
    }
  });

  it('weigert een ontbrekende of onbekende rol', () => {
    expect(hasPerilexPermission(null, 'assessment.read')).toBe(false);
    expect(hasPerilexPermission(undefined, 'assessment.read')).toBe(false);
    expect(() => assertPerilexPermission(null, 'assessment.read')).toThrow('Geen beheerdersrechten.');
    expect(() => assertPerilexPermission('user', 'assessment.decide')).toThrow('Geen beheerdersrechten.');
    expect(() => assertPerilexPermission('admin', 'assessment.decide')).not.toThrow();
  });

  it('houdt interne notities en prijsbeslissingen buiten een klantlink', () => {
    expect(customerLinkForbidden).toContain('assessment.read_internal_notes');
    expect(customerLinkForbidden).toContain('assessment.read_pricing_decision');
    expect(customerLinkForbidden).toContain('attachment.read_access_log');
  });
});
