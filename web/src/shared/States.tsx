import { useId } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../core/api'

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-xl bg-deep-purple ${className}`} />
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { t } = useTranslation()
  const network = error instanceof ApiError && error.message === 'network'
  const detail = error instanceof ApiError && !network ? error.message : null
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-danger/60 p-4">
      <div className="flex items-center gap-2 text-danger">
        <AlertTriangle size={20} aria-hidden />
        <span className="font-semibold">{t('states.error')}</span>
      </div>
      <p className="text-sm text-ink-muted">{network ? t('states.errorNetwork') : detail}</p>
      <button onClick={onRetry} className="h-11 rounded-lg border border-input-border px-4 text-sm hover:bg-deep-purple">
        {t('states.tryAgain')}
      </button>
    </div>
  )
}

export function DemoBadge({ status }: { status?: string }) {
  const { t } = useTranslation()
  if (status !== 'synthetic_demo') return null
  return (
    <span title={t('demoNote')} className="inline-flex items-center rounded-lg border border-ink-muted px-2 py-0.5 text-xs text-ink-muted">
      {t('demoBadge')}
    </span>
  )
}

export function GlossaryTip({ term, children }: { term: 'p' | 'sen' | 'anomaly' | 'ci'; children: React.ReactNode }) {
  const { t } = useTranslation()
  return (
    <abbr title={t(`glossary.${term}`)} className="cursor-help underline decoration-dotted underline-offset-4">
      {children}
    </abbr>
  )
}

/** Hover/focus tooltip for short plain-language explanations. */
export function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  const id = useId()
  return (
    <span className="group relative inline-flex">
      <span aria-describedby={id} tabIndex={0} className="inline-flex rounded outline-offset-2">{children}</span>
      <span
        id={id} role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 hidden w-60 -translate-x-1/2 rounded-xl border border-purple bg-deep-purple p-2.5 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-ink group-focus-within:block group-hover:block"
      >{text}</span>
    </span>
  )
}
