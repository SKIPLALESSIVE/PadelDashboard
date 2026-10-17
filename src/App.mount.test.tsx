import 'fake-indexeddb/auto'
import { beforeAll, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import App from './App'

// jsdom n'implémente pas window.scrollTo
beforeAll(() => {
  window.scrollTo = (() => {}) as unknown as typeof window.scrollTo
})

it('monte App sans exception (navigation + tableau de bord visibles)', async () => {
  render(<App />)
  await new Promise((r) => setTimeout(r, 200))
  // Sidebar desktop
  expect(document.querySelector('aside')).toBeTruthy()
  // Header avec bouton principal
  expect(document.querySelector('header')).toBeTruthy()
  expect(document.body.textContent).toContain('Tableau de bord')
})
