import { Info } from 'lucide-react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { StateRow, TrendsResponse } from '../../core/api'
import { REGION_BOUNDS, VARIABLES, divergingColor, legendGradient, type RegionId, type VariableId } from '../../core/variables'
import { ErrorState, Skeleton } from '../../shared/States'
import { fmt, fmtP } from '../explorer/hooks'
import { useExplorer } from '../explorer/store'

maplibregl.setWorkerUrl(workerUrl)

const OCEAN = '#0A1226'
const LAND = '#2A2038'
const HILITE = '#67E8F9'

const STYLE: maplibregl.StyleSpecification = {
  version: 8, sources: {},
  layers: [{ id: 'ocean', type: 'background', paint: { 'background-color': OCEAN } }],
}

/** Centre of a geometry's bounding box, used to decide whether a state belongs to the selected region. */
function center(g: GeoJSON.Geometry): [number, number] {
  let x0 = 180, x1 = -180, y0 = 90, y1 = -90
  const walk = (c: unknown): void => {
    if (Array.isArray(c) && typeof c[0] === 'number') {
      const [x, y] = c as [number, number]
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y)
    } else if (Array.isArray(c)) c.forEach(walk)
  }
  walk((g as { coordinates?: unknown }).coordinates)
  return [(x0 + x1) / 2, (y0 + y1) / 2]
}

// The map opens on Mexico plus a little border; that is also the widest view allowed.
const VIEW = REGION_BOUNDS.mexico

function accentRgb() {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().split(/\s+/).join(',')
  return `rgb(${v || '242,166,222'})`
}

function nodataPattern(): ImageData {
  const c = document.createElement('canvas')
  c.width = c.height = 8
  const g = c.getContext('2d')!
  g.fillStyle = 'rgba(74,61,88,0.5)'; g.fillRect(0, 0, 8, 8)
  g.strokeStyle = '#8F6BA3'; g.lineWidth = 1
  g.beginPath(); g.moveTo(0, 8); g.lineTo(8, 0); g.stroke()
  return g.getImageData(0, 0, 8, 8)
}

function scaleMax(rows: StateRow[]): number {
  const a = rows.filter((r) => r.slope != null).map((r) => Math.abs(r.slope!)).sort((x, y) => x - y)
  return a.length ? Math.max(a[Math.floor(a.length * 0.95)] ?? a[a.length - 1], 1e-9) : 1
}

