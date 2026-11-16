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
