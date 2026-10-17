import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getSettings, saveSettings, replaceAll, mergeAll, uid } from '../db/db'
import { Card, CardTitle, Modal } from '../components/ui'
import { buildBackup, download, tournamentsCsv, expensesCsv, buildIcs, validateBackup, type BackupShape } from '../lib/exporters'
import { parseMoney, fmtDate } from '../lib/format'

export default function Settings() {
  const tournaments = useLiveQuery(() => db.tournaments.toArray(), []) ?? []
  const partners = useLiveQuery(() => db.partners.toArray(), []) ?? []
  const availabilities = useLiveQuery(() => db.availabilities.toArray(), []) ?? []
  const events = useLiveQuery(() => db.events.toArray(), []) ?? []
  const officialRankings = useLiveQuery(() => db.officialRankings.toArray(), []) ?? []
  const [settings, setSettings] = useState<Awaited<ReturnType<typeof getSettings>> | null>(null)
  const [importPreview, setImportPreview] = useState<BackupShape | null>(null)
  const [confirmWipe, setConfirmWipe] = useState(false)

  void getSettings().then(setSettings)

  const doBackup = async () => {
    const s = settings ?? (await getSettings())
    download(`padeltrack-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(buildBackup({ settings: s, tournaments, partners, availabilities, events, officialRankings }), null, 2))
  }

  const doCsv = () => {
    const byName: Record<string, string> = Object.fromEntries(partners.map((p) => [p.id, p.name]))
    download(`padeltrack-tournois-${new Date().toISOString().slice(0, 10)}.csv`, tournamentsCsv(tournaments, byName), 'text/csv')
  }
  const doCsvExp = () => {
    download(`padeltrack-depenses-${new Date().toISOString().slice(0, 10)}.csv`, expensesCsv(tournaments), 'text/csv')
  }
  const doIcs = () => {
    download(`padeltrack-calendrier-${new Date().toISOString().slice(0, 10)}.ics`, buildIcs(tournaments, events, availabilities), 'text/calendar')
  }

  const onImportFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        const v = validateBackup(parsed)
        if (v.ok) setImportPreview(v.data)
        else alert(`Import refusé :\n${v.errors.join('\n')}`)
      } catch (e) {
        alert(`JSON invalide : ${String(e)}`)
      }
    }
    reader.readAsText(file)
  }

  const replace = async () => {
    if (!importPreview) return
    if (!confirm('Remplacer TOUTES les données actuelles par cette sauvegarde ? Action irréversible (faites une sauvegarde avant).')) return
    await replaceAll({
      settings: importPreview.settings,
      tournaments: importPreview.tournaments,
      partners: importPreview.partners,
      availabilities: importPreview.availabilities,
      events: importPreview.events,
      officialRankings: importPreview.officialRankings,
    })
    setImportPreview(null)
  }

  const merge = async () => {
    if (!importPreview) return
    await mergeAll({
      settings: importPreview.settings,
      tournaments: importPreview.tournaments,
      partners: importPreview.partners,
      availabilities: importPreview.availabilities,
      events: importPreview.events,
      officialRankings: importPreview.officialRankings,
    })
    setImportPreview(null)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Application</CardTitle>
        {settings && <ProfileSettings s={settings} onClose={() => void getSettings().then(setSettings)} />}
      </Card>

      <Card className="border-lime-400/40">
        <CardTitle>Sauvegarder mes données</CardTitle>
        <p className="mb-3 text-sm text-slate-300">
          Le stockage est local (IndexedDB, sur cet appareil). Il n'est <b>pas</b> synchronisé entre vos appareils :
          la sauvegarde JSON est votre filet de sécurité.
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={doBackup}>
            ⬇ Export JSON complet
          </button>
          <button className="btn-ghost" onClick={doCsv}>
            Export CSV tournois
          </button>
          <button className="btn-ghost" onClick={doCsvExp}>
            Export CSV dépenses
          </button>
          <button className="btn-ghost" onClick={doIcs}>
            Export ICS calendrier
          </button>
        </div>
      </Card>

      <Card>
        <CardTitle>Importer</CardTitle>
        <label className="btn-ghost w-full cursor-pointer">
          Choisir un fichier de sauvegarde JSON…
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onImportFile(f)
            }}
          />
        </label>
        <p className="mt-2 text-xs text-slate-500">
          L'import affiche un aperçu avec détection ; vous choisirez « Fusionner » ou « Remplacer ».
        </p>
        <details className="mt-3 text-xs text-slate-400">
          <summary className="cursor-pointer">Migrer depuis l'ancien fichier HTML ?</summary>
          <p className="mt-2">
            Si votre ancien fichier HTML stockait au format identifié dans localStorage, la migration n'est possible que
            si le format coïncide : pour l'instant, aucun format n'étant identifié, utilisez la saisie manuelle ou une
            reconversion via CSV.
          </p>
        </details>
      </Card>

      <Card>
        <CardTitle>Données de démonstration (fictives)</CardTitle>
        <p className="mb-3 text-sm text-slate-300">Jeu de données clairement marqué fictif pour tester l'app. Il n'affiche jamais de vrais résultats FFT.</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={() => void loadDemo()}>
            Charger la démo
          </button>
          {tournaments.some((t) => t.name.startsWith('[DÉMO]')) && (
            <button
              className="btn-danger"
              onClick={async () => {
                if (!confirm('Supprimer uniquement les données de démonstration ?')) return
                const ids = tournaments.filter((t) => t.name.startsWith('[DÉMO]')).map((t) => t.id)
                await Promise.all(ids.map((id) => db.tournaments.delete(id)))
              }}
            >
              Effacer les données de démo
            </button>
          )}
        </div>
      </Card>

      <Card className="border-rose-500/30">
        <CardTitle>Zone dangereuse</CardTitle>
        <button className="btn-danger" onClick={() => setConfirmWipe(true)}>
          Effacer TOUTES les données de l'appareil…
        </button>
      </Card>

      <p className="pb-4 text-center text-xs text-slate-600">
        PadelTrack · barèmes FFT : Guide de la compétition Chapitre II (février 2026 & juillet 2026), calculs versionnés par
        saison · données sous-chemin GitHub Pages compatibles.
      </p>

      {importPreview && (
        <Modal open onClose={() => setImportPreview(null)} title="Aperçu de l'import" wide>
          {(() => {
            const cur = { tournaments, partners, availabilities, events, officialRankings }
            const dupT = importPreview.tournaments.filter((t) => tournaments.some((c) => c.id === t.id)).length
            return (
              <div className="space-y-3 text-sm">
                <ul className="space-y-1 text-slate-300">
                  <li>Sauvegarde du {fmtDate(importPreview.exportedAt.slice(0, 10))}</li>
                  <li>• {importPreview.tournaments.length} tournois ({dupT} déjà présents = doublons potentiels)</li>
                  <li>• {importPreview.partners.length} partenaires</li>
                  <li>• {importPreview.availabilities.length} disponibilités · {importPreview.events.length} événements</li>
                  <li>• {importPreview.officialRankings.length} classements officiels</li>
                  <li>
                    Actuel : {cur.tournaments.length} tournois · {cur.partners.length} partenaires
                  </li>
                </ul>
                <div className="flex gap-2">
                  <button className="btn-primary flex-1" onClick={merge}>
                    Fusionner (remplace les mêmes id)
                  </button>
                  <button className="btn-danger flex-1" onClick={replace}>
                    Remplacer tout
                  </button>
                </div>
              </div>
            )
          })()}
        </Modal>
      )}

      {confirmWipe && (
        <Modal open onClose={() => setConfirmWipe(false)} title="Effacer toutes les données ?">
          <p className="text-sm text-slate-300">
            Tournois, partenaires, calendrier, budget et classements seront supprimés de cet appareil. Aucun
            effacement silencieux : faites d'abord un export JSON.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              className="btn-danger flex-1"
              onClick={async () => {
                if (!confirm('Confirmation finale : tout effacer ?')) return
                await replaceAll({
                  settings: { id: 'app', playerName: '', budgetMonthly: 0, budgetYear: 0, onboardingDone: true, viewYear: 2026 },
                  tournaments: [],
                  partners: [],
                  availabilities: [],
                  events: [],
                  officialRankings: [],
                })
                setConfirmWipe(false)
              }}
            >
              Tout effacer
            </button>
            <button className="btn-ghost" onClick={() => setConfirmWipe(false)}>
              Annuler
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function ProfileSettings({ s, onClose }: { s: Awaited<ReturnType<typeof getSettings>>; onClose: () => void }) {
  const [name, setName] = useState(s.playerName)
  const [monthly, setMonthly] = useState(String(s.budgetMonthly ? s.budgetMonthly / 100 : ''))
  const save = async () => {
    await saveSettings({ playerName: name.trim(), budgetMonthly: parseMoney(monthly) })
    onClose()
  }
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="label">Prénom / pseudo</span>
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="block">
        <span className="label">Budget mensuel (€)</span>
        <input className="field" inputMode="decimal" value={monthly} onChange={(e) => setMonthly(e.target.value)} />
      </label>
      <button className="btn-primary" onClick={save}>
        Enregistrer
      </button>
    </div>
  )
}

/** Données de démonstration : comptées, marquées [DÉMO], jamais présentées comme réelles. */
async function loadDemo() {
  if (!confirm('Charger un jeu de données FICTIF (5 tournois marqués [DÉMO], 2 partenaires) ?')) return
  const p1 = uid()
  const p2 = uid()
  await db.partners.bulkPut([
    { id: p1, name: 'Marc [DÉMO]', usualPosition: 'gauche', favorite: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: p2, name: 'Sophie [DÉMO]', usualPosition: 'flexible', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ])
  const mk = (d: string, cat: 'P25' | 'P100' | 'P250' | 'P500', status: import('../types').TournamentStatus, opts: Partial<{ pairs: number; place: number; partnerId: string; position: 'droite' | 'gauche'; club: string; city: string }>): import('../types').Tournament => ({
    id: uid(),
    name: `Tournoi ${cat} ${new Date(d).toLocaleDateString('fr-FR')} [DÉMO]`,
    date: d,
    category: cat,
    gender: 'messieurs',
    club: opts.club ?? '4PADEL Démo',
    city: opts.city ?? 'Ville démo',
    position: opts.position ?? 'droite',
    partnerId: opts.partnerId,
    status,
    pairs: opts.pairs,
    place: opts.place,
    expenses: status === 'joue' ? [{ id: uid(), kind: 'inscription', mode: 'paye', amount: 3500 }] : [{ id: uid(), kind: 'inscription', mode: 'prevu', amount: 3500 }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  const list: import('../types').Tournament[] = [
    mk('2026-04-11', 'P25', 'joue', { pairs: 28, place: 4, partnerId: p1, position: 'droite', city: 'Toulouse' }),
    mk('2026-05-23', 'P100', 'joue', { pairs: 30, place: 9, partnerId: p1, position: 'droite', city: 'Bordeaux' }),
    mk('2026-06-20', 'P100', 'joue', { pairs: 24, place: 13, partnerId: p2, position: 'gauche', city: 'Lyon' }),
    mk('2026-07-04', 'P250', 'joue', { pairs: 32, place: 15, partnerId: p1, position: 'droite', city: 'Toulon' }),
    mk('2026-10-17', 'P25', 'inscrit', { partnerId: p1, position: 'droite', city: 'Bordeaux' }),
    mk('2026-11-14', 'P100', 'envisage', { city: 'Pau' }),
  ]
  // calcul des points FFT via le moteur (au chargement)
  const { computePoints } = await import('../lib/fft/points')
  list.forEach((t) => {
    const r = computePoints({ date: t.date, category: t.category as 'P25', gender: t.gender, pairs: t.pairs ?? null, place: t.place ?? null })
    if (r.status === 'ok') t.fftResult = { status: 'ok', points: r.points, grilleLabel: r.grilleLabel }
    else if (t.place != null) t.fftResult = { status: 'impossible', reason: r.reason }
  })
  await db.tournaments.bulkPut(list)
  await db.availabilities.bulkPut([
    { date: '2026-03-08', state: 'indisponible', note: '[DÉMO] week-end famille' },
    { date: '2026-10-10', state: 'disponible' },
  ])
  await db.officialRankings.put({ id: uid(), date: '2026-10-06', rank: 3250, points: 415, source: 'saisie_manuelle', note: '[DÉMO] exemple Ten\u2019Up' })
}
