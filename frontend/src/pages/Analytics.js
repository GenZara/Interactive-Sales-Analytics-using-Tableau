/**
 * Sales Analytics Page — deep-dive charts + data table.
 */
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useFilters } from '../context/FilterContext';
import FilterBar from '../components/FilterBar';
import SalesTrendChart from '../components/charts/SalesTrendChart';
import CategoryChart from '../components/charts/CategoryChart';
import DiscountProfitChart from '../components/charts/DiscountProfitChart';
import WhatIfAnalysis from '../components/charts/WhatIfAnalysis';
import DataTable from '../components/DataTable';
import { fmtCurrency, COLORS } from '../utils/format';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from 'recharts';

function RegionRadar({ filters }) {
  const [chartData, setChartData] = useState([]);
  const [rawRegions, setRawRegions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getRegion(filters)
      .then(r => {
        const regions = r.data.regions;
        setRawRegions(regions);
        const maxSales = Math.max(...regions.map(x => x.sales), 1);
        const orderMap = { 'North': 0, 'East': 1, 'South': 2, 'West': 3 };
        const sorted = [...regions].sort((a, b) => (orderMap[a.name] ?? 9) - (orderMap[b.name] ?? 9));
        const directionMap = { 'North': 'N', 'South': 'S', 'East': 'E', 'West': 'W' };
        setChartData(sorted.map(region => ({
          region:  directionMap[region.name] || region.name,
          fullName: region.name,
          revenue: Math.round((region.sales / maxSales) * 100),
          orders:  region.orders,
          margin:  region.margin,
        })));
        setLoading(false);
      }).catch(() => setLoading(false));
  }, [filters]);

  if (loading) return <div className="skeleton" style={{ height: 240 }} />;

  const totalRegionSales = rawRegions.reduce((s, r) => s + r.sales, 0);

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', minHeight: 280 }}>
      {/* Compass */}
      <div style={{ flex: '1 1 55%', minWidth: 0 }}>
        <div className="radar-container" style={{ perspective: 1000 }}>
          <ResponsiveContainer width="100%" height={260} className="radar-compass">
            <RadarChart data={chartData} startAngle={90} endAngle={-270}>
              <defs>
                <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS[1]} stopOpacity={0.2}/>
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <PolarGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3"/>
              <PolarAngleAxis dataKey="region" tick={{ fill: '#cbd5e1', fontSize: 16, fontWeight: 800 }} />
              <PolarRadiusAxis tick={false} axisLine={false} />
              <Radar
                name="Revenue (relative %)"
                dataKey="revenue"
                stroke={COLORS[0]}
                strokeWidth={3}
                fill="url(#radarFill)"
                fillOpacity={0.6}
                style={{ filter: 'url(#glow)' }}
              />
              <Tooltip
                formatter={(v, n, props) => [`${v}%`, props.payload.fullName + ' Revenue Score']}
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-hover)' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Region Stats Sidebar */}
      <div style={{ flex: '1 1 45%', display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Region Breakdown</div>
        {[...rawRegions].sort((a, b) => b.sales - a.sales).map((r, i) => {
          const pct = totalRegionSales ? Math.round((r.sales / totalRegionSales) * 100) : 0;
          const rankColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];
          return (
            <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 10, borderLeft: `4px solid ${rankColors[i] || '#64748b'}` }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, background: rankColors[i] + '20', color: rankColors[i] }}>#{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.orders} orders · {r.margin}% margin</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{fmtCurrency(r.sales, true)}</div>
                <div style={{ fontSize: 11, color: r.profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmtCurrency(r.profit, true)} profit</div>
              </div>
              <div style={{ width: 40, textAlign: 'right', fontSize: 12, fontWeight: 700, color: rankColors[i] }}>{pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LossAnalysisPanel({ filters }) {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getInsights(filters)
      .then(r => {
        setAnomalies(r.data.anomalies || []);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, [filters]);

  if (loading) return <div className="skeleton" style={{ height: 260 }} />;
  if (!anomalies.length) return <div style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No significant losses detected.</div>;

  return (
    <div style={{ height: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {anomalies.slice(0, 5).map(a => (
        <div key={a.orderId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239, 68, 68, 0.05)', padding: '10px 14px', borderRadius: 8, borderLeft: '3px solid var(--danger)', fontSize: 13, flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
            <div className="truncate" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{a.productName}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>ORD: {a.orderId} · {a.discount}% DISC</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontWeight: 800, color: 'var(--danger)' }}>{fmtCurrency(a.profit)}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Loss</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const { effectiveFilters } = useFilters();

  return (
    <div className="page-content">
      <FilterBar />

      {/* Top row: Trend + Discount impact */}
      <div className="chart-grid chart-grid-2" style={{ marginBottom: 20 }}>
        <SalesTrendChart />
        <DiscountProfitChart />
      </div>

      {/* Mid row: Category + WhatIf Scenario */}
      <div className="chart-grid chart-grid-2" style={{ marginBottom: 20 }}>
        <CategoryChart />
        <WhatIfAnalysis />
      </div>

      {/* Region Radar & Loss Analysis */}
      <div className="chart-grid chart-grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Region Radar — Relative Revenue Score</div>
              <div className="card-subtitle">Higher percentage = stronger performer relative to best region</div>
            </div>
          </div>
          <div className="card-body" style={{ paddingTop: 0 }}>
            <RegionRadar filters={effectiveFilters} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Deep Loss Analysis</div>
              <div className="card-subtitle">Top anomaly orders dragging down margin severely.</div>
            </div>
          </div>
          <div className="card-body" style={{ paddingTop: 0 }}>
            <LossAnalysisPanel filters={effectiveFilters} />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="section-title">Transaction Records</div>
      <DataTable />
    </div>
  );
}
