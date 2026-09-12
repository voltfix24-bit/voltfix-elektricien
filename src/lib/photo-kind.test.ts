import { describe, expect, it } from 'vitest'

import { documentFileName, isHeicPath, splitPhotoKinds } from './photo-kind'

describe('photo-kind', () => {
  it('herkent HEIC/HEIF-paden', () => {
    expect(isHeicPath('2026-09-12/abc/1-IMG_0042.heic')).toBe(true)
    expect(isHeicPath('2026-09-12/abc/1-IMG_0042.HEIF')).toBe(true)
    expect(isHeicPath('https://x/y/1-foto.heic?token=1')).toBe(true)
    expect(isHeicPath('2026-09-12/abc/1-foto.jpg')).toBe(false)
  })

  it('splitst bijlagen zodat een iPhone-foto niet uit de keten valt', () => {
    const { photos, documents } = splitPhotoKinds([
      'a/1-foto.jpg',
      'a/2-IMG_1.heic',
      'a/3-foto.png',
      'a/4-IMG_2.HEIF',
    ])
    expect(photos).toEqual(['a/1-foto.jpg', 'a/3-foto.png'])
    expect(documents).toEqual(['a/2-IMG_1.heic', 'a/4-IMG_2.HEIF'])
    // Niets verdwijnt: samen zijn het weer alle vier de bijlagen.
    expect(photos.length + documents.length).toBe(4)
  })

  it('maakt een veilige bestandsnaam met HEIC-extensie', () => {
    expect(documentFileName('2026-09-12/abc/1-IMG 0042.heic', 0)).toBe('1-IMG_0042.heic')
    expect(documentFileName('', 2)).toBe('foto-3.heic')
  })
})
