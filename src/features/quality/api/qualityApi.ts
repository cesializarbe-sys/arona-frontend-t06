// Contract reference: docs/api-contract.md (Quality Reviews)
import {
  apiClient,
  encodePathParam,
  ensureArrayResponse,
  ensureObjectResponse,
} from '../../../shared/api/httpClient';
import type {
  EntityId,
  QualityReview,
  QualityReviewPayload,
} from '../../../shared/types/domain';

interface RawQualityRecord extends Record<string, unknown> {
  id?: EntityId;
  idRevision?: EntityId;
  idCosecha?: EntityId;
  cosecha?: { id?: EntityId; idCosecha?: EntityId };
  idUsuarioSupervisor?: EntityId;
  idSupervisor?: EntityId;
  supervisor?: { id?: EntityId; idUsuario?: EntityId; nombreCompleto?: string };
  fecha?: string;
  cumpleRequisitos?: boolean;
  notificado?: boolean;
  observaciones?: string;
  estado?: boolean;
}

function normalizeQualityReview(raw: RawQualityRecord): QualityReview {
  const id = raw.id ?? raw.idRevision ?? '';
  return {
    id,
    idRevision: raw.idRevision ?? id,
    idCosecha: raw.idCosecha ?? raw.cosecha?.idCosecha ?? raw.cosecha?.id,
    cosecha: raw.cosecha,
    idUsuarioSupervisor:
      raw.idUsuarioSupervisor ??
      raw.idSupervisor ??
      raw.supervisor?.idUsuario ??
      raw.supervisor?.id,
    idSupervisor: raw.idSupervisor,
    supervisor: raw.supervisor ? { id: raw.supervisor.id != null ? String(raw.supervisor.id) : raw.supervisor.idUsuario != null ? String(raw.supervisor.idUsuario) : undefined, fullName: raw.supervisor.nombreCompleto } : undefined,
    fecha: typeof raw.fecha === 'string' ? raw.fecha : '',
    cumpleRequisitos: Boolean(raw.cumpleRequisitos),
    notificado: raw.notificado,
    observaciones: typeof raw.observaciones === 'string' ? raw.observaciones : undefined,
    estado: raw.estado !== false,
  };
}

export const qualityApi = {
  getAll: async (signal?: AbortSignal): Promise<QualityReview[]> => {
    const res = signal
      ? await apiClient.get<unknown>('/revisiones-calidad', { signal })
      : await apiClient.get<unknown>('/revisiones-calidad');
    const items = ensureArrayResponse<RawQualityRecord>(res.data, 'revisiones de calidad');
    return items.map(normalizeQualityReview);
  },

  create: async (payload: QualityReviewPayload): Promise<QualityReview> => {
    const res = await apiClient.post<unknown>('/revisiones-calidad', payload);
    const data = ensureObjectResponse<RawQualityRecord>(res.data, 'creación de revisión de calidad');
    return normalizeQualityReview(data);
  },

  update: async (id: EntityId, payload: QualityReviewPayload): Promise<QualityReview> => {
    const encodedId = encodePathParam(id, 'id');
    const res = await apiClient.put<unknown>(`/revisiones-calidad/${encodedId}`, payload);
    const data = ensureObjectResponse<RawQualityRecord>(res.data, 'actualización de revisión de calidad');
    return normalizeQualityReview(data);
  },

  softDelete: async (id: EntityId): Promise<unknown> => {
    const encodedId = encodePathParam(id, 'id');
    const res = await apiClient.patch(`/revisiones-calidad/${encodedId}/eliminar`, {});
    return res.data;
  },

  restore: async (id: EntityId): Promise<unknown> => {
    const encodedId = encodePathParam(id, 'id');
    const res = await apiClient.patch(`/revisiones-calidad/${encodedId}/restaurar`, {});
    return res.data;
  },
};
