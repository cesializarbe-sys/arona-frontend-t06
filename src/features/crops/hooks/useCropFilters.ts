import { useState, useMemo, useCallback } from 'react';
import type { Crop } from '../../../shared/types/domain';

export function useCropFilters(crops: Crop[], getFieldName: (crop: Crop) => string) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [healthFilter, setHealthFilter] = useState('');

  const hasActiveFilters = Boolean(searchTerm.trim() || typeFilter || healthFilter);

  const filteredCrops = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return crops.filter((crop) => {
      const matchesTerm =
        !term ||
        crop.nombre?.toLowerCase().includes(term) ||
        crop.tipoCultivo?.toLowerCase().includes(term) ||
        getFieldName(crop).toLowerCase().includes(term);

      const matchesType = !typeFilter || crop.tipoCultivo === typeFilter;
      const matchesHealth = !healthFilter || crop.estadoSalud === healthFilter;
      return matchesTerm && matchesType && matchesHealth;
    });
  }, [crops, searchTerm, typeFilter, healthFilter, getFieldName]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setTypeFilter('');
    setHealthFilter('');
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    typeFilter,
    setTypeFilter,
    healthFilter,
    setHealthFilter,
    filteredCrops,
    hasActiveFilters,
    clearFilters,
  };
}
