import { Lightbulb } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { REGION_IDS, type VariableId } from '../../core/variables'
import { DemoBadge } from '../../shared/States'
import { VariableImage, type ImageState } from '../../shared/VariableImage'
import { fmt, useClues } from '../explorer/hooks'
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
      <div className="flex justify-between text-sm"><span>{t('explorer.period')}</span><span className="num">{a}–{b}</span></div>
      <div className="relative mt-1 h-11" style={{ accentColor: 'rgb(var(--accent))' }}>
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

function DetectiveClue({ variable }: { variable: VariableId }) {
  const { t } = useTranslation()
  const { data } = useClues(variable)
  const [x, y] = data?.opposite ?? []
  const word = (s: string) => t(`state.dir${s === 'rising' ? 'Rising' : s === 'falling' ? 'Falling' : 'None'}`).toLowerCase()
  const rname = (id: string) => t(`explorer.regions.${id}`)
  return (
    <div className="rounded-xl border border-purple p-3">
      <div className="section-label flex items-center gap-1.5"><Lightbulb size={16} aria-hidden />{t('explorer.clue')}</div>
      <p className="mt-2 text-sm text-ink-muted">
        {x && y && x.region !== y.region
          ? t('explorer.clueText', {
              a: rname(x.region), sa: word(x.stats.state), pa: `${fmt(x.stats.pct_per_decade, 1)}%`,
              b: rname(y.region), sb: word(y.stats.state), pb: `${fmt(y.stats.pct_per_decade, 1)}%`,
            })
          : t('explorer.clueNone')}
      </p>
    </div>
  )
}

export function VariablePanel({ variable, imageState, dataStatus }: { variable: VariableId; imageState: ImageState; dataStatus?: string }) {
  const { t } = useTranslation()
  const { region, resolution, set } = useExplorer()
  const field = 'h-11 w-full rounded-lg border border-input-border bg-surface px-3 text-sm'
  return (
    <aside className="rounded-2xl border border-purple bg-surface p-4 lg:p-6 md:col-span-2 lg:col-span-1" aria-label={t(`vars.${variable}.name`)}>
      <div className="flex items-center gap-4 lg:flex-col lg:items-start">
        <VariableImage variable={variable} state={imageState} size={160} />
        <div>
          <h1 className="accent-transition font-display text-2xl font-semibold text-accent">{t(`vars.${variable}.name`)}</h1>
          <p className="accent-transition text-xs text-accent">{t('explorer.sensor')}: {t(`vars.${variable}.sensor`)}</p>
          <div className="mt-2"><DemoBadge status={dataStatus} /></div>
        </div>
      </div>
      <h2 className="section-label mt-6">{t('explorer.measures')}</h2>
      <p className="mt-1 text-sm text-ink">{t(`vars.${variable}.def`)}</p>
      <h2 className="section-label mt-6">{t('explorer.parameters')}</h2>
      <div className="mt-2 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block">{t('explorer.region')}</span>
          <select className={field} value={region} onChange={(e) => set({ region: e.target.value as typeof region, point: null })}>
            {REGION_IDS.map((r) => <option key={r} value={r}>{t(`explorer.regions.${r}`)}</option>)}
          </select>
        </label>
        <div>
          <span className="mb-1 block text-sm" id="res-l">{t('explorer.resolution')}</span>
          <div role="group" aria-labelledby="res-l" className="flex rounded-lg border border-input-border p-0.5">
            {(['annual', 'monthly'] as const).map((r) => (
              <button key={r} aria-pressed={resolution === r} onClick={() => set({ resolution: r })}
                className={`h-10 flex-1 rounded-lg text-sm transition-colors duration-150 ${resolution === r ? 'bg-purple text-white' : 'text-ink-muted hover:text-ink'}`}>
                {t(`explorer.${r}`)}
              </button>
            ))}
          </div>
        </div>
        <PeriodSlider />
      </div>
      <div className="mt-6"><DetectiveClue variable={variable} /></div>
    </aside>
  )
}
