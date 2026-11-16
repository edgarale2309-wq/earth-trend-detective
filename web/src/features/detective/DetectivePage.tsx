import { useQuery } from '@tanstack/react-query'
import { ArrowRight, BookOpen, Check, Dices, FlaskConical, Newspaper, Search, Target, Trophy, X as XIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { api } from '../../core/api'
import { useAccent } from '../../core/useAccent'
import { VARIABLE_IDS, type VariableId } from '../../core/variables'
import { BackButton } from '../../shared/BackButton'
import { ErrorState, Skeleton } from '../../shared/States'
import { VariableImage } from '../../shared/VariableImage'
import { fmt, fmtP } from '../explorer/hooks'
import { CONCEPTS, STORIES, tr, type Mcq, type Story } from './banks'

type TrendPick = 'rising' | 'falling' | 'no_trend'
type Mode = 'mixed' | 'data' | 'concepts' | 'stories'

interface DataCase { variable: VariableId; region: string; state: TrendPick; rate: string; p: string }
type Item =
  | { kind: 'data'; c: DataCase }
  | { kind: 'concept' | 'story'; m: Mcq | Story; order: number[] }

interface Question {
  key: string
  kind: Item['kind']
  title?: string
  body?: string
  where?: string
  prompt: string
  choices: { id: string; label: string }[]
  correct: string
  explain: string
  variable?: VariableId
  link?: string
}

// Variables whose data are not yet real NASA records are not used as "facts" in the data cases.
const DEMO: VariableId[] = ['surface_runoff', 'no2']
const UNIT: Record<VariableId, string> = { precipitation: 'mm/day', solar_radiation: 'kWh/m²/day', soil_moisture: '', surface_runoff: 'mm/day', no2: '10¹⁵ molec/cm²', ozone: 'DU' }
const ROUND = 6

function shuffle<T>(a: T[]): T[] {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]]
  }
  return b
}
const sample = <T,>(a: T[], n: number) => shuffle(a).slice(0, n)

/** Every region for every real variable: a pool of data cases to draw from at random. */
async function loadPool(): Promise<DataCase[]> {
  const out: DataCase[] = []
  for (const v of VARIABLE_IDS.filter((x) => !DEMO.includes(x))) {
    const c = await api.clues(v)
    for (const r of c.regions) {
      if (r.stats.state === 'insufficient') continue
      out.push({ variable: v, region: r.region, state: r.stats.state, rate: fmt(r.stats.sen_slope_per_decade, 2), p: fmtP(r.stats.p_value) })
    }
  }
  return out
}

function buildDeck(mode: Mode, pool: DataCase[]): Item[] {
  const data = (n: number): Item[] => sample(pool, n).map((c) => ({ kind: 'data' as const, c }))
  const mcq = (kind: 'concept' | 'story', bank: Mcq[], n: number): Item[] =>
    sample(bank, n).map((m) => ({ kind, m, order: shuffle(m.choices.map((_, i) => i)) }))
  if (mode === 'data') return data(ROUND)
  if (mode === 'concepts') return mcq('concept', CONCEPTS, ROUND)
  if (mode === 'stories') return mcq('story', STORIES, ROUND)
  const deck = [...data(2), ...mcq('concept', CONCEPTS, 2), ...mcq('story', STORIES, 2)]
  // if the data pool is empty, top up with concept questions so the round still has six
  while (deck.length < ROUND) deck.push(...mcq('concept', CONCEPTS.filter((c) => !deck.some((d) => d.kind === 'concept' && d.m.id === c.id)), 1))
  return shuffle(deck)
}

const MODES: { id: Mode; Icon: typeof Dices }[] = [
  { id: 'mixed', Icon: Dices }, { id: 'data', Icon: Search }, { id: 'concepts', Icon: FlaskConical }, { id: 'stories', Icon: Newspaper },
]

