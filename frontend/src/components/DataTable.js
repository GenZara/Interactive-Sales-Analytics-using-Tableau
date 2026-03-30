/**
 * DataTable — sortable, searchable, paginated sales records table.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useFilters } from '../context/FilterContext';
import { fmtCurrency, fmtDate, fmtNumber } from '../utils/format';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

const COLUMNS = [
  { key: 'orderId',          label: 'Order ID',  width: 110 },
  { key: 'orderDate',        label: 'Date',       width: 100, format: 'date' },
  { key: 'customerName',     label: 'Customer',   width: 140, truncate: true },
  { key: 'customerSegment',  label: 'Segment',    width: 90,  badge: true },
  { key: 'productCategory',  label: 'Category',   width: 120, truncate: true },
  { key: 'productName',      label: 'Product',    width: 140, truncate: true },
  { key: 'region',           label: 'Region',     width: 80  },
  { key: 'city',             label: 'City',       width: 100, truncate: true },
  { key: 'salesAmount',      label: 'Revenue',    width: 100, format: 'currency', align: 'right' },
  { key: 'quantity',         label: 'Qty',        width: 60,  align: 'right' },
  { key: 'discount',         label: 'Disc %',     width: 70,  format: 'pct', align: 'right' },
  { key: 'profit',           label: 'Profit',     width: 100, format: 'currency', align: 'right', colorize: true },
  { key: 'paymentMode',      label: 'Payment',    width: 90,  badge: true },
];

const BADGE_COLORS = {
  Regular:   'badge-blue',
  Premium:   'badge-violet',
  Wholesale: 'badge-amber',
  Cash:      'badge-green',
  Card:      'badge-blue',
  UPI:       'badge-violet',
};

export default function DataTable() {
  const { effectiveFilters } = useFilters();
  const [rows,    setRows]    = useState([]);
  const [meta,    setMeta]    = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [sortBy,  setSortBy]  = useState('orderDate');
  const [sortOrd, setSortOrd] = useState('desc');
  const [page,    setPage]    = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    api.getSales(effectiveFilters, page, 50, sortBy, sortOrd)
      .then(r => { setRows(r.data.data); setMeta(r.data.meta); setLoading(false); })
      .catch(() => setLoading(false));
  }, [effectiveFilters, page, sortBy, sortOrd]);

  useEffect(() => { setPage(1); }, [effectiveFilters]);
  useEffect(() => { load(); }, [load]);

  const handleSort = (key) => {
    if (sortBy === key) setSortOrd(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortOrd('desc'); }
  };

  const renderCell = (col, row) => {
    const v = row[col.key];
    if (col.badge) return <span className={`badge ${BADGE_COLORS[v] || 'badge-blue'}`}>{v}</span>;
    if (col.format === 'date')     return fmtDate(v);
    if (col.format === 'currency') {
      const c = col.colorize ? v < 0 ? 'var(--danger)' : 'var(--success)' : 'var(--text-primary)';
      return <span style={{ color: c, fontWeight: 600 }}>{fmtCurrency(v)}</span>;
    }
    if (col.format === 'pct')      return `${v}%`;
    if (col.truncate)              return <span className="truncate" style={{ maxWidth: col.width }}>{v}</span>;
    return v;
  };

  return (
    <div>
      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={sortBy === col.key ? `sort-${sortOrd}` : ''}
                  style={{ textAlign: col.align || 'left', minWidth: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {COLUMNS.map(c => (
                      <td key={c.key}>
                        <div className="skeleton skeleton-text" style={{ width: '80%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map(row => (
                  <tr key={row.orderId}>
                    {COLUMNS.map(col => (
                      <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                        {renderCell(col, row)}
                      </td>
                    ))}
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-2" style={{ padding: '12px 4px' }}>
        <span className="text-sm text-muted">
          Showing {Math.min((page - 1) * 50 + 1, meta.total)}–{Math.min(page * 50, meta.total)} of {fmtNumber(meta.total)} records
        </span>
        <div className="flex items-center gap-2">
          <button className="btn-icon" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <MdChevronLeft size={18} />
          </button>
          <span className="text-sm" style={{ minWidth: 80, textAlign: 'center' }}>
            Page {page} / {meta.totalPages}
          </span>
          <button className="btn-icon" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>
            <MdChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
