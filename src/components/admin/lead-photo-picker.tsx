import { useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

import { isHeicFile } from '@/lib/lead-image'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
// iPhone-foto's zijn HEIC; die worden in de browser omgezet naar JPEG en
// daarna verkleind, dus mag de ruwe foto groter zijn dan de eindlimiet.
const MAX_BYTES = 25 * 1024 * 1024
const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif'

export function LeadPhotoPicker({ photos, onChange, disabled }: {
  photos: File[]
  onChange: (photos: File[]) => void
  disabled: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const camera = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  function addPhotos(files: File[]) {
    if (disabled) return
    const next = [...photos]
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type) && !isHeicFile(file)) {
        toast.error('Alleen JPG, PNG, WebP of een iPhone-foto (HEIC) is toegestaan.')
        continue
      }
      if (file.size === 0 || file.size > MAX_BYTES) {
        toast.error(`${file.name}: kies een foto van maximaal 25 MB.`)
        continue
      }
      if (next.some((p) => p.name === file.name && p.size === file.size && p.lastModified === file.lastModified)) continue
      if (next.length >= 3) {
        toast.error('Je kunt maximaal 3 foto’s toevoegen.')
        break
      }
      next.push(file)
    }
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">Foto’s</span>
        <span className="text-sm text-muted-foreground">{photos.length}/3</span>
      </div>
      <div
        onDragOver={(event) => { event.preventDefault(); if (!disabled) setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragOver(false)
          addPhotos(Array.from(event.dataTransfer.files))
        }}
        className={`flex flex-wrap items-center gap-3 rounded-lg border border-dashed p-4 ${dragOver ? 'border-primary bg-primary/5' : 'border-border'}`}
      >
        <Button type="button" variant="outline" className="min-h-12 flex-1 sm:flex-none" disabled={disabled || photos.length >= 3} onClick={() => input.current?.click()}>
          <ImagePlus className="size-4" /> Foto’s toevoegen
        </Button>
        <Button type="button" variant="outline" className="min-h-12" disabled={disabled || photos.length >= 3} onClick={() => camera.current?.click()}>
          <Camera className="size-4" /> Camera
        </Button>
        <input ref={camera} type="file" accept={ACCEPT} capture="environment" className="sr-only" aria-label="Maak een foto voor de lead" disabled={disabled} onChange={(event) => { addPhotos(Array.from(event.target.files ?? [])); event.target.value = '' }} />
        <span className="text-sm text-muted-foreground">JPG, PNG, WebP of iPhone (HEIC) · wordt automatisch verkleind</span>
        <input
          ref={input}
          type="file"
          accept={ACCEPT}
          multiple
          disabled={disabled}
          className="sr-only"
          aria-label="Foto’s toevoegen aan lead"
          onChange={(event) => {
            addPhotos(Array.from(event.target.files ?? []))
            event.target.value = ''
          }}
        />
      </div>
      {photos.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo, index) => (
            <li key={`${photo.name}-${photo.size}-${photo.lastModified}`} className="min-w-0">
              <div className="relative">
                <PhotoPreview photo={photo} />
                <Button
                  type="button" variant="outline" size="icon"
                  className="absolute right-2 top-2 bg-background"
                  disabled={disabled}
                  aria-label={`Verwijder foto ${photo.name}`}
                  title={`Verwijder foto ${photo.name}`}
                  onClick={() => onChange(photos.filter((_, i) => i !== index))}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <p className="mt-1 truncate text-sm text-muted-foreground" title={photo.name}>{photo.name}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function PhotoPreview({ photo }: { photo: File }) {
  const [url, setUrl] = useState('')
  // HEIC kan een browser niet tekenen; toon dan een nette plaatsvervanger.
  const heic = isHeicFile(photo)
  useEffect(() => {
    const next = URL.createObjectURL(photo)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [photo])
  if (heic) return <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg border border-border bg-muted px-2 text-center text-sm text-muted-foreground">iPhone-foto · wordt omgezet</div>
  return <img src={url || undefined} alt={`Geselecteerde foto: ${photo.name}`} className="aspect-[4/3] w-full rounded-lg border border-border bg-muted object-contain" />
}