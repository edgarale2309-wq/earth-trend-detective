import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { VARIABLE_IDS, type VariableId } from '../../core/variables'
import { VariableArt } from '../../shared/VariableArt'
import { useExplorer } from '../explorer/store'

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const GAP = 16

function useLayout(box: React.RefObject<HTMLDivElement | null>) {
  const [w, setW] = useState(1200)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    setW(el.clientWidth)
    return () => ro.disconnect()
  }, [box])
  const mobile = w < 640
  const expanded = mobile ? Math.round(w * 0.84) : Math.min(Math.round(w * 0.72), 820)
  const collapsed = mobile ? 64 : 150
  const height = mobile ? 460 : Math.round(expanded / 2)
  return { w, mobile, expanded, collapsed, height }
}

export function VariableCarousel({ active, setActive }: { active: number; setActive: (i: number) => void }) {
  const { t } = useTranslation()
  const nav = useNavigate()
  const set = useExplorer((s) => s.set)
  const box = useRef<HTMLDivElement>(null)
  const { w, mobile, expanded, collapsed, height } = useLayout(box)
  const n = VARIABLE_IDS.length
  const drag = useRef({ x: 0, down: false, moved: false })
  const hoverTimer = useRef<number | undefined>(undefined)
  const go = useCallback((i: number) => setActive(((i % n) + n) % n), [n, setActive]) // wraps around: after the last card comes the first

  // Track offset so the active card is centered; cards before it are collapsed.
  const offset = w / 2 - (active * (collapsed + GAP) + expanded / 2)

  const open = (id: VariableId) => { set({ variable: id, state: null, point: null }); nav(`/explore?v=${id}`) }

  const arrow = 'flex h-14 w-14 items-center justify-center rounded-full border border-purple bg-deep-purple text-ink transition-colors duration-150 hover:bg-purple'

  return (
    <div>
      <div
        ref={box} tabIndex={0} role="region" aria-roledescription="carousel" aria-label={t('home.carouselLabel')}
        onKeyDown={(e) => { if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1) } if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1) } }}
        onPointerDown={(e) => { drag.current = { x: e.clientX, down: true, moved: false } }}
        onPointerMove={(e) => { if (drag.current.down && Math.abs(e.clientX - drag.current.x) > 8) drag.current.moved = true }}
        onPointerUp={(e) => {
          const d = e.clientX - drag.current.x
          if (drag.current.down && Math.abs(d) > 50) go(active + (d < 0 ? 1 : -1))
          drag.current.down = false
        }}
        onPointerLeave={() => { drag.current.down = false }}
        className="relative cursor-grab select-none overflow-hidden py-6 active:cursor-grabbing [touch-action:pan-y]"
        style={{ height: height + 48 }}
      >
        <div
          className="m-0 flex p-0"
          style={{ gap: GAP, transform: `translateX(${offset}px)`, transition: `transform 600ms ${EASE}`, height }}
        >
          {VARIABLE_IDS.map((id, i) => {
            const isActive = i === active
            return (
              <div
                key={id} data-variable={id}
                role="group" aria-roledescription="slide" aria-label={t('home.slide', { n: i + 1, total: n, name: t(`vars.${id}.name`) })}
                onMouseEnter={(e) => {
                  if (isActive || (e.nativeEvent as PointerEvent).pointerType === 'touch') return
                  window.clearTimeout(hoverTimer.current)
                  hoverTimer.current = window.setTimeout(() => go(i), 450)
                }}
                onMouseLeave={() => window.clearTimeout(hoverTimer.current)}
                className="relative shrink-0 overflow-hidden rounded-3xl"
                style={{
                  width: isActive ? expanded : collapsed, height,
                  transition: `width 600ms ${EASE}, opacity 400ms ease, border-color 300ms`,
                  opacity: isActive ? 1 : 0.4,
                  border: `1px solid ${isActive ? 'rgb(var(--accent) / 0.65)' : 'rgb(97 32 115 / 0.7)'}`,
                  background: isActive
                    ? 'radial-gradient(120% 120% at 100% 0%, rgb(var(--accent) / 0.16), transparent 60%), #1E1029'
                    : '#1E1029',
                }}
              >
                {/* collapsed: only the illustration, click to center */}
                <button
                  onClick={() => { if (!drag.current.moved) go(i) }} aria-label={t(`vars.${id}.name`)} tabIndex={isActive ? -1 : 0}
                  className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
                  style={{ opacity: isActive ? 0 : 1, pointerEvents: isActive ? 'none' : 'auto' }}
                >
                  <VariableArt variable={id} size={mobile ? 44 : 84} />
                </button>

                {/* expanded content keeps its final width so nothing reflows during the animation */}
                <div
                  {...(!isActive ? { inert: true, 'aria-hidden': true } : {})}
                  className={`absolute left-0 top-0 grid h-full ${mobile ? 'grid-rows-[auto_1fr]' : 'grid-cols-2'}`}
                  style={{ width: expanded, opacity: isActive ? 1 : 0, transition: `opacity ${isActive ? 500 : 150}ms ease ${isActive ? 150 : 0}ms` }}
                >
                  <div className={`flex min-w-0 flex-col justify-between ${mobile ? 'order-2 p-5' : 'p-8'}`}>
                    <div>
                      <h3 className="text-2xl font-bold leading-tight text-white sm:text-[32px]">{t(`vars.${id}.name`)}</h3>
                      <p className="mt-3 line-clamp-5 text-[15px] leading-relaxed text-ink-muted sm:line-clamp-4">{t(`vars.${id}.def`)}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-center">
                      <button
                        onClick={() => open(id)}
                        className="inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-semibold text-[#0B0614] transition-[filter] duration-150 hover:brightness-110"
                        style={{ background: 'rgb(var(--accent))' }}
                      >
                        {t('home.analyze')} <ArrowUpRight size={16} aria-hidden />
                      </button>
                    </div>
                  </div>
                  <div
                    className={`flex items-center justify-center border-purple ${mobile ? 'order-1 border-b' : 'border-l'}`}
                    style={{ background: 'radial-gradient(circle at 50% 45%, rgb(var(--accent) / 0.28), rgb(var(--accent) / 0.04) 65%, transparent)', borderColor: 'rgb(var(--accent) / 0.3)' }}
                  >
                    <VariableArt variable={id} size={mobile ? 120 : Math.round(height * 0.62)} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-center gap-5">
        <button className={arrow} onClick={() => go(active - 1)} aria-label={t('home.previous')}><ChevronLeft size={28} aria-hidden /></button>
        <div className="flex items-center" role="group" aria-label={t('nav.variables')}>
          {VARIABLE_IDS.map((id, i) => (
            <button key={id} onClick={() => go(i)} aria-label={t('home.goTo', { n: i + 1 })} aria-current={i === active} data-variable={id} className="flex h-11 min-w-6 items-center justify-center px-1.5">
              <span
                className="block h-2.5 rounded-full transition-[width,background-color] duration-300"
                style={{ width: i === active ? 30 : 10, background: i === active ? 'rgb(var(--accent))' : 'rgb(var(--on-surface-variant) / 0.45)' }}
              />
            </button>
          ))}
        </div>
        <button className={arrow} onClick={() => go(active + 1)} aria-label={t('home.next')}><ChevronRight size={28} aria-hidden /></button>
      </div>
      <p className="mx-auto mt-2 max-w-xl px-4 text-center text-sm leading-relaxed text-ink-muted"><span className="num">{active + 1} / {n}</span> · {t(mobile ? 'home.auxTouch' : 'home.aux')}</p>
    </div>
  )
}
