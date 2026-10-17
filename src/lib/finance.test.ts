import { describe, expect, it } from 'vitest'
import { tournamentMoney, periodBudget, inPeriod } from './finance'
import type { Tournament, Expense } from '../types'

const e = (mode: 'prevu' | 'paye', amount: number): Expense => ({ id: `e${amount}${mode}`, kind: 'inscription', mode, amount })

function t(id: string, date: string, expenses: Expense[], status: Tournament['status'] = 'inscrit'): Tournament {
  return {
    id,
    name: id,
    date,
    category: 'P25',
    gender: 'messieurs',
    club: '',
    city: '',
    position: 'droite',
    status,
    expenses,
    createdAt: date,
    updatedAt: date,
  }
}

describe('finances', () => {
  it('prévu et payé jamais additionnés deux fois', () => {
    const t1 = t('a', '2026-10-16', [e('paye', 3500)])
    const m = tournamentMoney(t1)
    expect(m.paye).toBe(3500)
    expect(m.prevu).toBe(0)
    // engagement = payé + prévu non payé
  })

  it('le passage prévu → payé déplace le montant sans duplication', () => {
    const t1 = t('a', '2026-10-16', [e('prevu', 3500)])
    expect(tournamentMoney(t1).engagement ?? null).toBeNull()
    let b = periodBudget([t1], 2026, 9, { monthly: 10000, year: 0 })
    expect(b.engagement).toBe(3500)
    expect(b.totalPrevuNonEngage).toBe(3500)
    expect(b.totalPaye).toBe(0)
    // conversion
    t1.expenses[0].mode = 'paye'
    t1.expenses[0].paidOn = '2026-10-17'
    b = periodBudget([t1], 2026, 9, { monthly: 10000, year: 0 })
    expect(b.engagement).toBe(3500) // inchangé (pas de double comptage)
    expect(b.totalPaye).toBe(3500)
    expect(b.totalPrevuNonEngage).toBe(0)
  })

  it('restant et dépassement', () => {
    const transport: Expense = { id: 'tr1', kind: 'transport', mode: 'prevu', amount: 4000 }
    const t1 = t('a', '2026-10-16', [e('paye', 8000), transport])
    const b = periodBudget([t1], 2026, 9, { monthly: 10000, year: 0 })
    expect(b.restant).toBe(-2000)
    expect(b.depassement).toBe(2000)
  })

  it('vue annuelle sans budget année → 12 × mensuel', () => {
    const b = periodBudget([t('a', '2026-10-16', [])], 2026, undefined, { monthly: 10000, year: 0 })
    expect(b.budget).toBe(120000)
  })

  it('annulé : la dépense n\u2019est pas comptée comme résultat joué (statut uniquement)', () => {
    // les dépense sont conservées mais les stats excluent les tournois annulés (cf. partners/stats)
    expect(inPeriod(t('a', '2026-10-16', [], 'annule'), 2026, 9)).toBe(true)
  })

  it('exclusions mensuelles précises', () => {
    expect(inPeriod(t('a', '2026-10-16', []), 2026, 9)).toBe(true)
    expect(inPeriod(t('a', '2026-11-01', []), 2026, 9)).toBe(false)
    expect(inPeriod(t('a', '2027-10-16', []), 2026)).toBe(false)
  })
})
