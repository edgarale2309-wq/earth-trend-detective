import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useAccent } from '../../core/useAccent'
import { VARIABLE_IDS, VARIABLES, type VariableId } from '../../core/variables'
import { AppBar } from '../../shared/AppBar'
import { ICONS, VariableImage } from '../../shared/VariableImage'
import { useExplorer } from '../explorer/store'

const SOURCES: Record<VariableId, string> = {
  precipitation: 'NASA POWER · 1984–2025',
  solar_radiation: 'NASA POWER · 1984–2025',
  soil_moisture: 'NASA POWER · 1984–2025',
  surface_runoff: 'GLDAS Noah',
  no2: 'OMI · Aura',
  ozone: 'NASA POWER · 1984–2025',
}

function HomeHero({ onCta }: { onCta: () => void }) {
  const { t } = useTranslation()
  const [earthFailed, setEarthFailed] = useState(false)
  return (
    <section className="starfield mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 lg:grid-cols-2 lg:px-6 lg:py-20">
      <div>
        <div className="mb-6 h-0.5 w-16 bg-crimson" aria-hidden />
        <h1 className="font-display text-4xl font-semibold leading-tight lg:text-[56px]">{t('home.title')}</h1>
        <p className="mt-5 max-w-md text-lg text-ink-muted">{t('home.subtitle')}</p>
        <button
          onClick={onCta}
          className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-magenta px-6 font-medium text-white transition-colors duration-150 hover:bg-wine active:bg-wine"
        >
          {t('home.cta')} <ChevronDown size={18} aria-hidden />
        </button>
      </div>
      <div className="relative mx-auto aspect-video w-full max-w-xl overflow-hidden rounded-3xl bg-surface">
        {earthFailed ? (
          <div role="img" aria-label={t('home.earthAlt')} className="flex h-full items-center justify-center">
            <div className="aspect-square h-4/5 rounded-full" style={{ background: 'radial-gradient(circle at 35% 30%, #612073, #2F1740 55%, #140A1E 100%)', boxShadow: 'inset -20px -10px 40px rgba(0,0,0,.5)' }} />
          </div>
        ) : (
          <img src="/images/home/earth.webp" alt={t('home.earthAlt')} onError={() => setEarthFailed(true)} className="h-full w-full object-cover" />
        )}
        {!earthFailed && <span className="absolute bottom-3 right-4 text-xs text-ink-muted">{t('home.ai')}</span>}
      </div>
    </section>
  )
}

