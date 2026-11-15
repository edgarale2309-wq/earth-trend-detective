import { create } from 'zustand'
import type { RegionId, VariableId } from '../../core/variables'

export type Mode = 'explorer' | 'scientific'
export type Resolution = 'annual' | 'monthly'

interface ExplorerState {
  variable: VariableId | 'home'
  region: RegionId
  start: number
  end: number
  resolution: Resolution
  mode: Mode
  deseasonalize: boolean
  point: { lat: number; lon: number } | null
  state: string | null
  set: (p: Partial<Omit<ExplorerState, 'set'>>) => void
}

export const MIN_YEAR = 1984
export const MAX_YEAR = 2025

export const useExplorer = create<ExplorerState>((set) => ({
  variable: 'home',
  region: 'mexico',
  start: MIN_YEAR,
  end: MAX_YEAR,
  resolution: 'annual',
  mode: 'explorer',
  deseasonalize: true,
  point: null,
  state: null,
  set: (p) => set(p),
}))
