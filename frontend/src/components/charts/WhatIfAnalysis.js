/**
 * What-If Analysis (Scenario Simulator)
 * Allows users to simulate how changing discounts impacts revenue & profit.
 */
import React, { useState, useMemo } from 'react';
import { api } from '../../services/api';
import { useFilters } from '../../context/FilterContext';
import { fmtCurrency } from '../../utils/format';

export default function WhatIfAnalysis() {
  const { effectiveFilters } = useFilters();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discountShift, setDiscountShift] = useState(0); // -20 to +20 % shift

  React.useEffect(() => {
    setLoading(true);
    // Featch raw sales for calculation (or sum them in memory)
    api.getSales(effectiveFilters, 1, 200).then(r => {
      setData(r.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [effectiveFilters]);

  // Simulate
  const stats = useMemo(() => {
    let oldRev = 0, oldProfit = 0;
    let newRev = 0, newProfit = 0;
    
    data.forEach(d => {
      oldRev += d.salesAmount;
      oldProfit += d.profit;
      
      // Simulation: 
      // Higher discount = lower price, maybe higher volume?
      // simple linear model: 1% discount increase = 1.5% volume increase
      const priceShiftPct = -discountShift / 100; // -0.05 if +5% discount
      const volumeShiftPct = (discountShift > 0) ? (discountShift * 0.015) : (discountShift * 0.01);
      
      const pSales = (d.salesAmount * (1 + priceShiftPct)) * (1 + volumeShiftPct);
      // Cost of goods = sales - profit. Cost doesn't drop with discount.
      const cost = d.salesAmount - d.profit;
      const pProfit = pSales - cost;
      
      newRev += pSales;
      newProfit += pProfit;
    });

    return { oldRev, oldProfit, newRev, newProfit };
  }, [data, discountShift]);

  if (loading) return <div className="card"><div className="skeleton" style={{ height: '100%' }} /></div>;

  const revDiff = stats.newRev - stats.oldRev;
  const profDiff = stats.newProfit - stats.oldProfit;

  return (
    <div className="card" style={{ height: '100%', background: 'linear-gradient(145deg, var(--bg-card), rgba(99, 102, 241, 0.05))' }}>
      <div className="card-header">
        <div>
          <div className="card-title">What-If Analysis (Simulator)</div>
          <div className="card-subtitle">Predict how changing discounts impacts your Revenue & Profit. (Assumes 1% discount drives 1.5% more volume)</div>
        </div>
      </div>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div>
          <label style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>Adjust System Discount By:</span>
            <span style={{ fontWeight: 700, color: discountShift > 0 ? 'var(--danger)' : discountShift < 0 ? 'var(--success)' : 'var(--text-primary)' }}>
              {discountShift > 0 ? `+${discountShift}% (More Discount)` : discountShift < 0 ? `${discountShift}% (Less Discount)` : 'No Change'}
            </span>
          </label>
          <input 
            type="range" 
            min="-20" max="20" step="1" 
            value={discountShift} 
            onChange={e => setDiscountShift(Number(e.target.value))}
            style={{ width: '100%', cursor: 'ew-resize' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            <span>-20% (Reduce Discounts)</span>
            <span>+20% (Increase Discounts)</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Revenue (Current → Predicted)</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Now: {fmtCurrency(stats.oldRev, true)}</div>
            <div style={{ fontSize: 20, fontWeight: 700, margin: '4px 0', color: 'var(--text-primary)' }}>
              {fmtCurrency(stats.newRev)}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: revDiff >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {revDiff >= 0 ? '↑' : '↓'} {fmtCurrency(Math.abs(revDiff), true)} ({stats.oldRev ? Math.abs((revDiff/stats.oldRev)*100).toFixed(1) : 0}%)
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Profit (Current → Predicted)</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Now: {fmtCurrency(stats.oldProfit, true)}</div>
            <div style={{ fontSize: 20, fontWeight: 700, margin: '4px 0', color: 'var(--text-primary)' }}>
              {fmtCurrency(stats.newProfit)}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: profDiff >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {profDiff >= 0 ? '↑' : '↓'} {fmtCurrency(Math.abs(profDiff), true)} ({stats.oldProfit ? Math.abs((profDiff/stats.oldProfit)*100).toFixed(1) : 0}%)
            </div>
          </div>
        </div>

        <div style={{ marginTop: 'auto', padding: 12, background: 'rgba(99, 102, 241, 0.1)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
           <strong>How it works:</strong> {
             discountShift > 0 
              ? ` +${discountShift}% discount → Volume up ~${(discountShift * 1.5).toFixed(0)}%, but margin shrinks. Net profit impact: ${profDiff >= 0 ? '+' : ''}${fmtCurrency(profDiff, true)}.`
              : discountShift < 0 
              ? ` -${Math.abs(discountShift)}% discount → Volume drops ~${(Math.abs(discountShift) * 1.0).toFixed(0)}%, but margin improves. Net profit impact: +${fmtCurrency(profDiff, true)}.`
              : ` Drag the slider left (reduce discounts) or right (increase discounts) to simulate the impact on your revenue and profit.`
           }
        </div>
      </div>
    </div>
  );
}
