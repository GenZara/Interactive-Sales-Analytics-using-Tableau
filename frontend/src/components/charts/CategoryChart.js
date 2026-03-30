/**
 * CategoryChart — horizontal bar chart.
 * Clicking a bar sets a cross-filter for category.
 */
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { api } from '../../services/api';
import { useFilters } from '../../context/FilterContext';
import { fmtCurrency, COLORS } from '../../utils/format';

const ChartTooltip = ({ active, payload, metric }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 14px', boxShadow: 'var(--shadow-hover)',
    }}>
      <p style={{ fontWeight: 700, marginBottom: 6, fontSize: 13 }}>{d.name}</p>
      {metric === 'sales' && <p style={{ color: COLORS[0], fontSize: 12 }}>Revenue: {fmtCurrency(d.sales, true)}</p>}
      {metric === 'profit' && <p style={{ color: COLORS[1], fontSize: 12 }}>Profit: {fmtCurrency(d.profit, true)}</p>}
      {metric === 'orders' && <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Orders: {d.orders}</p>}
    </div>
  );
};

export default function CategoryChart() {
  const { effectiveFilters, crossFilter, applyCrossFilter } = useFilters();
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [metric,  setMetric]  = useState('sales'); // sales | profit | orders

  useEffect(() => {
    setLoading(true);
    api.getCategory(effectiveFilters)
      .then(r => { setData(r.data.categories); setLoading(false); })
      .catch(() => setLoading(false));
  }, [effectiveFilters]);

  const handleClick = ({ name }) => applyCrossFilter('category', name);

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <div>
          <div className="card-title">Category Performance</div>
          <div className="card-subtitle">Click a bar to cross-filter</div>
        </div>
        <select value={metric} onChange={e => setMetric(e.target.value)} style={{ width: 100 }}>
          <option value="sales">Revenue</option>
          <option value="profit">Profit</option>
          <option value="orders">Orders</option>
        </select>
      </div>

      <div className="card-body" style={{ paddingTop: 8 }}>
        {loading ? <div className="skeleton" style={{ height: 280 }} /> : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} layout="vertical" onClick={handleClick}
              style={{ cursor: 'pointer' }}
              margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={v => metric === 'orders' ? v : fmtCurrency(v, true)}
                domain={[0, 'auto']} allowDataOverflow
                tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={110}
                tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip metric={metric} />} cursor={false} />
              <Bar dataKey={metric} radius={[0, 5, 5, 0]}>
                {data.map((entry, i) => {
                  const isActive = crossFilter?.type === 'category' && crossFilter?.value === entry.name;
                  return (
                    <Cell
                      key={entry.name}
                      fill={isActive ? '#fff' : COLORS[i % COLORS.length]}
                      opacity={crossFilter && !isActive ? 0.35 : 1}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
