import { warranties } from '@/lib/pricing';
import { eur, quoteTotals } from './engine';

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/** Printbare klantofferte (browser "Opslaan als PDF"). Interne regels worden nooit getoond. */
export function renderQuoteHtml(q: any, lines: any[], logoUrl: string): string {
  const en = q.language === 'en';
  const lang = en ? 'en' : 'nl';
  const visible = lines.filter(l => !l.is_internal);
  const t = quoteTotals(visible);
  const b = q.business_snapshot ?? {};
  const c = q.customer_snapshot ?? {};
  const w = en ? warranties.en : warranties.nl;
  const title = q.quote_number ? `${en ? 'Quote' : 'Offerte'} ${q.quote_number}` : (en ? 'Quote — DRAFT' : 'Offerte — CONCEPT');
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>body{font-family:system-ui,sans-serif;color:#111;max-width:760px;margin:32px auto;padding:0 24px;font-size:13px}
h1{font-size:22px;margin:24px 0 4px}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{padding:6px 4px;border-bottom:1px solid #ddd;text-align:left}
.r{text-align:right}.head{display:flex;justify-content:space-between;gap:24px}.muted{color:#555}.tot td{border:0;font-weight:600}
@media print{.noprint{display:none}}</style></head><body>
<button class="noprint" onclick="window.print()">${en ? 'Print / save as PDF' : 'Printen / opslaan als PDF'}</button>
<div class="head"><img src="${esc(logoUrl)}" alt="VoltFix" style="height:44px"><div class="muted r">${esc(b.name)}<br>${esc(b.street)}<br>${esc(b.postal_code)} ${esc(b.city)}<br>${esc(b.phone)} · ${esc(b.email)}<br>KvK ${esc(b.kvk)} · ${en ? 'VAT' : 'btw'} ${esc(b.btw)}</div></div>
<h1>${esc(title)}</h1>
<p class="muted">${en ? 'Date' : 'Datum'}: ${esc((q.finalized_at ?? new Date().toISOString()).slice(0, 10))}${q.valid_until ? ` · ${en ? 'Valid until' : 'Geldig tot'}: ${esc(q.valid_until)}` : ''}</p>
<p><strong>${esc(c.name)}</strong><br>${esc(c.address)}<br>${esc(c.postal_code)} ${esc(c.city)}</p>
<table><thead><tr><th>${en ? 'Description' : 'Omschrijving'}</th><th class="r">${en ? 'Qty' : 'Aantal'}</th><th class="r">${en ? 'Price' : 'Prijs'}</th><th class="r">${en ? 'Total' : 'Totaal'}</th></tr></thead><tbody>
${visible.map(l => `<tr><td>${esc(l.label)}</td><td class="r">${l.qty}</td><td class="r">${eur(l.unit_price_inc_vat_cents, lang)}</td><td class="r">${eur(l.qty * l.unit_price_inc_vat_cents, lang)}</td></tr>`).join('')}
</tbody><tbody class="tot">
<tr><td colspan="3" class="r">${en ? 'Subtotal excl. VAT' : 'Subtotaal excl. btw'}</td><td class="r">${eur(t.subtotal_ex_vat_cents, lang)}</td></tr>
<tr><td colspan="3" class="r">${en ? 'VAT 21%' : 'Btw 21%'}</td><td class="r">${eur(t.vat_cents, lang)}</td></tr>
<tr><td colspan="3" class="r">${en ? 'Total incl. VAT' : 'Totaal incl. btw'}</td><td class="r">${eur(t.total_inc_vat_cents, lang)}</td></tr></tbody></table>
${q.customer_note ? `<p>${esc(q.customer_note).replace(/\n/g, '<br>')}</p>` : ''}
<p class="muted">${esc(w.sentence)} ${esc(w.startNote)}</p>
</body></html>`;
}
