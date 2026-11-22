// Contract reference: docs/api-contract.md (Crops)
import {
  apiClient,
  encodePathParam,
  ensureArrayResponse,
  ensureObjectResponse,
} from '../../../shared/api/httpClient';
import type { Crop, CropPayload, EntityId } from '../../../shared/types/domain';

interface RawCropRecord extends Record<string, unknown> {
  id?: EntityId;
  idCultivo?: EntityId;
  _id?: string;
  campoId?: EntityId;
  idCampo?: EntityId;
  campo?: { id?: EntityId; idCampo?: EntityId; nombre?: string };
  nombre?: string;
  tipoCultivo?: string;
  variedad?: string;
  frecuenciaRiegoDias?: number;
  temperaturaIdeal?: number;
  fechaSiembra?: string;
  estadoSalud?: string;
  requiereSombra?: boolean;
  observaciones?: string;
  estado?: boolean;
}

function normalizeCrop(raw: RawCropRecord): Crop {
  const id = raw.id != null ? String(raw.id) : raw.idCultivo != null ? String(raw.idCultivo) : '';
  const fieldRef =
    raw.campoId ??
    raw.idCampo ??
    raw.campo?.id ??
    (raw.campo?.idCampo != null ? String(raw.campo.idCampo) : undefined);

  return {
    id,
    idCultivo: id,
    _id: raw._id,
    campoId: fieldRef != null ? String(fieldRef) : undefined,
    idCampo: raw.idCampo,
    campo: raw.campo ? { id: raw.campo.id != null ? String(raw.campo.id) : undefined, idCampo: raw.campo.idCampo != null ? String(raw.campo.idCampo) : undefined, nombre: raw.campo.nombre } : undefined,
    nombre: typeof raw.nombre === 'string' ? raw.nombre : '',
    tipoCultivo: typeof raw.tipoCultivo === 'string' ? raw.tipoCultivo : '',
    variedad: typeof raw.variedad === 'string' ? raw.variedad : undefined,
    frecuenciaRiegoDias: raw.frecuenciaRiegoDias,
    temperaturaIdeal: raw.temperaturaIdeal,
    fechaSiembra: typeof raw.fechaSiembra === 'string' ? raw.fechaSiembra : undefined,
    estadoSalud: typeof raw.estadoSalud === 'string' ? raw.estadoSalud : undefined,
    requiereSombra: raw.requiereSombra,
    observaciones: typeof raw.observaciones === 'string' ? raw.observaciones : undefined,
    estado: raw.estado !== false,
  };
}

export const cropsApi = {
  getAll: async (signal?: AbortSignal): Promise<Crop[]> => {
    const res = signal
      ? await apiClient.get<unknown>('/cultivos', { signal })
      : await apiClient.get<unknown>('/cultivos');
    const items = ensureArrayResponse<RawCropRecord>(res.data, 'cultivos');
    return items.map(normalizeCrop);
  },

  getActive: async (signal?: AbortSignal): Promise<Crop[]> => {
    const res = signal
      ? await apiClient.get<unknown>('/cultivos/estado/true', { signal })
      : await apiClient.get<unknown>('/cultivos/estado/true');
    const items = ensureArrayResponse<RawCropRecord>(res.data, 'cultivos activos');
    return items.map(normalizeCrop);
  },

  create: async (crop: CropPayload): Promise<Crop> => {
    const res = await apiClient.post<unknown>('/cultivos', crop);
    const data = ensureObjectResponse<RawCropRecord>(res.data, 'creación de cultivo');
    return normalizeCrop(data);
  },

  update: async (id: EntityId, crop: CropPayload): Promise<Crop> => {
    const encodedId = encodePathParam(id, 'id');
    const res = await apiClient.put<unknown>(`/cultivos/${encodedId}`, crop);
    const data = ensureObjectResponse<RawCropRecord>(res.data, 'actualización de cultivo');
    return normalizeCrop(data);
  },

  softDelete: async (id: EntityId): Promise<unknown> => {
    const encodedId = encodePathParam(id, 'id');
    const res = await apiClient.patch(`/cultivos/${encodedId}/eliminar`, {});
    return res.data;
  },

  restore: async (id: EntityId): Promise<unknown> => {
    const encodedId = encodePathParam(id, 'id');
    const res = await apiClient.patch(`/cultivos/${encodedId}/restaurar`, {});
    return res.data;
  },
};
