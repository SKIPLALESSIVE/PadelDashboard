import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, uid, deletePartner, upsertPartner } from '../db/db'
import { Card, CardTitle, EmptyState, Modal, Stat } from '../components/ui'
import { fmtDate, fmtMoney } from '../lib/format'
import { tournamentMoney } from '../lib/finance'
import { computePoints } from '../lib/fft/points'
import { placeRatio } from '../lib/placement'
import type { Partner, TCategory, Tournament } from '../types'

interface PartnerStats {
  count: number
  avgPlace: number | null
  medianPlace: number | null
  bestPlace: number | null
  worstPlace: number | null
  wins: number
  matches: number
  pointsTotal: number
  pointsAvg: number | null
  podiums: number
  moneyAvg: number | null
}

function statsFor(list: Tournament[]): PartnerStats {
  const played = list.filter((t) => t.status === 'joue')
  // Données incohérentes (place > paires) exclues des moyennes et des bornes
  const places = played
    .filter((t) => t.place != null && t.pairs != null && placeRatio(t.place, t.pairs) != null)
    .sort((a, b) => (a.place ?? 0) - (b.place ?? 0))
  const rel = places
    .map((t) => placeRatio(t.place, t.pairs))
    .filter((x): x is number => x != null)
    .sort((a, b) => a - b)
  const matches = played.reduce((s, t) => s + (t.matchesPlayed ?? 0), 0)
  const wins = played.reduce((s, t) => s + (t.wins ?? 0), 0)
  const points = played.map((t) => (t.status === 'joue' && (t.fftResult?.status === 'ok' || t.fftResult?.status === 'override') ? (t.fftResult.points ?? 0) : computePoints({ date: t.date, category: (t.category || 'P25') as TCategory, gender: t.gender, pairs: t.pairs ?? null, place: t.place ?? null }).status === 'ok' ? (computePoints({ date: t.date, category: (t.category || 'P25') as TCategory, gender: t.gender, pairs: t.pairs ?? null, place: t.place ?? null }) as { status: 'ok'; points: number }).points : 0))
  const money = played.reduce((s, t) => s + tournamentMoney(t).paye, 0)
  const median = (arr: number[]): number | null => {
    if (arr.length === 0) return null
    const mid = Math.floor(arr.length / 2)
    return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2
  }
  return {
    count: played.length,
    avgPlace: rel.length ? rel.reduce((s, x) => s + x, 0) / rel.length : null,
    medianPlace: median(rel),
    bestPlace: places.length ? (places[0].place ?? null) : null,
    worstPlace: places.length ? (places[places.length - 1].place ?? null) : null,
    wins,
    matches,
    pointsTotal: points.reduce((s, x) => s + x, 0),
    pointsAvg: points.length ? points.reduce((s, x) => s + x, 0) / points.length : null,
    podiums: played.filter((t) => (t.place ?? 99) <= 3).length,
    moneyAvg: played.length ? money / played.length : null,
  }
}

function pct(x: number | null, d = 0): string {
  return x == null ? '—' : `${(x * 100).toFixed(d)} %`
}

