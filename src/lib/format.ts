import { format, parseISO } from 'date-fns'

export function fmtDate(iso: string | undefined): string {
  if (!iso) return ''
  try {
    return format(parseISO(iso), 'EEE d MMM yyyy')
  } catch {
    return iso
  }
}

export function fmtDateShort(iso: string | undefined): string {
  if (!iso) return ''
  try {
    return format(parseISO(iso), 'd MMM')
  } catch {
    return iso
  }
}

/** Montants : stockés en centimes, affichés en euros. */
export function fmtMoney(cents: number | undefined | null): string {
  const v = (cents ?? 0) / 100
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: Math.abs(v) < 1000 ? 2 : 0 }).format(v)
}

export function parseMoney(input: string): number {
  // '', '12', '12,5', '12.50' → centimes
  const cleaned = input.replace(/\s/g, '').replace(',', '.')
  const n = Number(cleaned)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.round(n * 100)
}

export function toInputMoney(cents: number | undefined): string {
  if (cents == null) return ''
  return (cents / 100).toFixed(2).replace('.', ',').replace(/,00$/, '')
}
