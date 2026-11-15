export const VARIABLE_IDS = ['precipitation', 'solar_radiation', 'soil_moisture', 'surface_runoff', 'no2', 'ozone'] as const
export type VariableId = (typeof VARIABLE_IDS)[number]

export const VARIABLES: Record<VariableId, { accent: string; icon: string; map: 'BrBG' | 'PuOr_r' | 'RdBu_r' }> = {
  precipitation: { accent: '#6FB6FF', icon: 'CloudRain', map: 'BrBG' },
  solar_radiation: { accent: '#FFC266', icon: 'Sun', map: 'PuOr_r' },
  soil_moisture: { accent: '#6EDBA6', icon: 'Sprout', map: 'BrBG' },
  surface_runoff: { accent: '#5FE0E8', icon: 'Waves', map: 'BrBG' },
  no2: { accent: '#FF8CC6', icon: 'Factory', map: 'RdBu_r' },
  ozone: { accent: '#B9A6FF', icon: 'ShieldHalf', map: 'RdBu_r' },
}

export const REGION_IDS = ['mexico', 'desert', 'rainforest', 'estuary', 'city'] as const
export type RegionId = (typeof REGION_IDS)[number]

export const REGION_VIEW: Record<RegionId, { center: [number, number]; zoom: number }> = {
  mexico: { center: [-102.5, 23.5], zoom: 3.6 },
  desert: { center: [-111.5, 30], zoom: 5.4 },
  rainforest: { center: [-91.5, 17.5], zoom: 6 },
  estuary: { center: [-96.5, 20], zoom: 6 },
  city: { center: [-99, 19.5], zoom: 6 },
}

export type TrendState = 'rising' | 'falling' | 'no_trend' | 'insufficient'

// ColorBrewer 11-class diverging ramps, low -> high. Midpoint is replaced by the dark neutral.
const RAMPS = {
  BrBG: ['#543005', '#8c510a', '#bf812d', '#dfc27d', '#f6e8c3', '#f5f5f5', '#c7eae5', '#80cdc1', '#35978f', '#01665e', '#003c30'],
  PuOr: ['#7f3b08', '#b35806', '#e08214', '#fdb863', '#fee0b6', '#f7f7f7', '#d8daeb', '#b2abd2', '#8073ac', '#542788', '#2d004b'],
  RdBu: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#f7f7f7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061'],
} as const

function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** t in [-1, 1] -> hex. -1 = "Low" end, +1 = "High" end of the legend. */
export function divergingColor(map: 'BrBG' | 'PuOr_r' | 'RdBu_r', t: number): string {
  const base: string[] = map === 'BrBG' ? [...RAMPS.BrBG] : map === 'PuOr_r' ? [...RAMPS.PuOr].reverse() : [...RAMPS.RdBu].reverse()
  base[5] = '#2A1F38'
  const x = (Math.max(-1, Math.min(1, t)) + 1) / 2 * (base.length - 1)
  const i = Math.min(Math.floor(x), base.length - 2)
  const f = x - i
  const a = hexToRgb(base[i])
  const b = hexToRgb(base[i + 1])
  const c = a.map((v, k) => Math.round(v + (b[k] - v) * f))
  return `rgb(${c[0]},${c[1]},${c[2]})`
}

export function legendGradient(map: 'BrBG' | 'PuOr_r' | 'RdBu_r'): string {
  const stops = Array.from({ length: 11 }, (_, i) => divergingColor(map, (i / 10) * 2 - 1))
  return `linear-gradient(to right, ${stops.join(',')})`
}
