import { lazy, Suspense, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useAccent } from '../../core/useAccent'
import { REGION_IDS, VARIABLE_IDS, type RegionId, type VariableId } from '../../core/variables'
import { AppBar } from '../../shared/AppBar'
import { ErrorState, Skeleton } from '../../shared/States'
import { TrendMap } from '../trends/TrendMap'
import { VariablePanel } from '../trends/VariablePanel'
import { ModeToggle, VariableTabs } from '../trends/VariableTabs'
import { VerdictPanel } from '../trends/VerdictPanel'
import { useQueryParams, useSeries, useTrends } from './hooks'
import { MAX_YEAR, MIN_YEAR, useExplorer } from './store'

const TimeSeriesChart = lazy(() => import('../trends/TimeSeriesChart'))

function useUrlSync() {
  const [params, setParams] = useSearchParams()
  const s = useExplorer()
  const hydrated = useRef(false)

  useEffect(() => {
    const v = params.get('v') as VariableId
    const r = params.get('r') as RegionId
    const num = (k: string, d: number) => { const n = Number(params.get(k)); return Number.isFinite(n) && params.get(k) ? n : d }
    const lat = params.get('lat'), lon = params.get('lon')
    s.set({
      variable: VARIABLE_IDS.includes(v) ? v : (s.variable === 'home' ? 'precipitation' : s.variable),
      region: REGION_IDS.includes(r) ? r : s.region,
      start: Math.max(MIN_YEAR, num('s', s.start)), end: Math.min(MAX_YEAR, num('e', s.end)),
      resolution: params.get('res') === 'monthly' ? 'monthly' : 'annual',
      mode: params.get('m') === 'scientific' ? 'scientific' : 'explorer',
      deseasonalize: params.get('d') !== '0',
      point: lat && lon ? { lat: Number(lat), lon: Number(lon) } : null,
    })
    hydrated.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!hydrated.current || s.variable === 'home') return
    const p = new URLSearchParams({ v: s.variable, r: s.region, s: String(s.start), e: String(s.end), res: s.resolution, m: s.mode })
    if (!s.deseasonalize) p.set('d', '0')
    if (s.point) { p.set('lat', String(s.point.lat)); p.set('lon', String(s.point.lon)) }
    setParams(p, { replace: true })
  }, [s.variable, s.region, s.start, s.end, s.resolution, s.mode, s.deseasonalize, s.point]) // eslint-disable-line react-hooks/exhaustive-deps
}

export default function ExplorerPage() {
  const { t } = useTranslation()
  useUrlSync()
  const { variable, mode, deseasonalize, point, set, region, start, end } = useExplorer()
  const q = useQueryParams()
  const trends = useTrends(q)
  const series = useSeries(q)
  useAccent(variable)

  if (variable === 'home') return <div className="min-h-screen"><AppBar back /></div>

  const busy = trends.isFetching || series.isFetching
  const stats = series.data?.stats
  const imageState = busy || !stats ? 'idle' : stats.state
  const name = t(`vars.${variable}.name`)
  const status = trends.data?.data_status ?? series.data?.data_status
  const offline = typeof navigator !== 'undefined' && !navigator.onLine

  return (
    <div className="min-h-screen">
      <AppBar back>
        <VariableTabs value={variable} onChange={(v) => set({ variable: v, point: null })} />
        <ModeToggle value={mode} onChange={(m) => set({ mode: m })} />
      </AppBar>
      {offline && <p role="status" className="bg-deep-purple px-4 py-2 text-center text-sm">{t('states.offline')}</p>}
      <main id="main" className="mx-auto grid max-w-[1600px] grid-cols-[minmax(0,1fr)] gap-6 p-4 md:grid-cols-2 lg:grid-cols-[320px_minmax(0,1fr)_400px] lg:p-6">
        <VariablePanel variable={variable} imageState={imageState} dataStatus={status} />
        <TrendMap
          variable={variable} region={region} data={trends.data} loading={trends.isFetching} error={trends.error}
          refetch={() => trends.refetch()} start={start} end={end}
        />
        <div className="flex flex-col gap-6 md:col-span-2 lg:col-span-1">
          <section aria-labelledby="ts-h" className="rounded-2xl border border-purple bg-surface p-4 lg:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="ts-h" className="section-label">{t('explorer.timeSeries')}</h2>
              <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" role="switch" checked={deseasonalize} onChange={(e) => set({ deseasonalize: e.target.checked })}
                  className="h-4 w-4" style={{ accentColor: 'rgb(var(--accent))' }} />
                {t('explorer.seasonal')}
              </label>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              {point ? `${t('explorer.selected')}: ${point.lat.toFixed(1)}°, ${point.lon.toFixed(1)}°` : t('explorer.regionAverage')}
              {point
                ? <button onClick={() => set({ point: null })} className="ml-2 underline">{t('explorer.clearPoint')}</button>
                : <span> · {t('explorer.clickCell')}</span>}
            </p>
            <p className="mt-1 text-xs text-ink-muted">{series.data ? `${series.data.source} · ${series.data.unit} · ${start}–${end}` : ' '}</p>
            <div className="mt-3 min-h-[260px]">
              {series.error && !series.data ? <ErrorState error={series.error} onRetry={() => series.refetch()} />
                : series.data ? <Suspense fallback={<Skeleton className="h-[260px]" />}><TimeSeriesChart variable={variable} data={series.data} /></Suspense>
                : <Skeleton className="h-[260px]" />}
            </div>
          </section>
          {stats ? <VerdictPanel stats={stats} unit={series.data!.unit} name={name} mode={mode} /> : <Skeleton className="h-52" />}
        </div>
      </main>
    </div>
  )
}
