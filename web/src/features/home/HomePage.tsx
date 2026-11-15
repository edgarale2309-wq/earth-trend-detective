import { ArrowRight, BarChart3, Compass, Map as MapIcon, Search, Target } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAccent } from '../../core/useAccent'
import { VARIABLE_IDS } from '../../core/variables'
import { VariableCarousel } from './VariableCarousel'

/** The clip has a near-black background, so `screen` blending lets the starfield show through (no solid box)
 *  and a radial mask dissolves the edges so it never collides with the text column. */
function HeroVideo() {
  const { t } = useTranslation()
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const v = ref.current
    if (!v) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { v.pause(); v.currentTime = 5 } else void v.play().catch(() => {})
  }, [])
  return (
    <div className="mx-auto w-full max-w-2xl xl:max-w-none">
      <video
        ref={ref} src="/media/hero.mp4" aria-label={t('home.heroVideoAlt')} role="img"
        autoPlay muted loop playsInline preload="auto"
        className="block aspect-video w-full bg-transparent object-cover mix-blend-screen"
        style={{ WebkitMaskImage: 'radial-gradient(ellipse 72% 72% at 50% 50%, #000 55%, transparent 100%)', maskImage: 'radial-gradient(ellipse 72% 72% at 50% 50%, #000 55%, transparent 100%)' }}
      />
    </div>
  )
}

function Hero() {
  const { t } = useTranslation()
  const cards = [
    { Icon: BarChart3, k: 'show' }, { Icon: Compass, k: 'use' }, { Icon: Target, k: 'goal' },
  ] as const
  return (
    <section className="starfield grid items-center gap-10 px-4 py-12 sm:px-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:px-10 lg:py-16">
      <div>
        <div className="mb-5 h-0.5 w-16 bg-crimson" aria-hidden />
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-ink-muted">{t('home.eyebrow')}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight lg:text-5xl 2xl:text-[56px]">{t('home.title')}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted">{t('home.lead')}</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {cards.map(({ Icon, k }) => (
            <div key={k} className="rounded-2xl border border-purple bg-surface p-4">
              <Icon size={20} className="text-accent" aria-hidden />
              <h2 className="mt-3 font-semibold">{t(`home.${k}Title`)}</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{t(`home.${k}Text`)}</p>
            </div>
          ))}
        </div>
      </div>
      <HeroVideo />
    </section>
  )
}

function HowTo() {
  const { t } = useTranslation()
  return (
    <section className="border-t border-purple px-4 py-12 sm:px-6 lg:px-10" aria-labelledby="how-h">
      <h2 id="how-h" className="font-display text-2xl font-semibold">{t('home.howTitle')}</h2>
      <p className="mt-2 max-w-3xl leading-relaxed text-ink-muted">{t('home.howIntro')}</p>
      <ol className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <li key={n} className="relative rounded-2xl border border-purple bg-surface p-5">
            <span className="num flex h-8 w-8 items-center justify-center rounded-full border border-input-border text-sm">{n}</span>
            <h3 className="mt-3 font-semibold">{t(`home.step${n}t`)}</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">{t(`home.step${n}`)}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Challenge() {
  const { t } = useTranslation()
  return (
    <section className="border-t border-purple px-4 py-12 sm:px-6 lg:px-10" aria-labelledby="challenge-h">
      <div className="flex flex-col gap-6 rounded-3xl border border-purple bg-surface p-6 sm:p-10 lg:flex-row lg:items-center lg:gap-12">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-deep-purple">
          <Search size={36} className="text-ink" aria-hidden />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-ink-muted">{t('home.challengeEyebrow')}</p>
          <h2 id="challenge-h" className="mt-1 font-display text-2xl font-semibold sm:text-3xl">{t('home.challengeTitle')}</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-ink-muted">{t('home.challengeText')}</p>
        </div>
        <Link to="/detective" className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-magenta px-6 font-medium text-white transition-colors duration-150 hover:bg-wine">
          {t('home.challengeCta')} <ArrowRight size={18} aria-hidden />
        </Link>
      </div>
    </section>
  )
}

export default function HomePage() {
  const { t } = useTranslation()
  const [active, setActive] = useState(0)
  useAccent(VARIABLE_IDS[active])
  return (
    <>
      <Hero />
      <HowTo />
      <section id="variables" aria-labelledby="vars-h" className="border-t border-purple py-12">
        <div className="px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <MapIcon size={22} className="text-accent" aria-hidden />
            <h2 id="vars-h" className="font-display text-2xl font-semibold">{t('home.varsTitle')}</h2>
          </div>
          <p className="mt-3 max-w-3xl leading-relaxed text-ink-muted">{t('home.varsIntro')}</p>
        </div>
        <div className="mt-4">
          <VariableCarousel active={active} setActive={setActive} />
        </div>
      </section>
      <Challenge />
      <footer className="border-t border-purple px-4 py-6 text-sm sm:px-6 lg:px-10">
        <Link to="/about" className="text-ink-muted underline underline-offset-4 hover:text-ink">{t('home.footerAbout')}</Link>
      </footer>
    </>
  )
}
