/** Budget et finances — calculs purs en centimes entiers.
 *  Prévu et payé ne sont JAMAIS additionnés : engagement = payé + reste prévu. */
import type { Expense, Tournament } from '../types'

export function sumExpenses(expenses: Expense[], modes: ('prevu' | 'paye')[]): number {
  return expenses.filter((e) => modes.includes(e.mode)).reduce((s, e) => s + e.amount, 0)
}

export interface MoneyLine {
  paye: number
  prevu: number
}

export function tournamentMoney(t: Tournament): MoneyLine {
  return {
    paye: sumExpenses(t.expenses, ['paye']),
    // prévu NON ENGAGÉ seulement (le payé n'est jamais compté en prévu)
    prevu: sumExpenses(t.expenses, ['prevu']),
  }
}

export interface PeriodBudget {
  totalPaye: number
  totalPrevuNonEngage: number
  /** engagement = payé + prévu non encore payé (pas de double comptage) */
  engagement: number
  budget: number
  restant: number
  /** dépassement éventuel */
  depassement: number
}

/** Filtrer les tournois dont la date (année/mois) tombe dans la période. */
export function inPeriod(t: Tournament, year: number, month?: number): boolean {
  const y = Number(t.date.slice(0, 4))
  if (month != null) return y === year && Number(t.date.slice(5, 7)) === month + 1
  return y === year
}

export function periodBudget(
  tournaments: Tournament[],
  year: number,
  month: number | undefined,
  budgets: { monthly: number; year: number },
): PeriodBudget {
  const sel = tournaments.filter((t) => inPeriod(t, year, month))
  let paye = 0
  let prevuNonEngage = 0
  for (const t of sel) {
    const m = tournamentMoney(t)
    paye += m.paye
    prevuNonEngage += m.prevu
  }
  const engagement = paye + prevuNonEngage
  // Si pas de budget annuel saisi, la vue annuelle retombe sur 12 × le budget mensuel.
  const budget = month != null ? budgets.monthly : budgets.year || budgets.monthly * 12
  const restant = budget - engagement
  return {
    totalPaye: paye,
    totalPrevuNonEngage: prevuNonEngage,
    engagement,
    budget,
    restant,
    depassement: Math.max(0, -restant),
  }
}

export function prepaidMarkedPaid(t: Tournament, kind: Expense['kind']): void {
  // utilitaire : convertir une prévision en payée (montant conservé)
  const e = t.expenses.find((x) => x.kind === kind && x.mode === 'prevu')
  if (e) {
    e.mode = 'paye'
    e.paidOn = new Date().toISOString().slice(0, 10)
  }
}
