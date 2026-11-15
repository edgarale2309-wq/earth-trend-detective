import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../core/api'
import { useAccent } from '../../core/useAccent'
import { VARIABLE_IDS, type VariableId } from '../../core/variables'
import { AppBar } from '../../shared/AppBar'
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

export default function DetectivePage() {
  const { t } = useTranslation()
  const q = useQuery({ queryKey: ['cases'], queryFn: loadCases, staleTime: Infinity })
  const [i, setI] = useState(0)
  const [answer, setAnswer] = useState<Pick | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const cases = q.data ?? []
  const cur = cases[i]
  useAccent(cur && !done ? cur.variable : 'home')
  const options: Pick[] = useMemo(() => ['rising', 'falling', 'no_trend'], [])

  const choose = (p: Pick) => { if (answer || !cur) return; setAnswer(p); if (p === cur.state) setScore((s) => s + 1) }
  const next = () => { if (i + 1 >= cases.length) setDone(true); else { setI(i + 1); setAnswer(null) } }
  const reset = () => { setI(0); setAnswer(null); setScore(0); setDone(false) }
  const unit = (v: VariableId) => ({ precipitation: 'mm/day', solar_radiation: 'kWh/m²/day', soil_moisture: '', surface_runoff: 'mm/day', no2: '10¹⁵ molec/cm²', ozone: 'DU' })[v]

  return (
    <div className="min-h-screen">
      <AppBar back />
      <main id="main" className="mx-auto max-w-xl px-4 py-10 text-center">
        <h1 className="font-display text-3xl font-semibold">{t('detective.title')}</h1>
        {q.isLoading && <div className="mt-8 space-y-4"><p className="text-ink-muted">{t('detective.loading')}</p><Skeleton className="mx-auto h-64 w-64" /></div>}
        {q.error && <div className="mt-8 text-left"><ErrorState error={q.error} onRetry={() => q.refetch()} /></div>}
        {done && (
          <div className="mt-10" aria-live="polite">
            <p className="text-xl">{t('detective.score', { score, total: cases.length })}</p>
            <button onClick={reset} className="mt-6 h-11 rounded-lg bg-magenta px-6 text-white hover:bg-wine">{t('detective.again')}</button>
          </div>
        )}
        {cur && !done && (
          <div className="mt-6">
            <p className="text-sm text-ink-muted">{t('detective.case', { n: i + 1, total: cases.length })}</p>
            <div className="mt-4 flex justify-center">
              <VariableImage variable={cur.variable} state={answer ? cur.state : 'idle'} size={240} />
            </div>
            <h2 className="accent-transition mt-4 font-display text-2xl font-semibold text-accent">{t(`vars.${cur.variable}.name`)}</h2>
            <p className="text-sm text-ink-muted">{t('detective.where', { name: t(`vars.${cur.variable}.sensor`), region: t(`explorer.regions.${cur.region}`), start: 1984, end: 2025 })}</p>
            <p className="mt-6 text-lg">{t('detective.question')}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3" role="group" aria-label={t('detective.question')}>
              {options.map((o) => (
                <button key={o} onClick={() => choose(o)} disabled={!!answer}
                  className={`accent-transition h-11 rounded-lg border-[1.5px] px-5 font-medium ${answer && o === cur.state ? 'border-accent bg-deep-purple text-accent' : 'border-accent text-accent'} ${answer && o !== cur.state ? 'opacity-40' : 'hover:bg-deep-purple'}`}>
                  {t(`detective.${o}`)}
                </button>
              ))}
            </div>
            {answer && (
              <div className="mt-6 rounded-xl bg-deep-purple p-4 text-left" role="status" aria-live="polite">
                <p className="font-semibold">{answer === cur.state ? t('detective.right') : t('detective.wrong')}</p>
                <p className="mt-1 text-sm text-ink-muted">{t('detective.explain', { verdict: t(`detective.${cur.state === 'insufficient' ? 'no_trend' : cur.state}`), rate: `${cur.rate} ${unit(cur.variable)}`, p: cur.p })}</p>
                <button onClick={next} className="mt-4 h-11 rounded-lg bg-magenta px-5 text-white hover:bg-wine">{i + 1 >= cases.length ? t('detective.finish') : t('detective.next')}</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
