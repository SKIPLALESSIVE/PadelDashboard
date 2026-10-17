import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { addMonths, format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { db, uid } from '../db/db'
import { Card, CardTitle, EmptyState, Modal, Stat } from '../components/ui'
import { fmtDate, fmtDateShort, toInputMoney } from '../lib/format'
import { rankingOn, nextExpiry, simulateTotal } from '../lib/fft/ranking'

import { computePoints } from '../lib/fft/points'
import { CATEGORIES, type TCategory, type TGender } from '../types'

/** 25 000 → « 25 000 » : séparateur français, jamais un « 25K » ambigu. */
const frNumberShort = (v: number): string => new Intl.NumberFormat('fr-FR').format(Math.round(v))

export default function RankingPage() {
  const tournaments = useLiveQuery(() => db.tournaments.toArray(), []) ?? []
  const official = useLiveQuery(() => db.officialRankings.orderBy('date').reverse().toArray(), []) ?? []
  const [simOpen, setSimOpen] = useState(false)

  // Simulation par défaut disponible dans le modal dédié (prévisionnel).
  const today = format(new Date(), 'yyyy-MM-dd')
  const snap = useMemo(() => rankingOn(tournaments, today), [tournaments, today])

  // courbe : total local calculé dans le temps (mensuel) vs rang officiel saisi.
  // Les entrées [DÉMO] sont exclues du graphe (jamais confondues avec vos vrais rangs).
  const chart = useMemo(() => {
    const months: { m: string; label: string; total: number; rank?: number }[] = []
    for (let i = 14; i >= 0; i--) {
      const dt = format(addMonths(new Date(), -i), 'yyyy-MM-dd')
      const s = rankingOn(tournaments, dt)
      const m = dt.slice(0, 7)
      const offAtMonth = official
        .filter((o) => !o.note?.includes('[DÉMO]'))
        .filter((o) => o.date.slice(0, 7) === m)
        .sort((a, b) => b.date.localeCompare(a.date))[0]
      months.push({ m, label: fmtDateShort(dt), total: s.total, rank: offAtMonth?.rank })
    }
    return months
  }, [tournaments, official])

  // Échelle de l'axe « rang » : calée sur les SEULS rangs saisis, jamais une échelle générique.
  const realRanks = chart.map((c) => c.rank).filter((r): r is number => r != null)
  const chartMinRank = realRanks.length ? Math.min(...realRanks) : 0
  const chartMaxRank = realRanks.length ? Math.max(...realRanks) : 1

  const latestOfficial = official[0]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat accent value={snap.total} label="points glissants calculés" sub="12 meilleurs résultats, 12 derniers mois" />
        <Stat
          value={latestOfficial ? `#${latestOfficial.rank}` : '—'}
          label="rang FFT officiel"
          sub={latestOfficial ? `${fmtDate(latestOfficial.date)} · saisi manuellement` : 'Renseigné dans l\u2019historique'}
        />
        <Stat value={`${snap.kept.length}/12`} label="top 12 rempli" sub={snap.dropped.length ? `${snap.dropped.length} résultat(s) hors top 12` : undefined} />
        <Stat
          value={snap.expiringSoon.length}
          label="résultats qui expirent <60 j"
          sub={snap.expiringSoon[0] ? `${snap.expiringSoon[0].name} : ${fmtDate(nextExpiry({ date: snap.expiringSoon[0].date } as never))}` : undefined}
          accent={snap.expiringSoon.length > 0}
        />
      </div>

      <Card>
        <CardTitle
          right={
            <button className="btn-ghost !py-2 text-xs" onClick={() => setSimOpen(true)}>
              Simuler « si je finis Nᵉ… »
            </button>
          }
        >
          Meilleurs 12 résultats (prévisionnel : simulations)
        </CardTitle>
        {snap.kept.length === 0 ? (
          <EmptyState icon="📈">Marquez un tournoi « joué » avec catégorie, paires et place : les points FFT s'affichent et alimentent ce top 12.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-1.5 pr-2">Date</th>
                  <th className="pr-2">Tournoi</th>
                  <th className="pr-2">Epreuve</th>
                  <th className="pr-2">Origine</th>
                  <th className="pr-2">Expire le</th>
                  <th className="text-right">Points</th>
                </tr>
              </thead>
              <tbody>
                {snap.kept.map((k, i) => (
                  <tr key={k.tournamentId} className="border-t border-line/60">
                    <td className="py-1.5 pr-2 text-slate-400">{fmtDateShort(k.date)}</td>
                    <td className="pr-2 font-medium">
                      <span className="mr-1.5 text-slate-500">{i + 1}.</span>
                      {k.name}
                    </td>
                    <td className="pr-2 text-xs text-slate-400">{k.grilleLabel?.split(' · ').slice(0, 1)}</td>
                    <td className="pr-2 text-xs">
                      {k.origin === 'manuel' ? <span className="chip bg-amber-400/15 text-amber-300">override</span> : <span className="chip bg-slate-700/60 text-slate-300">calculé</span>}
                    </td>
                    <td className="pr-2 text-xs text-slate-500">{fmtDateShort(nextExpiry({ date: k.date } as never))}</td>
                    <td className="text-right font-bold text-lime-300">{k.points}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-line">
                  <td className="pt-2 font-bold" colSpan={5}>
                    Total retenu
                  </td>
                  <td className="pt-2 text-right text-lg font-extrabold text-lime-300">{snap.total}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        {snap.dropped.length > 0 && (
          <p className="mt-3 text-xs text-slate-500">
            Hors top 12 (comptabilisés si un résultat sort) : {snap.dropped.map((d) => `${d.name} (${d.points})`).join(', ')}.
          </p>
        )}
      </Card>

      {/* Écarts entre classement officiel saisi et somme locale */}
      {latestOfficial && (
        <Card className="border-amber-400/30">
          <CardTitle>Classement officiel — écarts expliqués</CardTitle>
          <p className="text-sm text-slate-300">
            Rang saisi : <b>#{latestOfficial.rank}</b> pour <b>{latestOfficial.points}</b> pts ({fmtDate(latestOfficial.date)}).
          </p>
          {snap.total !== latestOfficial.points && (
            <p className="mt-2 rounded-xl bg-amber-400/10 px-3 py-2 text-xs text-amber-300">
              Écart local vs officiel : {snap.total - latestOfficial.points > 0 ? '+' : ''}
              {snap.total - latestOfficial.points} pts. Causes fréquentes : résultats d'autres tournois non saisis ici,
              épreuves par équipes, assimilation de classement, dates limites FFT spécifiques.
            </p>
          )}
          {latestOfficial.note && <p className="mt-1 text-xs text-slate-500">{latestOfficial.note}</p>}
        </Card>
      )}

      <Card>
        <CardTitle>Évolution (local calculé vs rang officiel saisi)</CardTitle>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#23304a" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: '#8ea0bd', fontSize: 11 }} />
              <YAxis yAxisId="pts" tick={{ fill: '#a3e635', fontSize: 11 }} />
              <YAxis
                yAxisId="rk"
                orientation="right"
                reversed
                // Échelle réellement calée sur les rangs saisis (pas une échelle générique 0..25k)
                domain={[
                  (dataMin: number) => dataMin - 0.08 * (chartMaxRank - chartMinRank || 1),
                  (dataMax: number) => dataMax + 0.08 * (chartMaxRank - chartMinRank || 1),
                ]}
                tickFormatter={frNumberShort}
                tick={{ fill: '#8ea0bd', fontSize: 11 }}
                label={{ value: 'rang saisi', angle: -90, position: 'insideRight', fill: '#8ea0bd', fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{ background: '#101828', border: '1px solid #23304a', borderRadius: 8, color: '#e6ecf5' }}
                formatter={(v: number | string, name) =>
                  name === 'total' ? [`${v} pts`, 'Somme locale'] : [`#${new Intl.NumberFormat('fr-FR').format(Number(v))}`, 'Rang officiel saisi']
                }
              />
              <Line yAxisId="pts" type="monotone" dataKey="total" stroke="#a3e635" strokeWidth={2} dot={false} />
              <Line yAxisId="rk" type="monotone" dataKey="rank" stroke="#60a5fa" strokeWidth={2} dot connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Une baisse du rang (numérique) est une amélioration. La ligne verte = somme locale des 12 meilleurs ; la bleue =
          rang officiel <b>saisi par vous</b> (Ten'Up). L'app ne prétend jamais déduire le rang officiel à elle seule.
        </p>
        {/* Récap explicite des rangs tracés : impossible de confondre une échelle avec sa valeur */}
        {realRanks.length > 0 && (
          <p className="mt-1 text-xs text-slate-400">
            Rangs saisis tracés sur l'axe droit :{' '}
            {official
              .filter((o) => !o.note?.includes('[DÉMO]'))
              .filter((o) => chart.some((c) => c.rank === o.rank))
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((o) => `#${frNumberShort(o.rank)} (${fmtDate(o.date)})`)
              .join(' · ')}
          </p>
        )}
        {official.some((o) => o.note?.includes('[DÉMO]')) && (
          <p className="mt-1 text-xs text-amber-300">
            ⚠ Des entrées [DÉMO] existent dans l'historique : elles sont exclues de ce graphe (effaçables dans
            Paramètres → données de démonstration).
          </p>
        )}
      </Card>

      <OfficialRankingModalOpener />

      {simOpen && <SimulationModal onClose={() => setSimOpen(false)} tournaments={tournaments} />}
    </div>
  )
}

/** Historique officiel : liste + ajout. (Saisie manuelle, jamais « synchronisé » prétendu.) */
function OfficialRankingModalOpener() {
  const official = useLiveQuery(() => db.officialRankings.orderBy('date').reverse().toArray(), []) ?? []
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [rank, setRank] = useState('')
  const [points, setPoints] = useState('')
  const [note, setNote] = useState('')

  const add = async () => {
    await db.officialRankings.put({
      id: uid(),
      date,
      rank: Math.round(Number(rank)),
      points: Math.round(Number(points)),
      source: 'saisie_manuelle',
      note: note.trim() || undefined,
    })
    setOpen(false)
    setRank('')
    setPoints('')
    setNote('')
  }

  return (
    <Card>
      <CardTitle
        right={
          <button className="btn-ghost !py-2 text-xs" onClick={() => setOpen(true)}>
            + Saisir mon rang officiel
          </button>
        }
      >
        Historique du classement officiel (saisi manuellement)
      </CardTitle>
      {official.length === 0 ? (
        <EmptyState icon="🏅">
          Saisissez votre rang Ten'Up chaque mois : l'app compare avec sa somme locale calculée et vous signale les écarts.
        </EmptyState>
      ) : (
        <div className="space-y-1">
          {official.map((o) => (
            <div key={o.id} className="flex items-center justify-between rounded-xl bg-slate-900/50 px-3 py-2 text-sm">
              <span>
                <b className="text-lime-300">#{o.rank}</b> · {o.points} pts
              </span>
              <span className="text-xs text-slate-400">
                {fmtDate(o.date)} · saisie manuelle {o.note ? `· ${o.note}` : ''}
              </span>
            </div>
          ))}
        </div>
      )}

      {open && (
        <Modal open onClose={() => setOpen(false)} title="Rang officiel du mois">
          <div className="space-y-3">
            <label className="block">
              <span className="label">Mois concerné (ex. 1er mardi)</span>
              <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="label">Rang</span>
                <input type="number" min={1} className="field" value={rank} onChange={(e) => setRank(e.target.value)} />
              </label>
              <label className="block">
                <span className="label">Points du classement</span>
                <input type="number" min={0} className="field" value={points} onChange={(e) => setPoints(e.target.value)} />
              </label>
            </div>
            <label className="block">
              <span className="label">Note (provenance, remarques)</span>
              <input className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="ex. source Ten'Up" />
            </label>
            <button className="btn-primary w-full" onClick={add} disabled={!rank || !points}>
              Enregistrer
            </button>
          </div>
        </Modal>
      )}
    </Card>
  )
}

/** Simulation clairement marquée prévisionnelle. */
function SimulationModal({ onClose, tournaments }: { onClose: () => void; tournaments: Parameters<typeof rankingOn>[0] }) {
  const [cat, setCat] = useState<TCategory>('P100')
  const [gender, setGender] = useState<TGender>('messieurs')
  const [pairs, setPairs] = useState('32')
  const [place, setPlace] = useState('2')
  const today = format(new Date(), 'yyyy-MM-dd')

  const sc = computePoints({ date: today, category: cat, gender, pairs: pairs ? Number(pairs) : null, place: place ? Number(place) : 0 })
  const sim = simulateTotal(tournaments, today, { date: today, category: cat, gender, pairs: pairs ? Number(pairs) : null, place: Number(place) || 0 })

  return (
    <Modal open onClose={onClose} title="Simulation (prévisionnel)" wide>
      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-2">
          <label className="block">
            <span className="label">Catégorie</span>
            <select className="field" value={cat} onChange={(e) => setCat(e.target.value as TCategory)}>
              {(Object.keys(CATEGORIES) as TCategory[]).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Épreuve</span>
            <select className="field" value={gender} onChange={(e) => setGender(e.target.value as TGender)}>
              <option value="messieurs">Messieurs</option>
              <option value="dames">Dames</option>
              <option value="mixte">Mixte</option>
            </select>
          </label>
          <label className="block">
            <span className="label">Paires</span>
            <input type="number" className="field" value={pairs} onChange={(e) => setPairs(e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Place</span>
            <input type="number" className="field" value={place} onChange={(e) => setPlace(e.target.value)} />
          </label>
        </div>
        {sc.status === 'ok' ? (
          <div className="rounded-2xl border border-lime-400/30 bg-lime-400/5 p-4">
            <div className="text-sm text-slate-300">Si ce résultat était acquis :</div>
            <div className="mt-1 text-2xl font-extrabold text-lime-300">
              total : {sim.newTotal} pts{' '}
              {sim.newTotal > sim.currentTotal && <span className="text-sm font-semibold text-emerald-300">(+{sim.newTotal - sim.currentTotal})</span>}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {sc.grilleLabel} · remplace : {sim.replaces.length ? sim.replaces.map((r) => r.name).join(', ') : 'aucun résultat (entrait dans le top 12)'}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm text-amber-300">
            Calcul impossible : {sc.reason}
          </div>
        )}
        <p className="text-xs text-slate-500">Prévisionnel — distinct des résultats acquis. Basé sur le barème {sc.status === 'ok' ? sc.season : 'non applicable'}.</p>
        <button className="btn-ghost w-full" onClick={onClose}>
          Fermer
        </button>
      </div>
    </Modal>
  )
}

export { fmtDate, toInputMoney }
