// Consistent chart theme (palette, soft grids, rounded bars). Only real data is ever plotted.
export const CHART = {
  teal: '#0f766e',
  navy: '#0b2545',
  cyan: '#14b8d8',
  grid: '#e2e9f2',
  axis: '#4a5b73',
  muted: '#8aa6cf',
  tooltip: { borderRadius: 12, border: '1px solid #e2e9f2', fontSize: 12 },
}
export const pct = (x: number, digits = 1) => `${(x * 100).toFixed(digits)}%`
