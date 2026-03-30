/**
 * Data Layer — loads the JSON dataset into memory and provides
 * query/aggregation helpers used by all route handlers.
 */
const fs   = require('fs');
const path = require('path');

// Load dataset once at startup
const DATA_PATH = path.join(__dirname, '../../..', 'dataset', 'sales_data.json');
let _data = null;

function getData() {
  if (!_data) {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    _data = JSON.parse(raw);
  }
  return _data;
}

// ─── Filter Builder ───────────────────────────────────────────────────────────
/**
 * Returns a filtered slice of the dataset based on query params.
 * Supported filters:
 *   startDate, endDate  — ISO date strings (inclusive)
 *   category            — productCategory
 *   region              — region
 *   segment             — customerSegment
 *   paymentMode         — paymentMode
 *   city                — city
 *   search              — substring match on customerName or productName
 */
function applyFilters(data, filters = {}) {
  let result = data;

  if (filters.startDate) {
    result = result.filter(r => r.orderDate >= filters.startDate);
  }
  if (filters.endDate) {
    result = result.filter(r => r.orderDate <= filters.endDate);
  }
  if (filters.category && filters.category !== 'all') {
    result = result.filter(r => r.productCategory === filters.category);
  }
  if (filters.region && filters.region !== 'all') {
    result = result.filter(r => r.region === filters.region);
  }
  if (filters.segment && filters.segment !== 'all') {
    result = result.filter(r => r.customerSegment === filters.segment);
  }
  if (filters.paymentMode && filters.paymentMode !== 'all') {
    result = result.filter(r => r.paymentMode === filters.paymentMode);
  }
  if (filters.city && filters.city !== 'all') {
    result = result.filter(r => r.city === filters.city);
  }
  if (filters.search) {
    const s = filters.search.toLowerCase();
    result = result.filter(r =>
      r.customerName.toLowerCase().includes(s) ||
      r.productName.toLowerCase().includes(s)
    );
  }

  return result;
}

// ─── Aggregation Helpers ──────────────────────────────────────────────────────

/** Sum a numeric field across an array of records */
function sum(records, field) {
  return records.reduce((acc, r) => acc + (r[field] || 0), 0);
}

/** Group records by a key field and compute aggregates */
function groupBy(records, keyField) {
  const groups = {};
  for (const r of records) {
    const key = r[keyField];
    if (!groups[key]) {
      groups[key] = { sales: 0, profit: 0, orders: 0, quantity: 0 };
    }
    groups[key].sales    += r.salesAmount;
    groups[key].profit   += r.profit;
    groups[key].orders   += 1;
    groups[key].quantity += r.quantity;
  }
  // Round and return as array
  return Object.entries(groups).map(([name, v]) => ({
    name,
    sales:    Math.round(v.sales * 100) / 100,
    profit:   Math.round(v.profit * 100) / 100,
    orders:   v.orders,
    quantity: v.quantity,
    margin:   v.sales > 0 ? Math.round((v.profit / v.sales) * 10000) / 100 : 0,
  }));
}

/** Monthly trend — groups by YYYY-MM */
function monthlyTrend(records) {
  const groups = {};
  for (const r of records) {
    const key = r.orderDate.substring(0, 7); // "YYYY-MM"
    if (!groups[key]) groups[key] = { sales: 0, profit: 0, orders: 0 };
    groups[key].sales  += r.salesAmount;
    groups[key].profit += r.profit;
    groups[key].orders += 1;
  }
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month,
      sales:  Math.round(v.sales * 100) / 100,
      profit: Math.round(v.profit * 100) / 100,
      orders: v.orders,
    }));
}

/** Top N items by sales */
function topN(records, keyField, n = 10) {
  return groupBy(records, keyField)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, n);
}

module.exports = { getData, applyFilters, sum, groupBy, monthlyTrend, topN };
