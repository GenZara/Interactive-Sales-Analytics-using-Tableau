import React from 'react';
import {
  MdTrendingUp, MdTrendingDown, MdTrendingFlat,
  MdAttachMoney, MdShoppingCart, MdBarChart, MdInventory,
} from 'react-icons/md';
import { fmtCurrency, fmtNumber, fmtPercent, percentChange } from '../utils/format';

const ICON_MAP = {
  revenue: MdAttachMoney,
  profit:  MdBarChart,
  orders:  MdShoppingCart,
  qty:     MdInventory,
};

const COLOR_MAP = {
  revenue: 'violet',
  profit:  'green',
  orders:  'blue',
  qty:     'amber',
  margin:  'green',
};

export function KpiCard({ type = 'revenue', label, value, prev, format = 'currency', color, target }) {
  const Icon    = ICON_MAP[type] || MdAttachMoney;
  const cls     = color || COLOR_MAP[type] || 'violet';
  const pct     = prev != null ? percentChange(value, prev) : null;
  const display = format === 'currency'
    ? fmtCurrency(value, true)
    : format === 'percent'
    ? fmtPercent(value)
    : fmtNumber(value, true);

  return (
    <div className={`kpi-card ${cls}`}>
      <div className="kpi-icon-wrap"><Icon size={20} /></div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{display}</div>
      {pct !== null && (
        <div className="kpi-meta">
          {pct > 0
            ? <span className="kpi-change up"><MdTrendingUp size={14} /> {fmtPercent(pct)} vs prev</span>
            : pct < 0
            ? <span className="kpi-change down"><MdTrendingDown size={14} /> {fmtPercent(Math.abs(pct))} vs prev</span>
            : <span className="kpi-change" style={{ color: 'var(--text-muted)' }}><MdTrendingFlat size={14} /> No change</span>
          }
        </div>
      )}
      {target && (
        <div style={{ marginTop: 12 }}>
          <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Target: {format === 'currency' ? fmtCurrency(target, true) : fmtNumber(target, true)}</span>
            <span style={{ color: (value >= target) ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>
              {Math.min(100, Math.round((value / (target||1)) * 100))}%
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min(100, (value / (target||1)) * 100)}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

export function KpiSkeleton() {
  return (
    <div className="kpi-grid">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="kpi-card" style={{ minHeight: 110 }}>
          <div className="skeleton skeleton-text" style={{ width: '50%' }} />
          <div className="skeleton skeleton-text" style={{ width: '70%', height: 28 }} />
          <div className="skeleton skeleton-text" style={{ width: '40%' }} />
        </div>
      ))}
    </div>
  );
}
