import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Cell, TrendsResponse } from '../../core/api'
import { REGION_VIEW, VARIABLES, divergingColor, legendGradient, type RegionId, type VariableId } from '../../core/variables'
import { ErrorState, Skeleton } from '../../shared/States'
import { fmt, fmtP } from '../explorer/hooks'
import { useExplorer } from '../explorer/store'

maplibregl.setWorkerUrl(workerUrl)

// Keyless, offline base map: Natural Earth country shapes bundled via world-atlas.
const STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#140A1E' } }],
}

function accentRgb() {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().split(/\s+/).join(',')
  return `rgb(${v || '242,166,222'})`
}

function nodataPattern(): ImageData {
  const c = document.createElement('canvas')
  c.width = c.height = 8
  const g = c.getContext('2d')!
  g.fillStyle = 'rgba(74,61,88,0.35)'; g.fillRect(0, 0, 8, 8)
  g.strokeStyle = '#4A3D58'; g.lineWidth = 1.5
  g.beginPath(); g.moveTo(0, 8); g.lineTo(8, 0); g.stroke()
  return g.getImageData(0, 0, 8, 8)
}

function scaleMax(cells: Cell[]): number {
  const a = cells.filter((c) => c.slope != null).map((c) => Math.abs(c.slope!)).sort((x, y) => x - y)
  return a.length ? Math.max(a[Math.floor(a.length * 0.95)] ?? a[a.length - 1], 1e-9) : 1
}

