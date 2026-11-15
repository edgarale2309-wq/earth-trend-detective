import { z } from 'zod'
import type { RegionId, TrendState, VariableId } from './variables'

export const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000/api/v1/'

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
  reason: z.string().nullable().optional(),
})
export type Stats = z.infer<typeof Stats>

const DataStatus = z.enum(['nasa', 'synthetic_demo'])

const Cell = z.object({
  lat: z.number(), lon: z.number(),
  state: z.enum(['rising', 'falling', 'no_trend', 'insufficient']),
  slope: z.number().nullable(), pct: z.number().nullable(), p: z.number().nullable(),
})
export type Cell = z.infer<typeof Cell>

const TrendsResponse = z.object({
  unit: z.string(), source: z.string(), data_status: DataStatus, step: z.number(),
  n_cells: z.number(), fdr_significant: z.number(), summary: Stats, cells: z.array(Cell),
})
export type TrendsResponse = z.infer<typeof TrendsResponse>

const SeriesResponse = z.object({
  unit: z.string(), source: z.string(), data_status: DataStatus, deseasonalized: z.boolean(),
  point: z.object({ lat: z.number(), lon: z.number() }).nullable(),
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
  return schema.parse(await res.json())
}

export interface Query { variable: VariableId; region: RegionId; start: number; end: number; resolution: 'annual' | 'monthly' }

export const api = {
  trends: (q: Query) =>
    call(TrendsResponse, 'trends', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q) }),
  series: (q: Query, deseasonalize: boolean, pt?: { lat: number; lon: number } | null) => {
    const p = new URLSearchParams({
      var: q.variable, region: q.region, start: String(q.start), end: String(q.end),
      resolution: q.resolution, deseasonalize: String(deseasonalize),
    })
    if (pt) { p.set('lat', String(pt.lat)); p.set('lon', String(pt.lon)) }
    return call(SeriesResponse, `series?${p}`)
  },
  place: (lat: number, lon: number) => call(PlaceResponse, `place?lat=${lat}&lon=${lon}`),
  clues: (variable: string) => call(ClueResponse, `clues?var=${variable}`),
}

export type { TrendState }
