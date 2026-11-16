import { useQuery } from '@tanstack/react-query'
import { Grid3x3, Lightbulb, ListChecks, LocateFixed, MapPin } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { api } from '../../core/api'
import { VARIABLES, type VariableId } from '../../core/variables'
import { BackButton } from '../../shared/BackButton'
import { DemoBadge, ErrorState, Skeleton } from '../../shared/States'
import { ICONS } from '../../shared/VariableImage'
import { stateLabel } from '../../core/places'
import { stateAt } from '../../core/stateAt'
import { fmt, useGeoStates } from '../explorer/hooks'
import { useExplorer } from '../explorer/store'
import { SignificanceBadge } from '../trends/VerdictPanel'

const CITIES: Record<string, [number, number]> = {
  'Ciudad de México': [19.43, -99.13], Guadalajara: [20.67, -103.35], Monterrey: [25.67, -100.31],
  Mérida: [20.97, -89.62], Tijuana: [32.0, -117.0], Veracruz: [19.17, -96.13], Hermosillo: [29.07, -110.96],
  Oaxaca: [17.07, -96.72], 'Tuxtla Gutiérrez': [16.75, -93.12], Cancún: [21.16, -86.85],
  'New York': [40.71, -74.0], 'Los Ángeles': [34.05, -118.24], Chicago: [41.88, -87.63], Houston: [29.76, -95.37],
  Anchorage: [61.22, -149.9], Toronto: [43.65, -79.38], Vancouver: [49.28, -123.12], 'La Habana': [23.11, -82.37],
  'Ciudad de Guatemala': [14.63, -90.51], 'Ciudad de Panamá': [8.98, -79.52], Bogotá: [4.71, -74.07], Caracas: [10.48, -66.9],
  Quito: [-0.18, -78.47], Lima: [-12.05, -77.04], 'La Paz': [-16.5, -68.15], Manaos: [-3.12, -60.02], Brasilia: [-15.79, -47.88],
  'São Paulo': [-23.55, -46.63], Santiago: [-33.45, -70.67], 'Buenos Aires': [-34.6, -58.38], Montevideo: [-34.9, -56.16],
}
const MY = '__me__'

