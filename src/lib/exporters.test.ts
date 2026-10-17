import { describe, expect, it } from 'vitest'
import { buildBackup, validateBackup, tournamentsCsv, expensesCsv, buildIcs } from './exporters'
import type { Tournament, Partner, Settings, Availability, CalendarEvent, OfficialRanking } from '../types'

const settings: Settings = { id: 'app', playerName: 'Alex', budgetMonthly: 15000, budgetYear: 0, onboardingDone: true, viewYear: 2026 }

const mkT = (over: Partial<Tournament>): Tournament => ({
  id: 't1',
  name: 'Test [DÉMO]',
  date: '2026-10-16',
  category: 'P25',
  gender: 'messieurs',
  club: '4PADEL Test',
  city: '',
  partnerId: 'p1',
  position: 'droite',
  status: 'joue',
  pairs: 28,
  place: 4,
  fftResult: { status: 'ok', points: 9, grilleLabel: 'test' },
  expenses: [{ id: 'e1', kind: 'inscription', mode: 'paye', amount: 3500, paidOn: '2026-10-17' }],
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  ...over,
})

const partner: Partner = { id: 'p1', name: 'Marc [DÉMO]', usualPosition: 'gauche', favorite: true, createdAt: '', updatedAt: '' }
const avail: Availability = { date: '2026-10-10', state: 'disponible' }
const evt: CalendarEvent = { id: 'e1', date: '2026-10-15', kind: 'entrainement', label: 'Entraînement [DÉMO]' }
const off: OfficialRanking = { id: 'o1', date: '2026-10-06', rank: 3250, points: 415, source: 'saisie_manuelle' }

describe('sauvegarde JSON', () => {
  it('round-trip export → validation → import', () => {
    const backup = buildBackup({ settings: settings as Settings, tournaments: [mkT({})], partners: [partner], availabilities: [avail], events: [evt], officialRankings: [off] })
    const json = JSON.stringify(backup)
    const v = validateBackup(JSON.parse(json))
    expect(v.ok).toBe(true)
    if (v.ok) {
      expect(v.data.tournaments).toHaveLength(1)
      expect(v.data.tournaments[0].name).toBe('Test [DÉMO]')
      expect(v.data.partners[0].name).toBe('Marc [DÉMO]')
    }
  })

  it('refuse un JSON qui n\u2019est pas une sauvegarde PadelTrack', () => {
    const v = validateBackup({ hello: 1 })
    expect(v.ok).toBe(false)
  })

  it('signale les dates invalides et ids absents', () => {
    const backup = buildBackup({ settings, tournaments: [mkT({ id: '', date: '10/16/2026' })], partners: [], availabilities: [], events: [], officialRankings: [] })
    const v = validateBackup(JSON.parse(JSON.stringify(backup)))
    expect(v.ok).toBe(false)
    if (!v.ok) {
      expect(v.errors.join(' ')).toMatch(/identifiant/)
      expect(v.errors.join(' ')).toMatch(/date/)
    }
  })
})

describe('CSV', () => {
  it('format tableur avec ; et points/paiements', () => {
    const csv = tournamentsCsv([mkT({})], { p1: 'Marc' })
    const rows = csv.split('\r\n')
    expect(rows[0]).toContain('inscription_prévu')
    expect(rows[1]).toContain('Marc')
    const rows2 = rows[1].split(';')
    expect(rows2[12]).toBe('9') // points

    const csvE = expensesCsv([mkT({})])
    expect(csvE.split('\r\n')[1]).toContain('35,00')
  })

  it('échappe les points-virgules dans les noms', () => {
    const csv = tournamentsCsv([mkT({ name: 'Tournoi; "spécial"' })], {})
    expect(csv).toContain('"Tournoi; ""spécial"""')
  })
})

describe('ICS', () => {
  it('génère un VCALENDAR avec VEVENT tournois + événements + disponibilités', () => {
    const ics = buildIcs([mkT({})], [evt], [avail])
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('UID:t-t1@padeltrack')
    expect(ics.match(/BEGIN:VEVENT/g)?.length).toBe(3)
    expect(ics).toContain('DTSTART:20261016T090000')
    expect(ics).toContain('SUMMARY:Entraînement [DÉMO]')
  })
})
