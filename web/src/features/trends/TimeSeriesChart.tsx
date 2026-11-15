import Plotly from 'plotly.js-basic-dist-min'
import createPlotlyComponent from 'react-plotly.js/factory'
import { useTranslation } from 'react-i18next'
import type { SeriesResponse } from '../../core/api'
import { VARIABLES, type VariableId } from '../../core/variables'

const Plot = createPlotlyComponent(Plotly)

export default function TimeSeriesChart({ variable, data }: { variable: VariableId; data: SeriesResponse }) {
  const { t } = useTranslation()
  const accent = VARIABLES[variable].accent
  const ink = '#F4ECF7'
  const muted = '#C4B2CF'
  const traces: Plotly.Data[] = []
  if (data.fit) {
    traces.push(
      { x: data.dates, y: data.fit.ci_high, type: 'scatter', mode: 'lines', line: { width: 0 }, hoverinfo: 'skip', showlegend: false },
      { x: data.dates, y: data.fit.ci_low, type: 'scatter', mode: 'lines', line: { width: 0 }, fill: 'tonexty', fillcolor: 'rgba(244,236,247,0.12)', name: t('explorer.legendCI'), hoverinfo: 'skip' },
    )
  }
  traces.push({ x: data.dates, y: data.values, type: 'scatter', mode: 'lines', name: t('explorer.legendSeries'), line: { color: accent, width: 1.8 }, hovertemplate: `%{x|%b %Y}: %{y:.2f} ${data.unit}<extra></extra>` })
  if (data.fit) traces.push({ x: data.dates, y: data.fit.trend, type: 'scatter', mode: 'lines', name: t('explorer.legendTrend'), line: { color: ink, width: 1.5, dash: 'dash' }, hoverinfo: 'skip' })

  return (
    <div role="img" aria-label={t('explorer.chartAlt', { name: t(`vars.${variable}.name`) })}>
      <Plot
        data={traces}
        layout={{
          autosize: true, height: 260, margin: { l: 48, r: 12, t: 8, b: 56 },
          paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
          font: { family: 'Inter, sans-serif', size: 12, color: muted },
          xaxis: { gridcolor: '#2F1740', zerolinecolor: '#612073', tickfont: { color: muted } },
          yaxis: { gridcolor: '#2F1740', zerolinecolor: '#612073', title: { text: data.deseasonalized ? `Δ ${data.unit}` : data.unit, font: { size: 11 } }, tickfont: { color: muted } },
          legend: { orientation: 'h', y: -0.25, font: { color: muted } },
          hoverlabel: { bgcolor: '#2F1740', font: { color: ink } },
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }} useResizeHandler
      />
    </div>
  )
}
