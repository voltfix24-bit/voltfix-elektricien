import { detectAttachmentSignature } from '@/lib/booking/attachments'
import { reviewHref } from '@/lib/business'
import * as tg from '@/lib/telegram.server'

const PHOTO_LIMIT = 12 * 1024 * 1024
const TOKEN_HOURS = 48

function base64url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function newSignatureToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return base64url(bytes)
}

export async function hashSignatureToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function canFinalizeCompletionProof(proof: { state: string; result_photo_path: string | null; signed_at: string | null }) {
  return proof.state === 'awaiting_signature' && Boolean(proof.result_photo_path) && proof.signed_at === null
}

export async function startCompletionProof(leadId: string, contractorId: string) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data, error } = await supabaseAdmin
    .from('lead_completion_proofs')
    .upsert({ lead_id: leadId, contractor_id: contractorId }, { onConflict: 'lead_id', ignoreDuplicates: true })
    .select('*')
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (data) return data
  const existing = await supabaseAdmin.from('lead_completion_proofs').select('*').eq('lead_id', leadId).single()
  if (existing.error) throw new Error(existing.error.message)
  return existing.data
}

export async function skipBeforePhoto(leadId: string, contractorId: string) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  return supabaseAdmin.from('lead_completion_proofs')
    .update({ state: 'awaiting_before_reason' })
    .eq('lead_id', leadId).eq('contractor_id', contractorId).eq('state', 'awaiting_before')
}

export async function saveBeforeSkipReason(leadId: string, contractorId: string, reason: string) {
  const clean = reason.trim().replace(/\s+/g, ' ').slice(0, 240)
  if (clean.length < 2 || clean.includes('\n')) return false
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data } = await supabaseAdmin.from('lead_completion_proofs')
    .update({ before_skipped_reason: clean, state: 'awaiting_result' })
    .eq('lead_id', leadId).eq('contractor_id', contractorId).eq('state', 'awaiting_before_reason')
    .select('id').maybeSingle()
  return Boolean(data)
}

export async function downloadTelegramPhoto(fileId: string): Promise<{ bytes: Uint8Array; mime: string; ext: string }> {
  const file = await tg.getFile(fileId)
  const bytes = new Uint8Array(await tg.downloadFile(file.file_path))
  if (bytes.byteLength === 0 || bytes.byteLength > PHOTO_LIMIT) throw new Error('Ongeldige fotogrootte')
  const mime = detectAttachmentSignature(bytes)
  if (!mime || mime === 'application/pdf') throw new Error('Bestand is geen geldige foto')
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'
  return { bytes, mime, ext }
}

export async function saveProofPhoto(input: { leadId: string; contractorId: string; kind: 'before' | 'result'; fileId: string }) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const proof = await supabaseAdmin.from('lead_completion_proofs').select('*').eq('lead_id', input.leadId).eq('contractor_id', input.contractorId).single()
  if (proof.error || !proof.data) return { ok: false as const, reason: 'not_started' }
  const expected = input.kind === 'before' ? 'awaiting_before' : 'awaiting_result'
  if (proof.data.state !== expected) return { ok: false as const, reason: 'wrong_step' }
  const photo = await downloadTelegramPhoto(input.fileId)
  const path = `${input.leadId}/${input.kind}.${photo.ext}`
  const upload = await supabaseAdmin.storage.from('lead-completion-proof').upload(path, photo.bytes, { contentType: photo.mime, upsert: false })
  if (upload.error && !/already exists|duplicate/i.test(upload.error.message)) throw new Error(upload.error.message)
  const patch = input.kind === 'before'
    ? { before_photo_path: path, state: 'awaiting_result' }
    : { result_photo_path: path, state: 'awaiting_signature' }
  const saved = await supabaseAdmin.from('lead_completion_proofs').update(patch).eq('id', proof.data.id).eq('state', expected).select('*').maybeSingle()
  if (!saved.data) return { ok: false as const, reason: 'duplicate' }
  await supabaseAdmin.from('lead_audit_logs').insert({ lead_id: input.leadId, action: `completion_${input.kind}_photo`, changes: { contractor_id: input.contractorId } as any })
  return { ok: true as const, proof: saved.data }
}

