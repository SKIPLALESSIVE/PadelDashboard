import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { addMonths, format, getISOWeek, isSameMonth, isToday, setDate, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { db, setAvailability, uid } from '../db/db'
import { Card, Modal, StatusBadge } from '../components/ui'
import { EVENT_KINDS, type AvailabilityState, type CalendarEvent, type NonTournamentKind, type Tournament } from '../types'

const AVA_LABELS: Record<Exclude<AvailabilityState, ''>, { label: string; dot: string; ring: string }> = {
  disponible: { label: 'Disponible', dot: 'bg-lime-400', ring: 'ring-lime-400/60' },
  indisponible: { label: 'Indisponible', dot: 'bg-rose-500', ring: 'ring-rose-500/60' },
  a_confirmer: { label: 'À confirmer', dot: 'bg-amber-400', ring: 'ring-amber-400/60' },
}

export default function CalendarPage({ onOpenCreate, onGoTournaments }: { onOpenCreate: (date: string) => void; onGoTournaments: () => void }) {
  const now = new Date()
  const [y, setY] = useState(() => (now.getFullYear() < 2026 || now.getFullYear() > 2027 ? 2026 : now.getFullYear()))
  const [m, setM] = useState(() => Math.max(0, Math.min(11, now.getMonth())))

  // navigation mensuelle bornée à 2026-01 .. 2037-12 mais ouverte au-delà
  const cur = new Date(y, m, 1)
  const prev = () => {
    const d = addMonths(cur, -1)
    setY(d.getFullYear())
    setM(d.getMonth())
  }
  const next = () => {
    const d = addMonths(cur, 1)
    setY(d.getFullYear())
    setM(d.getMonth())
  }
  const today = () => {
    setY(now.getFullYear())
    setM(now.getMonth())
  }

  const tournaments = useLiveQuery(async () => {
    const all = await db.tournaments.toArray()
    return all.filter((t) => isSameMonth(parseISO(t.date), cur))
  }, [y, m]) as Tournament[] | undefined

  const availabilities = useLiveQuery(async () => {
    const from = format(setDate(cur, 1), 'yyyy-MM-dd')
    const all = await db.availabilities.toArray()
    return all.filter((a) => a.date.slice(0, 7) === from.slice(0, 7))
  }, [y, m])

  const events = useLiveQuery(async () => {
    const all = await db.events.toArray()
    return all.filter((e) => e.date.slice(0, 7) === cur.toISOString().slice(0, 7))
  }, [y, m])

  const [dayModal, setDayModal] = useState<string | null>(null)

  // Grille du mois (lundi → dimanche)
  const grid = useMemo(() => {
    const first = setDate(cur, 1)
    const offset = (getISOWeek(first) + 6) % 7 === getISODow(first) ? getISODow(first) - 1 : getISODow(first) - 1
    const start = new Date(first)
    start.setDate(first.getDate() - ((first.getDay() + 6) % 7))
    void offset
    const weeks: (string | null)[][] = []
    const d = new Date(start)
    for (let w = 0; w < 6; w++) {
      const row: (string | null)[] = []
      for (let i = 0; i < 7; i++) {
        row.push(isSameMonth(d, cur) ? format(d, 'yyyy-MM-dd') : null)
        d.setDate(d.getDate() + 1)
      }
      weeks.push(row)
      if (!isSameMonth(d, cur) && new Date(d).getMonth() !== cur.getMonth()) break
    }
    return weeks
  }, [y, m])

  const conflicts = useMemo(() => {
    const list = tournaments ?? []
    const map = new Map<string, number>()
    list.forEach((t) => {
      const k = t.date
      map.set(k, (map.get(k) ?? 0) + 1)
    })
    return map
  }, [tournaments])

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button className="btn-ghost !px-3" onClick={prev} aria-label="Mois précédent">
              ‹
            </button>
            <h1 className="min-w-40 text-center text-lg font-bold">
              {format(cur, 'MMMM yyyy', { locale: fr })}
            </h1>
            <button className="btn-ghost !px-3" onClick={next} aria-label="Mois suivant">
              ›
            </button>
          </div>
          <div className="flex gap-2">
            {([2026, 2027] as const).map((year) => (
              <button
                key={year}
                className={`chip cursor-pointer ${y === year ? 'bg-lime-400/20 text-lime-300' : 'bg-slate-700/50 text-slate-300'}`}
                onClick={() => setY(year)}
              >
                {year}
              </button>
            ))}
            <button className="btn-ghost !px-3 text-xs" onClick={today}>
              Aujourd'hui
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'].map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.flat().map((iso, i) => {
            if (!iso) return <div key={`x${i}`} className="min-h-16 rounded-lg bg-slate-900/30 md:min-h-20" />
            const dd = Number(iso.slice(8))
            const dayTs = (tournaments ?? []).filter((t) => t.date === iso)
            const evs = (events ?? []).filter((e) => e.date === iso)
            const av = (availabilities ?? []).find((a) => a.date === iso)
            const conf = (conflicts.get(iso) ?? 0) > 1
            return (
              <button
                key={iso}
                onClick={() => setDayModal(iso)}
                className={`group relative flex min-h-16 cursor-pointer flex-col items-start gap-0.5 rounded-lg border p-1 text-left transition-colors md:min-h-20 ${
                  isToday(parseISO(iso)) ? 'border-lime-400/70 bg-lime-400/5' : 'border-line bg-slate-900/40 hover:bg-slate-800/60'
                } ${av ? AVA_LABELS[av.state as Exclude<AvailabilityState, ''>].ring : ''} ${av ? `ring-1 ring-inset ${AVA_LABELS[av.state as Exclude<AvailabilityState, ''>].ring}` : ''}`}
              >
                <span className="text-[11px] font-bold text-slate-300">{dd}</span>
                <span className="absolute right-1 top-1 flex gap-0.5">
                  {evs.map((e) => (
                    <span key={e.id} className="text-[10px]" aria-hidden>
                      {EVENT_KINDS.find((k) => k.id === e.kind)?.emoji}
                    </span>
                  ))}
                  {av && <span className={`h-1.5 w-1.5 rounded-full ${AVA_LABELS[av.state as Exclude<AvailabilityState, ''>].dot}`} aria-label={AVA_LABELS[av.state as Exclude<AvailabilityState, ''>].label} />}
                </span>
                <span className="mt-auto flex w-full flex-wrap gap-0.5">
                  {dayTs.slice(0, 2).map((t) => (
                    <span key={t.id} className={`truncate rounded px-1 text-[9px] font-semibold ${t.status === 'joue' ? 'bg-emerald-500/25 text-emerald-200' : t.status === 'annule' ? 'bg-rose-500/25 text-rose-200 line-through' : 'bg-violet-500/25 text-violet-200'}`}>
                      {t.category || t.name.slice(0, 6)}
                    </span>
                  ))}
                  {dayTs.length > 2 && <span className="text-[9px] text-slate-400">+{dayTs.length - 2}</span>}
                  {conf && <span className="text-[9px] text-amber-400">⚠ conflit</span>}
                </span>
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-[11px] text-slate-500">
          Astuce : un clic sur un jour ouvre un menu rapide (disponibilité, tournoi, événement). Les jours indisponibles
          avec un tournoi sont signalés ⚠.
        </p>
      </Card>

      {dayModal && (
        <DayModal
          iso={dayModal}
          onClose={() => setDayModal(null)}
          onOpenCreate={onOpenCreate}
          dayTournaments={(tournaments ?? []).filter((t) => t.date === dayModal)}
          onGoTournaments={onGoTournaments}
        />
      )}
    </div>
  )
}

function getISODow(d: Date): number {
  const dow = d.getDay()
  return dow === 0 ? 7 : dow
}

function DayModal({
  iso,
  onClose,
  onOpenCreate,
  dayTournaments,
  onGoTournaments,
}: {
  iso: string
  onClose: () => void
  onOpenCreate: (iso: string) => void
  dayTournaments: Tournament[]
  onGoTournaments: () => void
}) {
  const [av, setAv] = useLiveAvail(iso)
  const [events, setEvents] = useLiveEvents(iso)
  const [eventForm, setEventForm] = useState(false)
  const [label, setLabel] = useState('')
  const [kind, setKind] = useState<NonTournamentKind>('entrainement')

  const conflict = dayTournaments.length > 0 && av?.state === 'indisponible'

  return (
    <Modal open onClose={onClose} title={format(parseISO(iso), 'EEEE d MMMM', { locale: fr })}>
      <div className="space-y-4">
        {/* Disponibilité en 1 clic */}
        <div>
          <span className="label">Disponibilité</span>
          <div className="grid grid-cols-3 gap-2">
            {(['disponible', 'a_confirmer', 'indisponible'] as const).map((s) => (
              <button
                key={s}
                onClick={async () => {
                  const next = av?.state === s ? '' : s
                  await setAvailability(iso, next)
                  setAv(next)
                }}
                className={`chip justify-center rounded-xl py-2 cursor-pointer ${
                  (av?.state ?? '') === s ? AVA_LABELS[s].dot.replace('bg-', 'bg-') + ' ' : 'bg-slate-800/70 text-slate-300'
                } ${(av?.state ?? '') === s ? 'ring-2 ring-inset ' + AVA_LABELS[s].ring : ''}`}
              >
                <span className={`h-2 w-2 rounded-full ${AVA_LABELS[s].dot} ${(av?.state ?? '') === s ? '' : 'opacity-50'}`} />
                {AVA_LABELS[s].label}
              </button>
            ))}
          </div>
          {conflict && (
            <p className="mt-2 rounded-xl bg-amber-400/10 px-3 py-2 text-xs text-amber-300">
              ⚠ Conflit : jour marqué indisponible avec {dayTournaments.length} tournoi(s) planifié(s).
            </p>
          )}
        </div>

        {/* Tournois du jour */}
        <div>
          <span className="label">Tournois</span>
          {dayTournaments.length === 0 ? (
            <button className="btn-primary w-full" onClick={() => onOpenCreate(iso)}>
              + Ajouter un tournoi ce jour
            </button>
          ) : (
            <div className="space-y-2">
              {dayTournaments.map((t) => (
                <button key={t.id} className="card flex w-full cursor-pointer items-center justify-between p-3 text-left hover:bg-slate-800/60" onClick={onGoTournaments}>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{t.name}</span>
                    <span className="text-xs text-slate-400">{t.club || '—'}{t.partnerId ? ` · ${t.partnerId}` : ''}</span>
                  </span>
                  <StatusBadge status={t.status} />
                </button>
              ))}
              <button className="btn-ghost w-full" onClick={() => onOpenCreate(iso)}>
                + Autre tournoi ce jour
              </button>
            </div>
          )}
        </div>

        {/* Événements non tournoi */}
        <div>
          <span className="label">Événements (entraînement, stage…)</span>
          {(events ?? []).map((e) => (
            <div key={e.id} className="mb-1.5 flex items-center justify-between rounded-xl bg-slate-900/60 px-3 py-2 text-sm">
              <span>
                {EVENT_KINDS.find((k) => k.id === e.kind)?.emoji} {e.label}
              </span>
              <button
                className="text-xs text-rose-300"
                onClick={async () => {
                  await db.events.delete(e.id)
                  setEvents((cur) => (cur ?? []).filter((x) => x.id !== e.id))
                }}
              >
                ✕
              </button>
            </div>
          ))}
          {!eventForm ? (
            <button className="btn-ghost w-full" onClick={() => setEventForm(true)}>
              + Événement
            </button>
          ) : (
            <div className="mt-2 space-y-2 rounded-xl border border-line p-3">
              <select className="field" value={kind} onChange={(e) => setKind(e.target.value as NonTournamentKind)}>
                {EVENT_KINDS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.emoji} {k.label}
                  </option>
                ))}
              </select>
              <input className="field" placeholder="Libellé (ex. entraînement groupe)" value={label} onChange={(e) => setLabel(e.target.value)} />
              <div className="flex gap-2">
                <button
                  className="btn-primary flex-1"
                  onClick={async () => {
                    const ev: CalendarEvent = { id: uid(), date: iso, kind, label: label.trim() || EVENT_KINDS.find((k) => k.id === kind)!.label }
                    await db.events.put(ev)
                    setEventForm(false)
                    setLabel('')
                  }}
                >
                  Ajouter
                </button>
                <button className="btn-ghost" onClick={() => setEventForm(false)}>
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
        <button className="btn-ghost w-full" onClick={onClose}>
          Fermer
        </button>
      </div>
    </Modal>
  )
}

function useLiveAvail(iso: string) {
  const av = useLiveQuery(() => db.availabilities.get(iso), [iso])
  const setAv = (state: AvailabilityState) => {
    void import('../db/db').then(({ setAvailability }) => setAvailability(iso, state))
  }
  return [av, setAv] as const
}

function useLiveEvents(iso: string) {
  const events = useLiveQuery(() => db.events.where('date').equals(iso).toArray(), [iso])
  const setEvents = (_fn: (cur: CalendarEvent[] | undefined) => CalendarEvent[] | undefined) => {
    /* no-op : useLiveQuery rafraîchit tout seul après mutation Dexie */
  }
  return [events, setEvents] as const
}

