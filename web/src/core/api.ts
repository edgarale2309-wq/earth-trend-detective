import { z } from 'zod'
import type { RegionId, TrendState, VariableId } from './variables'

export const API_BASE = new URL((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000/api/v1/', typeof window === 'undefined' ? 'http://localhost' : window.location.origin).toString()

const Stats = z.object({
  state: z.enum(['rising', 'falling', 'no_trend', 'insufficient']),
  n: z.number(),
  sen_slope_per_decade: z.number().nullable().optional(),
  pct_per_decade: z.number().nullable().optional(),
  p_value: z.number().nullable().optional(),
  z: z.number().nullable().optional(),
  t: z.number().nullable().optional(),
  r2: z.number().nullable().optional(),
  ci_low: z.number().nullable().optional(),
  ci_high: z.number().nullable().optional(),
  methods_agree: z.boolean().nullable().optional(),
  sen_ci_low: z.number().nullable().optional(),
  sen_ci_high: z.number().nullable().optional(),
  lag1: z.number().nullable().optional(),
  test: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
})
export type Stats = z.infer<typeof Stats>

const DataStatus = z.enum(['nasa', 'synthetic_demo'])

const StateRow = z.object({
  id: z.string(), name: z.string(), cc: z.string().optional(), n_cells: z.number(),
  state: z.enum(['rising', 'falling', 'no_trend', 'insufficient']),
  slope: z.number().nullable(), pct: z.number().nullable(), p: z.number().nullable(),
})
export type StateRow = z.infer<typeof StateRow>

const TrendsResponse = z.object({
  unit: z.string(), source: z.string(), data_status: DataStatus,
  n_cells: z.number(), fdr_significant: z.number(), summary: Stats, states: z.array(StateRow),
})
export type TrendsResponse = z.infer<typeof TrendsResponse>

const SeriesResponse = z.object({
  unit: z.string(), source: z.string(), data_status: DataStatus, deseasonalized: z.boolean(),
  point: z.object({ lat: z.number().optional(), lon: z.number().optional(), state: z.string().optional(), name: z.string().optional(), cc: z.string().nullish() }).nullable(),
  mean: z.number(),
  dates: z.array(z.string()), values: z.array(z.number()),
  fit: z.object({ trend: z.array(z.number()), ci_low: z.array(z.number()), ci_high: z.array(z.number()) }).nullable(),
  stats: Stats,
})
export type SeriesResponse = z.infer<typeof SeriesResponse>

const PlaceResponse = z.object({
  lat: z.number(), lon: z.number(),
  rows: z.array(z.object({ variable: z.string(), unit: z.string(), source: z.string(), data_status: DataStatus, stats: Stats })),
})
export type PlaceResponse = z.infer<typeof PlaceResponse>

const ClueResponse = z.object({
  variable: z.string(),
  regions: z.array(z.object({ region: z.string(), stats: Stats })),
  opposite: z.array(z.object({ region: z.string(), stats: Stats })),
})
export type ClueResponse = z.infer<typeof ClueResponse>

export class ApiError extends Error {}

async function call<T>(schema: z.ZodType<T>, path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(new URL(path, API_BASE), init)
  } catch {
    throw new ApiError('network')
  }
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try { detail = (await res.json()).detail ?? detail } catch { /* ignore */ }
    throw new ApiError(String(detail))
  }
  const parsed = schema.safeParse(await res.json())
  if (!parsed.success) {
    console.error('[api] unexpected response from', path, parsed.error.issues.slice(0, 3))
    throw new ApiError('unexpected response')
  }
  return parsed.data
}

export interface Query { variable: VariableId; region: RegionId; start: number; end: number; resolution: 'annual' | 'monthly' }

export const api = {
  trends: (q: Query) =>
    call(TrendsResponse, 'trends', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q) }),
  series: (q: Query, deseasonalize: boolean, sel: { point?: { lat: number; lon: number } | null; state?: string | null } = {}) => {
    const p = new URLSearchParams({
      var: q.variable, region: q.region, start: String(q.start), end: String(q.end),
      resolution: q.resolution, deseasonalize: String(deseasonalize),
    })
    if (sel.state) p.set('state', sel.state)
    else if (sel.point) { p.set('lat', String(sel.point.lat)); p.set('lon', String(sel.point.lon)) }
    return call(SeriesResponse, `series?${p}`)
  },
  geoCountries: () => call(z.custom<GeoJSON.FeatureCollection>(), 'geo/countries'),
  geoStates: () => call(z.custom<GeoJSON.FeatureCollection>(), 'geo/states'),
  place: (lat: number, lon: number) => call(PlaceResponse, `place?lat=${lat}&lon=${lon}`),
  clues: (variable: string) => call(ClueResponse, `clues?var=${variable}`),
}

export type { TrendState }
