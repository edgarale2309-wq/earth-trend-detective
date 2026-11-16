export type MapName = 'BrBG_r' | 'PuOr_r' | 'RdBu_r'

export const VARIABLE_IDS = ['precipitation', 'solar_radiation', 'soil_moisture', 'surface_runoff', 'no2', 'ozone'] as const
export type VariableId = (typeof VARIABLE_IDS)[number]

export const VARIABLES: Record<VariableId, { accent: string; icon: string; map: MapName }> = {
  precipitation: { accent: '#38BDF8', icon: 'CloudRain', map: 'BrBG_r' },
  solar_radiation: { accent: '#F59E0B', icon: 'Sun', map: 'PuOr_r' },
  soil_moisture: { accent: '#10B981', icon: 'Sprout', map: 'BrBG_r' },
  surface_runoff: { accent: '#22D3EE', icon: 'Waves', map: 'BrBG_r' },
  no2: { accent: '#F472B6', icon: 'Factory', map: 'RdBu_r' },
  ozone: { accent: '#A78BFA', icon: 'ShieldHalf', map: 'RdBu_r' },
}

export const REGION_IDS = ['americas', 'north_america', 'central_caribbean', 'south_america', 'mexico', 'desert', 'rainforest', 'estuary', 'city'] as const
export type RegionId = (typeof REGION_IDS)[number]

/** [[west, south], [east, north]] used to fit the map to each preset region. */
export const REGION_BOUNDS: Record<RegionId, [[number, number], [number, number]]> = {
  americas: [[-168, -57], [-34, 76]],
  north_america: [[-168, 14], [-50, 76]],
  central_caribbean: [[-94, 6], [-58, 24]],
  south_america: [[-82, -57], [-34, 13]],
  mexico: [[-118.4, 14.4], [-86.5, 32.8]],
  desert: [[-115.5, 27.5], [-107.5, 32.5]],
  rainforest: [[-95, 15.5], [-88.5, 19.5]],
  estuary: [[-99, 17.5], [-94, 22.5]],
  city: [[-102, 17.5], [-96.5, 21.5]],
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
export function divergingColor(map: 'BrBG_r' | 'PuOr_r' | 'RdBu_r', t: number): string {
  const base: string[] = map === 'BrBG_r' ? [...RAMPS.BrBG].reverse() : map === 'PuOr_r' ? [...RAMPS.PuOr].reverse() : [...RAMPS.RdBu].reverse()
  base[5] = '#2A1F38'
  const x = (Math.max(-1, Math.min(1, t)) + 1) / 2 * (base.length - 1)
  const i = Math.min(Math.floor(x), base.length - 2)
  const f = x - i
  const a = hexToRgb(base[i])
  const b = hexToRgb(base[i + 1])
  const c = a.map((v, k) => Math.round(v + (b[k] - v) * f))
  return `rgb(${c[0]},${c[1]},${c[2]})`
}

export function legendGradient(map: 'BrBG_r' | 'PuOr_r' | 'RdBu_r'): string {
  const stops = Array.from({ length: 11 }, (_, i) => divergingColor(map, (i / 10) * 2 - 1))
  return `linear-gradient(to right, ${stops.join(',')})`
}

/** Distinct, bright outline colour per country for the selected state. Bigger countries are hand-picked so neighbours differ. */
const COUNTRY_COLORS: Record<string, string> = {
  US: '#FACC15', CA: '#F472B6', MX: '#4ADE80', BR: '#FF7A1A', AR: '#C084FC', CL: '#E879F9', CO: '#F87171', PE: '#FDE047',
  VE: '#BEF264', BO: '#F59E0B', EC: '#60A5FA', PY: '#818CF8', UY: '#FCA5A5', GY: '#86EFAC', SR: '#FDBA74', CU: '#C4B5FD',
  GT: '#3B82F6', HN: '#F9A8D4', NI: '#A3E635', CR: '#FDA4AF', PA: '#93C5FD', DO: '#FCD34D', HT: '#FB923C',
}
// no cyan anywhere: it is reserved for the hover outline
const FALLBACK = ['#FACC15', '#F472B6', '#A3E635', '#FB923C', '#C084FC', '#4ADE80', '#F87171', '#60A5FA', '#E879F9', '#FDE047']

export function countryColor(cc: string | undefined): string {
  if (!cc) return '#FACC15'
  if (COUNTRY_COLORS[cc]) return COUNTRY_COLORS[cc]
  let h = 0
  for (const ch of cc) h = (h * 31 + ch.charCodeAt(0)) % FALLBACK.length
  return FALLBACK[h]
}