function VariableCarousel({ onActive }: { onActive: (i: number) => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const scroller = useRef<HTMLDivElement>(null)
  const slides = useRef<(HTMLLIElement | null)[]>([])
  const [active, setActive] = useState(0)
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const update = useCallback(() => {
    const el = scroller.current
    if (!el) return
    const center = el.scrollLeft + el.clientWidth / 2
    let best = 0, bestD = Infinity
    slides.current.forEach((s, i) => {
      if (!s) return
      const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - center)
      if (d < bestD) { bestD = d; best = i }
      const k = Math.min(d / s.offsetWidth, 1)
      s.style.opacity = String(reduce ? (k < 0.5 ? 1 : 0.35) : 1 - 0.65 * k)
      s.style.transform = reduce ? 'none' : `scale(${1 - 0.12 * k})`
    })
    setActive((a) => (a === best ? a : best))
  }, [reduce])

  useEffect(() => { onActive(active) }, [active, onActive])
  useEffect(() => { update(); window.addEventListener('resize', update); return () => window.removeEventListener('resize', update) }, [update])

  const go = (i: number) => {
    const n = (i + VARIABLE_IDS.length) % VARIABLE_IDS.length
    const s = slides.current[n]
    const el = scroller.current
    if (s && el) el.scrollTo({ left: s.offsetLeft + s.offsetWidth / 2 - el.clientWidth / 2, behavior: reduce ? 'auto' : 'smooth' })
  }

  const arrow = 'flex h-11 w-11 items-center justify-center rounded-full bg-deep-purple text-ink hover:bg-purple transition-colors duration-150'

  return (
    <section id="variables" aria-labelledby="choose-h" className="border-t border-purple py-12">
      <div className="mx-auto flex max-w-7xl items-baseline justify-between px-4 lg:px-6">
        <h2 id="choose-h" className="font-display text-2xl font-semibold">{t('home.choose')}</h2>
        <p className="text-sm text-ink-muted"><span className="hidden sm:inline">{t('home.browse')} · </span><span className="num">{active + 1} / {VARIABLE_IDS.length}</span></p>
      </div>
      <div className="mt-6 [container-type:inline-size]">
        <div
          ref={scroller} onScroll={update} tabIndex={0} role="region" aria-roledescription="carousel" aria-label={t('home.choose')}
          onKeyDown={(e) => { if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1) } if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1) } }}
          className="carousel overflow-x-auto overflow-y-hidden [--sw:78cqw] lg:[--sw:56cqw]"
        >
          <ul className="m-0 flex list-none gap-4 py-4 [padding-inline:calc((100cqw-var(--sw))/2)]">
            {VARIABLE_IDS.map((id, i) => {
              const Icon = ICONS[VARIABLES[id].icon as keyof typeof ICONS]
              const isActive = i === active
              return (
                <li
                  key={id} ref={(el) => { slides.current[i] = el }}
                  role="group" aria-roledescription="slide" aria-label={t('home.slide', { n: i + 1, total: 6, name: t(`vars.${id}.name`) })}
                  data-variable={id} {...(!isActive ? { inert: true } : {})}
                  onClick={() => !isActive && go(i)}
                  className="flex w-[var(--sw)] shrink-0 snap-center flex-col items-center text-center transition-[opacity,transform] duration-300 ease-out"
                  style={{ scrollSnapAlign: 'center' }}
                >
                  <VariableImage variable={id} size={window.innerWidth >= 1024 ? 300 : 220} />
                  <h3 className="accent-transition mt-5 flex items-center gap-3 font-display text-[32px] font-semibold text-accent lg:text-5xl">
                    <Icon size={32} aria-hidden />{t(`vars.${id}.name`)}
                  </h3>
                  <p className="mt-3 max-w-md text-ink">{t(`vars.${id}.def`)}</p>
                  <p className="mt-2 text-sm text-ink-muted">{SOURCES[id]}</p>
                  <button
                    onClick={() => navigate(`/explore?v=${id}`)}
                    className="accent-transition mt-5 inline-flex h-11 items-center gap-2 rounded-lg border-[1.5px] border-accent px-5 font-medium text-accent hover:bg-deep-purple"
                  >
                    {t('home.investigate')} <ArrowRight size={16} aria-hidden />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-6">
        <button className={arrow} onClick={() => go(active - 1)} aria-label={t('home.previous')}><ChevronLeft size={20} aria-hidden /></button>
        <div className="flex items-center gap-2" role="group" aria-label="Variables">
          {VARIABLE_IDS.map((id, i) => (
            <button
              key={id} onClick={() => go(i)} aria-label={t('home.goTo', { n: i + 1 })} aria-current={i === active}
              className="flex h-11 w-5 items-center justify-center"
            >
              <span data-variable={i === active ? id : undefined}
                className={`accent-transition block h-2 rounded-full border ${i === active ? 'w-7 border-accent' : 'w-2 border-ink-muted'}`}
                style={i === active ? { background: 'rgb(var(--accent))' } : undefined} />
            </button>
          ))}
        </div>
        <button className={arrow} onClick={() => go(active + 1)} aria-label={t('home.next')}><ChevronRight size={20} aria-hidden /></button>
      </div>
    </section>
  )
}

export default function HomePage() {
  const { t } = useTranslation()
  const [idx, setIdx] = useState(0)
  const set = useExplorer((s) => s.set)
  useAccent(VARIABLE_IDS[idx])
  const onActive = useCallback((i: number) => setIdx(i), [])

  const demo = (v: VariableId, region: string) => `/explore?v=${v}&r=${region}`
  return (
    <div className="min-h-screen">
      <AppBar />
      <main id="main">
        <HomeHero onCta={() => document.getElementById('variables')?.scrollIntoView({ behavior: 'smooth' })} />
        <VariableCarousel onActive={onActive} />
        <section className="border-t border-purple px-4 py-8 lg:px-6">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 text-sm">
            <span className="text-ink-muted">{t('home.example')}</span>
            <Link onClick={() => set({ point: null })} to={demo('precipitation', 'desert')} className="inline-flex h-11 items-center gap-2 rounded-lg border border-input-border px-4 hover:bg-deep-purple"><Play size={14} aria-hidden />{t('home.demo1')}</Link>
            <Link onClick={() => set({ point: null })} to={demo('ozone', 'mexico')} className="inline-flex h-11 items-center gap-2 rounded-lg border border-input-border px-4 hover:bg-deep-purple"><Play size={14} aria-hidden />{t('home.demo2')}</Link>
            <Link to="/about" className="ml-auto text-ink-muted underline underline-offset-4">{t('nav.about')}</Link>
          </div>
        </section>
      </main>
    </div>
  )
}
