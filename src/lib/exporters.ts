/** Exports : JSON complet, CSV au format tableur, ICS (Europe/Paris). */
import type { Availability, CalendarEvent, OfficialRanking, Partner, Settings, Tournament, Expense } from '../types'
import { EXPENSE_KINDS, POSITION_LABELS, STATUS_LABELS } from '../types'

export interface BackupShape {
  format: 'padeltrack-backup'
  version: 1
  exportedAt: string
  settings: Settings
  tournaments: Tournament[]
  partners: Partner[]
  availabilities: Availability[]
  events: CalendarEvent[]
  officialRankings: OfficialRanking[]
}

export function buildBackup(data: Omit<BackupShape, 'format' | 'version' | 'exportedAt'>): BackupShape {
  return { format: 'padeltrack-backup', version: 1, exportedAt: new Date().toISOString(), ...data }
}

/** Validation d'import avec diagnostic lisible. */
export function validateBackup(raw: unknown): { ok: true; data: BackupShape } | { ok: false; errors: string[] } {
  const errors: string[] = []
  if (!raw || typeof raw !== 'object') errors.push('Fichier illisible (JSON attendu)')
  const o = raw as Record<string, unknown>
  if (o.format !== 'padeltrack-backup') errors.push("Ce n'est pas une sauvegarde PadelTrack (champ format manquant)")
  if (typeof o.version !== 'number' || o.version > 1) errors.push('Version de format inconnue')
  const data = raw as BackupShape
  ;(data.tournaments || []).forEach((t, i) => {
    if (!t.id) errors.push(`Tournoi #${i + 1} sans identifiant`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(t.date ?? '')) errors.push(`Tournoi #${i + 1} : date invalide`)
  })
  return errors.length ? { ok: false, errors } : { ok: true, data }
}

export function download(filename: string, content: string, mime = 'application/json'): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/* ---------------- CSV ---------------- */

function csvEsc(v: string | number | undefined | null): string {
  const s = v == null ? '' : String(v)
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function tournamentsCsv(ts: Tournament[], partnersById: Record<string, string>): string {
  const head = [
    'date', 'fin', 'nom', 'catégorie', 'épreuve', 'club', 'ville', 'statut', 'partenaire', 'position',
    'paires', 'place', 'points', 'barème', 'matchs', 'victoires', 'défaites',
    'inscription_prévu', 'inscription_payé', 'dépenses_payé_total',
  ]
  const rows = ts
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => {
      const ins = (kind: string, mode: string) =>
        t.expenses.filter((e: Expense) => e.kind === kind && e.mode === mode).reduce((s, e) => s + e.amount, 0) / 100
      const payeTotal = t.expenses.filter((e) => e.mode === 'paye').reduce((s, e) => s + e.amount, 0) / 100
      return [
        t.date, t.endDate ?? '', t.name, t.category, t.gender, t.club, t.city, STATUS_LABELS[t.status],
        t.partnerId ? partnersById[t.partnerId] ?? '' : '', POSITION_LABELS[t.position],
        t.pairs ?? '', t.place ?? '', t.fftResult?.status === 'ok' || t.fftResult?.status === 'override' ? t.fftResult.points ?? '' : '',
        t.fftResult?.status === 'override' ? 'override' : t.fftResult?.status === 'ok' ? 'calculé' : '',
        t.matchesPlayed ?? '', t.wins ?? '', t.losses ?? '',
        ins('inscription', 'prevu'), ins('inscription', 'paye'), payeTotal,
      ].map(csvEsc)
    })
  return [head.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')
}

export function expensesCsv(ts: Tournament[]): string {
  const head = ['date', 'tournoi', 'type', 'mode', 'montant_eur', 'payé_le', 'statut_tournoi']
  const rows: string[][] = []
  for (const t of ts) {
    for (const e of t.expenses) {
      const kind = EXPENSE_KINDS.find((k) => k.id === e.kind)?.label ?? e.kind
      rows.push([t.date, t.name, kind, e.mode === 'paye' ? 'payé' : 'prévu', (e.amount / 100).toFixed(2), e.paidOn ?? '', STATUS_LABELS[t.status]].map(csvEsc))
    }
  }
  return [head.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')
}

/* ---------------- ICS ---------------- */

function icsDate(iso: string, time?: string): string {
  return `${iso.replace(/-/g, '')}${time ? `T${time.replace(':', '')}00` : 'T090000'}`
}

export function buildIcs(ts: Tournament[], events: CalendarEvent[], avail: Availability[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PadelTrack//FR',
    'CALSCALE:GREGORIAN',
  ]
  const stamp = `${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`
  ts.forEach((t) => {
    lines.push(
      'BEGIN:VEVENT',
      `UID:t-${t.id}@padeltrack`,
      `DTSTAMP:${stamp}`,
      `SUMMARY:${t.name || `Tournoi ${t.category || ''}`} (${t.category || 'cat?'} · ${STATUS_LABELS[t.status]})`,
    )
    const dt = icsDate(t.date, t.time)
    const end = icsDate(t.endDate ?? t.date, '18:00')
    lines.push(`DTSTART:${dt}`, `DTEND:${end}`)
    if (t.club || t.city) lines.push(`LOCATION:${[t.club, t.city].filter(Boolean).join(', ')}`)
    if (t.note) lines.push(`DESCRIPTION:${t.note.replace(/\n/g, '\\n')}`)
    lines.push('END:VEVENT')
  })
  events.forEach((e) => {
    lines.push(
      'BEGIN:VEVENT',
      `UID:e-${e.id}@padeltrack`,
      `DTSTAMP:${stamp}`,
      `SUMMARY:${e.label}`,
      `DTSTART:${icsDate(e.date, e.time)}`,
      `DTEND:${icsDate(e.date, e.time ?? '10:00')}`,
      e.note ? `DESCRIPTION:${e.note.replace(/\n/g, '\\n')}` : '',
      'END:VEVENT',
    )
  })
  avail.forEach((a, i) => {
    lines.push(
      'BEGIN:VEVENT',
      `UID:a-${i}-${a.date}@padeltrack`,
      `DTSTAMP:${stamp}`,
      `SUMMARY:${a.state === 'disponible' ? 'Disponible (padel)' : a.state === 'indisponible' ? 'Indisponible' : 'À confirmer'}`,
      `DTSTART:${icsDate(a.date)}`,
      `DTEND:${icsDate(a.date, '23:59')}`,
      a.note ? `DESCRIPTION:${a.note.replace(/\n/g, '\\n')}` : '',
      'END:VEVENT',
    )
    void i
  })
  sanityCheck(lines)
  return lines.filter(Boolean).join('\r\n') + '\r\n'
}

function sanityCheck(lines: string[]): void {
  if (!lines.every((l) => l.length < 1000)) throw new Error('Ligne ICS trop longue')
}
