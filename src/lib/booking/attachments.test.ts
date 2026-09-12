import { describe, expect, it } from 'vitest';

import {
  attachmentRulesFor,
  attachmentStoragePath,
  detectAttachmentSignature,
  displayFilename,
  isUnsafeFilename,
  requiredFollowUpItems,
  retentionExpiresAt,
  uuidPattern,
  validateAttachment,
  validateAttachmentSet,
} from './attachments';
import { clientPreCheck, type AttachmentItem } from './attachment-upload';
import { perilexBookingRoutes } from './perilex-routing';

/* -------------------------------------------------------------------------- */
/* Testbestanden met echte magic bytes                                         */
/* -------------------------------------------------------------------------- */

const bytesOf = (...parts: Array<number[] | string>) =>
  new Uint8Array(parts.flatMap(part => (typeof part === 'string' ? [...part].map(c => c.charCodeAt(0)) : part)));

const jpeg = bytesOf([0xff, 0xd8, 0xff, 0xe0], 'JFIF padding padding');
const png = bytesOf([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 'IHDR padding');
const webp = bytesOf('RIFF', [0x20, 0x00, 0x00, 0x00], 'WEBPVP8 padding');
const heic = bytesOf([0x00, 0x00, 0x00, 0x18], 'ftypheic', '   padding');
const pdf = bytesOf('%PDF-1.7', '\n padding padding');
const svg = bytesOf('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
const html = bytesOf('<!DOCTYPE html><html></html>');
const script = bytesOf('#!/bin/sh\nrm -rf /');

const rules = attachmentRulesFor('perilex');

const check = (over: Partial<Parameters<typeof validateAttachment>[0]> = {}) =>
  validateAttachment({
    filename: 'groepenkast.jpg',
    declaredType: 'image/jpeg',
    size: jpeg.length,
    bytes: jpeg,
    category: 'consumer_unit',
    rules,
    ...over,
  });

describe('bijlagen: geldige bestandstypen', () => {
  it('accepteert JPEG, PNG, WebP, HEIC en PDF voor Perilex', () => {
    expect(check()).toEqual({ ok: true, mime: 'image/jpeg' });
    expect(check({ filename: 'kast.png', declaredType: 'image/png', bytes: png, size: png.length })).toEqual({ ok: true, mime: 'image/png' });
    expect(check({ filename: 'kast.webp', declaredType: 'image/webp', bytes: webp, size: webp.length })).toEqual({ ok: true, mime: 'image/webp' });
    expect(check({ filename: 'kast.heic', declaredType: 'image/heic', bytes: heic, size: heic.length })).toEqual({ ok: true, mime: 'image/heic' });
    expect(check({ filename: 'keuken.pdf', declaredType: 'application/pdf', bytes: pdf, size: pdf.length, category: 'kitchen_plan' })).toEqual({ ok: true, mime: 'application/pdf' });
  });

  it('herkent de signature los van de opgegeven naam of type', () => {
    expect(detectAttachmentSignature(pdf)).toBe('application/pdf');
    expect(detectAttachmentSignature(svg)).toBeNull();
    expect(detectAttachmentSignature(html)).toBeNull();
    expect(detectAttachmentSignature(script)).toBeNull();
  });
});

describe('bijlagen: vervalste bestanden worden geweigerd', () => {
  it('weigert een verkeerd opgegeven MIME-type bij echte inhoud', () => {
    expect(check({ declaredType: 'application/pdf', filename: 'kast.pdf' })).toEqual({ ok: false, issue: 'signature_mismatch' });
  });

  it('weigert een vervalste extensie met PDF-inhoud', () => {
    expect(check({ filename: 'foto.jpg', declaredType: 'image/jpeg', bytes: pdf, size: pdf.length })).toEqual({ ok: false, issue: 'signature_mismatch' });
  });

  it('weigert onbekende of ontbrekende magic bytes', () => {
    expect(check({ bytes: bytesOf('not an image at all') })).toEqual({ ok: false, issue: 'signature_unknown' });
  });

  it('weigert SVG, HTML en scripts, ook met een afbeeldings-MIME', () => {
    expect(check({ filename: 'logo.svg', declaredType: 'image/svg+xml', bytes: svg, size: svg.length })).toEqual({ ok: false, issue: 'unsafe_filename' });
    expect(check({ filename: 'pagina.html', declaredType: 'image/jpeg', bytes: html, size: html.length })).toEqual({ ok: false, issue: 'unsafe_filename' });
    expect(check({ filename: 'run.sh', declaredType: 'image/jpeg', bytes: script, size: script.length })).toEqual({ ok: false, issue: 'unsafe_filename' });
    // Ook zonder gevaarlijke naam blijft de inhoud onleesbaar → geweigerd.
    expect(check({ filename: 'logo.png', declaredType: 'image/png', bytes: svg, size: svg.length })).toEqual({ ok: false, issue: 'signature_unknown' });
  });

  it('weigert dubbele extensies, verborgen bestanden en path traversal', () => {
    expect(isUnsafeFilename('factuur.pdf.exe')).toBe(true);
    expect(isUnsafeFilename('../../etc/passwd')).toBe(true);
    expect(isUnsafeFilename('map\\kast.jpg')).toBe(true);
    expect(isUnsafeFilename('.htaccess')).toBe(true);
    expect(isUnsafeFilename('groepenkast keuken.jpg')).toBe(false);
  });

  it('weigert een leeg bestand en een onbekende categorie', () => {
    expect(check({ size: 0 })).toEqual({ ok: false, issue: 'empty_file' });
    expect(check({ category: 'vrije_tekst' })).toEqual({ ok: false, issue: 'invalid_category' });
  });
});

describe('bijlagen: limieten', () => {
  it('hanteert 12 MB per afbeelding en 15 MB per PDF voor Perilex', () => {
    expect(rules.maxImageBytes).toBe(12 * 1024 * 1024);
    expect(rules.maxPdfBytes).toBe(15 * 1024 * 1024);
    expect(check({ size: 13 * 1024 * 1024 })).toEqual({ ok: false, issue: 'file_too_large' });
    expect(check({ filename: 'keuken.pdf', declaredType: 'application/pdf', bytes: pdf, size: 16 * 1024 * 1024, category: 'kitchen_plan' }))
      .toEqual({ ok: false, issue: 'file_too_large' });
  });

  it('bewaakt maximaal 8 bestanden en 40 MB per aanvraag', () => {
    expect(validateAttachmentSet(Array.from({ length: 8 }, () => 1024), rules)).toEqual({ ok: true });
    expect(validateAttachmentSet(Array.from({ length: 9 }, () => 1024), rules)).toEqual({ ok: false, issue: 'too_many_files' });
    expect(validateAttachmentSet([20 * 1024 * 1024, 21 * 1024 * 1024], rules)).toEqual({ ok: false, issue: 'total_too_large' });
  });

  it('laat de bestaande groepenkastlimieten ongemoeid', () => {
    const groep = attachmentRulesFor('groepenkast');
    expect(groep.maxFiles).toBe(3);
    expect(groep.maxImageBytes).toBe(20 * 1024 * 1024);
    expect(groep.maxPdfBytes).toBe(0);
    expect(groep.allowedMimes).not.toContain('application/pdf');
  });

  it('past dezelfde limieten client-side toe vóór het uploaden', () => {
    const file = (name: string, type: string, size: number) =>
      new File([new Uint8Array(1)], name, { type }) && ({ name, type, size } as unknown as File);
    const current: AttachmentItem[] = [];
    expect(clientPreCheck(file('kast.jpg', 'image/jpeg', 1024), current, rules)).toBeNull();
    expect(clientPreCheck(file('kast.svg', 'image/svg+xml', 1024), current, rules)).toBe('mime_not_allowed');
    expect(clientPreCheck(file('kast.jpg', 'image/jpeg', 13 * 1024 * 1024), current, rules)).toBe('file_too_large');
  });
});

describe('bijlagen: opslagpaden en bewaartermijn', () => {
  const draft = '3f3d2c1a-9b7e-4a2b-8c1d-2f4a6b8c0d1e';
  const attachment = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

  it('bouwt een pad met uitsluitend UUID’s, zonder klantgegevens of bestandsnaam', () => {
    const path = attachmentStoragePath(draft, attachment, 'image/jpeg');
    expect(path).toBe(`perilex/${draft}/${attachment}.jpg`);
    expect(path).not.toMatch(/groepenkast|0612|1017|straat/i);
    expect(uuidPattern.test(draft)).toBe(true);
    expect(uuidPattern.test('../../etc')).toBe(false);
  });

  it('bewaart de originele naam alleen als leesbare metadata', () => {
    expect(displayFilename('../../Groepenkast foto.jpg')).not.toContain('..');
  });

  it('stelt een bewaartermijn voor zonder iets te verwijderen', () => {
    const at = new Date(retentionExpiresAt(new Date('2026-01-01T00:00:00Z')));
    expect(at.getUTCFullYear()).toBe(2027);
  });
});

describe('bijlagen: ontbrekende informatie per route', () => {
  it('vraagt bij een fotobeoordeling om groepenkast en aansluitplek', () => {
    expect(requiredFollowUpItems({ route: 'photo_review', intent: 'new_installation', categories: [] }))
      .toEqual(['photo_consumer_unit', 'photo_installation_location']);
    expect(requiredFollowUpItems({ route: 'photo_review', intent: 'new_installation', categories: ['consumer_unit', 'installation_location'] }))
      .toEqual([]);
  });

  it('vraagt bij een keukenrenovatie ook om de keukentekening', () => {
    expect(requiredFollowUpItems({ route: 'photo_review', intent: 'kitchen_renovation', categories: ['consumer_unit', 'installation_location'] }))
      .toEqual(['kitchen_plan']);
  });

  it('zet bij de veiligheidsroute telefonisch contact voorop', () => {
    expect(requiredFollowUpItems({ route: 'safety_call', intent: null, categories: ['consumer_unit'] }))
      .toEqual(['phone_contact_safety']);
  });

  it('blokkeert de vaste prijs en de schouw niet', () => {
    expect(requiredFollowUpItems({ route: 'fixed_existing_standard', intent: null, categories: ['existing_outlet'] })).toEqual([]);
    expect(requiredFollowUpItems({ route: 'site_survey', intent: 'new_installation', categories: [] })).toEqual([]);
  });

  it('geeft voor elke bestaande route een geldige lijst terug', () => {
    for (const route of perilexBookingRoutes) {
      expect(Array.isArray(requiredFollowUpItems({ route, intent: null, categories: [] }))).toBe(true);
    }
    expect(requiredFollowUpItems({ route: null, intent: null, categories: [] })).toEqual([]);
  });
});
