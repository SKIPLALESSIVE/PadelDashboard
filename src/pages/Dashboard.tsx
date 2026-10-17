import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { Card, CardTitle, EmptyState, Stat, StatusBadge, CategoryBadge } from '../components/ui'
import { fmtDate, fmtDateShort, fmtMoney } from '../lib/format'
import { rankingOn, nextExpiry } from '../lib/fft/ranking'
import { periodBudget } from '../lib/finance'
import { getSettings } from '../db/db'
import { format } from 'date-fns'
import type { Tournament } from '../types'

export default function Dashboard({
  nextTournaments,
  onOpenCreate,
  onGoCalendar,
  onGoRanking,
  onGoFinance,
  onGoPartners,
  onOpenTournament,
}: {
  nextTournaments: Tournament[]
  onOpenCreate: () => void
  onGoCalendar: () => void
  onGoRanking: () => void
  onGoFinance: () => void
  onGoPartners: () => void
  onOpenTournament: (id: string) => void
}) {
  const tournaments = useLiveQuery(() => db.tournaments.toArray(), []) ?? []
  const today = format(new Date(), 'yyyy-MM-dd')
  const snap = useMemo(() => rankingOn(tournaments, today), [tournaments, today])
  const playedCount = tournaments.filter((t) => t.status === 'joue').length
  const upcomingCount = tournaments.filter((t) => !['joue', 'annule'].includes(t.status) && t.date >= today).length

  const budgets = useLiveQuery(async () => (await getSettings()), [])?.budgetMonthly ?? 0
  const monthBudget = useMemo(
    () => periodBudget(tournaments, Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1, { monthly: budgets, year: 0 }),
    [tournaments, today, budgets],
  )

  // conflits calendariques prochains
  const conflicts = useMemo(() => {
    const byDay = new Map<string, number>()
    tournaments.filter((t) => !['joue', 'annule'].includes(t.status)).forEach((t) => byDay.set(t.date, (byDay.get(t.date) ?? 0) + 1))
    return [...byDay.entries()].filter(([, n]) => n > 1).map(([d, n]) => ({ d, n }))
  }, [tournaments])

  return (
    <div className="space-y-4">
      {/* Action principale */}
      <button className="btn-primary w-full !py-4 text-base md:hidden" onClick={onOpenCreate}>
        + Ajouter un tournoi
      </button>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat accent value={snap.total} label="points glissants" sub="top 12 · 12 derniers mois" />
        <Stat value={playedCount} label="tournois joués" />
        <Stat value={upcomingCount} label="tournois à venir" />
        <Stat
          value={monthBudget.engagement > 0 || budgets > 0 ? fmtMoney(monthBudget.engagement) : '—'}
          label={`engagement du mois`}
          sub={budgets > 0 ? `budget ${fmtMoney(budgets)}` : undefined}
        />
      </div>

      <Card>
        <CardTitle right={<button className="text-xs text-lime-300" onClick={onGoRanking}>Voir le classement →</button>}>
          Points en jeu · prochaines échéances
        </CardTitle>
        {snap.expiringSoon.length > 0 ? (
          <div className="space-y-1.5">
            {snap.expiringSoon.slice(0, 3).map((r) => (
              <div key={r.tournamentId} className="flex items-center justify-between rounded-xl bg-amber-400/10 px-3 py-2 text-sm">
                <span className="min-w-0 truncate">
                  ⏳ {r.name} ({r.points} pts) expire le {fmtDateShort(nextExpiry({ date: r.date } as never))}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Aucun résultat ne s'échappe dans les 2 prochains mois.</p>
        )}
      </Card>

      <Card>
        <CardTitle right={<button className="text-xs text-lime-300" onClick={onGoCalendar}>Calendrier →</button>}>
          Prochains tournois
        </CardTitle>
        {nextTournaments.length === 0 ? (
          <EmptyState icon="🎾">Planifiez votre prochaine sortie : « + Ajouter un tournoi », 1 minute, catégorie, club, partenaire, prix, statut.</EmptyState>
        ) : (
          <div className="space-y-2">
            {nextTournaments.map((t) => (
              <button key={t.id} className="card flex w-full cursor-pointer items-center justify-between gap-2 !p-3 text-left hover:border-lime-400/40" onClick={() => onOpenTournament(t.id)}>
                <span className="min-w-0">
                  <span className="text-sm font-semibold">{t.name}</span>
                  <span className="block text-xs text-slate-400">
                    {fmtDate(t.date)}{t.time ? ` · ${t.time}` : ''} · {t.club || ''}
                  </span>
                </span>
                <span className="flex shrink-0 gap-1.5">
                  <CategoryBadge category={t.category} />
                  <StatusBadge status={t.status} />
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>

      {conflicts.length > 0 && (
        <Card className="border-amber-400/40">
          <CardTitle>Conflits de dates ⚠</CardTitle>
          <div className="space-y-1.5 text-sm">
            {conflicts.slice(0, 4).map((c) => (
              <div key={c.d} className="rounded-xl bg-amber-400/10 px-3 py-2">
                {fmtDate(c.d)} : {c.n} tournois / événements le même jour.
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card className="cursor-pointer hover:border-lime-400/40" onClick={onGoFinance}>
          <div className="text-sm font-semibold">💰 Finances</div>
          <p className="mt-1 text-xs text-slate-400">Payé vs prévu, budget restant, coût par point.</p>
        </Card>
        <Card className="cursor-pointer hover:border-lime-400/40" onClick={onGoPartners}>
          <div className="text-sm font-semibold">👥 Partenaires</div>
          <p className="mt-1 text-xs text-slate-400">Stats par partenaire et par côté (droite/gauche).</p>
        </Card>
      </div>
    </div>
  )
}
