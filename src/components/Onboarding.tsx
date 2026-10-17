import { useState } from 'react'
import { db, getSettings, saveSettings, uid } from '../db/db'
import { Modal } from './ui'
import { parseMoney } from '../lib/format'

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [budget, setBudget] = useState('')
  const [partner, setPartner] = useState('')
  const [skip, setSkip] = useState(false)

  const finish = async () => {
    const s = await getSettings()
    await saveSettings({
      playerName: name.trim() || s.playerName,
      budgetMonthly: budget ? parseMoney(budget) : s.budgetMonthly,
      onboardingDone: true,
    })
    if (partner.trim()) {
      await db.partners.put({
        id: uid(),
        name: partner.trim(),
        usualPosition: 'flexible',
        favorite: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
    onDone()
  }

  return (
    <Modal open={!skip} onClose={() => {}} title="Bienvenue sur PadelTrack 🎾">
      {step === 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-300">
            Suivez vos tournois FFT 2026-2027 : calendrier, partenaires, budget, points. Tout est enregistré
            automatiquement sur votre appareil. On se règle en 30 secondes — ou passez.
          </p>
          <div className="flex gap-2">
            <button className="btn-primary flex-1" onClick={() => setStep(1)}>
              C'est parti
            </button>
            <button
              className="btn-ghost"
              onClick={async () => {
                await saveSettings({ onboardingDone: true })
                setSkip(true)
                onDone()
              }}
            >
              Plus tard
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="block">
            <span className="label">Votre prénom / pseudo</span>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="ex. Alex" />
          </label>
          <label className="block">
            <span className="label">Budget mensuel padel (€, optionnel)</span>
            <input className="field" inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="ex. 150" />
          </label>
          <label className="block">
            <span className="label">Partenaire habituel (optionnel)</span>
            <input className="field" value={partner} onChange={(e) => setPartner(e.target.value)} placeholder="ex. Marc" />
          </label>
          <p className="text-xs text-slate-400">
            Votre classement officiel Ten'Up pourra être saisi plus tard dans « Classement » : l'app ne le calculera
            jamais toute seule à partir de vos seuls tournois.
          </p>
          <button className="btn-primary w-full" onClick={finish}>
            Terminer
          </button>
        </div>
      )}
    </Modal>
  )
}
