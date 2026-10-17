import { describe, expect, it } from 'vitest'
import { computePoints, seasonOf, bracketsForPairs } from './points'

const P25 = (pairs: number, place: number, date = '2026-10-16', gender = 'messieurs') =>
  computePoints({ date, category: 'P25', gender: gender as 'messieurs', pairs, place })

describe('saison applicable', () => {
  it('avant le 01/03/2026 : non codé', () => {
    expect(seasonOf('2026-02-28')).toBeNull()
  })
  it('01/03/2026 → saison 2026', () => {
    expect(seasonOf('2026-03-01')).toBe('2026')
    expect(seasonOf('2026-08-31')).toBe('2026')
  })
  it('01/09/2026 → saison 2027', () => {
    expect(seasonOf('2026-09-01')).toBe('2027')
    expect(seasonOf('2027-12-31')).toBe('2027')
  })
})

describe('tranches de tableau', () => {
  it('bornes des tranches', () => {
    expect(bracketsForPairs(4, ['4-8', '9-12'])).toBe(0)
    expect(bracketsForPairs(8, ['4-8', '9-12'])).toBe(0)
    expect(bracketsForPairs(9, ['4-8', '9-12', '13-16'])).toBe(1)
    expect(bracketsForPairs(40, ['29-32+'])).toBe(0)
  })
})

describe('points P25 saison 2027 (cas officiels du guide juillet 2026)', () => {
  it('vainqueur 8 paires → 25', () => {
    expect(P25(8, 1)).toMatchObject({ status: 'ok', points: 25 })
  })
  it('4e place sur 8 paires → 9 points (critère métier)', () => {
    // Critère d'acceptation : P25 « joué », X paires, place 4 → barème 2027 applicable.
    const r = P25(8, 4)
    expect(r.status).toBe('ok')
    if (r.status === 'ok') {
      expect(r.points).toBe(9)
      expect(r.grilleLabel).toContain('saison 2027')
    }
  })
  it('rang 1 de 17 à 20 paires → 25', () => {
    expect(P25(20, 1)).toMatchObject({ status: 'ok', points: 25 })
  })
  it('colonne 29-32+: rang 6 → 14, rang 8 → 12, rang 16 → 3', () => {
    expect(P25(30, 6)).toMatchObject({ status: 'ok', points: 14 })
    expect(P25(30, 8)).toMatchObject({ status: 'ok', points: 12 })
    expect(P25(30, 16)).toMatchObject({ status: 'ok', points: 3 })
  })
  it('plus de 32 paires → colonne 29-32+', () => {
    expect(P25(40, 1)).toMatchObject({ status: 'ok', points: 25 })
  })
  it('mixte : même grille que messieurs/dames', () => {
    const m = P25(8, 4, '2026-10-16', 'mixte')
    expect(m.status).toBe('ok')
    if (m.status === 'ok') expect(m.points).toBe(9)
  })
})

describe('changement de saison 2026 → 2027', () => {
  it('P25 saison 2026 rang 6 sur 30 paires → 13, saison 2027 → 14', () => {
    expect(P25(30, 6, '2026-06-15')).toMatchObject({ status: 'ok', points: 13 })
    expect(P25(30, 6, '2026-10-16')).toMatchObject({ status: 'ok', points: 14 })
  })
})

describe('P100 saison 2027', () => {
  it('rang 1 quel que soit le tableau → 100', () => {
    expect(computePoints({ date: '2026-10-16', category: 'P100', gender: 'messieurs', pairs: 32, place: 1 })).toMatchObject({ status: 'ok', points: 100 })
    expect(computePoints({ date: '2026-10-16', category: 'P100', gender: 'messieurs', pairs: 8, place: 1 })).toMatchObject({ status: 'ok', points: 100 })
  })
  it('perdants 8e de finale ex æquo rang 9 (ex. 28 équipes) → 38', () => {
    // 28 paires → colonne 25-28 ; rang 9 → 38 (grille 2027 : rang9 col25-28 = 38)
    const r = computePoints({ date: '2026-10-16', category: 'P100', gender: 'messieurs', pairs: 28, place: 9 })
    expect(r.status).toBe('ok')
    if (r.status === 'ok') expect(r.points).toBe(38)
  })
})

