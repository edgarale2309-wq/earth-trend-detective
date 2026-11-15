import { Info, Minus, TrendingDown, TrendingUp, CircleDashed } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { Stats } from '../../core/api'
import { GlossaryTip } from '../../shared/States'
import { fmt, fmtP } from '../explorer/hooks'
import type { Mode } from '../explorer/store'

const ICON = { rising: TrendingUp, falling: TrendingDown, no_trend: Minus, insufficient: CircleDashed }

export function SignificanceBadge({ state }: { state: Stats['state'] }) {
  const { t } = useTranslation()
  const Icon = ICON[state]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-ink-muted px-2.5 py-1 text-sm text-ink">
      <Icon size={16} aria-hidden />{t(`state.${state}`)}
    </span>
  )
}

export function VerdictPanel({ stats, unit, name, mode }: { stats: Stats; unit: string; name: string; mode: Mode }) {
  const { t } = useTranslation()
  const rate = stats.sen_slope_per_decade
  const rateText = `${fmt(rate)} ${unit}`
  const pctText = stats.pct_per_decade != null ? ` (${fmt(stats.pct_per_decade, 1)}%)` : ''

  const direction = stats.state === 'rising' ? t('state.dirRising') : stats.state === 'falling' ? t('state.dirFalling') : stats.state === 'no_trend' ? t('state.dirNone') : t('state.insufficient')
  const slight = stats.state === 'no_trend' && rate != null ? (rate > 0 ? t('state.slightUp') : t('state.slightDown')) : null
  const absRate = `${fmt(Math.abs(rate ?? 0)).replace(/^\+/, '')} ${unit}`
  const summary =
    stats.state === 'rising' ? t('state.sumRising', { name, rate: absRate })
    : stats.state === 'falling' ? t('state.sumFalling', { name, rate: absRate })
    : stats.state === 'no_trend' ? t('state.sumNone', { p: fmtP(stats.p_value) })
    : t('state.sumInsufficient')

  return (
    <section aria-labelledby="sig-h" className="rounded-2xl border border-purple bg-surface p-4 lg:p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 id="sig-h" className="section-label">{t('explorer.significance')}</h2>
        <SignificanceBadge state={stats.state} />
      </div>
      <div aria-live="polite" className="mt-4 space-y-3">
        {stats.state === 'insufficient' ? (
          <p className="text-sm text-ink">{stats.reason ?? t('state.sumInsufficient')} {t('state.needMore')}</p>
        ) : (
          <>
            <div className="rounded-xl bg-deep-purple p-3">
              <div className="text-xs text-ink-muted">{t('explorer.rate')}</div>
              <div className="num accent-transition text-[28px] font-semibold text-accent">
                {rateText}<span className="text-sm"> {t('explorer.perDecade')}{pctText}</span>
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-ink-muted">{t('explorer.direction')}</span>
              <span className="text-right font-medium">{direction}{slight && <span className="block text-xs font-normal text-ink-muted">{slight}</span>}</span>
            </div>
            <p className="text-sm text-ink-muted">{summary}</p>
          </>
        )}
        {mode === 'scientific' && stats.state !== 'insufficient' && (
          <dl className="num grid grid-cols-2 gap-x-4 gap-y-2 border-t border-purple pt-3 text-sm">
            <Row k={<GlossaryTip term="sen">{t('stats.sen')}</GlossaryTip>} v={`${fmt(stats.sen_slope_per_decade, 3)}`} />
            <Row k={<GlossaryTip term="p">{t('stats.p')}</GlossaryTip>} v={fmtP(stats.p_value)} />
            <Row k={t('stats.z')} v={fmt(stats.z, 2)} />
            <Row k={t('stats.t')} v={fmt(stats.t, 2)} />
            <Row k={t('stats.r2')} v={stats.r2 != null ? stats.r2.toFixed(3) : '—'} />
            <Row k={t('stats.n')} v={String(stats.n)} />
            <div className="col-span-2 flex justify-between"><dt className="font-sans text-ink-muted"><GlossaryTip term="ci">{t('stats.ci')}</GlossaryTip></dt><dd>[{fmt(stats.ci_low, 3)}, {fmt(stats.ci_high, 3)}]</dd></div>
            <div className="col-span-2 font-sans text-xs text-ink-muted">{stats.methods_agree ? t('stats.agree') : t('stats.disagree')}</div>
          </dl>
        )}
        <Link to="/method" className="inline-flex h-11 items-center gap-2 text-sm text-ink-muted underline underline-offset-4"><Info size={16} aria-hidden />{t('explorer.methodLink')}</Link>
      </div>
    </section>
  )
}

function Row({ k, v }: { k: React.ReactNode; v: string }) {
  return <div className="flex justify-between gap-2"><dt className="font-sans text-ink-muted">{k}</dt><dd>{v}</dd></div>
}
