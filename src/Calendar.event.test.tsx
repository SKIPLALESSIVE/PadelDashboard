import 'fake-indexeddb/auto'
import { beforeEach, expect, it } from 'vitest'
import { render, act } from '@testing-library/react'
import CalendarPage from './pages/Calendar'
import { db } from './db/db'

// jsdom n'implémente pas window.scrollTo
window.scrollTo = (() => {}) as unknown as typeof window.scrollTo

beforeEach(async () => {
  await db.delete()
  await db.open()
})

it('affiche un événement ajouté dans db.events sur la cellule du jour', async () => {
  const { container } = render(<CalendarPage onOpenCreate={() => {}} onGoTournaments={() => {}} />)
  await act(async () => {
    await new Promise((r) => setTimeout(r, 150))
  })

  const now = new Date()
  const p2 = (n: number) => String(n).padStart(2, '0')
  const iso = `${now.getFullYear()}-${p2(now.getMonth() + 1)}-${p2(now.getDate())}`
  const dayNum = String(now.getDate())

  // Simuler exactement ce que fait la modale : put d'un événement non tournoi
  await act(async () => {
    await db.events.put({ id: 'e-test', date: iso, kind: 'cours', label: 'cours collectif' })
    await new Promise((r) => setTimeout(r, 250))
  })

  // Exclure les boutons d'année (« 2026 ») qui commencent aussi par le numéro du jour
  const cells = Array.from(container.querySelectorAll('button'))
    .map((b) => (b.textContent ?? '').trim())
    .filter((t) => !/^\d{4}$/.test(t))
  const todayCell = cells.find((t) => new RegExp(`^${dayNum}\\b`).test(t))
  expect(todayCell, `cellule du jour trouvée pour ${iso} ?`).toBeDefined()
  expect(todayCell, `cellule du jour: « ${todayCell} » — l'emoji 🎓 (cours) doit être affiché`).toContain('🎓')
})
