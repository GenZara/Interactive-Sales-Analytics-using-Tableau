/**
 * Dashboard Overview Page
 */
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useFilters } from '../context/FilterContext';
import { KpiCard, KpiSkeleton } from '../components/KpiCards';
import FilterBar from '../components/FilterBar';
import SalesTrendChart from '../components/charts/SalesTrendChart';
import RegionChart from '../components/charts/RegionChart';
import InsightsPanel from '../components/InsightsPanel';
import { fmtCurrency, fmtPercent } from '../utils/format';

export default function Overview() {
  const { effectiveFilters } = useFilters();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getSummary(effectiveFilters)
      .then(r => { setSummary(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [effectiveFilters]);

  const prev = summary?.previousPeriod;

  return (
    <div className="page-content">
      <FilterBar />

      {/* KPI Row */}
      {loading || !summary ? <KpiSkeleton /> : (
        <div className="kpi-grid">
          <KpiCard type="revenue" color="violet" label="Total Revenue"
            value={summary.totalSales}  prev={prev?.sales}  format="currency" target={summary.targets?.totalSales} />
          <KpiCard type="profit"  color="green"  label="Total Profit"
            value={summary.totalProfit} prev={prev?.profit} format="currency" />
          <KpiCard type="orders"  color="blue"   label="Total Orders"
            value={summary.totalOrders} prev={prev?.orders} format="number" target={summary.targets?.totalOrders} />
          <KpiCard type="qty"     color="amber"  label="Units Sold"
            value={summary.totalQuantity} format="number" />
          <KpiCard type="profit"  color="green"  label="Profit Margin"
            value={summary.profitMargin}  format="percent" />
        </div>
      )}

      {/* Trend + Region */}
      <div className="chart-grid chart-grid-2-1" style={{ marginBottom: 20 }}>
        <SalesTrendChart />
        <RegionChart />
      </div>

      {/* Insights */}
      <div className="section-title">Key Insights</div>
      <InsightsPanel />
    </div>
  );
}
