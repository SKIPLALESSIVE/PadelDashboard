import Dexie, { type Table } from 'dexie'
import type {
  Availability,
  CalendarEvent,
  OfficialRanking,
  Partner,
  Settings,
  Tournament,
} from '../types'

class PadelTrackDb extends Dexie {
  tournaments!: Table<Tournament, string>
  partners!: Table<Partner, string>
  availabilities!: Table<Availability, string>
  events!: Table<CalendarEvent, string>
  officialRankings!: Table<OfficialRanking, string>
  settings!: Table<Settings, string>

  constructor() {
    super('padeltrack')
    this.version(1).stores({
      tournaments: 'id, date, status, category, partnerId',
      partners: 'id, name',
      availabilities: 'date',
      events: 'id, date',
      officialRankings: 'id, date',
      settings: 'id',
    })
  }
}

export const db = new PadelTrackDb()

export const DEFAULT_SETTINGS: Settings = {
  id: 'app',
  playerName: '',
  budgetMonthly: 0,
  budgetYear: 0,
  onboardingDone: false,
  viewYear: new Date().getFullYear() >= 2026 && new Date().getFullYear() <= 2027 ? new Date().getFullYear() : 2026,
}

export function uid(): string {
  return crypto.randomUUID().slice(0, 8) + Date.now().toString(36)
}

export async function getSettings(): Promise<Settings> {
  const s = await db.settings.get('app')
  return s ?? { ...DEFAULT_SETTINGS }
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const cur = await getSettings()
  await db.settings.put({ ...cur, ...patch, id: 'app' })
}

export async function upsertTournament(t: Tournament): Promise<void> {
  await db.tournaments.put({ ...t, updatedAt: new Date().toISOString() })
}

export async function deleteTournament(id: string): Promise<void> {
  await db.tournaments.delete(id)
}

export async function upsertPartner(p: Partner): Promise<void> {
  await db.partners.put({ ...p, updatedAt: new Date().toISOString() })
}

export async function deletePartner(id: string): Promise<void> {
  await db.partners.delete(id)
}

export async function setAvailability(date: string, state: Availability['state'], note?: string): Promise<void> {
  if (state === '' && !note) await db.availabilities.delete(date)
  else await db.availabilities.put({ date, state, note })
}

/** Remplacement complet lors d'un import (aucun effacement silencieux : appelé après confirm). */
export async function replaceAll(data: {
  settings: Settings
  tournaments: Tournament[]
  partners: Partner[]
  availabilities: Availability[]
  events: CalendarEvent[]
  officialRankings: OfficialRanking[]
}): Promise<void> {
  const tables = [db.tournaments, db.partners, db.availabilities, db.events, db.officialRankings, db.settings]
  await db.transaction('rw', tables, async () => {
    await Promise.all([
      db.tournaments.clear(),
      db.partners.clear(),
      db.availabilities.clear(),
      db.events.clear(),
      db.officialRankings.clear(),
    ])
    await Promise.all([
      db.tournaments.bulkPut(data.tournaments),
      db.partners.bulkPut(data.partners),
      db.availabilities.bulkPut(data.availabilities),
      db.events.bulkPut(data.events),
      db.officialRankings.bulkPut(data.officialRankings),
      db.settings.put({ ...data.settings, id: 'app' }),
    ])
  })
}

/** Fusion d'import : remplace par id, ajoute le reste. */
export async function mergeAll(data: {
  settings: Settings
  tournaments: Tournament[]
  partners: Partner[]
  availabilities: Availability[]
  events: CalendarEvent[]
  officialRankings: OfficialRanking[]
}): Promise<void> {
  const tables = [db.tournaments, db.partners, db.availabilities, db.events, db.officialRankings, db.settings]
  await db.transaction('rw', tables, async () => {
    await Promise.all([
      db.tournaments.bulkPut(data.tournaments),
      db.partners.bulkPut(data.partners),
      db.availabilities.bulkPut(data.availabilities),
      db.events.bulkPut(data.events),
      db.officialRankings.bulkPut(data.officialRankings),
      db.settings.put({ ...data.settings, id: 'app' }),
    ])
  })
}
