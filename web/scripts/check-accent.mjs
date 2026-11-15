// UX rule: the variable accent colors text and elements only, never backgrounds.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const bad = []
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.(tsx?|css)$/.test(f) && /\bbg-accent\b/.test(readFileSync(p, 'utf8'))) bad.push(p)
  }
}
walk('src')
if (bad.length) { console.error('bg-accent is forbidden (UX.md):\n' + bad.join('\n')); process.exit(1) }
console.log('ok: no bg-accent')
