import type { ReactNode } from 'react'
import { STATUS_LABELS, STATUS_ORDER, type TournamentStatus } from '../types'

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <section className={`card p-4 md:p-5 ${onClick ? 'cursor-pointer' : ''} ${className}`} onClick={onClick}>
      {children}
    </section>
  )
}

export function CardTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">{children}</h2>
      {right}
    </div>
  )
}

export function Stat({
  value,
  label,
  sub,
  accent = false,
}: {
  value: ReactNode
  label: string
  sub?: ReactNode
  accent?: boolean
}) {
  return (
    <div className={`card p-3.5 ${accent ? 'border-lime-400/40' : ''}`}>
      <div className={`text-2xl font-extrabold tracking-tight ${accent ? 'text-lime-300' : 'text-slate-100'}`}>
        {value}
      </div>
      <div className="mt-0.5 text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
  )
}

export function EmptyState({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line px-6 py-10 text-center text-slate-400">
      <span className="text-3xl" aria-hidden>
        {icon}
      </span>
      <p className="max-w-xs text-sm">{children}</p>
    </div>
  )
}

export const STATUS_COLORS: Record<TournamentStatus, string> = {
  envisage: 'bg-slate-500/25 text-slate-300',
  a_confirmer: 'bg-amber-500/20 text-amber-300',
  liste_attente: 'bg-sky-500/20 text-sky-300',
  inscrit: 'bg-lime-500/20 text-lime-300',
  joue: 'bg-emerald-500/20 text-emerald-300',
  annule: 'bg-rose-500/20 text-rose-300',
}

export function StatusBadge({ status }: { status: TournamentStatus }) {
  return <span className={`chip ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>
}

export function CategoryBadge({ category }: { category: string }) {
  if (!category) return <span className="chip bg-slate-500/20 text-slate-400">?</span>
  return <span className="chip bg-violet-500/20 text-violet-300">{category}</span>
}

export { STATUS_ORDER }

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-line bg-panel p-5 shadow-2xl md:rounded-2xl ${
          wide ? 'md:max-w-2xl' : 'md:max-w-md'
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button className="btn-ghost !px-3 !py-1.5" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
