import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useAccent } from '../../core/useAccent'
import { REGION_IDS, VARIABLE_IDS, type RegionId, type VariableId } from '../../core/variables'
import { Skeleton } from '../../shared/States'
import { FilterBar } from '../trends/FilterBar'
import { SeriesPanel } from '../trends/SeriesPanel'
import { TrendMap } from '../trends/TrendMap'
import { VariablePanel } from '../trends/VariablePanel'
import { VerdictPanel } from '../trends/VerdictPanel'
import { useGeoStates, useQueryParams, useSeries, useTrends } from './hooks'
import { MAX_YEAR, MIN_YEAR, useExplorer } from './store'

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
      resolution: params.has('res') ? (params.get('res') === 'monthly' ? 'monthly' : 'annual') : s.resolution,
      mode: params.get('m') === 'scientific' ? 'scientific' : params.get('m') === 'explorer' ? 'explorer' : s.mode,
      deseasonalize: params.has('d') ? params.get('d') !== '0' : s.deseasonalize,
      point: lat && lon ? { lat: Number(lat), lon: Number(lon) } : null,
      state: params.get('st'),
    })
    hydrated.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!hydrated.current || s.variable === 'home') return
    const p = new URLSearchParams({ v: s.variable, r: s.region, s: String(s.start), e: String(s.end), res: s.resolution, m: s.mode })
    if (!s.deseasonalize) p.set('d', '0')
    if (s.state) p.set('st', s.state)
    else if (s.point) { p.set('lat', String(s.point.lat)); p.set('lon', String(s.point.lon)) }
    setParams(p, { replace: true })
  }, [s.variable, s.region, s.start, s.end, s.resolution, s.mode, s.deseasonalize, s.point, s.state]) // eslint-disable-line react-hooks/exhaustive-deps
}

export default function ExplorerPage() {
  const { t } = useTranslation()
  useUrlSync()
  const { variable, mode, point, state, set, region, start, end } = useExplorer()
  const q = useQueryParams()
  const trends = useTrends(q)
  const series = useSeries(q)
  const geo = useGeoStates()
  useAccent(variable)
  const w = typeof window === 'undefined' ? 1440 : window.innerWidth
  const [left, setLeft] = useState(w >= 1280)
  const [right, setRight] = useState(w >= 1280)

  if (variable === 'home') return null

  const busy = trends.isFetching || series.isFetching
  const stats = series.data?.stats
  const imageState = busy || !stats ? 'idle' : stats.state
  const name = t(`vars.${variable}.name`)
  const status = trends.data?.data_status ?? series.data?.data_status
  const offline = typeof navigator !== 'undefined' && !navigator.onLine
  const stateName = state ? (trends.data?.states.find((r) => r.id === state)?.name ?? series.data?.point?.name ?? state) : null
  const placeLabel = stateName
    ?? (point ? `${point.lat.toFixed(1)}°, ${point.lon.toFixed(1)}°` : t('chart.placeRegion', { region: t(`explorer.regions.${region}`) }))

  const toggle = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-purple text-ink-muted transition-colors duration-150 hover:bg-deep-purple hover:text-ink'

  return (
    <>
      {offline && <p role="status" className="bg-deep-purple px-4 py-2 text-center text-sm">{t('states.offline')}</p>}
      <div className="p-3 sm:p-4 lg:h-[calc(100dvh-3.5rem)]">
        <div className="h-[82dvh] min-w-0 lg:h-full">
          <TrendMap
            variable={variable} region={region} data={trends.data} geo={geo.data} loading={trends.isFetching || geo.isFetching} error={trends.error ?? geo.error}
            refetch={() => { trends.refetch(); geo.refetch() }} start={start} end={end}
            footer={<FilterBar />}
            cornerLeft={
              <button onClick={() => setLeft((v) => !v)} aria-expanded={left} aria-controls="panel-left" className={toggle}
                aria-label={left ? t('explorer.hideInfo') : t('explorer.showInfo')} title={left ? t('explorer.hideInfo') : t('explorer.showInfo')}>
                {left ? <PanelLeftClose size={18} aria-hidden /> : <PanelLeftOpen size={18} aria-hidden />}
              </button>
            }
            cornerRight={
              <button onClick={() => setRight((v) => !v)} aria-expanded={right} aria-controls="panel-right" className={`${toggle} ml-2`}
                aria-label={right ? t('explorer.hideCharts') : t('explorer.showCharts')} title={right ? t('explorer.hideCharts') : t('explorer.showCharts')}>
                {right ? <PanelRightClose size={18} aria-hidden /> : <PanelRightOpen size={18} aria-hidden />}
              </button>
            }
            overlayLeft={left ? (
              <div id="panel-left"><VariablePanel variable={variable} imageState={imageState} dataStatus={status} /></div>
            ) : null}
            overlayRight={right ? (
              <div id="panel-right" className="flex flex-col gap-3">
                {stateName && (
                  <button onClick={() => set({ state: null, point: null })} className="h-9 self-start rounded-full border border-input-border bg-surface px-3 text-xs text-ink hover:bg-deep-purple">
                    {t('explorer.selectedState', { name: stateName })} · {t('explorer.clearSelection')}
                  </button>
                )}
                <SeriesPanel variable={variable} data={series.data} loading={series.isFetching} error={series.error} refetch={() => series.refetch()} placeLabel={placeLabel} name={name} />
                {stats ? <VerdictPanel stats={stats} unit={series.data!.unit} name={name} mode={mode} /> : <Skeleton className="h-52" />}
              </div>
            ) : null}
          />
        </div>
      </div>
    </>
  )
}
