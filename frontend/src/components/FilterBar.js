import React, { useEffect, useState } from 'react';
import { useFilters } from '../context/FilterContext';
import { api } from '../services/api';
import { MdFilterList, MdRefresh, MdSearch } from 'react-icons/md';

export default function FilterBar() {
  const { filters, updateFilter, resetFilters, commitFilters, options, setOptions, crossFilter } = useFilters();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getFilters().then(r => {
      setOptions(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [setOptions]);

  return (
    <div className="filter-bar" style={{ animation: 'slideUpFade 0.4s cubic-bezier(0.4, 0, 0.2, 1) both' }}>
      <div className="flex items-center gap-2" style={{ color: 'var(--accent-1)' }}>
        <MdFilterList size={18} />
        <span className="filter-label">Filters</span>
      </div>

      <div className="filter-divider" />

      {/* Date range */}
      <div className="filter-group">
        <label className="text-xs text-muted">From</label>
        <input
          type="date"
          value={filters.startDate}
          max={filters.endDate || undefined}
          onChange={e => updateFilter('startDate', e.target.value)}
          style={{ width: 130 }}
        />
      </div>
      <div className="filter-group">
        <label className="text-xs text-muted">To</label>
        <input
          type="date"
          value={filters.endDate}
          min={filters.startDate || undefined}
          onChange={e => updateFilter('endDate', e.target.value)}
          style={{ width: 130 }}
        />
      </div>

      <div className="filter-divider" />

      {/* Dropdowns */}
      {[
        { key: 'category',    label: 'Category',   opts: options.categories   || [] },
        { key: 'region',      label: 'Region',     opts: options.regions      || [] },
        { key: 'segment',     label: 'Segment',    opts: options.segments     || [] },
        { key: 'paymentMode', label: 'Payment',    opts: options.paymentModes || [] },
      ].map(({ key, label, opts }) => (
        <div className="filter-group" key={key}>
          <label className="text-xs text-muted">{label}</label>
          <select
            value={filters[key]}
            onChange={e => updateFilter(key, e.target.value)}
            style={{ minWidth: 110 }}
          >
            <option value="all">All</option>
            {opts.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      ))}

      <div className="filter-divider" />

      {/* Search */}
      <div className="filter-group flex items-center">
        <MdSearch style={{ color: 'var(--text-muted)', flexShrink: 0 }} size={16} />
        <input
          type="search"
          placeholder="Search customer / product"
          value={filters.search}
          onChange={e => updateFilter('search', e.target.value)}
          onKeyDown={(e) => { if(e.key === 'Enter') commitFilters(); }}
          style={{ width: 180 }}
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button className="btn btn-primary" onClick={commitFilters} title="Apply filters">
          Apply
        </button>
        {/* Reset */}
        <button className="btn btn-ghost" onClick={resetFilters} title="Reset all filters">
          <MdRefresh size={16} />
          Reset
        </button>
      </div>

      {/* Cross-filter indicator */}
      {crossFilter && (
        <span className="badge badge-violet" style={{ marginLeft: 4 }}>
          ⚡ Cross-filter: {crossFilter.value}
        </span>
      )}
    </div>
  );
}
