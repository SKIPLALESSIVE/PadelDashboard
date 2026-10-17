/**
 * Classement glissant FFT : les 12 meilleurs résultats sur les 12 derniers mois.
 *
 * Le classement FFT est publié le 1er mardi de chaque mois et « tient compte, pour chaque
 * joueur, des 12 meilleurs résultats obtenus au cours des 12 derniers mois » (Chapitre II).
 * Le rang EXACT attribué par la FFT dépend d'une population complète de joueurs : il ne peut
 * PAS être inféré des seuls tournois personnels (rang = saisie manuelle / Ten'Up).
 *
 * Fenêtre glissante : un résultat daté D compte sur la période [D, D+12 mois) ; à la date de
 * calcul T, sont retenus les résultats dont la date > T-12 mois (borne exclusive).
 * Cette fonction est pure : les tournois annulés et non joués sont exclus Actif.
 */
import { addMonths, format, parseISO } from 'date-fns'
import type { Tournament } from '../../types'
import { computePoints, type PointsResult } from './points'

export interface ResultLine {
  tournamentId: string
  name: string
  date: string
  points: number
  /** calculé vs override */
  origin: 'calcule' | 'manuel'
  grilleLabel?: string
}

export interface RankingSnapshot {
  date: string
  /** 12 meilleurs résultats retenus, triés par points décroissants puis date */
  kept: ResultLine[]
  total: number
  /** résultats dans la fenêtre mais non retenus (au-delà du top 12) */
  dropped: ResultLine[]
  /** résultats qui sortiront de la fenêtre dans les 60 jours suivants */
  expiringSoon: ResultLine[]
}

const isJoue = (t: Tournament) => t.status === 'joue'

function resultPoint(t: Tournament): number | null {
  const r = t.fftResult
  if (!r) return null
  if (r.points != null) return r.points
  return null
}

export function resultLine(t: Tournament, _dateT: string): ResultLine | null {
  const r = t.fftResult
  const p = resultPoint(t)
  if (p == null || !r) return null
  return {
    tournamentId: t.id,
    name: t.name,
    date: t.date,
    points: p,
    origin: r.status === 'override' ? 'manuel' : 'calcule',
    grilleLabel: r.grilleLabel,
  }
}

/** Renvoie true si le résultat est encore dans la fenêtre glissante à la date dateT. */
export function inWindow(t: Tournament, dateT: string): boolean {
  const T = parseISO(dateT)
  const limit = addMonths(T, -12)
  return parseISO(t.date) > limit
}

export function nextExpiry(t: Tournament): string {
  // date à laquelle le résultat sort : tournoi + 12 mois (borne exclusive : jour +1)
  return format(addMonths(parseISO(t.date), 12), 'yyyy-MM-dd')
}

export function rankingOn(
  tournaments: Tournament[],
  dateT: string,
  window: RankingWindow = '12mois',
): RankingSnapshot {
  const played = tournaments.filter(isJoue)
  let results = played
    .map((t) => resultLine(t, dateT))
    .filter((l): l is ResultLine => l != null)

  if (window === '12mois') {
    results = results.filter((l) => inWindowByDate(l.date, dateT))
  }

  const sorted = [...results].sort((a, b) => b.points - a.points || a.date.localeCompare(b.date))
  const kept = sorted.slice(0, 12)
  const dropped = sorted.slice(12)
  const expiringSoon = kept
    .filter((l) => {
      const exp = nextExpiry({ date: l.date } as Tournament)
      const sixty = format(addMonths(parseISO(dateT), 2), 'yyyy-MM-dd')
      return exp <= sixty
    })
    .sort((a, b) => nextExpiry({ date: a.date } as Tournament).localeCompare(nextExpiry({ date: b.date } as Tournament)))

  const total = kept.reduce((s, l) => s + l.points, 0)
  return { date: dateT, kept, total, dropped, expiringSoon }
}

function inWindowByDate(dateD: string, dateT: string): boolean {
  return parseISO(dateD) > addMonths(parseISO(dateT), -12)
}

export type RankingWindow = '12mois' | 'tout'

/** Simulation pure : points si l'épreuve décrite finissait au rang indiqué. */
export interface SimulationInput {
  date: string
  category: Parameters<typeof computePoints>[0]['category']
  gender: Parameters<typeof computePoints>[0]['gender']
  pairs: number | null
  place: number
}

export function simulatePoints(input: SimulationInput): PointsResult {
  return computePoints({ ...input })
}

/** Simulation : nouveau total si ce résultat s'ajoute au classement courant. */
export function simulateTotal(
  tournaments: Tournament[],
  dateT: string,
  input: SimulationInput,
): { newTotal: number; currentTotal: number; addPoints: number; replaces: ResultLine[] } {
  const cur = rankingOn(tournaments, dateT)
  const sim = simulatePoints(input)
  if (sim.status !== 'ok') return { newTotal: cur.total, currentTotal: cur.total, addPoints: 0, replaces: [] }
  const line: ResultLine = {
    tournamentId: '__sim__',
    name: 'Simulation',
    date: input.date,
    points: sim.points,
    origin: 'calcule',
    grilleLabel: sim.grilleLabel,
  }
  const all = [...cur.kept, ...cur.dropped, line]
  const sorted = all.sort((a, b) => b.points - a.points || a.date.localeCompare(b.date))
  const kept = sorted.slice(0, 12)
  return {
    newTotal: kept.reduce((s, l) => s + l.points, 0),
    currentTotal: cur.total,
    addPoints: sim.points,
    replaces: cur.kept.filter((l) => !kept.some((k) => k.tournamentId === l.tournamentId)),
  }
}
