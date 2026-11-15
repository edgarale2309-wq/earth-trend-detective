import Plotly from 'plotly.js-basic-dist-min'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import createPlotlyComponent from 'react-plotly.js/factory'
import type { SeriesResponse } from '../../core/api'
import { VARIABLES, type VariableId } from '../../core/variables'

const Plot = createPlotlyComponent(Plotly)
const INK = '#F4ECF7'
const MUTED = '#C4B2CF'

export default function TimeSeriesChart({ variable, data, resolution, revision, onRange }: {
  variable: VariableId; data: SeriesResponse; resolution: 'annual' | 'monthly'; revision: string
  onRange: (startYear: number, endYear: number) => void
}) {
  const { t } = useTranslation()
  const accent = VARIABLES[variable].accent
  const [hi, setHi] = useState<number | null>(null)
  const monthly = resolution === 'monthly'
  const anomalies = data.deseasonalized

  // % relative to the long-term average: anomalies are already differences, absolute values are shifted by the mean.
  const pct = useMemo(
    () => data.values.map((v) => (data.mean ? ((anomalies ? v : v - data.mean) / Math.abs(data.mean)) * 100 : 0)),
    [data, anomalies],
  )

  const traces: Plotly.Data[] = []
  if (data.fit) {
    traces.push(
      { x: data.dates, y: data.fit.ci_high, type: 'scatter', mode: 'lines', line: { width: 0 }, hoverinfo: 'skip', showlegend: false },
      { x: data.dates, y: data.fit.ci_low, type: 'scatter', mode: 'lines', line: { width: 0 }, fill: 'tonexty', fillcolor: 'rgba(244,236,247,0.12)', hoverinfo: 'skip', showlegend: false },
    )
  }
  traces.push({
    x: data.dates, y: data.values, type: 'scatter', mode: monthly ? 'lines+markers' : 'lines+markers', showlegend: false,
    line: { color: accent, width: 1.8 },
    marker: { color: accent, size: monthly ? 3 : 6, line: { color: '#1E1029', width: 1 } },
    customdata: pct,
    hovertemplate:
      `<b>%{x|${monthly ? '%b %Y' : '%Y'}}</b><br>${t('chart.hoverValue')}: %{y:.2f} ${data.unit}<br>%{customdata:+.1f}% ${t('chart.hoverVsAvg')}<extra></extra>`,
  })
  if (data.fit) {
    traces.push({ x: data.dates, y: data.fit.trend, type: 'scatter', mode: 'lines', showlegend: false, line: { color: INK, width: 1.6, dash: 'dash' }, hoverinfo: 'skip' })
  }
  if (hi != null && data.dates[hi]) {
    // glowing highlight on the hovered point
    traces.push({ x: [data.dates[hi]], y: [data.values[hi]], type: 'scatter', mode: 'markers', showlegend: false, hoverinfo: 'skip',
      marker: { color: '#FFFFFF', size: 11, line: { color: accent, width: 4 } } })
  }

  return (
    <div role="img" aria-label={t('chart.alt', { name: t(`vars.${variable}.name`) })}>
      <Plot
        data={traces} revision={revision as unknown as number}
        layout={{
          autosize: true, height: 300, margin: { l: 52, r: 12, t: 8, b: 36 },
          paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
          font: { family: 'Inter, sans-serif', size: 12, color: MUTED },
          dragmode: 'select', selectdirection: 'h', hovermode: 'closest', hoverdistance: 40, uirevision: revision,
          xaxis: {
            gridcolor: '#2F1740', zerolinecolor: '#612073', tickfont: { color: MUTED },
            showspikes: true, spikemode: 'across', spikesnap: 'cursor', spikethickness: 1, spikedash: 'dot', spikecolor: MUTED,
          },
          yaxis: {
            gridcolor: '#2F1740', zerolinecolor: '#612073', tickfont: { color: MUTED },
            title: { text: anomalies ? `Δ ${data.unit}` : data.unit, font: { size: 11 } },
          },
          selectionrevision: revision,
          hoverlabel: { bgcolor: '#2F1740', bordercolor: accent, font: { color: INK, family: 'Inter, sans-serif', size: 13 } },
          newselection: { line: { color: accent, width: 1 } },
          selections: [],
        } as Partial<Plotly.Layout>}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }} useResizeHandler
        onHover={(e: Plotly.PlotHoverEvent) => { const p = e.points?.find((q) => (q.data as { mode?: string; hoverinfo?: string }).mode?.includes('markers') && (q.data as { hoverinfo?: string }).hoverinfo !== 'skip'); setHi(p ? p.pointIndex : null) }}
        onUnhover={() => setHi(null)}
        onSelected={(e: unknown) => {
          const x = (e as { range?: { x?: [string | number, string | number] } } | undefined)?.range?.x
          if (!x) return
          const y0 = new Date(x[0]).getUTCFullYear()
          const y1 = new Date(x[1]).getUTCFullYear()
          onRange(Math.min(y0, y1), Math.max(y0, y1))
        }}
      />
    </div>
  )
}
