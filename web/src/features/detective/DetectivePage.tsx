import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Eye, Search, Sparkles, Target, Trophy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { api } from '../../core/api'
import { useAccent } from '../../core/useAccent'
import { VARIABLE_IDS, type VariableId } from '../../core/variables'
import { BackButton } from '../../shared/BackButton'
import { ErrorState, Skeleton } from '../../shared/States'
import { VariableImage } from '../../shared/VariableImage'
import { fmt, fmtP } from '../explorer/hooks'

type Pick = 'rising' | 'falling' | 'no_trend'
interface Case { variable: VariableId; region: string; state: Pick | 'insufficient'; rate: string; p: string }

async function loadCases(): Promise<Case[]> {
  const out: Case[] = []
  for (const [i, v] of VARIABLE_IDS.entries()) {
    const c = await api.clues(v)
    const usable = c.regions.filter((r) => r.stats.state !== 'insufficient')
    // alternate between the most contrasting regions so cases differ
    const r = (i % 2 === 0 ? c.opposite[0] : c.opposite[c.opposite.length - 1]) ?? usable[0]
    if (!r) continue
    out.push({ variable: v, region: r.region, state: r.stats.state, rate: fmt(r.stats.sen_slope_per_decade, 2), p: fmtP(r.stats.p_value) })
  }
  return out
}

const UNIT: Record<VariableId, string> = { precipitation: 'mm/day', solar_radiation: 'kWh/m²/day', soil_moisture: '', surface_runoff: 'mm/day', no2: '10¹⁵ molec/cm²', ozone: 'DU' }

function Intro({ onStart, ready }: { onStart: () => void; ready: boolean }) {
  const { t } = useTranslation()
  const steps = [{ Icon: Eye, k: 'i1' }, { Icon: Search, k: 'i2' }, { Icon: Sparkles, k: 'i3' }, { Icon: Trophy, k: 'i4' }] as const
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <BackButton />
      <div className="flex items-center gap-3 text-ink-muted"><Target size={20} aria-hidden /><span className="text-sm font-semibold uppercase tracking-[0.08em]">{t('nav.detective')}</span></div>
      <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">{t('detective.introTitle')}</h1>
      <p className="mt-3 text-lg text-ink-muted">{t('detective.introLead')}</p>
      <ol className="mt-8 grid gap-3 sm:grid-cols-2">
        {steps.map(({ Icon, k }, i) => (
          <li key={k} className="flex gap-4 rounded-2xl border border-purple bg-surface p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-deep-purple"><Icon size={18} aria-hidden /></span>
            <div><div className="num text-xs text-ink-muted">0{i + 1}</div><p className="text-sm leading-relaxed">{t(`detective.${k}`)}</p></div>
          </li>
        ))}
      </ol>
      <p className="mt-6 rounded-xl border border-purple bg-background/60 p-4 text-sm leading-relaxed text-ink-muted">{t('detective.introNote')}</p>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button onClick={onStart} disabled={!ready} className="inline-flex h-12 items-center gap-2 rounded-lg bg-magenta px-6 font-medium text-white transition-colors duration-150 hover:bg-wine disabled:opacity-50">
          {ready ? t('detective.start') : t('detective.loading')} <ArrowRight size={18} aria-hidden />
        </button>
        <span className="text-sm text-ink-muted">{t('detective.or')} <Link to="/explore?v=precipitation" className="text-ink underline underline-offset-4">{t('detective.explore')}</Link></span>
      </div>
    </div>
  )
}

