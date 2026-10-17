import { describe, expect, it } from 'vitest'
import { rankingOn, simulateTotal, nextExpiry, inWindow } from './ranking'
import type { Tournament } from '../../types'

function t(id: string, date: string, points: number, status: 'joue' | 'annule' = 'joue'): Tournament {
  return {
    id,
    name: `T-${id}`,
    date,
    category: 'P25',
    gender: 'messieurs',
    club: '',
    city: '',
    position: 'droite',
    status,
    fftResult: { status: 'ok', points, grilleLabel: 'test' },
    expenses: [],
    createdAt: date,
    updatedAt: date,
  }
}

const AT = '2027-01-15'

describe('classement glissant', () => {
  it('ne retient que les 12 meilleurs sur 12 mois', () => {
    const ts: Tournament[] = []
    for (let i = 0; i < 15; i++) ts.push(t(`${i}`, `2026-06-${String((i % 28) + 1).padStart(2, '0')}`, 10 + i))
    const snap = rankingOn(ts, AT)
    expect(snap.kept).toHaveLength(12)
    expect(snap.total).toBe(13 + 14 + 15 + 16 + 17 + 18 + 19 + 20 + 21 + 22 + 23 + 24)
    expect(snap.dropped).toHaveLength(3)
  })

  it('exclut les tournois annulés et les non joués', () => {
    const ts = [t('a', '2026-10-01', 100, 'annule'), t('b', '2026-11-01', 50)]
    ts.push({ ...t('c', '2026-12-01', 40), status: 'inscrit', fftResult: undefined })
    const snap = rankingOn(ts, AT)
    expect(snap.kept).toHaveLength(1)
    expect(snap.total).toBe(50)
  })

  it('tenant compte de la fenêtre : un résultat vieux de plus de 12 mois sort', () => {
    const old = t('old', '2025-12-31', 999)
    const recent = t('recent', '2027-01-01', 20)
    const snap = rankingOn([old, recent], AT)
    expect(inWindow(old, AT)).toBe(false)
    expect(snap.kept.map((k) => k.tournamentId)).toEqual(['recent'])
    expect(nextExpiry(recent)).toBe('2028-01-01')
  })

  it('la borne de la fenêtre : résultat daté exactement 12 mois avant est sorti', () => {
    const exact = t('x', '2026-01-15', 10)
    expect(inWindow(exact, AT)).toBe(false)
    const plus1 = t('y', '2026-01-16', 10)
    expect(inWindow(plus1, AT)).toBe(true)
  })

  it('au-delà de 12 mois, sans fenêtre, tout compte (vue historique)', () => {
    const snap = rankingOn([t('a', '2024-01-01', 100)], AT, 'tout')
    expect(snap.total).toBe(100)
  })

  it('un tournoi expiré est retiré et les non retenus remontent (recalcul)', () => {
    const big = t('big', '2026-05-01', 100)
    const fillers = Array.from({ length: 14 }, (_, i) => t(`f${i}`, `2026-09-0${(i % 9) + 1}`, 90 - i))
    const before = rankingOn([big, ...fillers], '2026-12-01')
    expect(before.total).toBe(100 + 90 + 89 + 88 + 87 + 86 + 85 + 84 + 83 + 82 + 81 + 80)
    // big expire le 2027-05-01 ; à la date X, top 12 recalculé
    const after = rankingOn([big, ...fillers], '2027-05-02')
    expect(after.kept.some((k) => k.tournamentId === 'big')).toBe(false)
    expect(after.total).toBe(90 + 89 + 88 + 87 + 86 + 85 + 84 + 83 + 82 + 81 + 80 + 79)
  })

  it('override manuel conserve la valeur saisie', () => {
    const o: Tournament = { ...t('o', '2026-10-01', 0), fftResult: { status: 'override', points: 123 } }
    const snap = rankingOn([o], AT)
    expect(snap.total).toBe(123)
    expect(snap.kept[0].origin).toBe('manuel')
  })
})

describe('simulations', () => {
  it('ajoute la simulation et recalcule le top 12', () => {
    const fillers = Array.from({ length: 12 }, (_, i) => t(`f${i}`, `2026-09-1${i}`, 1000 - i * 10))
    const sim = simulateTotal(fillers, AT, { date: AT, category: 'P100', gender: 'messieurs', pairs: 32, place: 2 })
    expect(sim.addPoints).toBe(85) // P100 29-32+ rang 2 = 85 (grille 2027)
    // 85 < 890 minimum retenu → remplace le plus petit (890 → 870, ...)
    expect(sim.newTotal).toBeGreaterThan(sim.currentTotal)
  })

  it('clairement identifié comme prévisionnel', () => {
    const sim = simulateTotal([], AT, { date: AT, category: 'P25', gender: 'messieurs', pairs: 8, place: 4 })
    expect(sim.addPoints).toBe(9)
  })
})
