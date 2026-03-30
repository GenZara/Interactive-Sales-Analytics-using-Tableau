/**
 * DiscountProfitChart — scatter + bar showing discount-profit correlation.
 */
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { api } from '../../services/api';
import { useFilters } from '../../context/FilterContext';
import { fmtCurrency, COLORS } from '../../utils/format';

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 14px', boxShadow: 'var(--shadow-hover)',
    }}>
      <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Discount {d.label}</p>
      <p style={{ fontSize: 12, color: d.avgProfit < 0 ? '#ef4444' : '#10b981' }}>
        Avg Profit: {fmtCurrency(d.avgProfit)}
      </p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Orders: {d.count}</p>
    </div>
  );
};

export default function DiscountProfitChart() {
  const { effectiveFilters } = useFilters();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getInsights(effectiveFilters)
      .then(r => { setData(r.data.discountImpact || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [effectiveFilters]);

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <div>
          <div className="card-title">Discount Impact on Profit</div>
          <div className="card-subtitle">Higher discount → lower average profit</div>
        </div>
      </div>
      <div className="card-body" style={{ paddingTop: 8 }}>
        {loading ? <div className="skeleton" style={{ height: 220 }} /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ left: 0, right: 8 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => fmtCurrency(v, true)} tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
              <Bar dataKey="avgProfit" radius={[5, 5, 0, 0]}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.avgProfit < 0 ? '#ef4444' : COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
