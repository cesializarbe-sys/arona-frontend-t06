import { useState, useMemo, useCallback } from 'react';
import type { EntityId, PhytosanitaryAlert } from '../../../shared/types/domain';

export type AttendedFilter = 'ALL' | 'PENDIENTE' | 'ATENDIDA';

export function useAlertFilters(
  alerts: PhytosanitaryAlert[],
  getFieldName: (fieldId?: EntityId) => string,
  getCropName: (cropId?: EntityId | null) => string
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [problemTypeFilter, setProblemTypeFilter] = useState('');
  const [attendedFilter, setAttendedFilter] = useState<AttendedFilter>('ALL');

  const hasActiveFilters = Boolean(
    searchTerm.trim() || problemTypeFilter || attendedFilter !== 'ALL'
  );

  const filteredAlerts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return alerts.filter((a) => {
      const fieldName = (a.campo?.nombre || getFieldName(a.idCampo)).toLowerCase();
      const cropName = (a.cultivo?.nombre || getCropName(a.idCultivo)).toLowerCase();
      const desc = (a.descripcionProblema || '').toLowerCase();
      const sol = (a.solucionAplicada || '').toLowerCase();
      const matchesTerm =
        !term ||
        fieldName.includes(term) ||
        cropName.includes(term) ||
        desc.includes(term) ||
        sol.includes(term);

      const matchesType = !problemTypeFilter || a.tipoProblema === problemTypeFilter;
      const isAttended = a.atendida === true || Boolean(a.solucionAplicada);
      const matchesAttended =
        attendedFilter === 'ALL'
          ? true
          : attendedFilter === 'PENDIENTE'
          ? !isAttended
          : isAttended;

      return matchesTerm && matchesType && matchesAttended;
    });
  }, [alerts, searchTerm, problemTypeFilter, attendedFilter, getFieldName, getCropName]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setProblemTypeFilter('');
    setAttendedFilter('ALL');
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    problemTypeFilter,
    setProblemTypeFilter,
    attendedFilter,
    setAttendedFilter,
    filteredAlerts,
    hasActiveFilters,
    clearFilters,
  };
}
