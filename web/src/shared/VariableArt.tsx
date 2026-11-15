import type { VariableId } from '../core/variables'

/** Minimal line illustrations in the variable's accent color, with a small looping animation each.
 *  Animations are disabled globally under prefers-reduced-motion (see index.css). */
export function VariableArt({ variable, size = 200, className = '' }: { variable: VariableId; size?: number; className?: string }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 3.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden className={`accent-transition text-accent ${className}`}>
      {variable === 'precipitation' && (
        <g {...p}>
          <path d="M60 110a28 28 0 0 1 4-55 38 38 0 0 1 72 8 24 24 0 0 1 4 47z" />
          {[75, 100, 125].map((x, i) => (
            <line key={x} x1={x} y1="128" x2={x - 8} y2="150" className="art-drop" style={{ animationDelay: `${i * 0.35}s` }} />
          ))}
          {[88, 113].map((x, i) => (
            <line key={x} x1={x} y1="150" x2={x - 8} y2="172" className="art-drop" style={{ animationDelay: `${0.2 + i * 0.35}s` }} />
          ))}
        </g>
      )}
      {variable === 'solar_radiation' && (
        <g {...p}>
          <circle cx="100" cy="70" r="24" className="art-pulse-slow" />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4
            return <line key={i} x1={100 + Math.cos(a) * 36} y1={70 + Math.sin(a) * 36} x2={100 + Math.cos(a) * 50} y2={70 + Math.sin(a) * 50} className="art-ray" style={{ animationDelay: `${i * 0.15}s` }} />
          })}
          <path d="M20 170q80-40 160 0" />
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M${82 + i * 18} 124q${-2 + i * 2} 14 0 28`} className="art-wave" style={{ animationDelay: `${i * 0.4}s` }} />
          ))}
        </g>
      )}
      {variable === 'soil_moisture' && (
        <g {...p}>
          <path d="M30 160q70-30 140 0" />
          <path d="M45 180q55-18 110 0" opacity="0.5" />
          <g className="art-grow">
            <path d="M100 150V90" />
            <path d="M100 112q-30-4-34-34 30 0 34 34z" />
            <path d="M100 98q28-2 34-30-28-2-34 30z" />
          </g>
          <path d="M70 172l-3 6M100 175l-3 6M130 172l-3 6" className="art-drop" />
        </g>
      )}
      {variable === 'surface_runoff' && (
        <g {...p}>
          <path d="M20 90q60 10 100 50t60 34" />
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M${40 + i * 24} ${112 + i * 18}q12-10 24 0t24 0`} strokeDasharray="14 10" className="art-flow" style={{ animationDelay: `${i * 0.3}s` }} />
          ))}
          <path d="M60 40q8-12 16 0t16 0" opacity="0.6" />
        </g>
      )}
      {variable === 'no2' && (
        <g {...p}>
          <path d="M40 170V110l30 18v-18l30 18v-18l30 18V80h24v90z" />
          <path d="M20 170h160" />
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={142 + i * 4} cy="66" r={8 + i * 3} className="art-rise" style={{ animationDelay: `${i * 0.9}s` }} />
          ))}
        </g>
      )}
      {variable === 'ozone' && (
        <g {...p}>
          <path d="M100 30l56 20v44c0 36-24 62-56 76-32-14-56-40-56-76V50z" />
          <path d="M72 100l20 20 38-40" className="art-pulse-slow" />
          <ellipse cx="100" cy="100" rx="86" ry="26" transform="rotate(-24 100 100)" opacity="0.45" strokeDasharray="4 10" className="art-orbit" />
        </g>
      )}
    </svg>
  )
}
