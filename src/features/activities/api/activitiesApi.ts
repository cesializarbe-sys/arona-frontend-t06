// Contract reference: docs/api-contract.md (Field Activities)
import {
  apiClient,
  encodePathParam,
  ensureArrayResponse,
  ensureObjectResponse,
} from '../../../shared/api/httpClient';
import type {
  EntityId,
  FieldActivity,
  FieldActivityPayload,
} from '../../../shared/types/domain';

interface RawActivityRecord extends Record<string, unknown> {
  id?: EntityId;
  idActividad?: EntityId;
  tipoActividad?: string;
  fecha?: string;
  idCampo?: EntityId;
  idCultivo?: EntityId | null;
  observaciones?: string;
  estado?: boolean;
}

function normalizeActivity(raw: RawActivityRecord): FieldActivity {
  const id = raw.id ?? raw.idActividad ?? '';
  return {
    id,
    idActividad: raw.idActividad ?? id,
    tipoActividad: typeof raw.tipoActividad === 'string' ? raw.tipoActividad : 'OTRO',
    fecha: typeof raw.fecha === 'string' ? raw.fecha : '',
    idCampo: raw.idCampo,
    idCultivo: raw.idCultivo ?? null,
    observaciones: typeof raw.observaciones === 'string' ? raw.observaciones : undefined,
    estado: raw.estado !== false,
  };
}

export const activitiesApi = {
  getAll: async (signal?: AbortSignal): Promise<FieldActivity[]> => {
    const res = signal
      ? await apiClient.get<unknown>('/actividades-campo', { signal })
      : await apiClient.get<unknown>('/actividades-campo');
    const items = ensureArrayResponse<RawActivityRecord>(res.data, 'actividades de campo');
    return items.map(normalizeActivity);
  },

  create: async (payload: FieldActivityPayload): Promise<FieldActivity> => {
    const res = await apiClient.post<unknown>('/actividades-campo', payload);
    const data = ensureObjectResponse<RawActivityRecord>(res.data, 'creación de actividad');
    return normalizeActivity(data);
  },

  update: async (id: EntityId, payload: FieldActivityPayload): Promise<FieldActivity> => {
    const encodedId = encodePathParam(id, 'id');
    const res = await apiClient.put<unknown>(`/actividades-campo/${encodedId}`, payload);
    const data = ensureObjectResponse<RawActivityRecord>(res.data, 'actualización de actividad');
    return normalizeActivity(data);
  },

  softDelete: async (id: EntityId): Promise<unknown> => {
    const encodedId = encodePathParam(id, 'id');
    const res = await apiClient.patch(`/actividades-campo/${encodedId}/eliminar`, {});
    return res.data;
  },

  restore: async (id: EntityId): Promise<unknown> => {
    const encodedId = encodePathParam(id, 'id');
    const res = await apiClient.patch(`/actividades-campo/${encodedId}/restaurar`, {});
    return res.data;
  },
};
