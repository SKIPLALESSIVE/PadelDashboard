import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, uid, deleteTournament, upsertTournament } from '../db/db'
import { computePoints } from '../lib/fft/points'
import { fmtDate, parseMoney, toInputMoney } from '../lib/format'
import { Modal } from './ui'
import {
  CATEGORIES,
  POSITION_LABELS,
  STATUS_LABELS,
  STATUS_ORDER,
  type Expense,
  type TCategory,
  type TGender,
  type TPosition,
  type Tournament,
  type TournamentStatus,
} from '../types'


const emptyT = (date?: string): Tournament => ({
  id: uid(),
  name: '',
  date: date ?? new Date().toISOString().slice(0, 10),
  category: '',
  gender: 'messieurs',
  club: '',
  city: '',
  position: 'droite',
  status: 'inscrit',
  expenses: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

export function TournamentModal({
  open,
  openDate,
  editId,
  onClose,
}: {
  open: boolean
  openDate?: string
  editId?: string
  onClose: () => void
}) {
  const partners = useLiveQuery(() => db.partners.toArray(), []) ?? []
  const [t, setT] = useState<Tournament>(emptyT(openDate))
  const [details, setDetails] = useState(false)
  const [priceInput, setPriceInput] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoaded(false)
    if (editId) {
      db.tournaments.get(editId).then((row) => {
        if (row) {
          setT({ ...row })
          setPriceInput(toInputMoney(row.expenses.find((e) => e.kind === 'inscription')?.amount))
        }
        setLoaded(true)
        setDetails(true)
      })
    } else {
      setT(emptyT(openDate))
      setPriceInput('')
      setDetails(false)
      setLoaded(true)
    }
  }, [open, editId, openDate])

  const patch = (p: Partial<Tournament>) => setT((cur) => ({ ...cur, ...p }))

  const fft = useMemo(
    () =>
      computePoints({
        date: t.date,
        category: (t.category || 'P25') as TCategory,
        gender: t.gender,
        pairs: t.pairs ?? null,
        place: t.place ?? null,
      }),
    [t.date, t.category, t.gender, t.pairs, t.place],
  )

  const save = async () => {
    const cleanExpenses = t.expenses.filter((e) => e.amount > 0)
    const t2: Tournament = {
      ...t,
      expenses: cleanExpenses,
      name: t.name.trim() || `Tournoi ${fmtDate(t.date)}`,
      fftResult: buildFftResult(t, fft),
    }
    await upsertTournament(t2)
    onClose()
  }

  const remove = async () => {
    if (confirm('Supprimer définitivement ce tournoi ?')) {
      await deleteTournament(t.id)
      onClose()
    }
  }

  if (!open || !loaded) return null

  return (
    <Modal open={open} onClose={onClose} title={editId ? 'Modifier le tournoi' : 'Ajouter un tournoi'} wide>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
        className="space-y-4"
      >
        {/* Création express */}
        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2 block">
            <span className="label">Date</span>
            <input type="date" className="field" value={t.date} onChange={(e) => patch({ date: e.target.value })} />
          </label>
          <label className="col-span-2 block">
            <span className="label">Nom (optionnel)</span>
            <input className="field" placeholder="ex. P25 Faster" value={t.name} onChange={(e) => patch({ name: e.target.value })} />
          </label>
          <label className="block">
            <span className="label">Catégorie</span>
            <select className="field" value={t.category} onChange={(e) => patch({ category: e.target.value as TCategory })}>
              <option value="">—</option>
              {(Object.keys(CATEGORIES) as TCategory[]).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Statut</span>
            <select className="field" value={t.status} onChange={(e) => patch({ status: e.target.value as TournamentStatus })}>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Club</span>
            <input className="field" placeholder="ex. 4PADEL Bordeaux" value={t.club} onChange={(e) => patch({ club: e.target.value })} />
          </label>
          <label className="block">
            <span className="label">Ville</span>
            <input className="field" value={t.city} onChange={(e) => patch({ city: e.target.value })} />
          </label>
          <label className="block">
            <span className="label">Inscription (€ / joueur)</span>
            <input
              className="field"
              inputMode="decimal"
              placeholder="ex. 35"
              value={priceInput}
              onChange={(e) => {
                setPriceInput(e.target.value)
                const cents = parseMoney(e.target.value)
                const others = t.expenses.filter((x) => x.kind !== 'inscription')
                patch({
                  expenses: cents > 0 ? [{ id: uid(), kind: 'inscription', mode: 'paye', amount: cents }, ...others] : others,
                })
              }}
            />
          </label>
          <label className="block">
            <span className="label">Partenaire</span>
            <PartnerPicker partners={partners} value={t.partnerId} onChange={(id) => patch({ partnerId: id })} />
          </label>
        </div>

        {/* Détails optionnels */}
        {!details && (
          <button type="button" className="btn-ghost w-full" onClick={() => setDetails(true)}>
            Détails : tableau, position, résultats, dépenses…
          </button>
        )}
        {details && <Details t={t} patch={patch} setDetails={setDetails} fft={fft} partners={partners} />}

        <div className="flex flex-wrap gap-2 pt-2">
          <button type="submit" className="btn-primary flex-1">
            Enregistrer
          </button>
          {editId && (
            <button type="button" className="btn-danger" onClick={remove}>
              Supprimer
            </button>
          )}
          <button type="button" className="btn-ghost" onClick={onClose}>
            Annuler
          </button>
        </div>
      </form>
    </Modal>
  )
}

function buildFftResult(t: Tournament, fft: ReturnType<typeof computePoints>) {
  if (t.fftResult?.status === 'override') {
    return { ...t.fftResult, computedPoints: fft.status === 'ok' ? fft.points : undefined }
  }
  if (fft.status === 'ok') {
    return { status: 'ok' as const, points: fft.points, grilleLabel: fft.grilleLabel }
  }
  return { status: 'impossible' as const, reason: fft.reason, grilleLabel: fft.grilleLabel }
}

function PartnerPicker({
  partners,
  value,
  onChange,
}: {
  partners: { id: string; name: string; favorite?: boolean }[]
  value?: string
  onChange: (id: string | undefined) => void
}) {
  const [newName, setNewName] = useState('')
  const sorted = [...partners].sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite) || a.name.localeCompare(b.name))
  const createNow = async (name: string) => {
    const id = uid()
    await db.partners.put({ id, name, usualPosition: 'flexible', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    onChange(id)
  }
  return (
    <div className="space-y-1">
      <select className="field" value={value ?? ''} onChange={(e) => onChange(e.target.value || undefined)}>
        <option value="">—</option>
        {sorted.map((p) => (
          <option key={p.id} value={p.id}>
            {p.favorite ? '★ ' : ''}
            {p.name}
          </option>
        ))}
      </select>
      <input
        className="field"
        placeholder="Créer à la volée…"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        onBlur={() => {
          const name = newName.trim()
          if (name) {
            const hit = partners.find((p) => p.name.toLowerCase() === name.toLowerCase())
            if (hit) onChange(hit.id)
            else void createNow(name)
          }
          setNewName('')
        }}
      />
    </div>
  )
}

function Details({
  t,
  patch,
  fft,
  partners,
  setDetails,
}: {
  t: Tournament
  patch: (p: Partial<Tournament>) => void
  fft: ReturnType<typeof computePoints>
  partners: { id: string; name: string }[]
  setDetails: (b: boolean) => void
}) {
  const [overrideOpen, setOverrideOpen] = useState(false)
  const isJoue = t.status === 'joue'
  const ins = t.expenses.find((e) => e.kind === 'inscription')

  return (
    <div className="space-y-4 rounded-2xl border border-line bg-slate-900/40 p-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="label">Épreuve</span>
          <select className="field" value={t.gender} onChange={(e) => patch({ gender: e.target.value as TGender })}>
            <option value="messieurs">Messieurs</option>
            <option value="dames">Dames</option>
            <option value="mixte">Mixte</option>
          </select>
        </label>
        <label className="block">
          <span className="label">Ma position</span>
          <select className="field" value={t.position} onChange={(e) => patch({ position: e.target.value as TPosition })}>
            {(['droite', 'gauche', 'alternee', 'inconnue'] as TPosition[]).map((p) => (
              <option key={p} value={p}>
                {POSITION_LABELS[p]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Paires du tableau</span>
          <input
            type="number"
            min={4}
            className="field"
            value={t.pairs ?? ''}
            onChange={(e) => patch({ pairs: e.target.value ? Number(e.target.value) : undefined })}
          />
        </label>
        <label className="block">
          <span className="label">Place finale (rang FFT retenu)</span>
          <input
            type="number"
            min={1}
            className="field"
            value={t.place ?? ''}
            onChange={(e) => patch({ place: e.target.value ? Number(e.target.value) : undefined })}
          />
        </label>
        <label className="block">
          <span className="label">Partenaire</span>
          <select className="field" value={t.partnerId ?? ''} onChange={(e) => patch({ partnerId: e.target.value || undefined })}>
            <option value="">—</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Format payé / prévu</span>
          <select
            className="field"
            value={ins?.mode ?? ''}
            onChange={(e) => {
              const mode = e.target.value as 'prevu' | 'paye' | ''
              if (!mode) return
              const cents = ins?.amount ?? 0
              const others = t.expenses.filter((x) => x.kind !== 'inscription')
              patch({
                expenses:
                  cents > 0
                    ? [{ id: uid(), kind: 'inscription', mode, amount: cents } as Expense, ...others]
                    : [],
              })
            }}
          >
            <option value="">—</option>
            <option value="prevu">Prévu</option>
            <option value="paye">Payé</option>
          </select>
        </label>
        <label className="block">
          <span className="label">Lien Ten'Up / 4PADEL</span>
          <input className="field" inputMode="url" value={t.link ?? ''} onChange={(e) => patch({ link: e.target.value })} />
        </label>
        <label className="block">
          <span className="label">Note</span>
          <input className="field" value={t.note ?? ''} onChange={(e) => patch({ note: e.target.value })} />
        </label>
      </div>

      {isJoue && (
        <div className="grid grid-cols-3 gap-3">
          <label className="block">
            <span className="label">Matchs</span>
            <input
              type="number"
              min={0}
              className="field"
              value={t.matchesPlayed ?? ''}
              onChange={(e) => patch({ matchesPlayed: e.target.value ? Number(e.target.value) : undefined })}
            />
          </label>
          <label className="block">
            <span className="label">Victoires</span>
            <input
              type="number"
              min={0}
              className="field"
              value={t.wins ?? ''}
              onChange={(e) => patch({ wins: e.target.value ? Number(e.target.value) : undefined })}
            />
          </label>
          <label className="block">
            <span className="label">Défaites</span>
            <input
              type="number"
              min={0}
              className="field"
              value={t.losses ?? ''}
              onChange={(e) => patch({ losses: e.target.value ? Number(e.target.value) : undefined })}
            />
          </label>
        </div>
      )}

      {/* Points FFT en direct, recalculés sans bouton */}
      <div className="rounded-2xl border border-lime-400/30 bg-lime-400/5 p-4">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-lime-300">Points FFT individuels (temps réel)</div>
        {t.fftResult?.status === 'override' ? (
          <div>
            <div className="text-3xl font-extrabold text-lime-300">{t.fftResult.points} pts</div>
            <div className="text-xs text-slate-400">
              Override manuel.
              {t.fftResult.computedPoints != null && <> Valeur calculée : {t.fftResult.computedPoints} pts.</>}
            </div>
          </div>
        ) : fft.status === 'ok' ? (
          <div>
            <div className="text-3xl font-extrabold text-lime-300">{fft.points} pts</div>
            <div className="text-xs text-slate-400">{fft.grilleLabel}</div>
          </div>
        ) : (
          <div>
            <div className="text-sm font-semibold text-amber-300">Calcul impossible : {fft.reason}</div>
            {fft.grilleLabel && <div className="mt-1 text-xs text-slate-500">{fft.grilleLabel}</div>}
          </div>
        )}
        {!overrideOpen && (
          <button type="button" className="btn-ghost mt-3 !py-1.5 text-xs" onClick={() => setOverrideOpen(true)}>
            Override manuel (cas exceptionnel)…
          </button>
        )}
        {overrideOpen && <OverrideForm fft={fft} patch={patch} close={() => setOverrideOpen(false)} />}
      </div>

      <button type="button" className="btn-ghost w-full" onClick={() => setDetails(false)}>
        ↑ Replier les détails
      </button>
    </div>
  )
}

function OverrideForm({
  fft,
  patch,
  close,
}: {
  fft: ReturnType<typeof computePoints>
  patch: (p: Partial<Tournament>) => void
  close: () => void
}) {
  const [reason, setReason] = useState('')
  const [pts, setPts] = useState('')
  const p = Math.round(Number(pts.replace(',', '.').replace(/\s/g, '')))
  const invalid = !reason.trim() || !pts.trim() || !Number.isFinite(p) || p < 0
  return (
    <div className="mt-3 space-y-2 rounded-xl border border-line bg-slate-900/60 p-3">
      <p className="text-xs text-slate-400">
        L'override conserve la valeur calculée
        {fft.status === 'ok' && <> ({fft.points} pts)</>}. Il est conservé après recalculs.
      </p>
      <input className="field" inputMode="numeric" placeholder="Points officiels (ex. 95)" value={pts} onChange={(e) => setPts(e.target.value)} />
      <input className="field" placeholder="Motif (obligatoire)" value={reason} onChange={(e) => setReason(e.target.value)} />
      <div className="flex gap-2">
        <button
          type="button"
          className="btn-primary !py-1.5 text-xs"
          disabled={invalid}
          onClick={() => {
            patch({
              fftResult: {
                status: 'override',
                points: p,
                computedPoints: fft.status === 'ok' ? fft.points : undefined,
                reason: fft.status === 'impossible' ? fft.reason : undefined,
                grilleLabel: fft.grilleLabel,
              },
            })
            close()
          }}
        >
          Valider l'override
        </button>
        <button
          type="button"
          className="btn-ghost !py-1.5 text-xs"
          onClick={() => {
            patch({ fftResult: undefined })
            close()
          }}
        >
          Retirer l'override
        </button>
      </div>
    </div>
  )
}


