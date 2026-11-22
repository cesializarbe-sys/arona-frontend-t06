// Contract reference: docs/api-contract.md (Transactional / Master Data Service)
import { fieldsApi } from '../../fields/api/fieldsApi';
import { harvestsApi } from '../../harvests/api/harvestsApi';
import { alertsApi } from '../../alerts/api/alertsApi';
import { activitiesApi } from '../../activities/api/activitiesApi';
import { authApi } from '../../auth/api/authApi';
import type { DashboardSummaryData } from '../../../shared/types/domain';

export const dashboardApi = {
  getSummaryData: async (signal?: AbortSignal): Promise<DashboardSummaryData> => {
    const [fields, harvests, pendingAlerts, activities, users] = await Promise.all([
      fieldsApi.getActive(signal).catch(() => []),
      harvestsApi.getAll(signal).catch(() => []),
      alertsApi.getPending(signal).catch(() => []),
      activitiesApi.getAll(signal).catch(() => []),
      authApi.getAllUsers(signal).catch(() => []),
    ]);

    return {
      fields,
      harvests,
      pendingAlerts,
      recentActivities: [...activities]
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        .slice(0, 5),
      totalUsers: users.filter((u) => u.active !== false).length,
    };
  },
};
