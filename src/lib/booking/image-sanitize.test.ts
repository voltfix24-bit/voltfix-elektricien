import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { containsMetadataMarker, readExifOrientation, sanitizeImageBytes } from './image-sanitize';
import { detectAttachmentSignature } from './attachments';

const fixture = (name: string) => new Uint8Array(readFileSync(join(__dirname, '__fixtures__', name)));

describe('EXIF-verwijdering met een echt testbestand', () => {
  const jpeg = fixture('exif-gps.jpg');

  it('het testbestand bevat werkelijk GPS-gegevens', () => {
    const text = new TextDecoder('latin1').decode(jpeg);
    expect(text).toContain('VoltFix testfoto');
    expect(jpeg.length).toBeGreaterThan(500);
  });

  it('verwijdert GPS en beschrijving, behoudt de oriëntatie', () => {
    const result = sanitizeImageBytes(jpeg, 'image/jpeg');
    expect(result.status).toBe('metadata_stripped');
    expect(result.orientation).toBe(6);
    expect(result.removed).toContain('jpeg_exif');

    const text = new TextDecoder('latin1').decode(result.bytes);
    expect(text).not.toContain('VoltFix testfoto');
    expect(containsMetadataMarker(result.bytes, 'image/jpeg')).toBe(false);

    // Oriëntatie is bewaard in een minimaal EXIF-blok.
    const app1Start = 2;
    expect(result.bytes[app1Start]).toBe(0xff);
    expect(result.bytes[app1Start + 1]).toBe(0xe1);
    const length = (result.bytes[app1Start + 2]! << 8) | result.bytes[app1Start + 3]!;
    expect(readExifOrientation(result.bytes.subarray(app1Start + 4, app1Start + 2 + length))).toBe(6);
  });

  it('blijft een geldige JPEG en wordt niet groter', () => {
    const result = sanitizeImageBytes(jpeg, 'image/jpeg');
    expect(detectAttachmentSignature(result.bytes)).toBe('image/jpeg');
    expect(result.bytes.length).toBeLessThan(jpeg.length);
    expect(result.bytes.at(-2)).toBe(0xff);
    expect(result.bytes.at(-1)).toBe(0xd9);
  });

  it('is idempotent', () => {
    const once = sanitizeImageBytes(jpeg, 'image/jpeg').bytes;
    const twice = sanitizeImageBytes(once, 'image/jpeg');
    expect(twice.status).toBe('metadata_stripped');
    expect(twice.orientation).toBe(6);
    expect(Array.from(twice.bytes)).toEqual(Array.from(once));
  });
});

describe('PNG en WebP', () => {
  it('houdt een PNG geldig en verwijdert tekstchunks', () => {
    const png = fixture('plain.png');
    const result = sanitizeImageBytes(png, 'image/png');
    expect(result.status).toBe('metadata_stripped');
    expect(detectAttachmentSignature(result.bytes)).toBe('image/png');
  });

  it('houdt een WebP geldig', () => {
    const webp = fixture('plain.webp');
    const result = sanitizeImageBytes(webp, 'image/webp');
    expect(result.status).toBe('metadata_stripped');
    expect(detectAttachmentSignature(result.bytes)).toBe('image/webp');
  });
});

describe('eerlijke statussen', () => {
  it('meldt HEIC als niet-gestript in plaats van te doen alsof', () => {
    const result = sanitizeImageBytes(new Uint8Array([0, 0, 0, 24, 102, 116, 121, 112, 104, 101, 105, 99]), 'image/heic');
    expect(result.status).toBe('metadata_retained');
    expect(result.removed).toHaveLength(0);
  });

  it('laat PDF ongemoeid', () => {
    const pdf = new TextEncoder().encode('%PDF-1.7\n%%EOF\n');
    const result = sanitizeImageBytes(pdf, 'application/pdf');
    expect(result.status).toBe('not_applicable');
    expect(Array.from(result.bytes)).toEqual(Array.from(pdf));
  });

  it('geeft bij kapotte bytes de originelen terug met status failed', () => {
    const broken = new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0xff, 0xff, 1, 2, 3]);
    const result = sanitizeImageBytes(broken, 'image/jpeg');
    expect(result.status).toBe('failed');
    expect(Array.from(result.bytes)).toEqual(Array.from(broken));
  });
});
