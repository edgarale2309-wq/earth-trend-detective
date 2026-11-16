/** Country names come from the browser (Intl) so they follow the interface language: "Mexico" / "México". */
export function countryName(cc: string, lang: string): string {
  try { return new Intl.DisplayNames([lang], { type: 'region' }).of(cc) ?? cc } catch { return cc }
}

export interface StateProps { name: string; name_es?: string; cc?: string }

/** "Morelos-México": state plus country. */
export function stateLabel(p: StateProps, lang: string): string {
  const name = lang.startsWith('es') ? (p.name_es ?? p.name) : p.name
  return p.cc ? `${name}-${countryName(p.cc, lang)}` : name
}

type Bounds = [[number, number], [number, number]]

/** Bounding box of a country's main landmass (its largest polygon, so Alaska/Hawaii do not stretch the USA). */
export function countryBounds(fc: GeoJSON.FeatureCollection | undefined, cc: string): Bounds | null {
  let best: { b: Bounds; area: number } | null = null
  for (const f of fc?.features ?? []) {
    if ((f.properties as { cc?: string }).cc !== cc) continue
    const g = f.geometry
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []
    for (const poly of polys) {
      let w = 180, s = 90, e = -180, n = -90
      for (const [x, y] of poly[0]) { w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y) }
      const area = (e - w) * (n - s)
      if (!best || area > best.area) best = { b: [[w, s], [e, n]], area }
    }
  }
  return best?.b ?? null
}
