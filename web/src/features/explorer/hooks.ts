import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api, type Query } from '../../core/api'
import { useExplorer } from './store'

export function useQueryParams(): Query | null {
  const { variable, region, start, end, resolution } = useExplorer()
  if (variable === 'home') return null
  return { variable, region, start, end, resolution }
}

export function useTrends(q: Query | null) {
  return useQuery({
    queryKey: ['trends', q], queryFn: () => api.trends(q!), enabled: !!q,
    staleTime: Infinity, placeholderData: keepPreviousData, retry: 1,
  })
}

export function useSeries(q: Query | null) {
  const point = useExplorer((s) => s.point)
  const deseasonalize = useExplorer((s) => s.deseasonalize)
  return useQuery({
    queryKey: ['series', q, deseasonalize, point], queryFn: () => api.series(q!, deseasonalize, point),
    enabled: !!q, staleTime: Infinity, placeholderData: keepPreviousData, retry: 1,
  })
}

export function useClues(variable: string | null) {
  return useQuery({ queryKey: ['clues', variable], queryFn: () => api.clues(variable!), enabled: !!variable, staleTime: Infinity })
}

export function fmt(n: number | null | undefined, d = 2): string {
  if (n == null || !Number.isFinite(n)) return '—'
  const s = Math.abs(n) >= 1000 ? n.toFixed(0) : n.toFixed(d)
  return (n > 0 && !s.startsWith('-') ? '+' : '') + s.replace('-', '−')
}

export function fmtP(p: number | null | undefined): string {
  if (p == null) return '—'
  return p < 0.001 ? '<0.001' : p.toFixed(3)
}
