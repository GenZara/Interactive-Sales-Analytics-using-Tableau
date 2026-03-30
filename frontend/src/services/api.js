/**
 * API Service Layer
 * All axios calls to the backend, with filter support.
 */
import axios from 'axios';

const BASE = 'http://localhost:5000/sales';

/** Build query string from filter state */
function buildParams(filters = {}) {
  const p = {};
  if (filters.startDate)   p.startDate   = filters.startDate;
  if (filters.endDate)     p.endDate     = filters.endDate;
  if (filters.category && filters.category !== 'all')     p.category    = filters.category;
  if (filters.region   && filters.region   !== 'all')     p.region      = filters.region;
  if (filters.segment  && filters.segment  !== 'all')     p.segment     = filters.segment;
  if (filters.paymentMode && filters.paymentMode !== 'all') p.paymentMode = filters.paymentMode;
  if (filters.city     && filters.city     !== 'all')     p.city        = filters.city;
  if (filters.search)      p.search      = filters.search;
  return p;
}

export const api = {
  getSummary:    (filters) => axios.get(`${BASE}/summary`,  { params: buildParams(filters) }),
  getTrends:     (filters, drillMonth) =>
    axios.get(`${BASE}/trends`,   { params: { ...buildParams(filters), ...(drillMonth ? { drillMonth } : {}) } }),
  getCategory:   (filters) => axios.get(`${BASE}/category`, { params: buildParams(filters) }),
  getRegion:     (filters) => axios.get(`${BASE}/region`,   { params: buildParams(filters) }),
  getSegment:    (filters) => axios.get(`${BASE}/segment`,  { params: buildParams(filters) }),
  getInsights:   (filters) => axios.get(`${BASE}/insights`, { params: buildParams(filters) }),
  getFilters:    ()        => axios.get(`${BASE}/filters`),
  getSales:      (filters, page = 1, limit = 50, sortBy = 'orderDate', sortOrder = 'desc') =>
    axios.get(`${BASE}`, {
      params: { ...buildParams(filters), page, limit, sortBy, sortOrder },
    }),
};

export default api;
