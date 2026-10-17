import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { addMonths, format } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { db, getSettings, saveSettings, upsertTournament } from '../db/db'
import { Card, CardTitle, EmptyState, Stat, Modal } from '../components/ui'
import { fmtMoney, fmtDateShort, toInputMoney } from '../lib/format'
import { periodBudget, tournamentMoney } from '../lib/finance'
import type { Tournament } from '../types'

const MONTHS_FR = ['janv.', 'févr.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

export default function Finance() {
  const tournaments = useLiveQuery(() => db.tournaments.toArray(), []) ?? []
  const [year, setYear] = useState(2027 >= new Date().getFullYear() ? new Date().getFullYear() : 2027)
  const [budgetModal, setBudgetModal] = useState(false)
  const [settings, setSettings] = useState<Awaited<ReturnType<typeof getSettings>> | null>(null)

  useMemo(() => {
    getSettings().then(setSettings)
  }, [budgetModal])

  const yearly = useMemo(() => periodBudget(tournaments, year, undefined, { monthly: settings?.budgetMonthly ?? 0, year: settings?.budgetYear ?? 0 }), [tournaments, year, settings])
  const y2026 = useMemo(() => periodBudget(tournaments, 2026, undefined, { monthly: settings?.budgetMonthly ?? 0, year: settings?.budgetYear ?? 0 }), [tournaments, settings])
  const y2027 = useMemo(() => periodBudget(tournaments, 2027, undefined, { monthly: settings?.budgetMonthly ?? 0, year: settings?.budgetYear ?? 0 }), [tournaments, settings])

  const months = useMemo(() => {
    const out: { label: string; paye: number; prevu: number }[] = []
    for (let m = 0; m < 12; m++) {
      const b = periodBudget(tournaments, year, m, { monthly: settings?.budgetMonthly ?? 0, year: settings?.budgetYear ?? 0 })
      out.push({ label: MONTHS_FR[m], paye: b.totalPaye / 100, prevu: b.totalPrevuNonEngage / 100 })
    }
    return out
  }, [tournaments, year, settings])

  const playedYoY = useMemo(() => {
    const list = tournaments.filter((t) => t.status === 'joue' && Number(t.date.slice(0, 4)) === year)
    const totalPaye = list.reduce((s, t) => s + tournamentMoney(t).paye, 0)
    const points = list.reduce((s, t) => s + ((t.fftResult?.status === 'ok' || t.fftResult?.status === 'override') ? t.fftResult.points ?? 0 : 0), 0)
    return {
      count: list.length,
      costAvg: list.length ? totalPaye / list.length : null,
      costPerPoint: points > 0 && totalPaye > 0 ? totalPaye / points : null,
      points,
      totalPaye,
    }
  }, [tournaments, year])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          {([2026, 2027] as const).map((y) => (
            <button key={y} className={`chip cursor-pointer ${year === y ? 'bg-lime-400/20 text-lime-300' : 'bg-slate-700/50 text-slate-300'}`} onClick={() => setYear(y)}>
              {y}
            </button>
          ))}
        </div>
        <button className="btn-ghost !py-2 text-xs" onClick={() => setBudgetModal(true)}>
          ⚙ Budget {settings?.budgetMonthly ? `${fmtMoney(settings.budgetMonthly)}/mois` : 'non paramétré'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat value={fmtMoney(yearly.totalPaye)} label="dépense réelle (payé)" accent />
        <Stat value={fmtMoney(yearly.totalPrevuNonEngage)} label="prévu non payé" sub="n'additionne jamais les deux" />
        <Stat value={fmtMoney(yearly.engagement)} label="engagement total" sub={`budget ${year} : ${fmtMoney(yearly.budget)}`} />
        <Stat value={yearly.restant >= 0 ? fmtMoney(yearly.restant) : `−${fmtMoney(yearly.depassement)}`} label={yearly.restant >= 0 ? 'budget restant' : 'dépassement'} accent={yearly.restant < 0} />
      </div>

      <Card>
        <CardTitle>Dépenses par mois — {year}</CardTitle>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={months} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#23304a" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: '#8ea0bd', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8ea0bd', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#101828', border: '1px solid #23304a', borderRadius: 8, color: '#e6ecf5' }}
                formatter={(v: number, name) => [`${v.toFixed(0)} €`, name === 'paye' ? 'Payé' : 'Prévu']}
              />
              <Bar dataKey="paye" stackId="a" fill="#34d399" radius={[0, 0, 4, 4]} />
              <Bar dataKey="prevu" stackId="a" fill="#a3e63566" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-slate-500">Empilé : vert plein = déjà payé ; vert pâle = prévu non encore payé (jamais double compté).</p>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat value={playedYoY.count} label="tournois joués" />
        <Stat value={playedYoY.costAvg != null ? fmtMoney(playedYoY.costAvg) : '—'} label="coût moyen / tournoi" />
        <Stat value={playedYoY.points} label="points acquis" sub="résultats saisis uniquement" />
        <Stat value={playedYoY.costPerPoint != null ? `${fmtMoney(playedYoY.costPerPoint)}` : '—'} label="coût par point FFT" sub="à interpréter avec prudence" />
      </div>
      {playedYoY.count > 0 && playedYoY.points === 0 && (
        <p className="text-xs text-amber-300">⚠ Coût par point indisponible : aucun résultat joué avec points saisis pour {year}.</p>
      )}

      <Card>
        <CardTitle>Détail par tournoi — {year}</CardTitle>
        <TournamentMoneyRows tournaments={tournaments.filter((t) => t.date.startsWith(String(year)))} onChange={() => void getSettings().then(setSettings)} />
      </Card>

      <p className="text-xs text-slate-500">
        Bilan 2026 : {fmtMoney(y2026.engagement)} engagé · 2027 : {fmtMoney(y2027.engagement)} engagé.
      </p>

      {budgetModal && settings && (
        <BudgetModal
          settings={settings}
          onClose={async () => {
            setBudgetModal(false)
            setSettings(await getSettings())
          }}
        />
      )}
    </div>
  )
}

function TournamentMoneyRows({ tournaments, onChange }: { tournaments: Tournament[]; onChange: () => void }) {
  if (tournaments.length === 0) return <EmptyState icon="💰">Aucune dépense enregistrée. Le prix inscrit dans un tournoi alimente directement le budget.</EmptyState>
  const planned = tournaments
    .flatMap((t) => t.expenses.filter((e) => e.mode === 'prevu').map((e) => ({ t, e })))
    .sort((a, b) => b.t.date.localeCompare(a.t.date))
  const markPaid = async ({ t, e }: { t: Tournament; e: (typeof planned)[number]['e'] }) => {
    const t2: Tournament = { ...t, expenses: t.expenses.map((x) => (x.id === e.id ? { ...x, mode: 'paye' as const, paidOn: format(new Date(), 'yyyy-MM-dd') } : x)) }
    await upsertTournament(t2)
    onChange()
  }
  if (planned.length === 0)
    return (
      <div className="space-y-1.5">
        {tournaments
          .filter((t) => t.expenses.length > 0)
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((t) => {
            const m = tournamentMoney(t)
            return (
              <div key={t.id} className="flex items-center justify-between rounded-xl bg-slate-900/50 px-3 py-2 text-sm">
                <span className="min-w-0 truncate">
                  {fmtDateShort(t.date)} · {t.name}
                </span>
                <span className="text-xs">
                  <span className="text-emerald-300">{m.paye > 0 ? `${fmtMoney(m.paye)} payé` : ''}</span>
                  {m.paye > 0 && m.prevu > 0 ? ' · ' : ''}
                  <span>{m.prevu > 0 ? `${fmtMoney(m.prevu)} prévu` : ''}</span>
                </span>
              </div>
            )
          })}
      </div>
    )
  return (
    <div className="space-y-1.5">
      {planned.map(({ t, e }, i) => (
        <div key={`${t.id}-${e.id}-${i}`} className="flex items-center justify-between rounded-xl bg-slate-900/50 px-3 py-2 text-sm">
          <span className="min-w-0 truncate">
            {fmtDateShort(t.date)} · {t.name} — <b>{fmtMoney(e.amount)}</b> prévu
          </span>
          <button className="btn-ghost !px-2 !py-0.5 text-xs" onClick={() => void markPaid({ t, e })}>
            Marquer payé ✔
          </button>
        </div>
      ))}
    </div>
  )
}

function BudgetModal({ settings, onClose }: { settings: Awaited<ReturnType<typeof getSettings>>; onClose: () => void }) {
  const [monthly, setMonthly] = useState(toInputMoney(settings.budgetMonthly))
  const [yearly, setYearly] = useState(toInputMoney(settings.budgetYear))
  const save = async () => {
    await saveSettings({
      budgetMonthly: Math.round(Number((monthly || '0').replace(',', '.')) * 100) || 0,
      budgetYear: Math.round(Number((yearly || '0').replace(',', '.')) * 100) || 0,
    })
    onClose()
  }
  return (
    <Modal open onClose={onClose} title="Budget">
      <div className="space-y-3">
        <label className="block">
          <span className="label">Budget mensuel (€)</span>
          <input className="field" inputMode="decimal" value={monthly} onChange={(e) => setMonthly(e.target.value)} placeholder="ex. 150" />
        </label>
        <label className="block">
          <span className="label">Budget annuel (€, optionnel)</span>
          <input className="field" inputMode="decimal" value={yearly} onChange={(e) => setYearly(e.target.value)} placeholder="ex. 2000" />
        </label>
        <p className="text-xs text-slate-400">
          Calculs en centimes entiers ; prévu et payé jamais additionnés deux fois. Si un budget annuel est saisi, la vue
          annuelle l'utilise, sinon 12 × budget mensuel.
        </p>
        <button className="btn-primary w-full" onClick={save}>
          Enregistrer
        </button>
      </div>
    </Modal>
  )
}

export { addMonths }
