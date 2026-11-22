import { useState, useMemo, useCallback } from 'react';
import type { Field } from '../../../shared/types/domain';

export type FieldStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

export function useFieldFilters(fields: Field[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FieldStatusFilter>('ALL');

  const hasActiveFilters = Boolean(searchTerm.trim() || statusFilter !== 'ALL');

  const filteredFields = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return fields.filter((field) => {
      const matchesTerm =
        !term ||
        field.nombre?.toLowerCase().includes(term) ||
        field.zona?.toLowerCase().includes(term) ||
        field.responsable?.toLowerCase().includes(term) ||
        field.ubicacion?.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'ACTIVE'
          ? field.estado === true
          : field.estado === false;

      return matchesTerm && matchesStatus;
    });
  }, [fields, searchTerm, statusFilter]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('ALL');
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filteredFields,
    hasActiveFilters,
    clearFilters,
  };
}
