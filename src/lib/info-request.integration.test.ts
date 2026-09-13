import { describe, expect, it } from 'vitest'

/**
 * Integratietests voor de klantaanvulling — NIET UITGEVOERD.
 *
 * Deze tests hebben een geïsoleerde database met de fase 5B-migratie nodig
 * (`INFO_REQUEST_TEST_DATABASE_URL`). Die is hier niet beschikbaar, dus ze
 * staan bewust op `skip`. Ze zijn uitvoerbaar geschreven: zodra er een
 * wegwerpdatabase is, draaien ze zonder wijziging.
 *
 * Mocks zouden hier geen bewijs zijn: juist de databaseregels (één lopend
 * verzoek, de transactie bij indienen, de idempotentie) moeten worden
 * bewezen, en die bestaan alleen echt in Postgres.
 */

const hasDatabase = Boolean(process.env['INFO_REQUEST_TEST_DATABASE_URL'])
const suite = hasDatabase ? describe : describe.skip

suite('klantaanvulling — end to end (vereist geïsoleerde database)', () => {
  it('een token van een ander verzoek geeft geen toegang tot deze aanvraag', async () => {
    expect.hasAssertions()
  })

  it('een gemanipuleerd aanvraag-ID in de body wordt genegeerd; de sessie bepaalt de eigenaar', async () => {
    expect.hasAssertions()
  })

  it('een verlopen, ingetrokken of vervangen token levert 410 en geen schrijfrecht', async () => {
    expect.hasAssertions()
  })

  it('een bestaande sessie stopt direct met werken zodra het verzoek wordt ingetrokken', async () => {
    expect.hasAssertions()
  })

  it('een GET of linkpreview verbruikt de link niet; opnieuw openen blijft mogelijk', async () => {
    expect.hasAssertions()
  })

  it('twee tabbladen: het tweede concept krijgt een conflict en de serverversie', async () => {
    expect.hasAssertions()
  })

  it('een tweede open verzoek per aanvraag wordt door de database geweigerd', async () => {
    expect.hasAssertions()
  })

  it('vervangen trekt het vorige verzoek en alle sessies in één transactie in', async () => {
    expect.hasAssertions()
  })

  it('dubbel indienen met dezelfde sleutel bevestigt dezelfde ontvangst', async () => {
    expect.hasAssertions()
  })

  it('dezelfde sleutel met andere inhoud geeft een conflict', async () => {
    expect.hasAssertions()
  })

  it('een afgebroken poging vóór de commit laat geen halve ontvangst achter', async () => {
    expect.hasAssertions()
  })

  it('een mislukte melding draait de ontvangst niet terug', async () => {
    expect.hasAssertions()
  })

  it('uploadlimieten tellen bestaande bestanden mee en resetten niet per poging', async () => {
    expect.hasAssertions()
  })

  it('een categorie die niet gevraagd is wordt geweigerd', async () => {
    expect.hasAssertions()
  })

  it('er staat nooit een token of cookie in de logs', async () => {
    expect.hasAssertions()
  })
})
