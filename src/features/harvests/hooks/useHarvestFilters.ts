import { useState, useMemo, useCallback } from 'react';
import type { Harvest } from '../../../shared/types/domain';

export interface UseHarvestFiltersOptions {
  harvests: Harvest[];
  getFieldName: (harvest: Harvest) => string;
  getCropName: (harvest: Harvest) => string;
}

export function useHarvestFilters({
  harvests,
  getFieldName,
  getCropName,
}: UseHarvestFiltersOptions) {
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldFilter, setFieldFilter] = useState('');
  const [cropFilter, setCropFilter] = useState('');

  const hasActiveFilters = Boolean(searchTerm.trim() || fieldFilter || cropFilter);

  const filteredHarvests = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return harvests.filter((h) => {
      const fieldName = getFieldName(h).toLowerCase();
      const cropName = getCropName(h).toLowerCase();
      const obs = (h.observaciones || '').toLowerCase();
      const matchesTerm =
        !term || fieldName.includes(term) || cropName.includes(term) || obs.includes(term);

      const matchesField =
        !fieldFilter ||
        String(h.idCampo || h.campo?.id || h.campo?.idCampo) === String(fieldFilter);

      const matchesCrop =
        !cropFilter ||
        String(h.idCultivo || h.cultivo?.id || h.cultivo?.idCultivo) === String(cropFilter);

      return matchesTerm && matchesField && matchesCrop;
    });
  }, [harvests, searchTerm, fieldFilter, cropFilter, getFieldName, getCropName]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFieldFilter('');
    setCropFilter('');
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    fieldFilter,
    setFieldFilter,
    cropFilter,
    setCropFilter,
    filteredHarvests,
    hasActiveFilters,
    clearFilters,
  };
}
