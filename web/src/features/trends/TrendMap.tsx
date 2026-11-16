import { Info, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { StateRow, TrendsResponse } from '../../core/api'
import { stateLabel } from '../../core/places'
import { REGION_BOUNDS, VARIABLES, countryColor, divergingColor, legendGradient, type RegionId, type VariableId } from '../../core/variables'
import { ErrorState, Skeleton } from '../../shared/States'
import { fmt, fmtP } from '../explorer/hooks'
import { useExplorer } from '../explorer/store'

maplibregl.setWorkerUrl(workerUrl)

const OCEAN = '#0A1226'
const LAND = '#2A2038'
const HILITE = '#67E8F9'
const SELECTED = '#FACC15' // gold: not used by any palette nor by the hover outline

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

// The map opens on the whole continent; that is also the widest view allowed.
const VIEW = REGION_BOUNDS.americas

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

export function TrendMap({ variable, region, focus, focusName, onResetFocus, data, geo, countries, loading, error, refetch, start, end, footer, left, right, asTable }: {
  asTable: boolean
  variable: VariableId; region: RegionId; data?: TrendsResponse; geo?: GeoJSON.FeatureCollection; countries?: GeoJSON.FeatureCollection
  focus?: [[number, number], [number, number]] | null; focusName?: string | null; onResetFocus: () => void
  loading: boolean; error: unknown; refetch: () => void; start: number; end: number; footer: React.ReactNode
  left: DockedPanel; right: DockedPanel
}) {
  const { t, i18n } = useTranslation()
  const tRef = useRef(t)
  tRef.current = t
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const ready = useRef(false)
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
        const fp = f.properties as { id: string; name: string; name_es?: string; cc?: string }
        const r = by.get(String(fp.id))
        const [cx, cy] = center(f.geometry)
        const [[w, so], [e, n]] = REGION_BOUNDS[region]
        return {
          ...f,
          properties: {
            id: r?.id ?? '', name: r?.name ?? '', label: stateLabel(fp, i18n.language), selColor: countryColor(fp.cc), state: r?.state ?? 'insufficient',
            slope: r?.slope ?? null, pct: r?.pct ?? null, p: r?.p ?? null,
            color: r?.slope == null ? '#4A3D58' : divergingColor(palette, r.slope / max),
            sig: r?.state === 'rising' || r?.state === 'falling',
            inRegion: region === 'americas' || (cx >= w && cx <= e && cy >= so && cy <= n),
          },
        }
      }),
    }
  }, [geo, data, palette, max, region, i18n.language])

  const apply = () => {
    const m = map.current
    if (!m || !ready.current || !joined) return
    ;(m.getSource('states') as maplibregl.GeoJSONSource).setData(joined as never)
    const f = ['==', ['get', 'id'], selected ?? ''] as maplibregl.FilterSpecification
    m.setFilter('sel-casing', f)
    m.setFilter('sel', f)
    if (countries) (m.getSource('countries-lines') as maplibregl.GeoJSONSource | undefined)?.setData(countries as never)
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
    // Widest view = the whole continent; closest view = a few states.
    let placed = false
    const fit = () => {
      const cam = m.cameraForBounds(VIEW, { padding: 8 })
      if (!cam || cam.zoom == null || !cam.center) return
      m.setMinZoom(cam.zoom)
      m.setMaxZoom(cam.zoom + 4.5)
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
      const name = document.createElement('div'); name.style.cssText = 'font-weight:600;font-size:14px'; name.textContent = String(p.label ?? p.name)
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
      // Russia, Fiji and Antarctica cross the antimeridian and draw streaks across the world view; they are far from the Americas anyway.
      const world = feature(t0 as never, t0.objects.countries) as unknown as GeoJSON.FeatureCollection
      world.features = world.features.filter((f) => !['Russia', 'Fiji', 'Antarctica'].includes(String((f.properties as { name?: string }).name)))
      m.addSource('countries', { type: 'geojson', data: world as never, attribution: 'Natural Earth' })
      m.addLayer({ id: 'land', type: 'fill', source: 'countries', paint: { 'fill-color': LAND } })
      m.addLayer({ id: 'country-borders', type: 'line', source: 'countries', paint: { 'line-color': '#8F6BA3', 'line-width': 0.8 } })
      m.addImage('nodata', nodataPattern())
      m.addSource('states', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      m.addLayer({ id: 'nodata', type: 'fill', source: 'states', filter: ['all', ['==', ['get', 'state'], 'insufficient'], ['get', 'inRegion']], paint: { 'fill-pattern': 'nodata' } })
      m.addLayer({
        id: 'states-fill', type: 'fill', source: 'states', filter: ['all', ['!=', ['get', 'state'], 'insufficient'], ['get', 'inRegion']], // states outside the chosen zone are not painted at all
        paint: { 'fill-color': ['get', 'color'], 'fill-opacity': ['case', ['get', 'sig'], 0.95, 0.5] },
      })
      // state borders stay faint and thin; country borders are brighter and thicker so the hierarchy reads at a glance
      m.addLayer({ id: 'states-border', type: 'line', source: 'states', paint: { 'line-color': '#C4B2CF', 'line-opacity': ['case', ['get', 'inRegion'], 0.28, 0.08], 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 0.25, 6, 0.9] } })
      m.addSource('countries-lines', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      m.addLayer({ id: 'countries-casing', type: 'line', source: 'countries-lines', paint: { 'line-color': '#0A0612', 'line-opacity': 0.7, 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 2.4, 6, 5] }, layout: { 'line-join': 'round' } })
      m.addLayer({ id: 'countries-line', type: 'line', source: 'countries-lines', paint: { 'line-color': '#F4ECF7', 'line-opacity': 0.95, 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 1.1, 6, 2.6] }, layout: { 'line-join': 'round' } })
      m.addLayer({ id: 'hover', type: 'line', source: 'states', filter: ['==', ['get', 'id'], ''], paint: { 'line-color': HILITE, 'line-width': 2.5 } })
      m.addLayer({ id: 'sel-casing', type: 'line', source: 'states', filter: ['==', ['get', 'id'], ''], paint: { 'line-color': '#0A0612', 'line-width': 7, 'line-opacity': 0.85 }, layout: { 'line-join': 'round' } })
      m.addLayer({ id: 'sel', type: 'line', source: 'states', filter: ['==', ['get', 'id'], ''], paint: { 'line-color': ['coalesce', ['get', 'selColor'], SELECTED], 'line-width': 3.5 }, layout: { 'line-join': 'round' } })
      ready.current = true
      applyRef.current()
      pendingFit.current?.()
      pendingFit.current = null
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
  useEffect(() => { apply() }, [joined, selected, variable, countries]) // eslint-disable-line react-hooks/exhaustive-deps
  const rows = useMemo(
    () => [...(data?.states ?? [])].filter((r) => r.slope != null).sort((a, b) => Math.abs(b.slope!) - Math.abs(a.slope!)),
    [data],
  )
  const name = t(`vars.${variable}.name`)

  // Fly to the chosen zone, or to the visitor's country when a location was shared. Skipped on the first paint of the whole continent.
  const target = focus ?? REGION_BOUNDS[region]
  const targetKey = JSON.stringify(target)
  const firstFit = useRef(true)
  const pendingFit = useRef<(() => void) | null>(null)
  useEffect(() => {
    if (firstFit.current) { firstFit.current = false; if (targetKey === JSON.stringify(VIEW)) return }
    const go = () => {
      const m = map.current
      if (!m) return
      const w = m.getContainer().clientWidth
      const side = document.getElementById(right.id)
      let lp = left.open ? 330 : 20
      let rp = right.open && side ? side.offsetWidth + 50 : 20
      if (lp + rp > w * 0.7) { lp = 20; rp = 20 } // never squeeze the map to nothing
      m.fitBounds(target, { padding: { top: 24, bottom: 24, left: lp, right: rp }, duration: document.hidden ? 0 : 1100 })
    }
    if (ready.current) go(); else pendingFit.current = go // the style finishes loading asynchronously; applied right after
  }, [targetKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const wrap = useRef<HTMLDivElement>(null)
  const hdr = useRef<HTMLDivElement>(null)
  const foot = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ top: 80, foot: 0 })
  useEffect(() => {
    const measure = () => setDims({ top: (hdr.current?.offsetTop ?? 0) + (hdr.current?.offsetHeight ?? 60) + 20, foot: foot.current?.offsetHeight ?? 0 })
    const ro = new ResizeObserver(measure)
    if (hdr.current) ro.observe(hdr.current)
    if (foot.current) ro.observe(foot.current)
    measure()
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={wrap} className="relative flex h-full min-h-[560px] flex-col">
    <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-purple/60 bg-transparent p-3 sm:p-4" aria-labelledby="map-h">
      <div ref={hdr} className="relative flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div>
          <div className="relative flex items-center gap-1.5">
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
          <p className="mt-1 text-xs text-ink-muted">{t('explorer.mapLegend', { unit })} · {start}–{end}</p>
        </div>
        {focusName && (
          <div className="flex items-center gap-2 text-xs text-ink-muted lg:ml-auto">
            <span>{t('explorer.focusedOn', { country: focusName })}</span>
            <button onClick={onResetFocus} className="h-8 rounded-full border border-input-border px-3 text-ink hover:bg-deep-purple">{t('explorer.viewAll')}</button>
          </div>
        )}
        {/* colour guide: centred over the map and large enough to actually be read */}
        <div className="order-last flex w-full items-center justify-center gap-3 lg:pointer-events-none lg:absolute lg:inset-x-0 lg:top-0 lg:order-none lg:w-auto">
          <span className="text-sm font-semibold text-ink">{t('explorer.mapLow')}</span>
          <span className="h-4 w-56 rounded-full border border-white/20 sm:w-80" style={{ background: legendGradient(palette) }} aria-hidden />
          <span className="text-sm font-semibold text-ink">{t('explorer.mapHigh')}</span>
        </div>
      </div>

      <div className="relative mt-3 min-h-[320px] flex-1 overflow-hidden rounded-xl" style={{ background: OCEAN }}>
        <div ref={box} role="img" aria-label={t('explorer.mapAlt')} style={{ position: 'absolute', inset: 0 }} className={asTable ? 'invisible' : ''} />
        {loading && <div className="absolute inset-x-0 top-0 z-10 h-1 animate-pulse border-t-2 border-accent" aria-hidden />}
        {loading && !data && <Skeleton className="absolute inset-0" />}
        {loading && <p role="status" className="absolute bottom-2 right-2 z-10 rounded-lg bg-deep-purple px-2 py-1 text-xs">{t('explorer.analyzing', { n: data?.n_cells ?? '…' })}</p>}
        {!loading && !asTable && <p className="pointer-events-none absolute left-2 top-2 z-10 rounded-lg bg-background/80 px-2 py-1 text-xs text-ink-muted">{t('explorer.hoverHint')}</p>}
        {asTable && (
          <div className="absolute inset-0 overflow-auto bg-surface py-2" style={{ paddingLeft: `calc(${left.open ? left.width : '0px'} + 3rem)`, paddingRight: `calc(${right.open ? right.width : '0px'} + 3rem)` }}>
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
        {error != null && !data && <div className="absolute inset-0 z-20 grid place-items-center bg-background p-4"><ErrorState error={error} onRetry={refetch} /></div>}
      </div>
    </section>

    {/* transparent dock that is only as wide as its filters */}
    <div ref={foot} className="flex justify-center pt-2" style={{ paddingRight: asTable ? `calc(${right.open ? right.width : '0px'} + 3rem)` : undefined }}>{footer}</div>

    {/* Panels live over the whole block: the charts column runs down beside the filter dock, the variable card stops above it. */}
    <div className="pointer-events-none absolute inset-x-4 bottom-0 overflow-x-clip sm:inset-x-5" style={{ top: dims.top }}>
      <FloatingPanel side="left" panel={left} maxH={`calc(100% - ${dims.foot}px - 4.5rem)`} />
      <FloatingPanel side="right" panel={right} maxH={asTable ? '100%' : `calc(100% - ${dims.foot}px - 1rem)`} />
    </div>
    </div>
  )
}

export interface DockedPanel { width: string; open: boolean; onToggle: () => void; label: string; hideLabel: string; showLabel: string; id: string; children: React.ReactNode }

/** A card floating over the map with a pull-tab fixed to its inner edge. Closing slides the card away
 *  but leaves the tab docked at the map border, so the control always lives on the panel it moves. */
function FloatingPanel({ side, panel, maxH }: { side: 'left' | 'right'; panel: DockedPanel; maxH: string }) {
  const isLeft = side === 'left'
  const Icon = isLeft ? (panel.open ? PanelLeftClose : PanelLeftOpen) : (panel.open ? PanelRightClose : PanelRightOpen)
  return (
    <div
      className={`pointer-events-none absolute top-0 z-30 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isLeft ? 'left-0' : 'right-0'}`}
      style={{
        width: panel.width, maxHeight: maxH,
        transform: panel.open ? 'translateX(0)' : `translateX(${isLeft ? '-100%' : '100%'})`,
      }}
    >
      <div
        id={panel.id} aria-hidden={!panel.open} {...(!panel.open ? { inert: true } : {})}
        className={`pointer-events-auto min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.55)] transition-opacity duration-200 ${panel.open ? 'opacity-100' : 'opacity-0'}`}
      >
        {panel.children}
      </div>
      <button
        onClick={panel.onToggle} aria-expanded={panel.open} aria-controls={panel.id}
        aria-label={panel.open ? panel.hideLabel : panel.showLabel} title={panel.open ? panel.hideLabel : panel.showLabel}
        className={`pointer-events-auto absolute top-1/2 flex h-28 w-8 -translate-y-1/2 flex-col items-center justify-center gap-2 border border-purple bg-deep-purple text-ink shadow-[0_6px_20px_rgba(0,0,0,0.45)] transition-colors duration-150 hover:bg-purple
          ${isLeft ? 'left-full rounded-r-2xl border-l-0' : 'right-full rounded-l-2xl border-r-0'}`}
      >
        <Icon size={16} aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] [writing-mode:vertical-rl]" style={{ transform: isLeft ? 'none' : 'rotate(180deg)' }}>{panel.label}</span>
      </button>
    </div>
  )
}
