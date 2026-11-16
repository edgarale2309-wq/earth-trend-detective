type Ring = number[][]

function inRing(x: number, y: number, ring: Ring): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function polygons(g: GeoJSON.Geometry): Ring[][] {
  return g.type === 'Polygon' ? [g.coordinates as Ring[]] : g.type === 'MultiPolygon' ? (g.coordinates as Ring[][]) : []
}

/** The state (id and name) a coordinate falls in. Points a little offshore (the data grid is ~1°) snap to the nearest state. */
export interface StateHit { id: string; name: string; name_es?: string; cc?: string }

export function stateAt(geo: GeoJSON.FeatureCollection | undefined, lat: number, lon: number): StateHit | null {
  if (!geo) return null
  let best: (StateHit & { d: number }) | null = null
  for (const f of geo.features) {
    const p = f.properties as StateHit
    for (const poly of polygons(f.geometry)) {
      if (inRing(lon, lat, poly[0]) && !poly.slice(1).some((h) => inRing(lon, lat, h))) return { id: p.id, name: p.name, name_es: p.name_es, cc: p.cc }
      for (const [x, y] of poly[0]) {
        const d = Math.hypot(x - lon, y - lat)
        if (!best || d < best.d) best = { id: p.id, name: p.name, name_es: p.name_es, cc: p.cc, d }
      }
    }
  }
  return best && best.d < 1.5 ? { id: best.id, name: best.name, name_es: best.name_es, cc: best.cc } : null
}
