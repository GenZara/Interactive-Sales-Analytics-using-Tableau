/**
 * Filter Context — shared filter state + options across all pages/charts.
 * Cross-chart filtering: when a user clicks a chart element, it sets
 * a cross-filter that all other charts consume.
 */
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const FilterCtx = createContext(null);

const DEFAULT_FILTERS = {
  startDate:   '2023-01-01',
  endDate:     '2024-12-31',
  category:    'all',
  region:      'all',
  segment:     'all',
  paymentMode: 'all',
  city:        'all',
  search:      '',
};

export function FilterProvider({ children }) {
  const [filters, setFilters]         = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [crossFilter, setCrossFilter] = useState(null); // { type: 'category'|'region'|'segment', value }
  const [options, setOptions]         = useState({
    categories: [], regions: [], segments: [], paymentModes: [], cities: [],
  });

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const commitFilters = useCallback(() => {
    setAppliedFilters(filters);
    setCrossFilter(null);
  }, [filters]);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setCrossFilter(null);
  }, []);

  const applyCrossFilter = useCallback((type, value) => {
    setCrossFilter(prev => prev?.type === type && prev?.value === value ? null : { type, value });
  }, []);

  const effectiveFilters = useMemo(() => {
    const ef = { ...appliedFilters };
    if (crossFilter) {
      ef[crossFilter.type] = crossFilter.value;
    }
    return ef;
  }, [appliedFilters, crossFilter]);

  return (
    <FilterCtx.Provider value={{
      filters, effectiveFilters, updateFilter, resetFilters, commitFilters,
      crossFilter, applyCrossFilter,
      options, setOptions,
    }}>
      {children}
    </FilterCtx.Provider>
  );
}

export const useFilters = () => useContext(FilterCtx);
