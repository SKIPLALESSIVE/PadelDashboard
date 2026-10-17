import { describe, expect, it } from 'vitest'
import { placeRatio, isIncoherentPlace } from './placement'

describe('place normalisée', () => {
  it('4e sur 8 paires → 50 %', () => {
    expect(placeRatio(4, 8)).toBeCloseTo(0.5)
  })
  it('place > paires → null, jamais un ratio absurde > 100 %', () => {
    expect(placeRatio(13, 6)).toBeNull()
    expect(placeRatio(35, 32)).toBeNull()
    expect(isIncoherentPlace(13, 6)).toBe(true)
  })
  it('champ absent → null (pas de devinette)', () => {
    expect(placeRatio(4, undefined)).toBeNull()
    expect(placeRatio(undefined, 8)).toBeNull()
    expect(placeRatio(0, 8)).toBeNull()
  })
  it('place valide à la limite → 100 %', () => {
    expect(placeRatio(32, 32)).toBe(1)
  })
})
