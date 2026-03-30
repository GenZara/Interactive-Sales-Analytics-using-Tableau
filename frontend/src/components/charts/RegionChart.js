/**
 * RegionChart — donut pie chart + top regions list.
 * Clicking a slice cross-filters by region.
 */
import React, { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { api } from '../../services/api';
import { useFilters } from '../../context/FilterContext';
import { fmtCurrency, fmtPercent, COLORS } from '../../utils/format';

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const rx = cx + (outerRadius + 20) * Math.cos(-midAngle * RADIAN);
  const ry = cy + (outerRadius + 20) * Math.sin(-midAngle * RADIAN);
  return (
    <text x={rx} y={ry} textAnchor={rx > cx ? 'start' : 'end'}
      fill="var(--text-secondary)" fontSize={11}>
      {fmtPercent(percent * 100, 0)}
    </text>
  );
};

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 14px', boxShadow: 'var(--shadow-hover)',
    }}>
      <p style={{ fontWeight: 700, marginBottom: 6, fontSize: 13 }}>{d.name}</p>
      <p style={{ color: COLORS[0], fontSize: 12 }}>Revenue: {fmtCurrency(d.sales, true)}</p>
      <p style={{ color: COLORS[1], fontSize: 12 }}>Profit: {fmtCurrency(d.profit, true)}</p>
      <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Orders: {d.orders}</p>
    </div>
  );
};

export default function RegionChart() {
  const { effectiveFilters, crossFilter, applyCrossFilter } = useFilters();
  const [data,    setData]    = useState({ regions: [], cities: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getRegion(effectiveFilters)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [effectiveFilters]);

  const total = data.regions.reduce((s, r) => s + r.sales, 0);

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <div>
          <div className="card-title">Region Distribution</div>
          <div className="card-subtitle">Click slice to cross-filter</div>
        </div>
      </div>

      <div className="card-body" style={{ paddingTop: 0 }}>
        {loading ? <div className="skeleton" style={{ height: 240 }} /> : (
          <>
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie
                  data={data.regions}
                  dataKey="sales"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  labelLine={false}
                  label={renderCustomLabel}
                  onClick={({ name }) => applyCrossFilter('region', name)}
                  style={{ cursor: 'pointer' }}
                >
                  {data.regions.map((entry, i) => {
                    const isActive = crossFilter?.type === 'region' && crossFilter?.value === entry.name;
                    return (
                      <Cell
                        key={entry.name}
                        fill={COLORS[i % COLORS.length]}
                        opacity={crossFilter && crossFilter.type === 'region' && !isActive ? 0.3 : 1}
                        stroke={isActive ? '#fff' : 'transparent'}
                        strokeWidth={isActive ? 2 : 0}
                      />
                    );
                  })}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Region list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.regions.map((r, i) => (
                <div key={r.name}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                  onClick={() => applyCrossFilter('region', r.name)}
                >
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                    background: COLORS[i % COLORS.length],
                  }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>{r.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {fmtCurrency(r.sales, true)}
                  </span>
                  <div className="progress-bar" style={{ width: 60 }}>
                    <div className="progress-fill"
                      style={{ width: `${(r.sales / total) * 100}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
