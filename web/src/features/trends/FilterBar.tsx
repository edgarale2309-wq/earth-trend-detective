import { CalendarRange, Info, Map as MapIcon, MapPin, Rows3, Table2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { REGION_IDS } from '../../core/variables'
import { Tip } from '../../shared/States'
import { MAX_YEAR, MIN_YEAR, useExplorer } from '../explorer/store'

function Label({ icon: Icon, text, tip }: { icon: typeof MapPin; text: string; tip: string }) {
  return (
    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-ink">
      <Icon size={14} aria-hidden className="accent-transition text-accent" />
      <span>{text}</span>
      <Tip text={tip}><Info size={13} aria-label={tip} className="cursor-help text-ink-muted" /></Tip>
    </div>
  )
}

function PeriodSlider() {
  const { t } = useTranslation()
  const { start, end, set } = useExplorer()
  const [a, setA] = useState(start)
  const [b, setB] = useState(end)
  useEffect(() => { setA(start); setB(end) }, [start, end])
  useEffect(() => {
    if (a === start && b === end) return
    const h = setTimeout(() => set({ start: a, end: b }), 450)
    return () => clearTimeout(h)
  }, [a, b]) // eslint-disable-line react-hooks/exhaustive-deps
  const pct = (v: number) => ((v - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100
  const thumb = 'pointer-events-none absolute inset-0 h-9 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto'
  return (
    <div className="w-64">
      <Label icon={CalendarRange} text={t('explorer.filterPeriod')} tip={t('explorer.filterPeriodTip')} />
      <div className="relative h-9" style={{ accentColor: 'rgb(var(--accent))' }}>
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded bg-deep-purple" />
        <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded border-t-4 border-accent" style={{ left: `${pct(a)}%`, right: `${100 - pct(b)}%` }} />
        <input type="range" min={MIN_YEAR} max={MAX_YEAR} value={a} aria-label={`${t('explorer.filterPeriod')} (start)`} className={thumb}
          onChange={(e) => setA(Math.min(Number(e.target.value), b - 10))} />
        <input type="range" min={MIN_YEAR} max={MAX_YEAR} value={b} aria-label={`${t('explorer.filterPeriod')} (end)`} className={thumb}
          onChange={(e) => setB(Math.max(Number(e.target.value), a + 10))} />
      </div>
      <div className="num flex justify-between text-xs text-ink"><span>{a}</span><span className="font-sans text-ink-muted">{t('explorer.periodMin')}</span><span>{b}</span></div>
    </div>
  )
}

/** Compact, centered control dock under the map. Each control says what it changes; a summary line closes the loop. */
export function FilterBar({ asTable, onView }: { asTable: boolean; onView: (table: boolean) => void }) {
  const { t } = useTranslation()
  const { region, resolution, start, end, set } = useExplorer()
  return (
    <div className="w-fit max-w-full">
      <div role="group" aria-label={t('explorer.filters')} className="flex flex-wrap items-start justify-center gap-x-6 gap-y-3 py-1">
        <div className="w-60">
          <Label icon={MapPin} text={t('explorer.filterRegion')} tip={t('explorer.filterRegionTip')} />
          <select className="h-9 w-full rounded-lg border border-input-border bg-surface px-2 text-sm" value={region}
            onChange={(e) => set({ region: e.target.value as typeof region, point: null, state: null })}>
            {REGION_IDS.map((r) => <option key={r} value={r}>{t(`explorer.regions.${r}`)}</option>)}
          </select>
        </div>
        <div>
          <Label icon={Rows3} text={t('explorer.filterDetail')} tip={t('explorer.filterDetailTip')} />
          <div role="group" aria-label={t('explorer.filterDetail')} className="flex rounded-lg border border-input-border p-0.5">
            {(['annual', 'monthly'] as const).map((r) => (
              <button key={r} aria-pressed={resolution === r} onClick={() => set({ resolution: r })}
                className={`h-8 rounded-md px-3 text-sm transition-colors duration-150 ${resolution === r ? 'bg-purple text-white' : 'text-ink-muted hover:bg-deep-purple hover:text-ink'}`}>
                {t(`explorer.${r}`)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label icon={asTable ? Table2 : MapIcon} text={t('explorer.viewLabel')} tip={t('explorer.viewTip')} />
          <div role="group" aria-label={t('explorer.viewLabel')} className="flex rounded-lg border border-input-border p-0.5">
            {([false, true] as const).map((tb) => (
              <button key={String(tb)} aria-pressed={asTable === tb} onClick={() => onView(tb)}
                className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm transition-colors duration-150 ${asTable === tb ? 'bg-purple text-white' : 'text-ink-muted hover:bg-deep-purple hover:text-ink'}`}>
                {tb ? <Table2 size={14} aria-hidden /> : <MapIcon size={14} aria-hidden />}{t(tb ? 'explorer.viewTable' : 'explorer.viewMap')}
              </button>
            ))}
          </div>
        </div>
        <PeriodSlider />
      </div>
      <p className="mt-2 w-0 min-w-full text-center text-xs leading-relaxed text-ink-muted" aria-live="polite">
        {t('explorer.filterSummary', {
          region: t(`explorer.regions.${region}`), unit: t(resolution === 'monthly' ? 'chart.unitMonth' : 'chart.unitYear'), start, end,
        })}
      </p>
    </div>
  )
}
