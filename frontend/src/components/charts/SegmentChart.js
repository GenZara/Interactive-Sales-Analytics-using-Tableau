/**
 * SegmentChart — stacked bar chart for customer segment comparison.
 */
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
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
      borderRadius: 10, padding: '10px 14px',
    }}>
      <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{d.name}</p>
      <p style={{ fontSize: 12, color: COLORS[0] }}>Revenue: {fmtCurrency(d.sales, true)}</p>
      <p style={{ fontSize: 12, color: COLORS[1] }}>Profit: {fmtCurrency(d.profit, true)}</p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Orders: {d.orders}</p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Margin: {d.margin}%</p>
    </div>
  );
};

export default function SegmentChart() {
  const { effectiveFilters, crossFilter, applyCrossFilter } = useFilters();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getSegment(effectiveFilters)
      .then(r => { setData(r.data.segments); setLoading(false); })
      .catch(() => setLoading(false));
  }, [effectiveFilters]);

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <div>
          <div className="card-title">Segment Comparison</div>
          <div className="card-subtitle">Revenue & Profit by customer segment</div>
        </div>
      </div>
      <div className="card-body" style={{ paddingTop: 8 }}>
        {loading ? <div className="skeleton" style={{ height: 220 }} /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} onClick={({ activePayload }) => {
              if (activePayload?.[0]?.payload?.name)
                applyCrossFilter('segment', activePayload[0].payload.name);
            }} style={{ cursor: 'pointer' }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => fmtCurrency(v, true)} tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
              <Legend iconType="circle" iconSize={8}
                formatter={v => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{v === 'sales' ? 'Revenue' : 'Profit'}</span>} />
              <Bar dataKey="sales"  name="sales"  fill={COLORS[0]} radius={[4,4,0,0]} />
              <Bar dataKey="profit" name="profit" fill={COLORS[1]} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
