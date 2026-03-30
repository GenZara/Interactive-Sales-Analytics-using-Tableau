/**
 * SalesTrendChart — line chart with drill-down (Year → Month → Day).
 * Click a data point to drill down into daily view.
 */
import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import { api } from '../../services/api';
import { useFilters } from '../../context/FilterContext';
import { fmtCurrency, monthLabel, COLORS } from '../../utils/format';
import { MdChevronRight, MdArrowBack } from 'react-icons/md';

// Custom tooltip
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 14px', boxShadow: 'var(--shadow-hover)',
    }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
      {payload.map(p => {
        if (p.value == null) return null;
        const pName = p.name === 'predictedSales' ? 'AI Predicted Sales' : p.name === 'sales' ? 'Revenue' : 'Profit';
        return (
        <p key={p.dataKey} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>
          {pName}: {fmtCurrency(p.value, true)}
        </p>
      )})}
    </div>
  );
};

export default function SalesTrendChart() {
  const { effectiveFilters } = useFilters();
  const [data,       setData]       = useState({ monthly: [], daily: [] });
  const [loading,    setLoading]    = useState(true);
  const [drillMonth, setDrillMonth] = useState(null); // "YYYY-MM"

  useEffect(() => {
    setLoading(true);
    api.getTrends(effectiveFilters, drillMonth)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [effectiveFilters, drillMonth]);

  let chartData = [];
  if (drillMonth) {
    chartData = data.daily.map(d => ({ ...d, name: d.date.split('-')[2] + ' ' + monthLabel(drillMonth) }));
  } else if (data.monthly) {
    data.monthly.forEach((m, i) => {
      let ret = { name: monthLabel(m.month), rawMonth: m.month };
      if (m.isPrediction) {
         ret.predictedSales = m.sales;
      } else {
         ret.sales = m.sales;
         if (data.monthly[i+1]?.isPrediction) {
           ret.predictedSales = m.sales; // Connect line without gap
         }
      }
      ret.profit = m.profit;
      chartData.push(ret);
    });
  }

  const handleClick = (payload) => {
    if (!drillMonth && payload?.activePayload?.[0]?.payload?.rawMonth) {
      setDrillMonth(payload.activePayload[0].payload.rawMonth);
    }
  };

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <div>
          {/* Breadcrumb */}
          <div className="breadcrumb" style={{ marginBottom: 0 }}>
            <span
              className="breadcrumb-item"
              onClick={() => setDrillMonth(null)}
              style={{ fontWeight: drillMonth ? 600 : 700, fontSize: 14 }}
            >
              Sales Trend
            </span>
            {drillMonth && (
              <>
                <MdChevronRight className="breadcrumb-sep" size={16} />
                <span className="breadcrumb-current">{monthLabel(drillMonth)} — Daily</span>
              </>
            )}
          </div>
          <p className="card-subtitle">
            {drillMonth ? 'Click another month to compare' : 'Click a point to drill into days'}
          </p>
        </div>
        {drillMonth && (
          <button className="btn btn-ghost" onClick={() => setDrillMonth(null)}>
            <MdArrowBack size={14} /> Back
          </button>
        )}
      </div>

      <div className="card-body" style={{ paddingTop: 8 }}>
        {loading ? (
          <div className="skeleton" style={{ height: 260 }} />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} onClick={handleClick}
              style={{ cursor: drillMonth ? 'default' : 'pointer' }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={COLORS[0]} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={COLORS[1]} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={COLORS[1]} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => fmtCurrency(v, true)} tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8}
                formatter={v => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{v === 'sales' ? 'Revenue' : v === 'predictedSales' ? 'AI Prediction' : 'Profit'}</span>} />
              <Area type="monotone" dataKey="sales"  stroke={COLORS[0]} fill="url(#salesGrad)"  strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} name="sales" />
              <Area type="monotone" dataKey="predictedSales" stroke={COLORS[0]} strokeDasharray="5 5" fill="transparent" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} name="predictedSales" />
              <Area type="monotone" dataKey="profit" stroke={COLORS[1]} fill="url(#profitGrad)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} name="profit" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
