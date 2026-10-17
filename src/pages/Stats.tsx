import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { addMonths, format } from 'date-fns'
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { db } from '../db/db'
import { Card, CardTitle, EmptyState, Stat } from '../components/ui'
import { computePoints } from '../lib/fft/points'
import { tournamentMoney } from '../lib/finance'
import { CATEGORIES, type TCategory, type Tournament } from '../types'

type Period = 'all' | 'm3' | 'm6' | 'm12' | 'y2026' | 'y2027'

const PERIODS: { id: Period; label: string }[] = [
  { id: 'all', label: 'Tout l\u2019historique' },
  { id: 'm3', label: '3 derniers mois' },
  { id: 'm6', label: '6 derniers mois' },
  { id: 'm12', label: '12 derniers mois' },
  { id: 'y2026', label: '2026' },
  { id: 'y2027', label: '2027' },
]

export default function Stats() {
  const tournaments = useLiveQuery(() => db.tournaments.toArray(), []) ?? []
  const [period, setPeriod] = useState<Period>('m12')
  const [cat, setCat] = useState<'tous' | TCategory>('tous')
  const [gender, setGender] = useState<'tous' | 'messieurs' | 'dames' | 'mixte'>('tous')
  const [side, setSide] = useState<'tous' | 'droite' | 'gauche'>('tous')

  const now = format(new Date(), 'yyyy-MM-dd')
  const filtered = useMemo(() => {
    const min =
      period === 'all'
        ? '0000-00'
        : period === 'y2026'
          ? '2026-01'
          : period === 'y2027'
            ? '2027-01'
            : format(addMonths(new Date(), period === 'm3' ? -3 : period === 'm6' ? -6 : -12), 'yyyy-MM-dd')
    const max = period === 'y2026' ? '2026-12' : period === 'y2027' ? '2027-12' : '9999-99'
    return tournaments.filter(
      (t) =>
        t.date.slice(0, 7) >= min &&
        t.date.slice(0, 7) <= max &&
        (cat === 'tous' || t.category === cat) &&
        (gender === 'tous' || t.gender === gender) &&
        (side === 'tous' || t.position === side),
    )
  }, [tournaments, period, cat, gender, side])

  const played = filtered.filter((t) => t.status === 'joue')
  const withPlace = played.filter((t) => t.place != null)
  const relPlaces = withPlace.map((t) => (t.pairs ? t.place! / t.pairs : null)).filter((x): x is number => x != null)
  const matches = played.reduce((s, t) => s + (t.matchesPlayed ?? 0), 0)
  const wins = played.reduce((s, t) => s + (t.wins ?? 0), 0)
  const moneyPaye = played.reduce((s, t) => s + tournamentMoney(t).paye, 0)
  const moneyPrevu = filtered.reduce(
    (s, t) => s + (t.status !== 'annule' ? tournamentMoney(t).prevu : 0),
    0,
  )

  const catData = useMemo(() => {
    const counts = new Map<string, number>()
    filtered.forEach((t) => {
      if (!t.category) return
      counts.set(t.category, (counts.get(t.category) ?? 0) + 1)
    })
    return [...counts.entries()].sort((a, b) => (CATEGORIES[a[0] as TCategory] ? Object.keys(CATEGORIES).indexOf(a[0]) : 99) - (CATEGORIES[b[0] as TCategory] ? Object.keys(CATEGORIES).indexOf(b[0]) : 99)).map(([k, v]) => ({ name: k, value: v }))
  }, [filtered])

  const sideData = useMemo(() => {
    const mk = (sideKey: 'droite' | 'gauche') => {
      const list = played.filter((t) => t.position === sideKey)
      const pl = list.filter((t) => t.place != null && t.pairs)
      return {
        name: sideKey === 'droite' ? 'Droite' : 'Gauche',
        count: list.length,
        relAvg: pl.length ? pl.reduce((s, t) => s + t.place! / t.pairs!, 0) / pl.length : null,
        ptsAvg: pl.length
          ? pl.reduce((s, t) => s + pointsOf(t), 0) / pl.length
          : null,
      }
    }
    return [mk('droite'), mk('gauche')]
  }, [played])

  const plannedByStatus = useMemo(() => {
    const counts = new Map<string, number>()
    filtered.filter((t) => t.status !== 'joue').forEach((t) => counts.set(t.status, (counts.get(t.status) ?? 0) + 1))
    return [...counts.entries()].map(([k, v]) => ({ name: k, label: humanStatus(k), value: v }))
  }, [filtered])

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Filtres (conservés pendant la session)</CardTitle>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button key={p.id} className={`chip cursor-pointer ${period === p.id ? 'bg-lime-400/20 text-lime-300' : 'bg-slate-700/50 text-slate-300'}`} onClick={() => setPeriod(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
          <select className="field" value={cat} onChange={(e) => setCat(e.target.value as 'tous' | TCategory)}>
            <option value="tous">Toutes catégories</option>
            {(Object.keys(CATEGORIES) as TCategory[]).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select className="field" value={gender} onChange={(e) => setGender(e.target.value as typeof gender)}>
            <option value="tous">Tous formats</option>
            <option value="messieurs">Messieurs</option>
            <option value="dames">Dames</option>
            <option value="mixte">Mixte</option>
          </select>
          <select className="field" value={side} onChange={(e) => setSide(e.target.value as typeof side)}>
            <option value="tous">Tous côtés</option>
            <option value="droite">Droite</option>
            <option value="gauche">Gauche</option>
          </select>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat value={filtered.length} label="tournois (filtre)" />
        <Stat value={played.length} label="tournois joués" sub={`${filtered.filter((t) => t.status === 'annule').length} annulé(s) exclu(s)`} />
        <Stat value={matches > 0 ? `${Math.round((wins / matches) * 100)} %` : '—'} label="taux de victoires (matchs)" sub={matches > 0 ? `${wins}/${matches}` : 'détails matchs non saisis'} />
        <Stat value={withPlace.length ? `${(relPlaces.reduce((s, x) => s + x, 0) * 100).toFixed(1)} %` : '—'} label="place moyenne (du tableau)" sub={`sur ${withPlace.length} obs.`} />
        <Stat value={moneyPaye > 0 ? `${fmtInt(moneyPaye)} €` : '—'} label="dépensé (payé)" />
        <Stat value={moneyPrevu > 0 ? `${fmtInt(moneyPrevu)} €` : '—'} label="prévu non payé" />
        <Stat value={sideData.find((s) => s.name === 'Droite')?.count ?? 0} label="à droite (obs.)" />
        <Stat value={sideData.find((s) => s.name === 'Gauche')?.count ?? 0} label="à gauche (obs.)" />
      </div>

      <Card>
        <CardTitle>Exclusions appliquées</CardTitle>
        <p className="text-xs text-slate-400">
          Tournois annulés, non joués et places inconnues exclus des moyennes réalisées. Chaque comparaison indique son
          nombre d'observations ; petits échantillons sous-représentatifs signalés.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle>Répartition par catégorie ({filtered.length} tournois)</CardTitle>
          {catData.length === 0 ? (
            <EmptyState icon="📊">Pas encore de données sur ce filtre.</EmptyState>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={catData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {catData.map((entry, i) => (
                      <Cell key={entry.name} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12, color: '#8ea0bd' }} />
                  <Tooltip contentStyle={{ background: '#101828', border: '1px solid #23304a', borderRadius: 8, color: '#e6ecf5' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <CardTitle>Par côté : place moy. du tableau et pts moy.</CardTitle>
          {sideData.every((s) => s.count === 0) ? (
            <EmptyState icon="↔️">Renseignez votre position (droite/gauche) dans les tournois.</EmptyState>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sideData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#23304a" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fill: '#8ea0bd', fontSize: 12 }} />
                  <YAxis yAxisId="pct" tick={{ fill: '#8ea0bd', fontSize: 11 }} />
                  <YAxis yAxisId="pts" orientation="right" tick={{ fill: '#a3e635', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#101828', border: '1px solid #23304a', borderRadius: 8, color: '#e6ecf5' }} />
                  <Bar yAxisId="pct" dataKey="relAvg" name="place moy (% du tableau)" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="pts" dataKey="ptsAvg" name="points FFT moy." fill="#a3e635" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="mt-1 text-[11px] text-slate-500">
                Droite : {sideData[0].count} obs. · Gauche : {sideData[1].count} obs.
              </p>
            </div>
          )}
        </Card>

        <Card>
          <CardTitle>Statuts en cours (non joués)</CardTitle>
          {plannedByStatus.length === 0 ? (
            <EmptyState icon="✅">Tout est soldé sur ce filtre.</EmptyState>
          ) : (
            <div className="space-y-1.5">
              {plannedByStatus.map((s) => (
                <div key={s.name} className="flex items-center justify-between rounded-xl bg-slate-900/50 px-3 py-2 text-sm">
                  <span>{s.label}</span>
                  <b>{s.value}</b>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardTitle>Prochains tournois (toutes périodes)</CardTitle>
          <div className="space-y-1.5">
            {(tournaments.filter((t) => !['joue', 'annule'].includes(t.status) && t.date >= now).sort((a, b) => a.date.localeCompare(b.date)) as Tournament[]).slice(0, 6).map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl bg-slate-900/50 px-3 py-2 text-sm">
                <span className="min-w-0 truncate">
                  {t.date} · {t.name}
                </span>
                <span className="text-xs text-lime-300">{t.category || '—'}</span>
              </div>
            ))}
            {tournaments.filter((t) => !['joue', 'annule'].includes(t.status) && t.date >= now).length === 0 && (
              <EmptyState icon="🗓">Aucun tournoi à venir planifié.</EmptyState>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

function pointsOf(t: Tournament): number {
  if ((t.fftResult?.status === 'ok' || t.fftResult?.status === 'override') && t.fftResult.points != null) return t.fftResult.points
  const r = computePoints({ date: t.date, category: (t.category || 'P25') as TCategory, gender: t.gender, pairs: t.pairs ?? null, place: t.place ?? null })
  return r.status === 'ok' ? r.points : 0
}

function humanStatus(k: string): string {
  const map: Record<string, string> = {
    envisage: 'Envisagé',
    a_confirmer: 'À confirmer',
    liste_attente: 'Liste d\u2019attente',
    inscrit: 'Inscrit',
    annule: 'Annulé',
  }
  return map[k] ?? k
}

const CAT_COLORS = ['#a3e635', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#fbbf24', '#fb923c', '#94a3b8', '#22d3ee']

function fmtInt(cents: number): number {
  return Math.round(cents / 100)
}
