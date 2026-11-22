import { useState, useMemo, useCallback } from 'react';
import type { QualityReview } from '../../../shared/types/domain';

export type DictumFilter = 'ALL' | 'APROBADO' | 'RECHAZADO';

export function useQualityFilters(
  reviews: QualityReview[],
  getHarvestDisplay: (review: QualityReview) => string,
  getSupervisorDisplay: (review: QualityReview) => string
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dictumFilter, setDictumFilter] = useState<DictumFilter>('ALL');

  const hasActiveFilters = Boolean(searchTerm.trim() || dictumFilter !== 'ALL');

  const filteredReviews = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return reviews.filter((r) => {
      const harvestLabel = getHarvestDisplay(r).toLowerCase();
      const supervisorLabel = getSupervisorDisplay(r).toLowerCase();
      const obs = (r.observaciones || '').toLowerCase();
      const matchesTerm =
        !term ||
        harvestLabel.includes(term) ||
        supervisorLabel.includes(term) ||
        obs.includes(term);

      const matchesDictum =
        dictumFilter === 'ALL'
          ? true
          : dictumFilter === 'APROBADO'
          ? r.cumpleRequisitos === true
          : r.cumpleRequisitos === false;

      return matchesTerm && matchesDictum;
    });
  }, [reviews, searchTerm, dictumFilter, getHarvestDisplay, getSupervisorDisplay]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setDictumFilter('ALL');
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    dictumFilter,
    setDictumFilter,
    filteredReviews,
    hasActiveFilters,
    clearFilters,
  };
}
