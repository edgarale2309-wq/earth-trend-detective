import { useQuery } from '@tanstack/react-query'
import { LocateFixed } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { api } from '../../core/api'
import { VARIABLES, type VariableId } from '../../core/variables'
import { AppBar } from '../../shared/AppBar'
import { DemoBadge, ErrorState, Skeleton } from '../../shared/States'
import { ICONS } from '../../shared/VariableImage'
import { fmt } from '../explorer/hooks'
import { useExplorer } from '../explorer/store'
import { SignificanceBadge } from '../trends/VerdictPanel'

const CITIES: Record<string, [number, number]> = {
  'Ciudad de México': [19.43, -99.13], Guadalajara: [20.67, -103.35], Monterrey: [25.67, -100.31],
  Mérida: [20.97, -89.62], Tijuana: [32.0, -117.0], Veracruz: [19.17, -96.13], Hermosillo: [29.07, -110.96],
  Oaxaca: [17.07, -96.72], 'Tuxtla Gutiérrez': [16.75, -93.12], Cancún: [21.16, -86.85],
}

export default function PlacePage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const set = useExplorer((s) => s.set)
  const [pt, setPt] = useState<[number, number]>(CITIES['Ciudad de México'])
  const [geoErr, setGeoErr] = useState(false)
  const [outside, setOutside] = useState(false)
  const q = useQuery({ queryKey: ['place', pt], queryFn: () => api.place(pt[0], pt[1]), staleTime: Infinity })

  const locate = () => {
    setGeoErr(false)
    if (!navigator.geolocation) { setGeoErr(true); return }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const la = p.coords.latitude, lo = p.coords.longitude
        setOutside(la < 14.5 || la > 32.5 || lo < -117.5 || lo > -86.5)
        setPt([la, lo])
      },
      () => setGeoErr(true),
    )
  }

  const open = (v: VariableId, c: { lat: number; lon: number }) => {
    set({ variable: v, region: 'mexico', point: { lat: c.lat, lon: c.lon } })
    nav(`/explore?v=${v}&r=mexico&lat=${c.lat}&lon=${c.lon}`)
  }

  return (
    <div className="min-h-screen">
      <AppBar back />
      <main id="main" className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-display text-3xl font-semibold">{t('place.title')}</h1>
        <p className="mt-2 text-ink-muted">{t('place.subtitle')}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <select aria-label={t('place.pick')} className="h-11 flex-1 rounded-lg border border-input-border bg-surface px-3"
            onChange={(e) => { setOutside(false); setPt(CITIES[e.target.value]) }} defaultValue="Ciudad de México">
            {Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}
          </select>
          <button onClick={locate} className="inline-flex h-11 items-center gap-2 rounded-lg border border-input-border px-4 hover:bg-deep-purple"><LocateFixed size={16} aria-hidden />{t('place.geo')}</button>
        </div>
        {geoErr && <p role="alert" className="mt-3 text-sm text-danger">{t('place.geoError')}</p>}
        {outside && <p role="status" className="mt-3 text-sm text-ink-muted">{t('place.outside')}</p>}
        <div className="mt-6" aria-live="polite">
          {q.isLoading && <div className="space-y-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-16" />)}</div>}
          {q.error && <ErrorState error={q.error} onRetry={() => q.refetch()} />}
          {q.data && (
            <>
              <p className="mb-3 text-xs text-ink-muted">{t('place.cell', { lat: q.data.lat.toFixed(1), lon: q.data.lon.toFixed(1) })}</p>
              <ul className="space-y-2">
                {q.data.rows.map((r) => {
                  const v = r.variable as VariableId
                  const Icon = ICONS[VARIABLES[v].icon as keyof typeof ICONS]
                  return (
                    <li key={v} data-variable={v}>
                      <button onClick={() => open(v, { lat: q.data.lat, lon: q.data.lon })}
                        className="flex min-h-16 w-full items-center gap-3 rounded-xl border border-purple bg-surface px-4 py-2 text-left hover:bg-deep-purple">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: VARIABLES[v].accent }} aria-hidden />
                        <Icon size={20} className="accent-transition shrink-0 text-accent" aria-hidden />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{t(`vars.${v}.name`)}</span>
                          <span className="num block text-sm text-ink-muted">{r.stats.state === 'insufficient' ? '—' : `${fmt(r.stats.sen_slope_per_decade)} ${r.unit} ${t('explorer.perDecade')}`}</span>
                        </span>
                        <DemoBadge status={r.data_status} />
                        <SignificanceBadge state={r.stats.state} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
