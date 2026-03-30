/** Formatting utilities */

export function fmtCurrency(value, compact = false) {
  if (value === null || value === undefined) return '—';
  if (compact) {
    if (Math.abs(value) >= 1e7) return `₹${(value / 1e7).toFixed(1)}Cr`;
    if (Math.abs(value) >= 1e5) return `₹${(value / 1e5).toFixed(1)}L`;
    if (Math.abs(value) >= 1e3) return `₹${(value / 1e3).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value);
}

export function fmtNumber(value, compact = false) {
  if (value === null || value === undefined) return '—';
  if (compact) {
    if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return String(Math.round(value));
  }
  return new Intl.NumberFormat('en-IN').format(Math.round(value));
}

export function fmtPercent(value, decimals = 1) {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(decimals)}%`;
}

export function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function monthLabel(yyyymm) {
  if (!yyyymm) return '';
  const [y, m] = yyyymm.split('-');
  const d = new Date(+y, +m - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}

export function percentChange(current, prev) {
  if (!prev || prev === 0) return null;
  return ((current - prev) / prev) * 100;
}

/** Chart color palette */
export const COLORS = [
  '#4f46e5', // Indigo
  '#0ea5e9', // Light Blue
  '#10b981', // Emerald Green
  '#f59e0b', // Amber/Yellow
  '#f43f5e', // Rose/Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
];

export const CHART_COMMON = {
  cartesianGrid: { stroke: 'rgba(255,255,255,0.05)', strokeDasharray: '3 3' },
  axis: { tick: { fill: '#475569', fontSize: 11 }, axisLine: false, tickLine: false },
};
