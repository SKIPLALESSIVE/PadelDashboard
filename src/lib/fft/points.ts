import { rulesBySeason, ruleFor, SEASON_BOUNDS, type Season } from '../../data/fft-rules'
import type { TCategory, TGender } from '../../types'

export type GenderFactor = 'messieurs' | 'dames' | 'mixte'

export interface PointsInput {
  /** ISO yyyy-MM-dd : sert à choisir le barème applicable */
  date: string
  category: TCategory
  gender: TGender
  /** nombre effectif de paires du tableau */
  pairs: number | null
  /** rang retenu par la FFT (rang d'ex æquo le moins avantageux déjà déduit) */
  place: number | null
}

export interface PointsOk {
  status: 'ok'
  points: number
  season: Season
  grilleLabel: string
  source: string
}

export interface PointsImpossible {
  status: 'impossible'
  season: Season | null
  grilleLabel?: string
  reason: string
}

export type PointsResult = PointsOk | PointsImpossible

export const SANS_LIMITATION = 'Pas de limitation de classement'

/** Saison sportive applicable à une date (barèmes transcrits). */
export function seasonOf(date: string): Season | null {
  const d = date >= '2026-03-01' && date <= '2026-08-31' ? '2026' : date >= '2026-09-01' ? '2027' : null
  return d as Season | null
}

export function bracketsForPairs(pairs: number, brackets: readonly string[]): number {
  // Colonne applicative : dernière tranche dont la borne supérieure couvre le nombre de paires.
  for (let i = 0; i < brackets.length; i++) {
    const b = brackets[i]
    if (b.endsWith('+')) return i
    const sup = Number(b.split('-')[1])
    if (pairs <= sup) return i
  }
  return brackets.length - 1
}

/** Libellé de grille lisible, affiché sous le calcul pour vérification. */
// Libellé de grille déjà présent dans PointsOk.grilleLabel.

/** Points FFT individuels : le barème applique la grille selon season/catégorie/gender.
 *  mixte : grilles P25–P1000 messieurs/dames identiques jusqu'en P250 (cf. cuts) —
 *  au-delà, le règle n'a pas d'épreuve mixte ; on utilise la grille messieurs uniquement si
 *  catégorie le permet (P500+), sinon règle non vérifiée. */
export function computePoints(input: PointsInput): PointsResult {
  if (!input.category) return { status: 'impossible', season: null, reason: 'Catégorie non renseignée' }
  if (!input.date) return { status: 'impossible', season: null, reason: 'Date non renseignée' }
  const season = seasonOf(input.date)
  if (!season) {
    return {
      status: 'impossible',
      season: null,
      reason: 'Barème antérieur au 01/03/2026 non codé — saisie manuelle ou override possible',
    }
  }
  const rule = ruleFor(season, input.category)
  if (!rule) return { status: 'impossible', season, reason: `Pas de barème pour ${input.category} en saison ${season}` }

  if (input.place == null || input.place < 1)
    return { status: 'impossible', season, grilleLabel: rule.source, reason: 'Place finale non renseignée' }

  const genderKey: 'messieurs' | 'dames' =
    input.gender === 'dames' ? 'dames' : 'messieurs'
  const isMixte = input.gender === 'mixte'

  if (rule.grid.kind === 'brackets') {
    if (rule.grid.rows.length === 0)
      return { status: 'impossible', season, grilleLabel: rule.source, reason: rule.source.includes('non vérifiée') ? 'Règle non vérifiée (grille officielle non lisible dans le PDF) — override manuel possible' : 'Grille indisponible' }
    if (input.pairs == null || input.pairs < 1)
      return { status: 'impossible', season, grilleLabel: rule.source, reason: 'Nombre de paires non renseigné' }
    if (input.place > input.pairs)
      return { status: 'impossible', season, grilleLabel: rule.source, reason: `Place (${input.place}) > nombre de paires (${input.pairs})` }
    const bi = bracketsForPairs(input.pairs, rule.grid.brackets)
    // Les rangs ex æquo sont déjà au ram « le moins avantageux » selon la FFT.
    const rowIndex = Math.min(input.place, rule.grid.rows.length) - 1
    const pts = rule.grid.rows[rowIndex]?.[bi] ?? null
    const grilleLabel = `${input.category} · saison ${season} · tableau ${rule.grid.brackets[bi]} paires${isMixte ? ' · mixte' : ''}`
    if (pts == null)
      return { status: 'impossible', season, grilleLabel, reason: 'Aucun point au rang indiqué pour cette taille de tableau (vérifier place/paires)' }
    return { status: 'ok', points: pts, season, grilleLabel, source: rule.source }
  }

  // Grille unique (saison 2027 : P500 / P1000 / P2000 / P3000)
  if (isMixte) {
    const existsMixte = Number(input.category.slice(1)) <= 250
    if (!existsMixte) {
      return { status: 'impossible', season, grilleLabel: rule.source, reason: `Pas d'épreuve mixte en ${input.category} pour la saison ${season}` }
    }
  }
  const g = rule.grid[genderKey]
  const cap = g.capIndex // index de la première ligne « N et plus »
  // Dernière ligne des grilles uniques = rang « N et plus » (rang tenu par la FFT).
  const bezier = cap ?? g.rows.length - 1
  const pts = input.place - 1 >= bezier ? g.rows[bezier] : g.rows[input.place - 1]
  const grilleLabel = `${input.category} · saison ${season} · grille ${input.gender} · rang ${input.place}`
  return { status: 'ok', points: pts, season, grilleLabel, source: rule.source }
}

/** Formatte la grille applicable (pour tests et affichages). */
export function describeRule(season: Season, category: TCategory, gender: TGender): string {
  const rule = ruleFor(season, category)
  if (!rule) return 'règle absente'
  if (rule.grid.kind === 'brackets') return `${category} (${season}) : grille par tranches de paires`
  const g = rule.grid[gender === 'dames' ? 'dames' : 'messieurs']
  return `${category} (${season}) : grille unique ${gender}, ${g.capIndex != null ? `${g.capIndex + 1} et plus` : '32 rangs'}`
}

export function unknowableReason(input: PointsInput): string {
  const pts = computePoints(input)
  return pts.status === 'impossible' ? pts.reason : ''
}

/** Utilitaire exporté pour le moteur classement. */
export { rulesBySeason, SEASON_BOUNDS, type Season }
