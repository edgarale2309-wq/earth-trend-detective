import { ArrowLeft, FlaskConical, Languages, MapPin, Search, Share2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink } from 'react-router-dom'

export function AppBar({ back, children }: { back?: boolean; children?: React.ReactNode }) {
  const { t, i18n } = useTranslation()
  const [copied, setCopied] = useState(false)

  const share = async () => {
    try { await navigator.clipboard.writeText(window.location.href) } catch { /* ignore */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  const link = 'inline-flex h-11 items-center gap-1.5 rounded-lg px-2 text-sm text-ink-muted hover:text-ink'

  return (
    <header className="sticky top-0 z-30 border-b border-purple bg-background/95 backdrop-blur">
      <div className="flex min-h-16 flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 lg:px-6">
        {back && (
          <Link to="/" className={link} aria-label={t('nav.home')}>
            <ArrowLeft size={20} aria-hidden /> <span className="hidden sm:inline">{t('nav.home')}</span>
          </Link>
        )}
        <Link to="/" className="font-display text-lg font-semibold">{t('app.name')}</Link>
        {children && <div className="order-last flex w-full min-w-0 items-center gap-3 lg:order-none lg:w-auto lg:flex-1">{children}</div>}
        <nav className="ml-auto flex items-center gap-1" aria-label="Main">
          <NavLink to="/detective" className={link}><Search size={16} aria-hidden /><span className="hidden md:inline">{t('nav.detective')}</span></NavLink>
          <NavLink to="/place" className={link}><MapPin size={16} aria-hidden /><span className="hidden md:inline">{t('nav.place')}</span></NavLink>
          <NavLink to="/method" className={link}><FlaskConical size={16} aria-hidden /><span className="hidden md:inline">{t('nav.method')}</span></NavLink>
          <div role="group" aria-label={t('nav.language')} className="flex items-center text-sm">
            <Languages size={16} className="mr-1 text-ink-muted" aria-hidden />
            {(['en', 'es'] as const).map((l) => (
              <button
                key={l} onClick={() => i18n.changeLanguage(l)} aria-pressed={i18n.language === l}
                className={`h-11 min-w-9 px-1.5 ${i18n.language === l ? 'font-semibold text-ink' : 'text-ink-muted'}`}
              >{l.toUpperCase()}</button>
            ))}
          </div>
          <button onClick={share} className={`${link} border border-input-border px-3`}>
            <Share2 size={16} aria-hidden /> <span className="hidden sm:inline">{copied ? t('nav.copied') : t('nav.share')}</span>
          </button>
        </nav>
      </div>
      <span role="status" className="sr-only">{copied ? t('nav.copied') : ''}</span>
    </header>
  )
}
