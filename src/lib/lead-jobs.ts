/** Eén lijst met klussoorten voor het leadformulier en de WhatsApp-herkenning. */
export const JOBS = [
  'Storing / geen stroom',
  'Groepenkast vervangen',
  'Perilex aansluiten',
  'Laadpaal installeren',
  'Stopcontact / schakelaar',
  'Verlichting ophangen',
  'Inspectie / keuring',
] as const

export type JobType = (typeof JOBS)[number]
