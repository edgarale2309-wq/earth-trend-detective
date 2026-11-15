import { BookOpen, House, Languages, MapPin, Menu, PanelLeftClose, PanelLeftOpen, Search, Share2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { VARIABLE_IDS, VARIABLES } from '../core/variables'
import { useExplorer } from '../features/explorer/store'
import { ICONS } from './VariableImage'

function usePersistentCollapsed(): [boolean, (v: boolean) => void] {
  const [c, setC] = useState(() => {
    try { return localStorage.getItem('sidebar') === 'collapsed' } catch { return false }
  })
  const set = (v: boolean) => {
    setC(v)
    try { localStorage.setItem('sidebar', v ? 'collapsed' : 'open') } catch { /* ignore */ }
  }
  return [c, set]
}

function ModeToggle() {
  const { t } = useTranslation()
  const mode = useExplorer((s) => s.mode)
  const set = useExplorer((s) => s.set)
  return (
    <div role="group" aria-label={t('explorer.mode')} className="flex shrink-0 rounded-lg border border-purple p-0.5">
      {(['explorer', 'scientific'] as const).map((m) => (
        <button
          key={m} onClick={() => set({ mode: m })} aria-pressed={mode === m}
          className={`h-9 rounded-lg px-3 text-sm transition-colors duration-150 ${mode === m ? 'bg-crimson text-white' : 'text-ink-muted hover:bg-deep-purple hover:text-ink'}`}
        >{t(`explorer.${m}`)}</button>
      ))}
    </div>
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

function Sidebar({ collapsed, setCollapsed, open, close }: { collapsed: boolean; setCollapsed: (v: boolean) => void; open: boolean; close: () => void }) {
  const { t, i18n } = useTranslation()
  const nav = useNavigate()
  const loc = useLocation()
  const { variable, set } = useExplorer()
  const rail = collapsed && !open // drawer on mobile is always full width
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
      <aside
        aria-label={t('nav.sidebar')}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-purple bg-surface transition-[width,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:translate-x-0
          ${open ? 'w-72 translate-x-0' : '-translate-x-full w-72'} ${collapsed ? 'lg:w-[68px]' : 'lg:w-64'}`}
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
          <button onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? t('nav.expand') : t('nav.collapse')}
            title={collapsed ? t('nav.expand') : t('nav.collapse')}
            className={`hidden h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-ink-muted hover:bg-deep-purple hover:text-ink lg:flex ${collapsed ? 'justify-center px-0' : ''}`}>
            {collapsed ? <PanelLeftOpen size={20} aria-hidden /> : <><PanelLeftClose size={20} aria-hidden /><span>{t('nav.collapse')}</span></>}
          </button>
        </div>
      </aside>
    </>
  )
}

export default function AppShell() {
  const [collapsed, setCollapsed] = usePersistentCollapsed()
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  useEffect(() => { setOpen(false) }, [loc.pathname])
  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} open={open} close={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setOpen(true)} />
        <main id="main" className="min-w-0 flex-1"><Outlet /></main>
      </div>
    </div>
  )
}
