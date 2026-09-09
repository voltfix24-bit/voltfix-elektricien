import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ImagePlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { LeadPhotoPicker } from './lead-photo-picker'
import { addLeadPhotos, uploadLeadImage } from '@/lib/admin.functions'
import { uploadLeadPhotos } from '@/lib/lead-photo-upload'

export function LeadExtraPhotos({ leadId, name, count }: { leadId: string; name: string; count: number }) {
  const [open, setOpen] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const upload = useServerFn(uploadLeadImage)
  const save = useServerFn(addLeadPhotos)
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async () => save({ data: { leadId, paths: await uploadLeadPhotos(photos, upload) } }),
    onSuccess: (result) => {
      if (result.deliveryExpected && !result.delivered) toast.warning('Foto’s opgeslagen, maar niet afgeleverd via Telegram.')
      else toast.success(result.delivered ? 'Foto’s opgeslagen en naar Telegram gestuurd.' : 'Foto’s toegevoegd aan de lead.')
      setPhotos([]); setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin', 'leads'] })
    },
    onError: () => toast.error('Foto’s opslaan mislukt. Probeer opnieuw.'),
  })
  return <>
    <Button variant="outline" size="sm" className="min-h-11" onClick={() => setOpen(true)}><ImagePlus className="size-4" /> Foto’s {count > 0 ? `(${count})` : ''}</Button>
    <Dialog open={open} onOpenChange={(value) => { if (!mutation.isPending) setOpen(value) }}>
      <DialogContent className="admin-mobile max-h-[90dvh] overflow-y-auto">
        <DialogHeader><DialogTitle>Foto’s toevoegen</DialogTitle><DialogDescription>{name} · {count} foto’s opgeslagen</DialogDescription></DialogHeader>
        <LeadPhotoPicker photos={photos} onChange={setPhotos} disabled={mutation.isPending} />
        <Button disabled={!photos.length || mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? 'Foto’s opslaan…' : 'Foto’s bewaren'}</Button>
      </DialogContent>
    </Dialog>
  </>
}