function Intro({ onStart, ready, mode, setMode }: { onStart: () => void; ready: boolean; mode: Mode; setMode: (m: Mode) => void }) {
  const { t } = useTranslation()
  const needsData = mode === 'data'
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <BackButton />
      <div className="flex items-center gap-3 text-ink-muted"><Target size={20} aria-hidden /><span className="text-sm font-semibold uppercase tracking-[0.08em]">{t('nav.detective')}</span></div>
      <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">{t('detective.introTitle')}</h1>
      <p className="mt-3 text-lg text-ink-muted">{t('detective.introLead')}</p>
      <ol className="mt-6 grid gap-3 sm:grid-cols-3">
        {(['i1', 'i2', 'i3'] as const).map((k, i) => (
          <li key={k} className="rounded-2xl border border-purple bg-surface p-4">
            <div className="num text-xs text-ink-muted">0{i + 1}</div>
            <p className="mt-1 text-sm leading-relaxed">{t(`detective.${k}`)}</p>
          </li>
        ))}
      </ol>

      <fieldset className="mt-8">
        <legend className="text-sm font-semibold uppercase tracking-[0.08em] text-ink-muted">{t('detective.modeTitle')}</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {MODES.map(({ id, Icon }) => (
            <label key={id} className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors duration-150 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink ${mode === id ? 'border-accent bg-deep-purple' : 'border-purple bg-surface hover:bg-deep-purple'}`}>
              <input type="radio" name="mode" value={id} checked={mode === id} onChange={() => setMode(id)} className="sr-only" />
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background"><Icon size={18} aria-hidden /></span>
              <span>
                <span className="block font-semibold">{t(`detective.mode_${id}`)}</span>
                <span className="mt-0.5 block text-sm leading-relaxed text-ink-muted">{t(`detective.mode_${id}_desc`)}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <p className="mt-6 rounded-xl border border-purple bg-background/60 p-4 text-sm leading-relaxed text-ink-muted">{t('detective.introNote')}</p>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button onClick={onStart} disabled={needsData && !ready} className="inline-flex h-12 items-center gap-2 rounded-lg bg-magenta px-6 font-medium text-white transition-colors duration-150 hover:bg-wine disabled:opacity-50">
          {needsData && !ready ? t('detective.loading') : t('detective.start')} <ArrowRight size={18} aria-hidden />
        </button>
        <span className="text-sm text-ink-muted">{t('detective.or')} <Link to="/explore?v=precipitation" className="text-ink underline underline-offset-4">{t('detective.explore')}</Link></span>
      </div>
    </div>
  )
}

export default function DetectivePage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const q = useQuery({ queryKey: ['case-pool'], queryFn: loadPool, staleTime: Infinity })
  const [mode, setMode] = useState<Mode>('mixed')
  const [deck, setDeck] = useState<Item[] | null>(null)
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const feedback = useRef<HTMLDivElement>(null)

  const start = useCallback(() => {
    setDeck(buildDeck(mode, q.data ?? []))
    setI(0); setPicked(null); setScore(0); setDone(false)
  }, [mode, q.data])

  // Questions are rendered from raw items, so switching language mid-round translates them too.
  const question: Question | null = useMemo(() => {
    const item = deck?.[i]
    if (!item) return null
    if (item.kind === 'data') {
      const c = item.c
      return {
        key: `${c.variable}-${c.region}`, kind: 'data', variable: c.variable,
        where: t('detective.where', { name: t(`vars.${c.variable}.sensor`), region: t(`explorer.regions.${c.region}`), start: 1984, end: 2025 }),
        prompt: t('detective.question'),
        choices: (['rising', 'falling', 'no_trend'] as const).map((o) => ({ id: o, label: t(`detective.${o}`) })),
        correct: c.state,
        explain: t('detective.explain', { verdict: t(`detective.${c.state}`), rate: `${c.rate} ${UNIT[c.variable]}`.trim(), p: c.p }),
        link: `/explore?v=${c.variable}&r=${c.region}`,
      }
    }
    const m = item.m
    const story = item.kind === 'story' ? (m as Story) : null
    return {
      key: m.id, kind: item.kind, variable: story?.variable,
      title: story ? tr(story.title, lang) : undefined, body: story ? tr(story.body, lang) : undefined,
      prompt: tr(m.prompt, lang),
      choices: item.order.map((idx) => ({ id: String(idx), label: tr(m.choices[idx], lang) })),
      correct: '0', explain: tr(m.explain, lang),
      link: story?.variable ? `/explore?v=${story.variable}${story.region ? `&r=${story.region}` : ''}` : undefined,
    }
  }, [deck, i, t, lang])

  useAccent(deck && question?.variable && !done ? question.variable : 'home')
  useEffect(() => { document.title = `${t('detective.title')} · ${t('app.name')}` }, [t, lang])
  // keyboard and screen-reader users: land on the new question, then on the explanation after answering
  useEffect(() => { if (deck && !done) heading.current?.focus() }, [i, deck, done])
  useEffect(() => { if (picked) feedback.current?.focus() }, [picked])

  const choose = (id: string) => {
    if (picked || !question) return
    setPicked(id)
    if (id === question.correct) setScore((s) => s + 1)
  }
  const next = () => { if (!deck || i + 1 >= deck.length) setDone(true); else { setI(i + 1); setPicked(null) } }

  if (!deck) {
    return (
      <>
        <Intro onStart={start} ready={!q.isLoading && !q.error} mode={mode} setMode={setMode} />
        {q.error && mode === 'data' && <div className="mx-auto max-w-3xl px-4"><ErrorState error={q.error} onRetry={() => q.refetch()} /></div>}
      </>
    )
  }

  const total = deck.length
  const tier = score >= total - 1 ? 'top' : score >= total / 2 ? 'mid' : 'low'
  const kindIcon = { data: Search, concept: BookOpen, story: Newspaper }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <BackButton />
      <h1 className="font-display text-3xl font-semibold">{t('detective.title')}</h1>

      {done && (
        <div className="mt-8 text-center" role="status" aria-live="polite">
          <Trophy size={40} className="mx-auto text-ink" aria-hidden />
          <h2 className="mt-3 text-xl font-semibold">{t('detective.score', { score, total })}</h2>
          <p className="mt-2 text-ink-muted">{t(`detective.tier_${tier}`)}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={start} className="inline-flex h-11 items-center gap-2 rounded-lg bg-magenta px-6 text-white hover:bg-wine"><Dices size={16} aria-hidden />{t('detective.again')}</button>
            <button onClick={() => setDeck(null)} className="h-11 rounded-lg border border-input-border px-6 hover:bg-deep-purple">{t('detective.changeMode')}</button>
            <Link to="/explore?v=precipitation" className="inline-flex h-11 items-center rounded-lg border border-input-border px-6 hover:bg-deep-purple">{t('detective.explore')}</Link>
          </div>
        </div>
      )}

      {question && !done && (
        <section className="mt-6" aria-labelledby="q-h">
          <div className="flex items-center justify-between gap-3 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-2">
              {(() => { const Icon = kindIcon[question.kind]; return <Icon size={16} aria-hidden /> })()}
              <span className="font-semibold uppercase tracking-[0.08em]">{t(`detective.kind_${question.kind}`)}</span>
            </span>
            <span className="num">{t('detective.case', { n: i + 1, total })}</span>
          </div>
          <div role="progressbar" aria-label={t('detective.case', { n: i + 1, total })} aria-valuemin={1} aria-valuemax={total} aria-valuenow={i + 1} className="mt-2 h-1.5 overflow-hidden rounded-full bg-deep-purple">
            <div className="h-full rounded-full bg-accent transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${((i + 1) / total) * 100}%` }} />
          </div>

          {question.kind === 'data' && question.variable && (
            <div className="mt-5 flex items-center gap-4">
              <VariableImage variable={question.variable} state={picked ? (question.correct as TrendPick) : 'idle'} size={96} className="shrink-0" />
              <div>
                <h2 id="q-h" ref={heading} tabIndex={-1} className="accent-transition font-display text-2xl font-semibold text-accent outline-none">{t(`vars.${question.variable}.name`)}</h2>
                <p className="text-sm text-ink-muted">{question.where}</p>
              </div>
            </div>
          )}
          {question.kind !== 'data' && (
            <div className="mt-5">
              <h2 id="q-h" ref={heading} tabIndex={-1} className="font-display text-2xl font-semibold outline-none">{question.title ?? question.prompt}</h2>
              {question.body && <p className="mt-3 rounded-xl border border-purple bg-surface p-4 leading-relaxed text-ink-muted">{question.body}</p>}
            </div>
          )}

          <fieldset className="mt-6">
            <legend className="text-lg font-medium">{question.prompt}</legend>
            <div className="mt-3 grid gap-2">
              {question.choices.map((c) => {
                const isRight = c.id === question.correct
                const isMine = picked === c.id
                const state = !picked ? '' : isRight ? 'border-ink bg-deep-purple' : isMine ? 'border-danger' : 'opacity-60'
                return (
                  <button key={c.id} onClick={() => choose(c.id)} aria-disabled={!!picked}
                    className={`flex min-h-12 items-start gap-3 rounded-xl border-[1.5px] px-4 py-3 text-left text-[15px] leading-snug transition-colors duration-150 ${picked ? state : 'border-purple bg-surface hover:bg-deep-purple'}`}>
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden>
                      {picked && isRight && <Check size={18} />}
                      {picked && isMine && !isRight && <XIcon size={18} />}
                    </span>
                    <span className="flex-1">
                      {c.label}
                      {picked && isRight && <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">· {t('detective.correctAnswer')}</span>}
                      {picked && isMine && !isRight && <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">· {t('detective.yourAnswer')}</span>}
                    </span>
                  </button>
                )
              })}
            </div>
          </fieldset>

          {picked && (
            <div ref={feedback} tabIndex={-1} role="status" aria-live="polite" className="mt-5 rounded-xl bg-deep-purple p-4 text-left outline-none">
              <p className="font-semibold">{picked === question.correct ? t('detective.right') : t('detective.wrong')}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{question.explain}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={next} className="h-11 rounded-lg bg-magenta px-5 text-white hover:bg-wine">{i + 1 >= total ? t('detective.finish') : t('detective.next')}</button>
                {question.link && <Link to={question.link} className="inline-flex h-11 items-center rounded-lg border border-input-border px-5 hover:bg-purple">{t('detective.openExplorer')}</Link>}
              </div>
            </div>
          )}
        </section>
      )}
      {q.isLoading && !deck && <Skeleton className="mt-8 h-64" />}
    </div>
  )
}