export function TrendMap({ variable, region, data, loading, error, refetch, start, end }: {
  variable: VariableId; region: RegionId; data?: TrendsResponse; loading: boolean; error: unknown; refetch: () => void
  start: number; end: number
}) {
  const { t } = useTranslation()
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const ready = useRef(false)
  const [asTable, setAsTable] = useState(false)
  const point = useExplorer((s) => s.point)
  const set = useExplorer((s) => s.set)
  const palette = VARIABLES[variable].map
  const max = useMemo(() => (data ? scaleMax(data.cells) : 1), [data])
  const step = data?.step ?? 1

  const geo = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: (data?.cells ?? []).map((c) => ({
      type: 'Feature' as const,
      properties: {
        lat: c.lat, lon: c.lon, state: c.state, slope: c.slope, pct: c.pct, p: c.p,
        color: c.slope == null ? '#4A3D58' : divergingColor(palette, c.slope / max),
        sig: c.state === 'rising' || c.state === 'falling',
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[[c.lon - step / 2, c.lat - step / 2], [c.lon + step / 2, c.lat - step / 2], [c.lon + step / 2, c.lat + step / 2], [c.lon - step / 2, c.lat + step / 2], [c.lon - step / 2, c.lat - step / 2]]],
      },
    })),
  }), [data, palette, max, step])

  const apply = () => {
    const m = map.current
    if (!m || !ready.current) return
    ;(m.getSource('cells') as maplibregl.GeoJSONSource).setData(geo as never)
    m.setPaintProperty('sel', 'line-color', accentRgb())
    m.setFilter('sel', point ? ['all', ['==', ['get', 'lat'], point.lat], ['==', ['get', 'lon'], point.lon]] : ['==', ['get', 'lat'], -999])
  }
  const applyRef = useRef(apply)
  applyRef.current = apply

  useEffect(() => {
    if (!box.current || map.current) return
    const m = new maplibregl.Map({
      container: box.current, style: STYLE, center: REGION_VIEW[region].center, zoom: REGION_VIEW[region].zoom,
      attributionControl: { compact: true }, dragRotate: false,
    })
    map.current = m
    if (import.meta.env.DEV) (window as unknown as { __map: unknown }).__map = m
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-left')
    m.on('error', (e) => console.warn('[map]', (e as unknown as { error?: Error }).error?.message ?? e))
    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 8 })
    m.on('load', async () => {
      const [{ feature }, topo] = await Promise.all([import('topojson-client'), import('world-atlas/countries-50m.json')])
      const t0 = topo.default as unknown as { objects: { countries: never } }
      const countries = feature(t0 as never, t0.objects.countries)
      m.addSource('countries', { type: 'geojson', data: countries as never, attribution: 'Natural Earth' })
      m.addLayer({ id: 'land', type: 'fill', source: 'countries', paint: { 'fill-color': '#1E1029' } })
      m.addLayer({ id: 'borders', type: 'line', source: 'countries', paint: { 'line-color': '#612073', 'line-width': 1 } })
      m.addImage('nodata', nodataPattern())
      m.addSource('cells', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      m.addLayer({ id: 'nodata', type: 'fill', source: 'cells', filter: ['==', ['get', 'state'], 'insufficient'], paint: { 'fill-pattern': 'nodata' } })
      m.addLayer({
        id: 'cells', type: 'fill', source: 'cells', filter: ['!=', ['get', 'state'], 'insufficient'],
        paint: { 'fill-color': ['get', 'color'], 'fill-opacity': ['case', ['get', 'sig'], 0.9, 0.25] },
      })
      m.addLayer({ id: 'sel', type: 'line', source: 'cells', paint: { 'line-width': 2.5, 'line-color': '#F2A6DE' }, filter: ['==', ['get', 'lat'], -999] })
      ready.current = true
      applyRef.current()
    })
    m.on('click', 'cells', (e: maplibregl.MapLayerMouseEvent) => {
      const p = e.features?.[0]?.properties
      if (p) useExplorer.getState().set({ point: { lat: Number(p.lat), lon: Number(p.lon) } })
    })
    m.on('mousemove', 'cells', (e: maplibregl.MapLayerMouseEvent) => {
      const p = e.features?.[0]?.properties
      if (!p) return
      m.getCanvas().style.cursor = 'pointer'
      const el = document.createElement('div')
      el.style.cssText = 'font:12px Inter,sans-serif;color:#F4ECF7'
      el.textContent = `${Number(p.lat).toFixed(1)}°, ${Number(p.lon).toFixed(1)}° · ${fmt(Number(p.slope))}/dec · ${t(`state.${p.state}`)}`
      popup.setLngLat(e.lngLat).setDOMContent(el).addTo(m)
    })
    m.on('mouseleave', 'cells', () => { m.getCanvas().style.cursor = ''; popup.remove() })
    return () => { m.remove(); map.current = null; ready.current = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { apply() }, [geo, point, variable]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const v = REGION_VIEW[region]
    map.current?.easeTo({ center: v.center, zoom: v.zoom, duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 400 })
  }, [region])

  const rows = useMemo(
    () => [...(data?.cells ?? [])].filter((c) => c.slope != null).sort((a, b) => Math.abs(b.slope!) - Math.abs(a.slope!)).slice(0, 25),
    [data],
  )
  const unit = data?.unit ?? ''

  return (
    <section className="flex min-h-[460px] flex-col rounded-2xl border border-purple bg-surface p-4 lg:p-6" aria-labelledby="map-h">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="map-h" className="section-label">{t('explorer.map')}</h2>
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <span>{t('explorer.mapLow')}</span>
          <span className="h-2.5 w-28 rounded-full" style={{ background: legendGradient(palette) }} aria-hidden />
          <span>{t('explorer.mapHigh')}</span>
        </div>
      </div>
      <p className="mt-1 text-xs text-ink-muted">{t('explorer.mapLegend', { unit, start, end })}</p>
      <div className="relative mt-3 min-h-[320px] flex-1 overflow-hidden rounded-xl bg-background">
        <div ref={box} role="img" aria-label={t('explorer.mapAlt')} style={{ position: 'absolute', inset: 0 }} className={asTable ? 'invisible' : ''} />
        {loading && <div className="absolute inset-x-0 top-0 z-10 h-1 animate-pulse border-t-2 border-accent" aria-hidden />}
        {loading && !data && <Skeleton className="absolute inset-0" />}
        {loading && <p role="status" className="absolute bottom-2 right-2 z-10 rounded-lg bg-deep-purple px-2 py-1 text-xs">{t('explorer.analyzing', { n: data?.n_cells ?? '…' })}</p>}
        {asTable && (
          <div className="absolute inset-0 overflow-auto p-2">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-ink-muted"><tr><th className="p-1">Lat, lon</th><th className="p-1">{t('stats.sen')}</th><th className="p-1">p (FDR)</th><th className="p-1" /></tr></thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={`${c.lat}${c.lon}`} className="border-t border-purple">
                    <td className="num p-1">{c.lat.toFixed(1)}, {c.lon.toFixed(1)}</td>
                    <td className="num p-1">{fmt(c.slope)} {unit}</td>
                    <td className="num p-1">{fmtP(c.p)}</td>
                    <td className="p-1"><button className="h-9 text-xs underline" onClick={() => set({ point: { lat: c.lat, lon: c.lon } })}>{t('explorer.selected')}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {error != null && !data && <div className="absolute inset-0 z-20 grid place-items-center bg-background p-4"><ErrorState error={error} onRetry={refetch} /></div>}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
        <span>{t('explorer.cellsNote')}</span>
        <button onClick={() => setAsTable((v) => !v)} className="h-11 px-2 underline underline-offset-4">{asTable ? t('explorer.mapChart') : t('explorer.mapTable')}</button>
      </div>
    </section>
  )
}
