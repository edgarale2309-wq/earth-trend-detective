import { Search } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { VariableId } from '../../core/variables'
import { DemoBadge } from '../../shared/States'
import { VariableImage, type ImageState } from '../../shared/VariableImage'
import { fmt, useClues } from '../explorer/hooks'

function DetectiveClue({ variable }: { variable: VariableId }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { data } = useClues(open ? variable : null)
  const [x, y] = data?.opposite ?? []
  const word = (s: string) => t(`state.dir${s === 'rising' ? 'Rising' : s === 'falling' ? 'Falling' : 'None'}`).toLowerCase()
  const rname = (id: string) => t(`explorer.regions.${id}`)
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="accent-transition inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] border-accent px-4 text-sm font-medium text-accent hover:bg-deep-purple"
      >
        <Search size={16} aria-hidden />{open ? t('explorer.clueHide') : t('explorer.clueShow')}
      </button>
      {open && (
        <div className="mt-3 rounded-xl border border-purple bg-background/60 p-3 text-sm leading-relaxed text-ink-muted">
          {x && y && x.region !== y.region
            ? t('explorer.clueText', {
                a: rname(x.region), sa: word(x.stats.state), pa: `${fmt(x.stats.pct_per_decade, 1)}%`,
                b: rname(y.region), sb: word(y.stats.state), pb: `${fmt(y.stats.pct_per_decade, 1)}%`,
              })
            : data ? t('explorer.clueNone') : t('states.loading')}
          <Link to="/detective" className="mt-2 block text-ink underline underline-offset-4">{t('explorer.clueGame')}</Link>
        </div>
      )}
    </div>
  )
}

export function VariablePanel({ variable, imageState, dataStatus }: { variable: VariableId; imageState: ImageState; dataStatus?: string }) {
  const { t } = useTranslation()
  const blocks = [['aboutWhat', 'what'], ['aboutShows', 'shows'], ['aboutRead', 'read'], ['aboutWhy', 'why']] as const
  return (
    <aside className="rounded-2xl border border-purple bg-surface p-4 lg:p-5" aria-label={t(`vars.${variable}.name`)}>
      <div className="flex items-center gap-4">
        <VariableImage variable={variable} state={imageState} size={112} className="shrink-0" />
        <div className="min-w-0">
          <h1 className="accent-transition font-display text-2xl font-semibold leading-tight text-accent">{t(`vars.${variable}.name`)}</h1>
          <p className="mt-1 text-xs text-ink-muted">{t('explorer.sensor')}: {t(`vars.${variable}.sensor`)}</p>
          <div className="mt-2"><DemoBadge status={dataStatus} /></div>
        </div>
      </div>
      <h2 className="section-label mt-5">{t('explorer.about')}</h2>
      <dl className="mt-2 space-y-3">
        {blocks.map(([label, key]) => (
          <div key={key}>
            <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-ink">{t(`explorer.${label}`)}</dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-ink-muted">{t(`vars.${variable}.${key}`)}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5"><DetectiveClue variable={variable} /></div>
    </aside>
  )
}
