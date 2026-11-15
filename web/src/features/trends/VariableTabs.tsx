import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { VARIABLE_IDS, VARIABLES, type VariableId } from '../../core/variables'
import { ICONS } from '../../shared/VariableImage'

export function VariableTabs({ value, onChange }: { value: VariableId; onChange: (v: VariableId) => void }) {
  const { t } = useTranslation()
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  useEffect(() => {
    const i = VARIABLE_IDS.indexOf(value)
    refs.current[i]?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [value])
  const onKey =(e: React.KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!d) return
    e.preventDefault()
    const n = (i + d + VARIABLE_IDS.length) % VARIABLE_IDS.length
    onChange(VARIABLE_IDS[n]); refs.current[n]?.focus()
  }
  return (
    <div role="tablist" aria-label={t('explorer.tabs')} className="flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {VARIABLE_IDS.map((id, i) => {
        const Icon = ICONS[VARIABLES[id].icon as keyof typeof ICONS]
        const on = id === value
        return (
          <button
            key={id} ref={(el) => { refs.current[i] = el }} role="tab" aria-selected={on} tabIndex={on ? 0 : -1}
            onClick={() => onChange(id)} onKeyDown={(e) => onKey(e, i)} data-variable={id}
            className={`accent-transition flex h-10 shrink-0 items-center gap-1.5 border-b-2 px-3 text-sm ${on ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink'}`}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: VARIABLES[id].accent }} aria-hidden />
            <Icon size={16} aria-hidden className="hidden xl:block" />
            {t(`vars.${id}.name`).replace(/ \(.*\)/, '')}
          </button>
        )
      })}
    </div>
  )
}

export function ModeToggle({ value, onChange }: { value: 'explorer' | 'scientific'; onChange: (m: 'explorer' | 'scientific') => void }) {
  const { t } = useTranslation()
  return (
    <div role="group" aria-label={t('explorer.mode')} className="flex shrink-0 rounded-lg border border-purple p-0.5">
      {(['explorer', 'scientific'] as const).map((m) => (
        <button
          key={m} onClick={() => onChange(m)} aria-pressed={value === m}
          className={`h-10 rounded-lg px-3 text-sm transition-colors duration-150 ${value === m ? 'bg-crimson text-white' : 'text-ink-muted hover:text-ink'}`}
        >{t(`explorer.${m}`)}</button>
      ))}
    </div>
  )
}
