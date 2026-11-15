import { CircleDashed, CloudRain, Factory, Minus, ShieldHalf, Sprout, Sun, TrendingDown, TrendingUp, Waves } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { VARIABLES, type VariableId } from '../core/variables'

export const ICONS = { CloudRain, Sun, Sprout, Waves, Factory, ShieldHalf } as const
export type ImageState = 'idle' | 'rising' | 'falling' | 'no_trend' | 'insufficient'

const STATE_ICON = { idle: null, rising: TrendingUp, falling: TrendingDown, no_trend: Minus, insufficient: CircleDashed }

/** Loads /images/variables/<id>/<state>.webp, falls back to idle, then to a drawn glyph. */
export function VariableImage({ variable, state = 'idle', size = 160, className = '' }: {
  variable: VariableId; state?: ImageState; size?: number; className?: string
}) {
  const { t } = useTranslation()
  const [failed, setFailed] = useState<Record<string, boolean>>({})
  const key = `${variable}/${state}`
  const useIdle = failed[key] && state !== 'idle'
  const src = `/images/variables/${variable}/${useIdle ? 'idle' : state}.webp`
  const dead = failed[`${variable}/idle`] || (state === 'idle' && failed[key])
  const Icon = ICONS[VARIABLES[variable].icon as keyof typeof ICONS]
  const Overlay = STATE_ICON[state]
  const alt = t(`vars.${variable}.alt`)

  if (dead) {
    return (
      <div
        role="img" aria-label={alt} style={{ width: size, height: size }}
        className={`accent-transition relative flex items-center justify-center rounded-full border border-accent/40 text-accent ${className}`}
      >
        <Icon size={size * 0.42} strokeWidth={1.5} aria-hidden />
        {Overlay && <Overlay size={size * 0.2} className="absolute bottom-[12%] right-[12%]" aria-hidden />}
      </div>
    )
  }
  return (
    <img
      src={src} alt={alt} width={size} height={size} loading="lazy" decoding="async"
      onError={() => setFailed((f) => ({ ...f, [useIdle || state === 'idle' ? `${variable}/idle` : key]: true }))}
      style={{ width: size, height: size }} className={`object-contain transition-opacity duration-[400ms] ${className}`}
    />
  )
}
