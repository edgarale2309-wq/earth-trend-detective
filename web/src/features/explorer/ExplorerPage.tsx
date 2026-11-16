import { Maximize2, Minimize2, X } from 'lucide-react'
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
import { stateLabel } from '../../core/places'
import { countryColor } from '../../core/variables'
import { useGeoCountries, useGeoStates, useQueryParams, useSeries, useTrends } from './hooks'
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
  const { t, i18n } = useTranslation()
  useUrlSync()
  const { variable, mode, point, state, set, region, start, end } = useExplorer()
  const q = useQueryParams()
  const trends = useTrends(q)
  const series = useSeries(q)
  const geo = useGeoStates()
  const countries = useGeoCountries()
  useAccent(variable)
  const w = typeof window === 'undefined' ? 1440 : window.innerWidth
  const [left, setLeft] = useState(w >= 1280)
  const [right, setRight] = useState(w >= 1280)
  const [asTable, setAsTable] = useState(false)
  const [big, setBig] = useState(false)
  const leftBefore = useRef(left)

  // Table view: only the table and the chart cards stay on screen, so the variable card folds away.
  const onView = (table: boolean) => {
    if (table === asTable) return
    if (table) { leftBefore.current = left; setLeft(false); setRight(true); setBig(false) } else setLeft(leftBefore.current)
    setAsTable(table)
  }
  const toggleBig = () => { setBig((v) => !v); setLeft(false); setRight(true) }
  const LEFT_W = 'min(312px, 80vw)'
  // Charts sit side by side; they share the map width with the variable card when both are open.
  // Charts and verdict sit side by side (table view stacks them in a narrow column); "enlarge" uses the full width.
  const rightW = asTable ? 'min(400px, 84vw)'
    : big ? 'calc(100% - 4.5rem)'
    : `min(880px, calc(100% - ${left ? '312px' : '0px'} - 5rem))`

  if (variable === 'home') return null

  const busy = trends.isFetching || series.isFetching
  const stats = series.data?.stats
  const imageState = busy || !stats ? 'idle' : stats.state
  const name = t(`vars.${variable}.name`)
  const status = trends.data?.data_status ?? series.data?.data_status
  const offline = typeof navigator !== 'undefined' && !navigator.onLine
  const picked = state ? (geo.data?.features.find((f) => (f.properties as { id: string }).id === state)?.properties as { name: string; name_es?: string; cc?: string } | undefined) : undefined
  const stateName = state ? (picked ? stateLabel(picked, i18n.language) : (series.data?.point?.name ?? state)) : null
  const placeLabel = stateName
    ?? (point ? `${point.lat.toFixed(1)}°, ${point.lon.toFixed(1)}°` : t('chart.placeRegion', { region: t(`explorer.regions.${region}`) }))

  return (
    <>
      {offline && <p role="status" className="bg-deep-purple px-4 py-2 text-center text-sm">{t('states.offline')}</p>}
      <div className="p-3 sm:p-4 lg:h-[calc(100dvh-3.5rem)]">
        <div className="h-[82dvh] min-w-0 lg:h-full">
          <TrendMap
            variable={variable} region={region} data={trends.data} geo={geo.data} countries={countries.data} loading={trends.isFetching || geo.isFetching} error={trends.error ?? geo.error}
            refetch={() => { trends.refetch(); geo.refetch() }} start={start} end={end}
            asTable={asTable}
            footer={<FilterBar asTable={asTable} onView={onView} />}
            left={{
              width: LEFT_W, open: left, onToggle: () => setLeft((v) => !v), id: 'panel-left', label: t('explorer.panelInfo'),
              hideLabel: t('explorer.hideInfo'), showLabel: t('explorer.showInfo'),
              children: <VariablePanel variable={variable} imageState={imageState} dataStatus={status} />,
            }}
            right={{
              width: rightW, open: right, onToggle: () => setRight((v) => !v), id: 'panel-right', label: t('explorer.panelCharts'),
              hideLabel: t('explorer.hideCharts'), showLabel: t('explorer.showCharts'),
              children: (
                <div className="@container flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {stateName && (
                      <button onClick={() => set({ state: null, point: null })} title={t('explorer.clearSelection')}
                        className="inline-flex min-h-9 min-w-0 max-w-full items-center gap-2 rounded-full border border-input-border bg-surface py-1 pl-3 pr-1.5 text-left text-xs text-ink hover:bg-deep-purple">
                        <span aria-hidden className="h-3 w-3 shrink-0 rounded-full border border-white/40" style={{ background: countryColor(picked?.cc) }} />
                        <span className="truncate">{t('explorer.selectedState', { name: stateName })}</span>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-deep-purple px-2 py-1"><X size={12} aria-hidden />{t('explorer.clearSelection')}</span>
                      </button>
                    )}
                    {!asTable && (
                      <button onClick={toggleBig} aria-pressed={big} title={big ? t('explorer.shrink') : t('explorer.enlarge')}
                        className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full border border-input-border bg-surface px-3 text-xs text-ink hover:bg-deep-purple">
                        {big ? <Minimize2 size={14} aria-hidden /> : <Maximize2 size={14} aria-hidden />}{big ? t('explorer.shrink') : t('explorer.enlarge')}
                      </button>
                    )}
                  </div>
                  <div className="grid items-start gap-3 @2xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                    <SeriesPanel variable={variable} data={series.data} loading={series.isFetching} error={series.error} refetch={() => series.refetch()} placeLabel={placeLabel} name={name} chartHeight={big ? 420 : 300} />
                    {stats ? <VerdictPanel stats={stats} unit={series.data!.unit} name={name} mode={mode} /> : <Skeleton className="h-52" />}
                  </div>
                </div>
              ),
            }}
          />
        </div>
      </div>
    </>
  )
}
