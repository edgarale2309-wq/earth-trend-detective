import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { REGION_IDS } from '../../core/variables'
import { MAX_YEAR, MIN_YEAR, useExplorer } from '../explorer/store'

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
  const thumb = 'pointer-events-none absolute inset-0 h-11 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto'
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-ink-muted">{t('explorer.period')}</span>
        <span className="num text-ink">{a}–{b}</span>
      </div>
      <div className="relative h-9" style={{ accentColor: 'rgb(var(--accent))' }}>
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded bg-deep-purple" />
        <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded border-t-4 border-accent" style={{ left: `${pct(a)}%`, right: `${100 - pct(b)}%` }} />
        <input type="range" min={MIN_YEAR} max={MAX_YEAR} value={a} aria-label={`${t('explorer.period')} (start)`} className={thumb}
          onChange={(e) => setA(Math.min(Number(e.target.value), b - 10))} />
        <input type="range" min={MIN_YEAR} max={MAX_YEAR} value={b} aria-label={`${t('explorer.period')} (end)`} className={thumb}
          onChange={(e) => setB(Math.max(Number(e.target.value), a + 10))} />
      </div>
      <p className="text-xs text-ink-muted">{t('explorer.periodMin')}</p>
    </div>
  )
}

/** Compact filter strip under the map: region, detail and period. */
export function FilterBar() {
  const { t } = useTranslation()
  const { region, resolution, set } = useExplorer()
  return (
    <div role="group" aria-label={t('explorer.filters')} className="mt-1 grid gap-4 rounded-xl border border-purple bg-background/60 p-3 sm:grid-cols-2 sm:items-end">
      <label className="block text-sm">
        <span className="mb-1 block text-ink-muted">{t('explorer.region')}</span>
        <select className="h-10 w-full rounded-lg border border-input-border bg-surface px-3 text-sm" value={region}
          onChange={(e) => set({ region: e.target.value as typeof region, point: null, state: null })}>
          {REGION_IDS.map((r) => <option key={r} value={r}>{t(`explorer.regions.${r}`)}</option>)}
        </select>
      </label>
      <div>
        <span className="mb-1 block text-sm text-ink-muted" id="res-l">{t('explorer.resolution')}</span>
        <div role="group" aria-labelledby="res-l" className="flex rounded-lg border border-input-border p-0.5">
          {(['annual', 'monthly'] as const).map((r) => (
            <button key={r} aria-pressed={resolution === r} onClick={() => set({ resolution: r })}
              className={`h-9 flex-1 rounded-lg px-4 text-sm transition-colors duration-150 ${resolution === r ? 'bg-purple text-white' : 'text-ink-muted hover:bg-deep-purple hover:text-ink'}`}>
              {t(`explorer.${r}`)}
            </button>
          ))}
        </div>
      </div>
      <div className="sm:col-span-2"><PeriodSlider /></div>
    </div>
  )
}