export async function createSignatureLink(leadId: string, contractorId: string): Promise<string> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const token = newSignatureToken()
  const hash = await hashSignatureToken(token)
  const expires = new Date(Date.now() + TOKEN_HOURS * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabaseAdmin.from('lead_completion_proofs')
    .update({ signature_token_hash: hash, signature_expires_at: expires })
    .eq('lead_id', leadId).eq('contractor_id', contractorId).eq('state', 'awaiting_signature')
    .is('signed_at', null).select('id').maybeSingle()
  if (error || !data) throw new Error(error?.message ?? 'Ondertekenlink kon niet worden gemaakt')
  const base = process.env['PUBLIC_SITE_URL']?.replace(/\/$/, '') || 'https://www.voltfix.nl'
  return `${base}/ondertekenen?token=${encodeURIComponent(token)}`
}

export async function getSignatureContext(token: string) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const hash = await hashSignatureToken(token)
  const { data } = await supabaseAdmin.from('lead_completion_proofs')
    .select('id, signed_at, signature_expires_at, leads:lead_id(customer_name, address, postal_code, city)')
    .eq('signature_token_hash', hash).maybeSingle()
  if (!data || data.signed_at || !data.signature_expires_at || Date.parse(data.signature_expires_at) < Date.now()) return null
  const lead = Array.isArray(data.leads) ? data.leads[0] : data.leads
  if (!lead) return null
  return { customerName: lead.customer_name, address: [lead.address, lead.postal_code, lead.city].filter(Boolean).join(', ') }
}

export async function submitSignature(token: string, dataUrl: string) {
  const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl)
  if (!match) throw new Error('Ongeldige handtekening')
  const bytes = Uint8Array.from(atob(match[1]), (c) => c.charCodeAt(0))
  if (bytes.byteLength < 100 || bytes.byteLength > 1_500_000 || detectAttachmentSignature(bytes) !== 'image/png') throw new Error('Ongeldige handtekening')
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const hash = await hashSignatureToken(token)
  const proof = await supabaseAdmin.from('lead_completion_proofs').select('*, leads:lead_id(*)').eq('signature_token_hash', hash).single()
  const row = proof.data
  if (proof.error || !row || !canFinalizeCompletionProof(row) || !row.signature_expires_at || Date.parse(row.signature_expires_at) < Date.now()) throw new Error('Link is ongeldig of al gebruikt')
  const path = `${row.lead_id}/signature.png`
  const upload = await supabaseAdmin.storage.from('lead-completion-proof').upload(path, bytes, { contentType: 'image/png', upsert: false })
  if (upload.error && !/already exists|duplicate/i.test(upload.error.message)) throw new Error(upload.error.message)
  const now = new Date().toISOString()
  const completed = await supabaseAdmin.from('lead_completion_proofs').update({ signature_path: path, signed_at: now, completed_at: now, state: 'complete', signature_token_hash: null }).eq('id', row.id).is('signed_at', null).select('id').maybeSingle()
  if (!completed.data) throw new Error('Link is al gebruikt')
  const lead = Array.isArray(row.leads) ? row.leads[0] : row.leads
  if (lead) {
    const contractor = await supabaseAdmin.from('contractors').select('name').eq('id', row.contractor_id).single()
    const admin = tg.adminChatId()
    if (admin) {
      const handoff = tg.reviewHandoffMessage(lead as tg.LeadRow, contractor.data?.name ?? 'Monteur', reviewHref({ source: 'whatsapp', content: 'monteur-bewijs' }))
      await tg.sendMessage({ chat_id: admin, text: handoff.text, reply_markup: handoff.reply_markup }).catch((error) => console.error('review handoff failed', error))
    }
  }
  return { ok: true }
}
