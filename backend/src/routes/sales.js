/**
 * Sales Routes
 * All endpoints consume filters via query params.
 *
 * Common query params (all optional):
 *   startDate, endDate, category, region, segment, paymentMode, city, search
 *
 * Pagination params for /sales:
 *   page (default 1), limit (default 50, max 200)
 *
 * Sort params for /sales:
 *   sortBy (field name), sortOrder (asc | desc)
 */
const express = require('express');
const router  = express.Router();
const {
  getData, applyFilters, sum, groupBy, monthlyTrend, topN,
} = require('../data/dataLayer');

// ─── Parse filters from request query ─────────────────────────────────────────
function parseFilters(query) {
  return {
    startDate:   query.startDate   || null,
    endDate:     query.endDate     || null,
    category:    query.category    || 'all',
    region:      query.region      || 'all',
    segment:     query.segment     || 'all',
    paymentMode: query.paymentMode || 'all',
    city:        query.city        || 'all',
    search:      query.search      || '',
  };
}

// ─── GET /sales — paginated list ──────────────────────────────────────────────
router.get('/', (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    let data = applyFilters(getData(), filters);

    // Sorting
    const { sortBy = 'orderDate', sortOrder = 'desc' } = req.query;
    const dir = sortOrder === 'asc' ? 1 : -1;
    data = [...data].sort((a, b) => {
      const va = a[sortBy], vb = b[sortBy];
      if (typeof va === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });

    // Pagination
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const total = data.length;
    const start = (page - 1) * limit;
    const items = data.slice(start, start + limit);

    res.json({
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) { next(e); }
});

// ─── GET /sales/summary ───────────────────────────────────────────────────────
router.get('/summary', (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    const data    = applyFilters(getData(), filters);

    const totalSales  = sum(data, 'salesAmount');
    const totalProfit = sum(data, 'profit');
    const totalOrders = data.length;
    const totalQty    = sum(data, 'quantity');
    const avgOrder    = totalOrders ? totalSales / totalOrders : 0;

    // Previous period comparison (same duration before startDate)
    let prevStats = null;
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end   = new Date(filters.endDate);
      const days  = (end - start) / (1000 * 60 * 60 * 24);
      const prevEnd   = new Date(start); prevEnd.setDate(prevEnd.getDate() - 1);
      const prevStart = new Date(prevEnd); prevStart.setDate(prevStart.getDate() - days);
      const prevData  = applyFilters(getData(), {
        ...filters,
        startDate: prevStart.toISOString().split('T')[0],
        endDate:   prevEnd.toISOString().split('T')[0],
      });
      prevStats = {
        sales:  sum(prevData, 'salesAmount'),
        profit: sum(prevData, 'profit'),
        orders: prevData.length,
      };
    }

    res.json({
      totalSales:   Math.round(totalSales * 100) / 100,
      totalProfit:  Math.round(totalProfit * 100) / 100,
      totalOrders,
      totalQuantity: totalQty,
      avgOrderValue: Math.round(avgOrder * 100) / 100,
      profitMargin:  totalSales > 0
        ? Math.round((totalProfit / totalSales) * 10000) / 100
        : 0,
      previousPeriod: prevStats,
      targets: {
        totalSales: prevStats ? prevStats.sales * 1.1 : 50000000, 
        totalOrders: prevStats ? prevStats.orders * 1.1 : 2000,
      }
    });
  } catch (e) { next(e); }
});

// ─── GET /sales/trends ────────────────────────────────────────────────────────
router.get('/trends', (req, res, next) => {
  try {
    const filters   = parseFilters(req.query);
    const data      = applyFilters(getData(), filters);
    const monthly   = monthlyTrend(data);

    // Daily drilldown when a specific month is requested
    const { drillMonth } = req.query; // e.g., "2023-10"
    let daily = [];
    if (drillMonth) {
      const monthData = data.filter(r => r.orderDate.startsWith(drillMonth));
      const dayGroups = {};
      for (const r of monthData) {
        const k = r.orderDate;
        if (!dayGroups[k]) dayGroups[k] = { sales: 0, profit: 0, orders: 0 };
        dayGroups[k].sales  += r.salesAmount;
        dayGroups[k].profit += r.profit;
        dayGroups[k].orders += 1;
      }
      daily = Object.entries(dayGroups)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({
          date,
          sales:  Math.round(v.sales * 100) / 100,
          profit: Math.round(v.profit * 100) / 100,
          orders: v.orders,
        }));
    }

    // Generate 3 months of predictions based on simple linear regression
    let extendedMonthly = monthly.map(m => ({ ...m, isPrediction: false }));
    if (monthly.length >= 3 && !drillMonth) {
      const n = monthly.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
      for (let i = 0; i < n; i++) {
        sumX += i; sumY += monthly[i].sales; sumXY += i * monthly[i].sales; sumX2 += i * i;
      }
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      const lastDate = monthly[n-1].month;
      let [yy, mm] = lastDate.split('-').map(Number);
      for (let i = 1; i <= 3; i++) {
        mm++; if (mm > 12) { mm = 1; yy++; }
        const nextDate = `${yy}-${String(mm).padStart(2, '0')}`;
        const pSales = Math.max(0, intercept + slope * (n - 1 + i));
        // Push a prediction node
        extendedMonthly.push({
          month: nextDate,
          sales: Number(pSales.toFixed(2)),
          profit: null, orders: null, isPrediction: true
        });
      }
    }

    res.json({ monthly: extendedMonthly, daily });
  } catch (e) { next(e); }
});

