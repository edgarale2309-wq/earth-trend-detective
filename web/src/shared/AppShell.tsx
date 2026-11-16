import { BookOpen, Check, House, LoaderCircle, Languages, MapPin, Menu, Search, Share2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { VARIABLE_IDS, VARIABLES } from '../core/variables'
import { useExplorer } from '../features/explorer/store'
import { ICONS } from './VariableImage'

function ModeToggle() {
  const { t } = useTranslation()
  const loc = useLocation()
  const mode = useExplorer((s) => s.mode)
  const set = useExplorer((s) => s.set)
  const [toast, setToast] = useState<{ mode: 'explorer' | 'scientific'; phase: 'busy' | 'done' } | null>(null)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const choose = (m: 'explorer' | 'scientific') => {
    if (m === mode) return
    timers.current.forEach(clearTimeout)
    set({ mode: m })
    setToast({ mode: m, phase: 'busy' })
    timers.current = [
      window.setTimeout(() => setToast({ mode: m, phase: 'done' }), 700),
      window.setTimeout(() => setToast(null), 7000),
    ]
  }
  const name = toast ? t(`explorer.${toast.mode}`) : ''
  return (
    <>
      <div role="group" aria-label={t('explorer.mode')} className="flex shrink-0 rounded-lg border border-purple p-0.5">
        {(['explorer', 'scientific'] as const).map((m) => (
          <button
            key={m} onClick={() => choose(m)} aria-pressed={mode === m}
            className={`h-9 rounded-lg px-3 text-sm transition-colors duration-150 ${mode === m ? 'bg-crimson text-white' : 'text-ink-muted hover:bg-deep-purple hover:text-ink'}`}
          >{t(`explorer.${m}`)}</button>
        ))}
      </div>
      {toast && createPortal(
        <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 z-[90] flex w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 items-start gap-3 rounded-2xl border border-purple bg-deep-purple p-4 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
          {toast.phase === 'busy' ? <LoaderCircle size={20} aria-hidden className="mt-0.5 shrink-0 animate-spin text-ink" /> : <Check size={20} aria-hidden className="mt-0.5 shrink-0 text-ink" />}
          <div className="min-w-0 text-sm leading-relaxed">
            <p className="font-semibold text-ink">{toast.phase === 'busy' ? t('explorer.modeBusy', { mode: name.toLowerCase() }) : t('explorer.modeDone', { mode: name })}</p>
            {toast.phase === 'done' && (
              <p className="mt-1 text-ink-muted">
                {t(toast.mode === 'scientific' ? 'explorer.modeWhereScientific' : 'explorer.modeWhereExplorer')}
                {loc.pathname !== '/explore' && ` ${t('explorer.modeElsewhere')}`}
              </p>
            )}
          </div>
          <button onClick={() => setToast(null)} aria-label={t('nav.close')} className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-purple hover:text-ink"><X size={16} aria-hidden /></button>
        </div>, document.body)}
    </>
  )
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  const { t, i18n } = useTranslation()
  const [copied, setCopied] = useState(false)
  const share = async () => {
    try { await navigator.clipboard.writeText(window.location.href) } catch { /* ignore */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-purple bg-background/95 px-3 backdrop-blur sm:gap-3 sm:px-4">
      <button onClick={onMenu} aria-label={t('nav.menu')} className="flex h-11 w-11 items-center justify-center rounded-lg text-ink hover:bg-deep-purple lg:hidden">
        <Menu size={22} aria-hidden />
      </button>
      <Link to="/" className="truncate font-display text-base font-semibold sm:text-lg">{t('app.name')}</Link>
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <ModeToggle />
        <div role="group" aria-label={t('nav.language')} className="hidden items-center text-sm sm:flex">
          <Languages size={16} className="mr-1 text-ink-muted" aria-hidden />
          {(['en', 'es'] as const).map((l) => (
            <button key={l} onClick={() => i18n.changeLanguage(l)} aria-pressed={i18n.language === l}
              className={`h-9 min-w-9 rounded-lg px-1.5 hover:bg-deep-purple ${i18n.language === l ? 'font-semibold text-ink' : 'text-ink-muted'}`}>{l.toUpperCase()}</button>
          ))}
        </div>
        <button onClick={share} aria-label={t('nav.share')}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-input-border px-3 text-sm text-ink hover:bg-deep-purple">
          <Share2 size={16} aria-hidden /> <span className="hidden md:inline">{copied ? t('nav.copied') : t('nav.share')}</span>
        </button>
      </div>
      <span role="status" className="sr-only">{copied ? t('nav.copied') : ''}</span>
    </header>
  )
}

function Sidebar({ open, close }: { open: boolean; close: () => void }) {
  const { t, i18n } = useTranslation()
  const nav = useNavigate()
  const loc = useLocation()
  const { variable, set } = useExplorer()
  const [hover, setHover] = useState(false)
  const rail = !hover && !open // desktop: a slim rail that unfolds on hover/focus; the mobile drawer is always full width
  const row = (active: boolean) =>
    `group flex h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-150 ${rail ? 'justify-center px-0' : ''} ${
      active ? 'bg-deep-purple font-medium text-ink' : 'text-ink-muted hover:bg-deep-purple hover:text-ink'}`

  const simple = (to: string, Icon: typeof House, label: string, end = false) => (
    <NavLink to={to} end={end} onClick={close} title={rail ? label : undefined} aria-label={rail ? label : undefined}
      className={({ isActive }) => row(isActive)}>
      <Icon size={20} aria-hidden className="shrink-0" />
      {!rail && <span className="truncate">{label}</span>}
    </NavLink>
  )

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={close} aria-hidden />}
      {/* the spacer keeps the page layout fixed; the aside floats over the content when it unfolds */}
      <div className="hidden w-[68px] shrink-0 lg:block" aria-hidden />
      <aside
        aria-label={t('nav.sidebar')}
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHover(false) }}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden border-r border-purple bg-surface transition-[width,transform,box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:translate-x-0
          ${open ? 'w-72 translate-x-0' : '-translate-x-full w-72'} ${hover ? 'lg:w-64 lg:shadow-[8px_0_32px_rgba(0,0,0,0.5)]' : 'lg:w-[68px]'}`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-purple px-3">
          {!rail && <span className="px-1 font-display text-sm font-semibold text-ink-muted">{t('app.name')}</span>}
          <button onClick={close} aria-label={t('nav.close')} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-deep-purple lg:hidden"><X size={20} aria-hidden /></button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-2" aria-label={t('nav.sidebar')}>
          {simple('/', House, t('nav.home'), true)}
          <div className={`px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted ${rail ? 'sr-only' : ''}`}>{t('nav.variables')}</div>
          {rail && <div className="mx-3 my-2 border-t border-purple" />}
          {VARIABLE_IDS.map((id) => {
            const Icon = ICONS[VARIABLES[id].icon as keyof typeof ICONS]
            const active = loc.pathname === '/explore' && variable === id
            const label = t(`vars.${id}.name`)
            return (
              <button
                key={id} data-variable={id} title={rail ? label : undefined} aria-label={rail ? label : undefined} aria-current={active ? 'page' : undefined}
                onClick={() => { set({ variable: id, state: null, point: null }); nav(`/explore?v=${id}`); close() }}
                className={`w-full ${row(active)}`}
              >
                <Icon size={20} aria-hidden className="accent-transition shrink-0 text-accent" />
                {!rail && <span className="truncate text-left">{label}</span>}
              </button>
            )
          })}
          {rail && <div className="mx-3 my-2 border-t border-purple" />}
          <div className="pt-3" />
          {simple('/detective', Search, t('nav.detective'))}
          {simple('/place', MapPin, t('nav.place'))}
          {simple('/info', BookOpen, t('nav.info'))}
        </nav>
        <div className="shrink-0 border-t border-purple p-2">
          <div className="mb-2 flex items-center justify-center gap-1 sm:hidden" role="group" aria-label={t('nav.language')}>
            {(['en', 'es'] as const).map((l) => (
              <button key={l} onClick={() => i18n.changeLanguage(l)} aria-pressed={i18n.language === l}
                className={`h-11 min-w-11 rounded-lg ${i18n.language === l ? 'bg-deep-purple font-semibold' : 'text-ink-muted'}`}>{l.toUpperCase()}</button>
            ))}
          </div>
        </div>
      </aside>
    </>
  )
}

export default function AppShell() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  useEffect(() => { setOpen(false) }, [loc.pathname])
  // a distinct document title per page, so screen-reader users know where they are
  useEffect(() => {
    const key = loc.pathname.startsWith('/explore') ? 'titleExplore' : loc.pathname.startsWith('/place') ? 'titlePlace'
      : loc.pathname.startsWith('/info') || loc.pathname.startsWith('/about') ? 'titleInfo' : loc.pathname === '/' ? 'titleHome' : null
    if (key) document.title = `${t(`nav.${key}`)} · ${t('app.name')}`
  }, [loc.pathname, t])
  return (
    <div className="flex min-h-screen">
      <a href="#main" className="sr-only z-[100] rounded-lg bg-ink px-4 py-2 font-medium text-background focus:not-sr-only focus:fixed focus:left-3 focus:top-3">{t('nav.skip')}</a>
      <Sidebar open={open} close={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setOpen(true)} />
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 outline-none"><Outlet /></main>
      </div>
    </div>
  )
}