describe('P500 / P1000 saison 2027 : grille unique', () => {
  it('P1000 messieurs rang 2 → 850, rang 32 et plus → 30', () => {
    expect(computePoints({ date: '2026-10-16', category: 'P1000', gender: 'messieurs', pairs: 24, place: 2 })).toMatchObject({ status: 'ok', points: 850 })
    expect(computePoints({ date: '2026-10-16', category: 'P1000', gender: 'messieurs', pairs: 32, place: 32 })).toMatchObject({ status: 'ok', points: 30 })
    expect(computePoints({ date: '2026-10-16', category: 'P1000', gender: 'messieurs', pairs: 32, place: 40 })).toMatchObject({ status: 'ok', points: 30 })
  })
  it('P1000 dames : grille s\u2019arrête à « 25 et plus » → 40', () => {
    expect(computePoints({ date: '2026-10-16', category: 'P1000', gender: 'dames', pairs: 28, place: 25 })).toMatchObject({ status: 'ok', points: 40 })
    expect(computePoints({ date: '2026-10-16', category: 'P1000', gender: 'dames', pairs: 28, place: 30 })).toMatchObject({ status: 'ok', points: 40 })
  })
  it('P500 dames rang 21 → 60, rang 25 et plus → 20', () => {
    expect(computePoints({ date: '2026-10-16', category: 'P500', gender: 'dames', pairs: 24, place: 21 })).toMatchObject({ status: 'ok', points: 60 })
    expect(computePoints({ date: '2026-10-16', category: 'P500', gender: 'dames', pairs: 30, place: 26 })).toMatchObject({ status: 'ok', points: 20 })
  })
  it('mixte en P500+ : pas d\u2019épreuve', () => {
    expect(computePoints({ date: '2026-10-16', category: 'P500', gender: 'mixte', pairs: 24, place: 1 })).toMatchObject({ status: 'impossible' })
  })
})

describe('P1000 saison 2026 : non vérifié', () => {
  it('affiche règle non vérifiée, jamais de valeur fictive', () => {
    const r = computePoints({ date: '2026-06-15', category: 'P1000', gender: 'messieurs', pairs: 24, place: 1 })
    expect(r.status).toBe('impossible')
    if (r.status === 'impossible') expect(r.reason).toMatch(/non vérifiée/)
  })
})

describe('cas impossibles explicites', () => {
  it('place > paires', () => {
    expect(P25(24, 25, '2026-10-16')).toMatchObject({ status: 'impossible' })
  })
  it('paires non renseignée', () => {
    expect(P25(0, 4)).toMatchObject({ status: 'impossible', reason: /paires/i })
  })
  it('place non renseignée', () => {
    expect(computePoints({ date: '2026-10-16', category: 'P25', gender: 'messieurs', pairs: 24, place: 0 })).toMatchObject({ status: 'impossible', reason: /place/i })
  })
})

describe('P1500 — abrogée en saison 2027', () => {
  it('P1500 existe en saison 2026', () => {
    expect(computePoints({ date: '2026-06-15', category: 'P1500', gender: 'messieurs', pairs: 24, place: 1 })).toMatchObject({ status: 'ok', points: 1500 })
  })
  it('P1500 impossible en saison 2027', () => {
    expect(computePoints({ date: '2026-10-16', category: 'P1500', gender: 'messieurs', pairs: 24, place: 1 })).toMatchObject({ status: 'impossible' })
  })
})

describe('P2000 / P3000 saison 2027 uniques', () => {
  it('P2000 rang 4 → 1400', () => {
    expect(computePoints({ date: '2026-10-16', category: 'P2000', gender: 'messieurs', pairs: null, place: 4 })).toMatchObject({ status: 'ok', points: 1400 })
  })
  it('P3000 rang 6 → 1740', () => {
    expect(computePoints({ date: '2026-10-16', category: 'P3000', gender: 'dames', pairs: null, place: 6 })).toMatchObject({ status: 'ok', points: 1740 })
  })
})