export default function DetectivePage() {
  const { t } = useTranslation()
  const q = useQuery({ queryKey: ['cases'], queryFn: loadCases, staleTime: Infinity })
  const [started, setStarted] = useState(false)
  const [i, setI] = useState(0)
  const [answer, setAnswer] = useState<Pick | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const cases = q.data ?? []
  const cur = cases[i]
  useAccent(started && cur && !done ? cur.variable : 'home')
  const options: Pick[] = useMemo(() => ['rising', 'falling', 'no_trend'], [])

  const choose = (p: Pick) => { if (answer || !cur) return; setAnswer(p); if (p === cur.state) setScore((s) => s + 1) }
  const next = () => { if (i + 1 >= cases.length) setDone(true); else { setI(i + 1); setAnswer(null) } }
  const reset = () => { setI(0); setAnswer(null); setScore(0); setDone(false) }

  if (!started) {
    return (
      <>
        <Intro onStart={() => setStarted(true)} ready={cases.length > 0} />
        {q.error && <div className="mx-auto max-w-3xl px-4"><ErrorState error={q.error} onRetry={() => q.refetch()} /></div>}
      </>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 text-center">
      <div className="text-left"><BackButton /></div>
      <h1 className="font-display text-3xl font-semibold">{t('detective.title')}</h1>
      {q.isLoading && <div className="mt-8 space-y-4"><p className="text-ink-muted">{t('detective.loading')}</p><Skeleton className="mx-auto h-64 w-64" /></div>}
      {done && (
        <div className="mt-10" aria-live="polite">
          <Trophy size={40} className="mx-auto text-ink" aria-hidden />
          <p className="mt-3 text-xl">{t('detective.score', { score, total: cases.length })}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={reset} className="h-11 rounded-lg bg-magenta px-6 text-white hover:bg-wine">{t('detective.again')}</button>
            <Link to="/explore?v=precipitation" className="inline-flex h-11 items-center rounded-lg border border-input-border px-6 hover:bg-deep-purple">{t('detective.explore')}</Link>
          </div>
        </div>
      )}
      {cur && !done && (
        <div className="mt-6">
          <p className="text-sm text-ink-muted">{t('detective.case', { n: i + 1, total: cases.length })}</p>
          <div className="mt-4 flex justify-center"><VariableImage variable={cur.variable} state={answer ? (cur.state === 'insufficient' ? 'no_trend' : cur.state) : 'idle'} size={220} /></div>
          <h2 className="accent-transition mt-4 font-display text-2xl font-semibold text-accent">{t(`vars.${cur.variable}.name`)}</h2>
          <p className="text-sm text-ink-muted">{t('detective.where', { name: t(`vars.${cur.variable}.sensor`), region: t(`explorer.regions.${cur.region}`), start: 1984, end: 2025 })}</p>
          <p className="mt-6 text-lg">{t('detective.question')}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3" role="group" aria-label={t('detective.question')}>
            {options.map((o) => (
              <button key={o} onClick={() => choose(o)} disabled={!!answer}
                className={`accent-transition h-11 rounded-lg border-[1.5px] border-accent px-5 font-medium text-accent ${answer && o === cur.state ? 'bg-deep-purple' : ''} ${answer && o !== cur.state ? 'opacity-40' : 'hover:bg-deep-purple'}`}>
                {t(`detective.${o}`)}
              </button>
            ))}
          </div>
          {answer && (
            <div className="mt-6 rounded-xl bg-deep-purple p-4 text-left" role="status" aria-live="polite">
              <p className="font-semibold">{answer === cur.state ? t('detective.right') : t('detective.wrong')}</p>
              <p className="mt-1 text-sm text-ink-muted">{t('detective.explain', { verdict: t(`detective.${cur.state === 'insufficient' ? 'no_trend' : cur.state}`), rate: `${cur.rate} ${UNIT[cur.variable]}`, p: cur.p })}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={next} className="h-11 rounded-lg bg-magenta px-5 text-white hover:bg-wine">{i + 1 >= cases.length ? t('detective.finish') : t('detective.next')}</button>
                <Link to={`/explore?v=${cur.variable}&r=${cur.region}`} className="inline-flex h-11 items-center rounded-lg border border-input-border px-5 hover:bg-purple">{t('detective.openExplorer')}</Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
