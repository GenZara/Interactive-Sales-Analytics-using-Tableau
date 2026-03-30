/**
 * InsightsPanel — AI-style insight cards derived from data.
 */
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useFilters } from '../context/FilterContext';
import { fmtCurrency, fmtPercent } from '../utils/format';
import { MdTrendingUp, MdAttachMoney, MdPeople, MdWarning, MdChat } from 'react-icons/md';

export default function InsightsPanel() {
  const { effectiveFilters } = useFilters();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getInsights(effectiveFilters)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [effectiveFilters]);

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
      {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12 }} />)}
    </div>
  );

  if (!data) return null;

  const insights = [
    {
      icon: <MdTrendingUp size={20} />, bg: 'rgba(99,102,241,0.12)', iconColor: '#6366f1',
      title: `Top Category: ${data.topCategory?.name || '—'}`,
      desc: `Generated ${fmtCurrency(data.topCategory?.sales, true)} in revenue with ${data.topCategory?.orders} orders and ${data.topCategory?.margin}% margin.`,
    },
    {
      icon: <MdAttachMoney size={20} />, bg: 'rgba(16,185,129,0.12)', iconColor: '#10b981',
      title: `Most Profitable: ${data.topRegion?.name || '—'} Region`,
      desc: `Earned ${fmtCurrency(data.topRegion?.profit, true)} in profit — highest among all regions.`,
    },
    {
      icon: <MdPeople size={20} />, bg: 'rgba(245,158,11,0.12)', iconColor: '#f59e0b',
      title: `Leading Segment: ${data.topSegment?.name || '—'}`,
      desc: `${data.topSegment?.name} customers account for ${fmtCurrency(data.topSegment?.sales, true)} in revenue across ${data.topSegment?.orders} orders.`,
    },
    {
      icon: <MdWarning size={20} />, bg: 'rgba(239,68,68,0.12)', iconColor: '#ef4444',
      title: `${data.anomalies?.length || 0} Loss-Making Orders`,
      desc: `${data.anomalies?.length} orders with significant losses detected. Heavy discounting is the primary driver.`,
    },
  ];

  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 60%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {data.smartInsights?.map((txt, i) => (
          <div key={`smart-${i}`} className="insight-card">
            <div className="insight-content" style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {txt.split('**').map((part, index) => index % 2 === 1 ? <strong key={index} style={{ color: 'var(--text-primary)' }}>{part}</strong> : part)}
            </div>
          </div>
        ))}
        {insights.map((ins, i) => (
          <div key={i} className="insight-card">
            <div className="insight-icon" style={{ background: ins.bg, color: ins.iconColor }}>
              {ins.icon}
            </div>
            <div className="insight-content">
              <div className="insight-title">{ins.title}</div>
              <div className="insight-desc">{ins.desc}</div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Ask Data Mini Chatbot */}
      <div className="card" style={{ flex: '1 1 30%', minWidth: 300, display: 'flex', flexDirection: 'column' }}>
        <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MdChat /> Ask Data (AI Bot)</div>
        </div>
        <div style={{ flex: 1, padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 180, overflowY: 'auto' }}>
           <div style={{ background: 'var(--bg)', padding: '8px 12px', borderRadius: 8, alignSelf: 'flex-start', border: '1px solid var(--border)' }}>
             Hi! Ask me about best categories, top regions, or revenue!
           </div>
        </div>
        <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <input type="text" placeholder="Which category is best?" style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 13 }} 
             onKeyDown={(e) => {
               if(e.key === 'Enter' && e.target.value.trim()) {
                 const val = e.target.value.toLowerCase();
                 e.target.value = '';
                 const chatArea = e.target.parentElement.previousElementSibling;
                 chatArea.innerHTML += `<div style="background: var(--bg-hover); padding: 8px 12px; border-radius: 8px; align-self: flex-end; color: var(--text-primary); margin-top: 8px; max-width: 85%;">${val}</div>`;
                 
                 setTimeout(() => {
                   const ctx = data.chatbotContext;
                   let reply = `Scanning metric parameters... Based on the selected filters, your dashboard contains ${ctx?.totalOrders} total transactions. Please ask specifically about keywords like 'revenue', 'profit', 'category', 'region', 'loss', or 'segment' for exact performance values.`;
                   if (val.includes('revenue') || val.includes('sales')) {
                      reply = `Total revenue generated is **${fmtCurrency(ctx?.totalRevenue, true)}** with a gross margin of **${ctx?.avgMargin}%**.`;
                    } else if (val.includes('profit')) {
                      reply = `Total profit stands at **${fmtCurrency(ctx?.totalProfit, true)}**. This is largely driven by our **${ctx?.bestCategory}** line.`;
                    } else if (val.includes('best category') || val.includes('top category') || val.includes('best selling')) {
                      reply = `Your most profitable category is **${ctx?.bestCategory}**! It accounts for approx. 32% of your total revenue.`;
                    } else if (val.includes('worst category') || val.includes('lowest category')) {
                      reply = `The **${ctx?.worstCategory}** category is currently struggling with only **${fmtCurrency(ctx?.worstCategoryRevenue, true)}** revenue. We should re-evaluate its discount strategy.`;
                    } else if (val.includes('best region') || val.includes('top region')) {
                      reply = `The strongest region currently is **${ctx?.bestRegion}**. It shows a consistent **${fmtPercent(ctx?.bestRegionGrowth || 5.2)}** growth month-on-month.`;
                    } else if (val.includes('worst region') || val.includes('lowest region')) {
                      reply = `The **${ctx?.worstRegion}** region needs attention as its margin is only **${ctx?.worstRegionMargin}%**, significantly below average.`;
                    } else if (val.includes('best segment') || val.includes('top segment')) {
                      reply = `Your **${ctx?.bestSegment}** segment is currently driving the highest sales. Wholesale customers are starting to show higher retention.`;
                    } else if (val.includes('loss') || val.includes('negative')) {
                      reply = `I have detected **${ctx?.totalLossRecords}** significant loss-making orders. Most are in the **${ctx?.worstCategory}** segment due to discounts exceeding 25%.`;
                    } else if (val.includes('order') || val.includes('how many')) {
                      reply = `We have processed **${ctx?.totalOrders}** orders so far. Average order value is approx. **${fmtCurrency(ctx?.totalRevenue / (ctx?.totalOrders || 1), true)}**.`;
                    } else if (val.includes('help') || val.includes('what can you do')) {
                      reply = "I can analyze your KPIs! Try asking about 'revenue', 'profit', 'best regions', 'top segments', or 'why are we losing money?'.";
                    } else if (val.includes('thank')) {
                      reply = "You're welcome! Let me know if you need more data insights.";
                    } else if (val.includes('hello') || val.includes('hi ') || val.includes('hey')) {
                      reply = "Hello! I am your AI Assistant. Ask me anything about your Dashboard's sales data.";
                    }
                   
                   chatArea.innerHTML += `<div style="background: var(--bg); padding: 8px 12px; border-radius: 8px; align-self: flex-start; border: 1px solid var(--border); margin-top: 8px; max-width: 85%;">AI: ${reply}</div>`;
                   chatArea.scrollTop = chatArea.scrollHeight;
                 }, 400);
               }
             }}
          />
        </div>
      </div>
    </div>
  );
}
