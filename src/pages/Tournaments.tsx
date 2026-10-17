import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, uid, upsertTournament } from '../db/db'
import { Card, CardTitle, EmptyState, StatusBadge, CategoryBadge, Modal } from '../components/ui'
import { fmtDate, fmtMoney } from '../lib/format'
import { computePoints } from '../lib/fft/points'
import { isIncoherentPlace } from '../lib/placement'
import { tournamentMoney } from '../lib/finance'
import { CATEGORIES, STATUS_LABELS, STATUS_ORDER, type TCategory, type Tournament, type TournamentStatus } from '../types'

export default function Tournaments({ onOpenCreate, onEdit }: { onOpenCreate: () => void; onEdit: (t: Tournament) => void }) {
  const tournaments = useLiveQuery(() => db.tournaments.orderBy('date').toArray(), [])
  const partners = useLiveQuery(() => db.partners.toArray(), []) ?? []
  const [fCat, setFCat] = useState('tous')
  const [fStatus, setFStatus] = useState<'tous' | TournamentStatus>('tous')
  const [fPartner, setFPartner] = useState('tous')
  const [fYear, setFYear] = useState('tous')
  const [fPos, setFPos] = useState('tous')
  const [dupConfirm, setDupConfirm] = useState<Tournament | null>(null)

  const years = useMemo(() => {
    const ys = new Set((tournaments ?? []).map((t) => t.date.slice(0, 4)))
    return ['tous', ...Array.from(ys).sort()]
  }, [tournaments])

  const filtered = (tournaments ?? []).filter(
    (t) =>
      (fCat === 'tous' || t.category === fCat) &&
      (fStatus === 'tous' || t.status === fStatus) &&
      (fPartner === 'tous' || t.partnerId === fPartner) &&
      (fYear === 'tous' || t.date.slice(0, 4) === fYear) &&
      (fPos === 'tous' || t.position === fPos),
  )

  const dup = async (t: Tournament) => {
    const copy: Tournament = {
      ...t,
      id: uid(),
      name: `${t.name} (copie)`,
      status: t.status === 'joue' ? 'inscrit' : t.status,
      fftResult: undefined,
      place: undefined,
      matchesPlayed: undefined,
      wins: undefined,
      losses: undefined,
      expenses: t.expenses.map((e) => ({ ...e, id: uid() })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await upsertTournament(copy)
    setDupConfirm(null)
    onEdit(copy)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle
          right={
            <button className="btn-primary !py-2" onClick={onOpenCreate}>
              + Tournoi
            </button>
          }
        >
          {filtered.length} tournoi{filtered.length > 1 ? 's' : ''}
        </CardTitle>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <select className="field" value={fCat} onChange={(e) => setFCat(e.target.value)}>
            <option value="tous">Toutes cat.</option>
            {(Object.keys(CATEGORIES) as TCategory[]).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select className="field" value={fStatus} onChange={(e) => setFStatus(e.target.value as TournamentStatus | 'tous')}>
            <option value="tous">Tous statuts</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <select className="field" value={fPartner} onChange={(e) => setFPartner(e.target.value)}>
            <option value="tous">Tous partenaires</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.favorite ? '★ ' : ''}
                {p.name}
              </option>
            ))}
          </select>
          <select className="field" value={fYear} onChange={(e) => setFYear(e.target.value)}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y === 'tous' ? 'Toutes années' : y}
              </option>
            ))}
          </select>
          <select className="field" value={fPos} onChange={(e) => setFPos(e.target.value)}>
            <option value="tous">Tous côtés</option>
            <option value="droite">Droite</option>
            <option value="gauche">Gauche</option>
            <option value="alternee">Alternée</option>
          </select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon="🏆">
          {tournaments && tournaments.length > 0
            ? 'Aucun tournoi ne correspond aux filtres actifs.'
            : 'Aucun tournoi enregistré. Cliquez sur « + Tournoi » : 6 champs suffisent, les résultats se saisissent après.'}
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const money = tournamentMoney(t)
            const partner = partners.find((p) => p.id === t.partnerId)
            const pts =
              t.fftResult?.status === 'override' || t.fftResult?.status === 'ok'
                ? t.fftResult.points
                : computePoints({ date: t.date, category: (t.category || 'P25') as TCategory, gender: t.gender, pairs: t.pairs ?? null, place: t.place ?? null }).status === 'ok'
                  ? (computePoints({ date: t.date, category: (t.category || 'P25') as TCategory, gender: t.gender, pairs: t.pairs ?? null, place: t.place ?? null }) as { status: 'ok'; points: number }).points
                  : undefined
            return (
              <Card key={t.id} className="!p-3 hover:border-lime-400/40">
                <button className="flex w-full cursor-pointer items-start justify-between gap-3 text-left" onClick={() => onEdit(t)}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs font-bold ${t.status === 'annule' ? 'text-rose-300 line-through' : 'text-slate-200'}`}>{fmtDate(t.date)}</span>
                      <CategoryBadge category={t.category} />
                      <StatusBadge status={t.status} />
                      {t.position !== 'inconnue' && t.position !== 'alternee' && (
                        <span className="chip bg-slate-700/60 text-slate-300">{t.position === 'droite' ? '→ droite' : '← gauche'}</span>
                      )}
                    </div>
                    <div className="mt-1 truncate font-semibold">{t.name}</div>
                    <div className="mt-0.5 text-xs text-slate-400">
                      {t.club || '—'}
                      {t.city ? ` · ${t.city}` : ''}
                      {partner ? ` · avec ${partner.name}` : ''}
                      {t.pairs ? ` · ${t.pairs} paires` : ''}
                      {t.place ? ` · ${t.place}${t.pairs ? `/` + t.pairs : ''}` : ''}
                      {t.status === 'joue' && t.wins != null && t.matchesPlayed ? ` · ${t.wins}/${t.matchesPlayed}` : ''}
                    {isIncoherentPlace(t.place, t.pairs) && (
                      <span className="ml-1 rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                        ⚠ place {t.place} &gt; {t.pairs} paires — corrigez
                      </span>
                    )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-lg font-extrabold text-lime-300">{pts != null ? `${pts} pts` : '—'}</div>
                    <div className="text-xs text-slate-400">
                      {(money.paye > 0 || money.prevu > 0) && (
                        <>
                          {money.paye > 0 && <span className="text-emerald-300">{fmtMoney(money.paye)} payé</span>}
                          {money.paye > 0 && money.prevu > 0 && ' + '}
                          {money.prevu > 0 && <span>{fmtMoney(money.prevu)} prévu</span>}
                        </>
                      )}
                    </div>
                    <button
                      className="mt-1 cursor-pointer rounded-md px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-700/60 hover:text-slate-200"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDupConfirm(t)
                      }}
                    >
                      Dupliquer
                    </button>
                  </div>
                </button>
              </Card>
            )
          })}
        </div>
      )}

      {dupConfirm && (
        <Modal open onClose={() => setDupConfirm(null)} title="Dupliquer le tournoi ?">
          <p className="text-sm text-slate-300">
            Une copie sera créée (adresse, partenaire, dépenses conservés), statut « {STATUS_LABELS.inscrit} », résultats et
            points remis à zéro. Vous pourrez modifier la date ensuite.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              className="btn-primary flex-1"
              onClick={() => {
                void dup(dupConfirm)
              }}
            >
              Dupliquer
            </button>
            <button className="btn-ghost" onClick={() => setDupConfirm(null)}>
              Annuler
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