export default function PlacePage() {
  const { t, i18n } = useTranslation()
  const nav = useNavigate()
  const set = useExplorer((s) => s.set)
  const [choice, setChoice] = useState('Ciudad de México') // controlled, so the selector always shows what is analysed
  const [pt, setPt] = useState<[number, number]>(CITIES['Ciudad de México'])
  const [geo, setGeo] = useState<'idle' | 'busy' | 'ok' | 'denied' | 'error'>('idle')
  const [outside, setOutside] = useState(false)
  const geoStates = useGeoStates()
  const here = stateAt(geoStates.data, pt[0], pt[1])
  const q = useQuery({ queryKey: ['place', pt], queryFn: () => api.place(pt[0], pt[1]), staleTime: Infinity })

  const pick = (c: string) => {
    if (c === MY) return
    setChoice(c); setOutside(false); setGeo('idle'); setPt(CITIES[c])
  }

  const locate = () => {
    if (!navigator.geolocation) { setGeo('error'); return }
    setGeo('busy')
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const la = p.coords.latitude, lo = p.coords.longitude
        setOutside(la < -57 || la > 84 || lo < -170 || lo > -30)
        setPt([la, lo]); setChoice(MY); setGeo('ok')
      },
      (e) => setGeo(e.code === 1 ? 'denied' : 'error'),
      { timeout: 10000, maximumAge: 60000 },
    )
  }

  const open = (v: VariableId, c: { lat: number; lon: number }) => {
    // Open the explorer on the state this place belongs to, so the map outlines it and the panels name it.
    if (here) { set({ variable: v, region: 'americas', point: null, state: here.id }); nav(`/explore?v=${v}&r=americas&st=${here.id}`) }
    else { set({ variable: v, region: 'americas', point: { lat: c.lat, lon: c.lon }, state: null }); nav(`/explore?v=${v}&r=americas&lat=${c.lat}&lon=${c.lon}`) }
  }

  const counts = { rising: 0, falling: 0, no_trend: 0, insufficient: 0 }
  q.data?.rows.forEach((r) => { counts[r.stats.state] += 1 })
  const chips = [['rising', 'countRising'], ['falling', 'countFalling'], ['no_trend', 'countNone'], ['insufficient', 'countInsufficient']] as const
  const placeName = choice === MY ? (here ? stateLabel(here, i18n.language) : t('place.myLocation')) : choice
  const extra = [['readTitle', ListChecks], ['gridTitle', Grid3x3], ['tipTitle', Lightbulb]] as const

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <BackButton />
      <div className="flex items-center gap-3 text-ink-muted"><MapPin size={20} aria-hidden /><span className="text-sm font-semibold uppercase tracking-[0.08em]">{t('nav.place')}</span></div>
      <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">{t('place.title')}</h1>
      <p className="mt-2 max-w-2xl text-ink-muted">{t('place.subtitle')}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <select aria-label={t('place.pick')} className="h-11 min-w-56 flex-1 rounded-lg border border-input-border bg-surface px-3" value={choice} onChange={(e) => pick(e.target.value)}>
          {choice === MY && <option value={MY}>{t('place.myLocation')}</option>}
          {Object.keys(CITIES).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={locate} disabled={geo === 'busy'} className="inline-flex h-11 items-center gap-2 rounded-lg border border-input-border px-4 hover:bg-deep-purple disabled:opacity-60">
          <LocateFixed size={16} aria-hidden className={geo === 'busy' ? 'animate-pulse' : ''} />{geo === 'busy' ? t('place.locating') : t('place.geo')}
        </button>
      </div>
      <div aria-live="polite" className="min-h-5">
        {geo === 'denied' && <p role="alert" className="mt-3 text-sm text-danger">{t('place.geoDenied')}</p>}
        {geo === 'error' && <p role="alert" className="mt-3 text-sm text-danger">{t('place.geoError')}</p>}
        {geo === 'ok' && <p className="mt-3 text-sm text-ink-muted">{t('place.located')}</p>}
        {outside && <p role="status" className="mt-1 text-sm text-ink-muted">{t('place.outside')}</p>}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div aria-live="polite">
          {q.isLoading && <div className="space-y-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-16" />)}</div>}
          {q.error && <ErrorState error={q.error} onRetry={() => q.refetch()} />}
          {q.data && (
            <ul className="space-y-2">
              {q.data.rows.map((r) => {
                const v = r.variable as VariableId
                const Icon = ICONS[VARIABLES[v].icon as keyof typeof ICONS]
                return (
                  <li key={v} data-variable={v}>
                    <button onClick={() => open(v, { lat: q.data.lat, lon: q.data.lon })}
                      className="flex min-h-16 w-full flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-purple bg-surface px-4 py-2 text-left hover:bg-deep-purple">
                      <Icon size={20} className="accent-transition shrink-0 text-accent" aria-hidden />
                      <span className="min-w-0 flex-1 basis-40">
                        <span className="block font-medium">{t(`vars.${v}.name`)}</span>
                        <span className="num block text-sm text-ink-muted">{r.stats.state === 'insufficient' ? '—' : `${fmt(r.stats.sen_slope_per_decade)} ${r.unit} ${t('explorer.perDecade')}`}</span>
                      </span>
                      <DemoBadge status={r.data_status} />
                      <SignificanceBadge state={r.stats.state} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-purple bg-surface p-5" aria-labelledby="pl-sum">
            <h2 id="pl-sum" className="section-label">{t('place.summaryTitle')}</h2>
            <p className="mt-2 font-display text-xl font-semibold">{placeName}</p>
            {here && choice !== MY && <p className="mt-1 text-sm text-ink">{t('place.inState', { name: stateLabel(here, i18n.language) })}</p>}
            <p className="num mt-1 text-sm text-ink-muted">{t('place.coords')}: {pt[0].toFixed(2)}°, {pt[1].toFixed(2)}°</p>
            {q.data && <p className="mt-0.5 text-xs text-ink-muted">{t('place.cell', { lat: q.data.lat.toFixed(1), lon: q.data.lon.toFixed(1) })}</p>}
            {q.data && (
              <>
                <ul className="mt-4 grid grid-cols-2 gap-2">
                  {chips.map(([k, label]) => (
                    <li key={k} className="rounded-xl bg-deep-purple p-3">
                      <span className="num block text-2xl font-semibold">{counts[k]}</span>
                      <span className="text-xs text-ink-muted">{t(`place.${label}`)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-ink-muted">{t('place.ofSix', { n: q.data.rows.length })}</p>
              </>
            )}
          </section>
          {extra.map(([k, Icon]) => (
            <section key={k} className="rounded-2xl border border-purple bg-surface p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold"><Icon size={16} aria-hidden className="text-ink-muted" />{t(`place.${k}`)}</h2>
              {k === 'readTitle'
                ? <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-muted">{[1, 2, 3].map((n) => <li key={n}>{t(`place.read${n}`)}</li>)}</ul>
                : <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t(k === 'gridTitle' ? 'place.gridText' : 'place.tipText')}</p>}
            </section>
          ))}
        </aside>
      </div>
    </div>
  )
}