// ─── GET /sales/category ─────────────────────────────────────────────────────
router.get('/category', (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    const data    = applyFilters(getData(), filters);
    const cats    = groupBy(data, 'productCategory').sort((a, b) => b.sales - a.sales);

    // Also provide top products within each category
    const topProducts = {};
    for (const cat of cats) {
      const catRecords = data.filter(r => r.productCategory === cat.name);
      topProducts[cat.name] = topN(catRecords, 'productName', 5);
    }

    res.json({ categories: cats, topProducts });
  } catch (e) { next(e); }
});

// ─── GET /sales/region ────────────────────────────────────────────────────────
router.get('/region', (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    const data    = applyFilters(getData(), filters);
    const regions = groupBy(data, 'region').sort((a, b) => b.sales - a.sales);
    const cities  = groupBy(data, 'city').sort((a, b) => b.sales - a.sales).slice(0, 10);

    res.json({ regions, cities });
  } catch (e) { next(e); }
});

// ─── GET /sales/filters ───────────────────────────────────────────────────────
router.get('/filters', (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    const data    = applyFilters(getData(), filters);

    const categories  = [...new Set(getData().map(r => r.productCategory))].sort();
    const regions     = [...new Set(getData().map(r => r.region))].sort();
    const segments    = [...new Set(getData().map(r => r.customerSegment))].sort();
    const paymentModes = [...new Set(getData().map(r => r.paymentMode))].sort();
    const cities      = [...new Set(getData().map(r => r.city))].sort();

    res.json({ categories, regions, segments, paymentModes, cities });
  } catch (e) { next(e); }
});

// ─── GET /sales/insights ──────────────────────────────────────────────────────
router.get('/insights', (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    const data    = applyFilters(getData(), filters);

    // Top category
    const cats    = groupBy(data, 'productCategory').sort((a, b) => b.sales - a.sales);
    const regions = groupBy(data, 'region').sort((a, b) => b.profit - a.profit);
    const segs    = groupBy(data, 'customerSegment').sort((a, b) => b.sales - a.sales);

    // Discount vs profit correlation buckets
    const discountBuckets = [
      { label: '0-5%',   min: 0,  max: 5  },
      { label: '5-10%',  min: 5,  max: 10 },
      { label: '10-15%', min: 10, max: 15 },
      { label: '15-20%', min: 15, max: 20 },
      { label: '20%+',   min: 20, max: 100 },
    ].map(bucket => {
      const recs = data.filter(r => r.discount > bucket.min && r.discount <= bucket.max);
      return {
        label:    bucket.label,
        avgProfit: recs.length
          ? Math.round((sum(recs, 'profit') / recs.length) * 100) / 100
          : 0,
        count:    recs.length,
      };
    });

    // Payment mode distribution
    const paymentDist = groupBy(data, 'paymentMode');

    // Anomalies: records with profit < -1000
    const anomalies = data
      .filter(r => r.profit < -500)
      .sort((a, b) => a.profit - b.profit)
      .slice(0, 10);

    // Smart AI Insights Generation
    const aiInsights = [];
    if (cats.length) {
      const topC = cats[0];
      const botC = cats[cats.length - 1];
      aiInsights.push(`**${topC.name}** is the strongest performer with ₹${(topC.sales/100000).toFixed(1)}L in revenue.`);
      if (topC.profit < sum(data, 'profit') / cats.length) {
        aiInsights.push(`Despite high revenue, **${topC.name}** has lower than average profit margin.`);
      }
    }
    if (regions.length) {
      aiInsights.push(`The **${regions[0].name}** region generated the most profit.`);
    }
    const deepDiscountBucket = discountBuckets.find(b => b.label === '20%+');
    if (deepDiscountBucket && deepDiscountBucket.avgProfit < 0) {
       aiInsights.push(`**Warning:** Heavy discounts (20%+) are causing an average loss of ₹${Math.abs(deepDiscountBucket.avgProfit)} per order.`);
    }
    
    // Auto-reply context for UI "Ask Data" chatbot
    const chatbotContext = {
      totalRevenue: sum(data, 'salesAmount'),
      totalProfit: sum(data, 'profit'),
      totalOrders: data.length,
      totalLossRecords: anomalies.length,
      bestCategory: cats[0]?.name || 'N/A',
      worstCategory: cats[cats.length - 1]?.name || 'N/A',
      worstCategoryRevenue: cats[cats.length - 1]?.sales || 0,
      bestRegion: regions[0]?.name || 'N/A',
      worstRegion: regions[regions.length - 1]?.name || 'N/A',
      worstRegionMargin: regions[regions.length - 1]?.margin || 0,
      bestSegment: segs[0]?.name || 'N/A',
      avgMargin: Math.round((sum(data, 'profit') / (sum(data, 'salesAmount') || 1)) * 100),
      bestRegionGrowth: 5.4, // Simulated static growth
    };

    res.json({
      topCategory: cats[0] || null,
      topRegion:   regions[0] || null,
      topSegment:  segs[0] || null,
      discountImpact:  discountBuckets,
      paymentDistribution: paymentDist,
      anomalies,
      smartInsights: aiInsights,
      chatbotContext
    });
  } catch (e) { next(e); }
});

// ─── GET /sales/segment ───────────────────────────────────────────────────────
router.get('/segment', (req, res, next) => {
  try {
    const filters  = parseFilters(req.query);
    const data     = applyFilters(getData(), filters);
    const segments = groupBy(data, 'customerSegment').sort((a, b) => b.sales - a.sales);
    res.json({ segments });
  } catch (e) { next(e); }
});

module.exports = router;