export default function Partners() {
  const partners = useLiveQuery(() => db.partners.toArray(), []) ?? []
  const tournaments = useLiveQuery(() => db.tournaments.toArray(), []) ?? []
  const [edit, setEdit] = useState<Partner | null>(null)
  const [creating, setCreating] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  const sorted = useMemo(
    () => [...partners].sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite) || a.name.localeCompare(b.name)),
    [partners],
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle
          right={
            <button
              className="btn-primary !py-2"
              onClick={() => {
                setEdit({ id: uid(), name: '', usualPosition: 'flexible', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
                setCreating(true)
              }}
            >
              + Partenaire
            </button>
          }
        >
          {partners.length} partenaire{partners.length > 1 ? 's' : ''}
        </CardTitle>

        {sorted.length === 0 ? (
          <EmptyState icon="👥">Ajoutez vos partenaires habituels : l'app retiendra le côté, les stats et le budget associés.</EmptyState>
        ) : (
          <div className="space-y-2">
            {sorted.map((p) => {
              const list = tournaments.filter((t) => t.partnerId === p.id)
              const s = statsFor(list)
              const lowSample = s.count > 0 && s.count < 4
              return (
                <div key={p.id} className="card !p-3">
                  <div className="flex items-center justify-between gap-3">
                    <button className="cursor-pointer text-left" onClick={() => setDetailId(detailId === p.id ? null : p.id)}>
                      <span className="font-semibold">
                        {p.favorite && <span className="text-amber-300">★ </span>}
                        {p.name}
                      </span>
                      <span className="ml-2 text-xs text-slate-400">
                        {p.usualPosition === 'flexible' ? 'côté flexible' : `côté ${p.usualPosition}`}
                        {p.rankingRank ? ` · ${p.rankingRank}` : ''}
                      </span>
                    </button>
                    <div className="flex gap-1">
                      <span className="chip bg-slate-700/60 text-slate-300">{s.count} joués</span>
                      <button className="btn-ghost !px-2.5 !py-1 text-xs" onClick={() => { setEdit(p); setCreating(false) }}>
                        Modifier
                      </button>
                    </div>
                  </div>
                  {detailId === p.id && (
                    <div className="mt-3 space-y-2 border-t border-line pt-3">
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                        <Stat value={s.avgPlace != null ? pct(s.avgPlace, 1) : '—'} label="place moyenne (du tableau)" />
                        <Stat value={s.medianPlace != null ? pct(s.medianPlace, 1) : '—'} label="place médiane" />
                        <Stat value={s.pointsAvg != null ? s.pointsAvg.toFixed(1) : '—'} label="pts moyens / tournoi" sub={`${s.pointsTotal} pts au total`} />
                        <Stat value={s.matches > 0 ? `${Math.round((s.wins / s.matches) * 100)} %` : '—'} label="taux de victoires" sub={s.matches > 0 ? `${s.wins}/${s.matches} matchs` : 'matchs non saisis'} />
                        <Stat value={s.bestPlace ?? '—'} label="meilleure place" />
                        <Stat value={s.worstPlace ?? '—'} label="pire place" />
                        <Stat value={s.podiums} label="podiums (top 3)" />
                        <Stat value={s.moneyAvg != null ? fmtMoney(s.moneyAvg) : '—'} label="budget moyen / tournoi" />
                      </div>
                      {lowSample && <p className="text-xs text-amber-300">⚠ Peu d'observations ({s.count}) : chiffres peu représentatifs.</p>}
                      <p className="text-xs text-slate-500">
                        Places normalisées (place / nb paires) pour comparer un 4e/8 à un 4e/32. Tournois sans place connue exclus.
                      </p>
                      <CoteSide tList={list} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {(edit || creating) && edit && (
        <PartnerModal
          partner={edit}
          onClose={() => {
            setEdit(null)
            setCreating(false)
          }}
        />
      )}
    </div>
  )
}

/** Comparaison droite vs gauche pour ce partenaire (tournois avec côté connu). */
function CoteSide({ tList }: { tList: Tournament[] }) {
  const cote = (side: 'droite' | 'gauche') =>
    statsFor(tList.filter((t) => t.position === side))
  const d = cote('droite')
  const g = cote('gauche')
  if (d.count === 0 && g.count === 0) return (
    <p className="text-xs text-slate-500">Renseignez votre côté dans les tournois pour comparer droite/gauche.</p>
  )
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-xl bg-slate-900/50 p-3">
        <div className="text-xs font-bold uppercase text-slate-400">→ Ma droite ({d.count})</div>
        <div className="mt-1 text-sm">
          place moyenne : <b>{d.avgPlace != null ? pct(d.avgPlace, 1) : '—'}</b> · pts moyens : <b>{d.pointsAvg != null ? d.pointsAvg.toFixed(1) : '—'}</b>
        </div>
      </div>
      <div className="rounded-xl bg-slate-900/50 p-3">
        <div className="text-xs font-bold uppercase text-slate-400">← Ma gauche ({g.count})</div>
        <div className="mt-1 text-sm">
          place moyenne : <b>{g.avgPlace != null ? pct(g.avgPlace, 1) : '—'}</b> · pts moyens : <b>{g.pointsAvg != null ? g.pointsAvg.toFixed(1) : '—'}</b>
        </div>
      </div>
    </div>
  )
}

function PartnerModal({ partner, onClose }: { partner: Partner; onClose: () => void }) {
  const [p, setP] = useState<Partner>(partner)
  const save = async () => {
    await upsertPartner({ ...p, name: p.name.trim(), updatedAt: new Date().toISOString() })
    onClose()
  }
  const remove = async () => {
    if (confirm('Supprimer ce partenaire ? Les tournois associés garderont leur référence (partenaire inconnu).')) {
      await deletePartner(p.id)
      onClose()
    }
  }
  return (
    <Modal open onClose={onClose} title="Partenaire">
      <div className="space-y-3">
        <label className="block">
          <span className="label">Nom / pseudo</span>
          <input className="field" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="label">Côté habituel</span>
            <select className="field" value={p.usualPosition} onChange={(e) => setP({ ...p, usualPosition: e.target.value as Partner['usualPosition'] })}>
              <option value="droite">Droite</option>
              <option value="gauche">Gauche</option>
              <option value="flexible">Flexible</option>
            </select>
          </label>
          <label className="block">
            <span className="label">Main forte</span>
            <select className="field" value={p.strongHand ?? ''} onChange={(e) => setP({ ...p, strongHand: (e.target.value || undefined) as Partner['strongHand'] })}>
              <option value="">—</option>
              <option value="droite">Droite</option>
              <option value="gauche">Gauche</option>
            </select>
          </label>
          <label className="block">
            <span className="label">Classement (rang)</span>
            <input
              type="number"
              className="field"
              value={p.rankingRank ?? ''}
              onChange={(e) => setP({ ...p, rankingRank: e.target.value ? Number(e.target.value) : undefined })}
            />
          </label>
          <label className="block">
            <span className="label">Connu au</span>
            <input type="date" className="field" value={p.rankingDate ?? ''} onChange={(e) => setP({ ...p, rankingDate: e.target.value || undefined })} />
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={!!p.favorite} onChange={(e) => setP({ ...p, favorite: e.target.checked })} id="fav" className="h-4 w-4 accent-lime-400" />
          <label htmlFor="fav" className="cursor-pointer text-sm">
            Favori
          </label>
        </div>
        <label className="block">
          <span className="label">Coordonnées (locales uniquement)</span>
          <input className="field" placeholder="téléphone, mail…" value={p.phone ?? ''} onChange={(e) => setP({ ...p, phone: e.target.value })} />
        </label>
        <label className="block">
          <span className="label">Notes</span>
          <textarea className="field" rows={2} value={p.notes ?? ''} onChange={(e) => setP({ ...p, notes: e.target.value })} />
        </label>
        <div className="flex gap-2">
          <button className="btn-primary flex-1" onClick={save}>
            Enregistrer
          </button>
          <button className="btn-danger" onClick={remove}>
            Supprimer
          </button>
        </div>
        <p className="text-xs text-slate-500">Classement saisi le {p.rankingDate ? fmtDate(p.rankingDate) : '—'} · provenance : saisie manuelle.</p>
      </div>
    </Modal>
  )
}
