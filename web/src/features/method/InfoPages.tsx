import { ArrowDown, ArrowRight, ArrowUp, BookOpen, CircleDashed, FlaskConical, Layers, Minus, Ruler, ShieldCheck, TrendingUp, Wand2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const STEPS = [
  { n: 1, Icon: Wand2 }, { n: 2, Icon: TrendingUp }, { n: 3, Icon: Ruler }, { n: 4, Icon: FlaskConical }, { n: 5, Icon: Layers },
] as const

export function InfoPage() {
  const { t } = useTranslation()
  const reads = [
    { Icon: ArrowUp, k: 'readUp', badge: 'state.rising' }, { Icon: ArrowDown, k: 'readDown', badge: 'state.falling' },
    { Icon: Minus, k: 'readNone', badge: 'state.no_trend' }, { Icon: CircleDashed, k: 'readNot', badge: 'state.insufficient' },
  ] as const
  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-10 sm:px-6">
      <header>
        <div className="flex items-center gap-2 text-ink-muted"><BookOpen size={18} aria-hidden /><span className="text-sm font-semibold uppercase tracking-[0.08em]">{t('nav.info')}</span></div>
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">{t('info.title')}</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-muted">{t('info.lead')}</p>
      </header>

      <section>
        <h2 id="flow-h" className="font-display text-xl font-semibold">{t('info.flowTitle')}</h2>
        <ol className="mt-4 flex flex-wrap items-center gap-2">
          {STEPS.map(({ n }, i) => (
            <li key={n} className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-purple bg-surface px-4 py-2 text-sm"><span className="num text-ink-muted">{n}</span>{t(`info.flow${n}`)}</span>
              {i < STEPS.length - 1 && <ArrowRight size={16} className="text-ink-muted" aria-hidden />}
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-label={t('info.flowTitle')}>
        {STEPS.map(({ n, Icon }) => (
          <article key={n} className="rounded-2xl border border-purple bg-surface p-5">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-deep-purple"><Icon size={18} aria-hidden /></span>
              <span className="num text-2xl text-ink-muted/50">0{n}</span>
            </div>
            <h3 className="mt-4 font-semibold">{t(`info.s${n}t`)}</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">{t(`info.s${n}`)}</p>
            <span className="mt-3 inline-block rounded-lg border border-input-border px-2 py-0.5 text-xs text-ink-muted">{t(`info.s${n}term`)}</span>
          </article>
        ))}
      </section>

      <section aria-labelledby="read-h">
        <h2 id="read-h" className="font-display text-xl font-semibold">{t('info.readTitle')}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {reads.map(({ Icon, k, badge }) => (
            <div key={k} className="flex gap-4 rounded-2xl border border-purple bg-surface p-4">
              <Icon size={22} className="mt-0.5 shrink-0 text-ink" aria-hidden />
              <div>
                <span className="inline-flex items-center rounded-lg border border-ink-muted px-2.5 py-0.5 text-sm">{t(badge)}</span>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t(`info.${k}`)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="rules-h" className="rounded-3xl border border-purple bg-surface p-6">
        <h2 id="rules-h" className="flex items-center gap-2 font-display text-xl font-semibold"><ShieldCheck size={20} aria-hidden />{t('info.rulesTitle')}</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {(['r1', 'r2', 'r3', 'r4'] as const).map((r) => (
            <li key={r} className="flex gap-3 text-sm leading-relaxed text-ink-muted"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" aria-hidden />{t(`info.${r}`)}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="gl-h">
        <h2 id="gl-h" className="font-display text-xl font-semibold">{t('info.glossaryTitle')}</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {([['stats.p', 'glossary.p'], ['stats.sen', 'glossary.sen'], ['info.s1term', 'glossary.anomaly'], ['stats.ci', 'glossary.ci']] as const).map(([k, d]) => (
            <div key={k} className="rounded-xl border border-purple p-4"><dt className="font-semibold">{t(k)}</dt><dd className="mt-1 text-sm leading-relaxed text-ink-muted">{t(d)}</dd></div>
          ))}
        </dl>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-purple bg-surface p-5"><h2 className="font-semibold">{t('info.validationTitle')}</h2><p className="mt-2 text-sm leading-relaxed text-ink-muted">{t('info.validation')}</p></section>
        <section className="rounded-2xl border border-purple bg-surface p-5"><h2 className="font-semibold">{t('info.sourcesTitle')}</h2>
          <ul className="mt-2 space-y-2 text-sm leading-relaxed text-ink-muted">{(['src1', 'src2', 'src3'] as const).map((s) => <li key={s}>{t(`info.${s}`)}</li>)}</ul>
        </section>
      </div>
    </div>
  )
}

export function AboutPage() {
  const { t } = useTranslation()
  return (
    <div className="mx-auto max-w-[720px] px-4 py-10">
      <h1 className="font-display text-3xl font-semibold">{t('about.title')}</h1>
      <p className="mt-4">{t('about.challenge')}</p>
      <p className="mt-3 text-ink-muted">{t('about.team')}</p>
      <a className="mt-3 inline-block underline underline-offset-4" href="https://github.com/edgarale2309-wq/earth-trend-detective" target="_blank" rel="noreferrer">{t('about.repo')}</a>
      <h2 className="mt-8 font-display text-xl font-semibold">{t('about.aiT')}</h2>
      <p className="mt-2">{t('about.ai')}</p>
    </div>
  )
}
