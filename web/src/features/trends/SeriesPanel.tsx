import { Info, MousePointer2, RotateCcw } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SeriesResponse } from '../../core/api'
import type { VariableId } from '../../core/variables'
import { ErrorState, Skeleton, Tip } from '../../shared/States'
import { MAX_YEAR, MIN_YEAR, useExplorer } from '../explorer/store'

const TimeSeriesChart = lazy(() => import('./TimeSeriesChart'))

function Legend() {
  const { t } = useTranslation()
  const item = (swatch: React.ReactNode, label: string, term: string | null, tip: string) => (
    <Tip text={tip}>
      <span className="inline-flex items-center gap-2 text-xs text-ink-muted">
        {swatch}
        <span>{label}{term && <span className="text-ink-muted/80"> ({term})</span>}</span>
        <Info size={12} aria-hidden className="opacity-60" />
      </span>
    </Tip>
  )
  return (
    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2" aria-label="Legend">
      {item(<span className="flex items-center"><span className="h-0.5 w-3 bg-ink-muted" /><span className="accent-transition h-2.5 w-2.5 rounded-full border-2 border-accent" /><span className="h-0.5 w-3 bg-ink-muted" /></span>, t('chart.legendSeries'), null, t('chart.legendSeriesTip'))}
      {item(<span className="w-6 border-t-2 border-dashed border-ink" />, t('chart.legendTrend'), t('chart.legendTrendTerm'), t('chart.legendTrendTip'))}
      {item(<span className="h-3 w-6 rounded-sm bg-ink/15" />, t('chart.legendRange'), t('chart.legendRangeTerm'), t('chart.legendRangeTip'))}
    </div>
  )
}

export function SeriesPanel({ variable, data, loading, error, refetch, placeLabel, name }: {
  variable: VariableId; data?: SeriesResponse; loading: boolean; error: unknown; refetch: () => void; placeLabel: string; name: string
}) {
  const { t } = useTranslation()
  const { deseasonalize, resolution, start, end, set } = useExplorer()
  const [short, setShort] = useState(false)
  const full = start === MIN_YEAR && end === MAX_YEAR

  const onRange = (a: number, b: number) => {
    const s = Math.max(MIN_YEAR, a), e = Math.min(MAX_YEAR, b)
    if (e - s + 1 < 10) { setShort(true); return }
    setShort(false)
    set({ start: s, end: e })
  }

  const seg = (on: boolean) =>
    `h-9 rounded-lg px-3 text-sm transition-colors duration-150 ${on ? 'bg-purple text-white' : 'text-ink-muted hover:bg-deep-purple hover:text-ink'}`

  return (
    <section aria-labelledby="ts-h" className="rounded-2xl border border-purple bg-surface p-4 lg:p-5">
      <h2 id="ts-h" className="section-label">{t('chart.title')}</h2>
      <p className="mt-2 text-sm leading-snug text-ink">
        {t('chart.subtitle', {
          name, place: placeLabel, unit: t(resolution === 'monthly' ? 'chart.unitMonth' : 'chart.unitYear'),
          kind: t(deseasonalize ? 'chart.kindAnomaly' : 'chart.kindAbsolute'),
        })}
      </p>
      {data && <p className="mt-1 text-xs text-ink-muted">{t('chart.source', { source: data.source, start, end })}</p>}

      <div role="group" aria-label={t('chart.toggleLabel')} className="mt-3 inline-flex rounded-lg border border-input-border p-0.5">
        <Tip text={t('chart.anomaliesTip')}>
          <button aria-pressed={deseasonalize} onClick={() => set({ deseasonalize: true })} className={seg(deseasonalize)}>{t('chart.anomalies')}</button>
        </Tip>
        <Tip text={t('chart.absoluteTip')}>
          <button aria-pressed={!deseasonalize} onClick={() => set({ deseasonalize: false })} className={seg(!deseasonalize)}>{t('chart.absolute')}</button>
        </Tip>
      </div>

      <div className="mt-3 min-h-[300px]">
        {error != null && !data ? <ErrorState error={error} onRetry={refetch} />
          : data ? (
            <Suspense fallback={<Skeleton className="h-[300px]" />}>
              <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
                <TimeSeriesChart variable={variable} data={data} resolution={resolution} revision={`${variable}-${start}-${end}-${deseasonalize}-${resolution}-${data.point?.state ?? ''}`} onRange={onRange} />
              </div>
            </Suspense>
          ) : <Skeleton className="h-[300px]" />}
      </div>
      <Legend />
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1.5"><MousePointer2 size={14} aria-hidden />{short ? <span role="alert" className="text-danger">{t('chart.brushNeed')}</span> : t('chart.brushHint')}</span>
        {!full && (
          <button onClick={() => { setShort(false); set({ start: MIN_YEAR, end: MAX_YEAR }) }}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-input-border px-3 text-ink hover:bg-deep-purple">
            <RotateCcw size={12} aria-hidden />{t('chart.resetPeriod')}
          </button>
        )}
      </div>
    </section>
  )
}
