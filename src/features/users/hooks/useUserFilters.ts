import { useState, useMemo, useCallback } from 'react';
import type { User } from '../../../shared/types/domain';

export function useUserFilters(users: User[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const hasActiveFilters = Boolean(searchTerm.trim() || roleFilter);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return users.filter((u) => {
      const name = (
        u.fullName ||
        `${u.firstName || ''} ${u.lastName || ''}`.trim() ||
        u.email ||
        ''
      ).toLowerCase();
      const email = (u.email || '').toLowerCase();
      const nationalId = (u.nationalId || '').toLowerCase();
      const matchesTerm =
        !term || name.includes(term) || email.includes(term) || nationalId.includes(term);
      const matchesRole = !roleFilter || u.role === roleFilter;
      return matchesTerm && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setRoleFilter('');
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    filteredUsers,
    hasActiveFilters,
    clearFilters,
  };
}
