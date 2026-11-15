import { describe, expect, it } from 'vitest'
import { fmt, fmtP } from '../features/explorer/hooks'
import { divergingColor } from './variables'

describe('divergingColor', () => {
  it('uses the dark neutral at zero so unchanged cells are not holes', () => {
    expect(divergingColor('BrBG_r', 0)).toBe('rgb(42,31,56)')
  })
  it('clamps beyond the legend range', () => {
    expect(divergingColor('RdBu_r', 5)).toBe(divergingColor('RdBu_r', 1))
  })
  it('puts blue at the low end and red at the high end for NO2/ozone', () => {
    const lo = divergingColor('RdBu_r', -1)
    const hi = divergingColor('RdBu_r', 1)
    const rgb = (s: string) => s.match(/\d+/g)!.map(Number)
    expect(rgb(lo)[2]).toBeGreaterThan(rgb(lo)[0])
    expect(rgb(hi)[0]).toBeGreaterThan(rgb(hi)[2])
  })
})

describe('formatters', () => {
  it('shows an explicit sign and a true minus', () => {
    expect(fmt(1.234)).toBe('+1.23')
    expect(fmt(-1.234)).toBe('−1.23')
  })
  it('handles missing values and tiny p-values', () => {
    expect(fmt(null)).toBe('—')
    expect(fmtP(0.00001)).toBe('<0.001')
  })
})
