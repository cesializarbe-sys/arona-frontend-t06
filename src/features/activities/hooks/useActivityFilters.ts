import { useState, useMemo, useCallback } from 'react';
import type { EntityId, FieldActivity } from '../../../shared/types/domain';

export function useActivityFilters(
  activities: FieldActivity[],
  getFieldName: (fieldId?: EntityId) => string
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const hasActiveFilters = Boolean(searchTerm.trim() || typeFilter);

  const filteredActivities = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return activities.filter((a) => {
      const fieldName = getFieldName(a.idCampo).toLowerCase();
      const obs = (a.observaciones || '').toLowerCase();
      const matchesTerm = !term || fieldName.includes(term) || obs.includes(term);
      const matchesType = !typeFilter || a.tipoActividad === typeFilter;
      return matchesTerm && matchesType;
    });
  }, [activities, searchTerm, typeFilter, getFieldName]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setTypeFilter('');
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    typeFilter,
    setTypeFilter,
    filteredActivities,
    hasActiveFilters,
    clearFilters,
  };
}
