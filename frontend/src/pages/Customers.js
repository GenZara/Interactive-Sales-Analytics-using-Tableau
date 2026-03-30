/**
 * Customer Insights Page — segment behaviour, top cities, anomalies.
 */
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useFilters } from '../context/FilterContext';
import FilterBar from '../components/FilterBar';
import SegmentChart from '../components/charts/SegmentChart';
import PaymentChart from '../components/charts/PaymentChart';
import { fmtCurrency, fmtNumber, fmtPercent, COLORS } from '../utils/format';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

function TopCitiesChart({ filters }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getRegion(filters)
      .then(r => { setData(r.data.cities); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filters]);

  if (loading) return <div className="skeleton" style={{ height: 300 }} />;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickFormatter={v => fmtCurrency(v, true)}
          tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" width={90}
          tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(v, n) => [fmtCurrency(v, true), 'Revenue']}
          contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }}
        />
        <Bar dataKey="sales" radius={[0, 5, 5, 0]}>
          {data.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function AnomalyTable({ filters }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getInsights(filters)
      .then(r => { setData(r.data.anomalies || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filters]);

  if (loading) return <div className="skeleton" style={{ height: 180 }} />;
  if (!data.length) return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No anomalies in selected period.</p>;

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {['Order ID','Date','Customer','Category'].map(h => <th key={h} style={{ textAlign: 'left' }}>{h}</th>)}
            {['Revenue','Discount %','Profit'].map(h => <th key={h} style={{ textAlign: 'right' }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map(r => (
            <tr key={r.orderId}>
              <td><span className="font-mono text-xs">{r.orderId}</span></td>
              <td>{r.orderDate}</td>
              <td className="truncate" style={{ maxWidth: 140 }}>{r.customerName}</td>
              <td>{r.productCategory}</td>
              <td style={{ textAlign: 'right' }}>{fmtCurrency(r.salesAmount)}</td>
              <td style={{ textAlign: 'right' }}>
                <span className="badge badge-amber">{r.discount}%</span>
              </td>
              <td style={{ textAlign: 'right' }}>
                <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
                  {fmtCurrency(r.profit)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Customers() {
  const { effectiveFilters } = useFilters();

  return (
    <div className="page-content">
      <FilterBar />

      {/* Segment + Payment */}
      <div className="chart-grid chart-grid-2" style={{ marginBottom: 20 }}>
        <SegmentChart />
        <PaymentChart />
      </div>

      {/* Top Cities */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">Top 10 Cities by Revenue</div>
        </div>
        <div className="card-body" style={{ paddingTop: 0 }}>
          <TopCitiesChart filters={effectiveFilters} />
        </div>
      </div>

      {/* Anomalies */}
      <div className="section-title">Loss-Making Orders (Anomalies)</div>
      <AnomalyTable filters={effectiveFilters} />
    </div>
  );
}