export function TrendMap({ variable, region, data, geo, loading, error, refetch, start, end, footer, cornerLeft, cornerRight, overlayLeft, overlayRight }: {
  variable: VariableId; region: RegionId; data?: TrendsResponse; geo?: GeoJSON.FeatureCollection
  loading: boolean; error: unknown; refetch: () => void; start: number; end: number; footer: React.ReactNode; cornerLeft?: React.ReactNode; cornerRight?: React.ReactNode
  overlayLeft?: React.ReactNode; overlayRight?: React.ReactNode
}) {
  const { t } = useTranslation()
  const tRef = useRef(t)
  tRef.current = t
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const ready = useRef(false)
  const [asTable, setAsTable] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const selected = useExplorer((s) => s.state)
  const set = useExplorer((s) => s.set)
  const palette = VARIABLES[variable].map
  const unit = data?.unit ?? ''
  const max = useMemo(() => (data ? scaleMax(data.states) : 1), [data])

  const joined = useMemo(() => {
    if (!geo || !data) return null
    const by = new Map(data.states.map((r) => [r.id, r]))
    return {
      type: 'FeatureCollection' as const,
      features: geo.features.map((f) => {
        const r = by.get(String((f.properties as { id: string }).id))
        const [cx, cy] = center(f.geometry)
        const [[w, so], [e, n]] = REGION_BOUNDS[region]
        return {
          ...f,
          properties: {
            id: r?.id ?? '', name: r?.name ?? '', state: r?.state ?? 'insufficient',
            slope: r?.slope ?? null, pct: r?.pct ?? null, p: r?.p ?? null,
            color: r?.slope == null ? '#4A3D58' : divergingColor(palette, r.slope / max),
            sig: r?.state === 'rising' || r?.state === 'falling',
            inRegion: region === 'mexico' || (cx >= w && cx <= e && cy >= so && cy <= n),
          },
        }
      }),
    }
  }, [geo, data, palette, max, region])

  const apply = () => {
    const m = map.current
    if (!m || !ready.current || !joined) return
    ;(m.getSource('states') as maplibregl.GeoJSONSource).setData(joined as never)
    m.setPaintProperty('sel', 'line-color', accentRgb())
    m.setFilter('sel', ['==', ['get', 'id'], selected ?? ''])
  }
  const applyRef = useRef(apply)
  applyRef.current = apply

  useEffect(() => {
    if (!box.current || map.current) return
    const m = new maplibregl.Map({
      container: box.current, style: STYLE, bounds: VIEW, fitBoundsOptions: { padding: 8 },
      attributionControl: { compact: true }, dragRotate: false,
    })
    map.current = m
    // Widest view = all of Mexico (with a bit of border); closest view = about one state.
    let placed = false
    const fit = () => {
      const cam = m.cameraForBounds(VIEW, { padding: 8 })
      if (!cam || cam.zoom == null || !cam.center) return
      m.setMinZoom(cam.zoom)
      m.setMaxZoom(cam.zoom + 2.3)
      if (!placed) { m.jumpTo({ center: cam.center, zoom: cam.zoom }); placed = true }
    }
    const ro = new ResizeObserver(() => { m.resize(); fit() })
    ro.observe(box.current)
    if (import.meta.env.DEV) (window as unknown as { __map: unknown }).__map = m
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-left')
    m.on('error', (e) => console.warn('[map]', (e as unknown as { error?: Error }).error?.message ?? e))
    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10, maxWidth: '260px' })

    const show = (e: maplibregl.MapLayerMouseEvent) => {
      const p = e.features?.[0]?.properties
      if (!p) return
      const tt = tRef.current
      m.setFilter('hover', ['==', ['get', 'id'], String(p.id)])
      const el = document.createElement('div')
      el.style.cssText = 'font:13px Inter,sans-serif;color:#F4ECF7;display:grid;gap:6px'
      const name = document.createElement('div'); name.style.cssText = 'font-weight:600;font-size:14px'; name.textContent = String(p.name)
      const datum = document.createElement('div'); datum.style.color = '#C4B2CF'
      const st = String(p.state)
      const amount = p.slope == null || p.slope === 'null' ? '—' : `${fmt(Number(p.slope))} ${unitRef.current} ${tt('explorer.perDecade')}`
      datum.textContent = st === 'insufficient' ? tt('state.insufficient')
        : st === 'no_trend' ? amount : `${tt(st === 'rising' ? 'state.dirRising' : 'state.dirFalling')} · ${amount}`
      const badge = document.createElement('span')
      badge.style.cssText = 'justify-self:start;border:1px solid #C4B2CF;border-radius:8px;padding:2px 8px;font-size:12px'
      badge.textContent = tt(`state.${st}`)
      el.append(name, datum, badge)
      popup.setLngLat(e.lngLat).setDOMContent(el).addTo(m)
    }

    m.on('load', async () => {
      fit()
      const [{ feature }, topo] = await Promise.all([import('topojson-client'), import('world-atlas/countries-50m.json')])
      const t0 = topo.default as unknown as { objects: { countries: never } }
      m.addSource('countries', { type: 'geojson', data: feature(t0 as never, t0.objects.countries) as never, attribution: 'Natural Earth' })
      m.addLayer({ id: 'land', type: 'fill', source: 'countries', paint: { 'fill-color': LAND } })
      m.addLayer({ id: 'country-borders', type: 'line', source: 'countries', paint: { 'line-color': '#8F6BA3', 'line-width': 1 } })
      m.addImage('nodata', nodataPattern())
      m.addSource('states', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      m.addLayer({ id: 'nodata', type: 'fill', source: 'states', filter: ['==', ['get', 'state'], 'insufficient'], paint: { 'fill-pattern': 'nodata' } })
      m.addLayer({
        id: 'states-fill', type: 'fill', source: 'states', filter: ['!=', ['get', 'state'], 'insufficient'],
        paint: { 'fill-color': ['get', 'color'], 'fill-opacity': ['case', ['!', ['get', 'inRegion']], 0.18, ['get', 'sig'], 0.95, 0.5] },
      })
      m.addLayer({ id: 'states-border', type: 'line', source: 'states', paint: { 'line-color': '#C4B2CF', 'line-opacity': 0.4, 'line-width': 0.7 } })
      m.addLayer({ id: 'hover', type: 'line', source: 'states', filter: ['==', ['get', 'id'], ''], paint: { 'line-color': HILITE, 'line-width': 2.5 } })
      m.addLayer({ id: 'sel', type: 'line', source: 'states', filter: ['==', ['get', 'id'], ''], paint: { 'line-color': '#F2A6DE', 'line-width': 3 } })
      ready.current = true
      applyRef.current()
    })
    m.on('mousemove', 'states-fill', (e: maplibregl.MapLayerMouseEvent) => { m.getCanvas().style.cursor = 'pointer'; show(e) })
    m.on('mousemove', 'nodata', (e: maplibregl.MapLayerMouseEvent) => { m.getCanvas().style.cursor = 'pointer'; show(e) })
    const leave = () => { m.getCanvas().style.cursor = ''; popup.remove(); m.setFilter('hover', ['==', ['get', 'id'], '']) }
    m.on('mouseleave', 'states-fill', leave)
    m.on('mouseleave', 'nodata', leave)
    const pick = (e: maplibregl.MapLayerMouseEvent) => {
      const p = e.features?.[0]?.properties
      if (p) { useExplorer.getState().set({ state: String(p.id), point: null }); show(e) }
    }
    m.on('click', 'states-fill', pick)
    m.on('click', 'nodata', pick)
    return () => { ro.disconnect(); m.remove(); map.current = null; ready.current = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const unitRef = useRef(unit)
  unitRef.current = unit
  useEffect(() => { apply() }, [joined, selected, variable]) // eslint-disable-line react-hooks/exhaustive-deps
  const rows = useMemo(
    () => [...(data?.states ?? [])].filter((r) => r.slope != null).sort((a, b) => Math.abs(b.slope!) - Math.abs(a.slope!)),
    [data],
  )
  const name = t(`vars.${variable}.name`)

  return (
    <section className="flex h-full min-h-[520px] flex-col rounded-2xl border border-purple bg-surface p-3 sm:p-4" aria-labelledby="map-h">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex items-center gap-1.5">
          {cornerLeft}
          <h2 id="map-h" className="section-label">{t('explorer.map')}</h2>
          <button onClick={() => setShowNote((v) => !v)} aria-expanded={showNote} aria-label={t('explorer.mapNote')} title={t('explorer.mapNote')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-deep-purple hover:text-ink">
            <Info size={16} aria-hidden />
          </button>
          {showNote && (
            <div role="note" className="absolute left-0 top-full z-30 mt-1 w-[min(22rem,80vw)] rounded-xl border border-purple bg-deep-purple p-3 text-xs leading-relaxed text-ink">
              {t('explorer.mapNoteText', { name: name.toLowerCase(), start, end })}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <span>{t('explorer.mapLow')}</span>
          <span className="h-2.5 w-28 rounded-full" style={{ background: legendGradient(palette) }} aria-hidden />
          <span>{t('explorer.mapHigh')}</span>
          {cornerRight}
        </div>
      </div>
      <p className="mt-1 text-xs text-ink-muted">{t('explorer.mapLegend', { unit })} · {start}–{end}</p>

      <div className="relative mt-3 min-h-[320px] flex-1 overflow-hidden rounded-xl" style={{ background: OCEAN }}>
        <div ref={box} role="img" aria-label={t('explorer.mapAlt')} style={{ position: 'absolute', inset: 0 }} className={asTable ? 'invisible' : ''} />
        {loading && <div className="absolute inset-x-0 top-0 z-10 h-1 animate-pulse border-t-2 border-accent" aria-hidden />}
        {loading && !data && <Skeleton className="absolute inset-0" />}
        {loading && <p role="status" className="absolute bottom-2 right-2 z-10 rounded-lg bg-deep-purple px-2 py-1 text-xs">{t('explorer.analyzing', { n: data?.n_cells ?? '…' })}</p>}
        {!loading && !asTable && <p className="pointer-events-none absolute left-2 top-2 z-10 rounded-lg bg-background/80 px-2 py-1 text-xs text-ink-muted">{t('explorer.hoverHint')}</p>}
        {asTable && (
          <div className="absolute inset-0 overflow-auto bg-surface p-2">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-ink-muted"><tr><th className="p-2">{t('explorer.tableState')}</th><th className="p-2">{t('explorer.tableChange')}</th><th className="p-2">p (FDR)</th><th className="p-2" /></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-purple">
                    <td className="p-2">{r.name}</td>
                    <td className="num p-2">{fmt(r.slope)} {unit}</td>
                    <td className="num p-2">{fmtP(r.p)}</td>
                    <td className="p-2"><button className="h-9 text-xs underline" onClick={() => set({ state: r.id, point: null })}>{t('explorer.select')}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <FloatingPanel side="left">{overlayLeft}</FloatingPanel>
        <FloatingPanel side="right">{overlayRight}</FloatingPanel>
        {error != null && !data && <div className="absolute inset-0 z-20 grid place-items-center bg-background p-4"><ErrorState error={error} onRetry={refetch} /></div>}
      </div>
      <div className="mt-2 flex justify-end">
        <button onClick={() => setAsTable((v) => !v)} className="h-9 px-2 text-xs text-ink-muted underline underline-offset-4 hover:text-ink">{asTable ? t('explorer.mapChart') : t('explorer.mapTable')}</button>
      </div>
      {footer}
    </section>
  )
}

/** Floating card laid over the map; renders nothing when its content is null (panel hidden). */
function FloatingPanel({ side, children }: { side: 'left' | 'right'; children?: React.ReactNode }) {
  if (!children) return null
  return (
    <div className={`pointer-events-none absolute inset-y-2 z-30 flex ${side === 'left' ? 'left-2 justify-start' : 'right-2 justify-end'}`}>
      <div className={`pointer-events-auto max-h-full overflow-y-auto overflow-x-hidden overscroll-contain rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.55)] ${side === 'left' ? 'w-[min(312px,88vw)]' : 'w-[min(400px,92vw)]'}`}>
        {children}
      </div>
    </div>
  )
}
