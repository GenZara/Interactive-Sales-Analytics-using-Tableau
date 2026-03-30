/**
 * PaymentChart — radial / pie chart for payment mode distribution.
 */
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../../services/api';
import { useFilters } from '../../context/FilterContext';
import { fmtCurrency, fmtPercent, COLORS } from '../../utils/format';

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 14px',
    }}>
      <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{d.name}</p>
      <p style={{ fontSize: 12, color: COLORS[0] }}>Sales: {fmtCurrency(d.sales, true)}</p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Orders: {d.orders}</p>
    </div>
  );
};

export default function PaymentChart() {
  const { effectiveFilters } = useFilters();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getInsights(effectiveFilters)
      .then(r => { setData(r.data.paymentDistribution || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [effectiveFilters]);

  const total = data.reduce((s, d) => s + d.orders, 0);

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <div className="card-title">Payment Modes</div>
      </div>
      <div className="card-body" style={{ paddingTop: 0 }}>
        {loading ? <div className="skeleton" style={{ height: 200 }} /> : (
          <>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={data} dataKey="orders" nameKey="name"
                  cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4}>
                  {data.map((e, i) => (
                    <Cell key={e.name} fill={COLORS[i % COLORS.length]} stroke="var(--bg-card)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {data.map((d, i) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>{d.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{fmtPercent((d.orders / total) * 100, 0)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
