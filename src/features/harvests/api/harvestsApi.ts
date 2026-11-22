// Contract reference: docs/api-contract.md (Harvests)
import {
  apiClient,
  encodePathParam,
  ensureArrayResponse,
  ensureObjectResponse,
} from '../../../shared/api/httpClient';
import type { EntityId, Harvest, HarvestPayload } from '../../../shared/types/domain';

interface RawHarvestRecord extends Record<string, unknown> {
  id?: EntityId;
  idCosecha?: EntityId;
  fecha?: string;
  idCampo?: EntityId;
  idCultivo?: EntityId;
  idUsuario?: EntityId;
  campo?: { id?: EntityId; idCampo?: EntityId; nombre?: string };
  cultivo?: { id?: EntityId; idCultivo?: EntityId; nombre?: string };
  usuario?: { id?: EntityId; idUsuario?: EntityId; nombreCompleto?: string };
  cantidadKg?: number;
  cantidadUnidades?: number;
  observaciones?: string;
  estado?: boolean;
}

function normalizeHarvest(raw: RawHarvestRecord): Harvest {
  const id = raw.id ?? raw.idCosecha ?? '';
  return {
    id,
    idCosecha: raw.idCosecha ?? id,
    fecha: typeof raw.fecha === 'string' ? raw.fecha : '',
    idCampo: raw.idCampo,
    idCultivo: raw.idCultivo,
    idUsuario: raw.idUsuario,
    campo: raw.campo ? { id: raw.campo.id != null ? String(raw.campo.id) : undefined, idCampo: raw.campo.idCampo != null ? String(raw.campo.idCampo) : undefined, nombre: raw.campo.nombre } : undefined,
    cultivo: raw.cultivo ? { id: raw.cultivo.id != null ? String(raw.cultivo.id) : undefined, idCultivo: raw.cultivo.idCultivo != null ? String(raw.cultivo.idCultivo) : undefined, nombre: raw.cultivo.nombre } : undefined,
    usuario: raw.usuario ? { id: raw.usuario.id != null ? String(raw.usuario.id) : raw.usuario.idUsuario != null ? String(raw.usuario.idUsuario) : undefined, fullName: raw.usuario.nombreCompleto } : undefined,
    cantidadKg: Number(raw.cantidadKg ?? 0),
    cantidadUnidades: raw.cantidadUnidades,
    observaciones: typeof raw.observaciones === 'string' ? raw.observaciones : undefined,
    estado: raw.estado !== false,
  };
}

export const harvestsApi = {
  getAll: async (signal?: AbortSignal): Promise<Harvest[]> => {
    const res = signal
      ? await apiClient.get<unknown>('/cosechas', { signal })
      : await apiClient.get<unknown>('/cosechas');
    const items = ensureArrayResponse<RawHarvestRecord>(res.data, 'cosechas');
    return items.map(normalizeHarvest);
  },

  getById: async (id: EntityId): Promise<Harvest> => {
    const encodedId = encodePathParam(id, 'id');
    const res = await apiClient.get<unknown>(`/cosechas/${encodedId}`);
    const data = ensureObjectResponse<RawHarvestRecord>(res.data, 'cosecha');
    return normalizeHarvest(data);
  },

  getByStatus: async (status: string | boolean): Promise<Harvest[]> => {
    const encodedStatus = encodePathParam(String(status), 'status');
    const res = await apiClient.get<unknown>(`/cosechas/estado/${encodedStatus}`);
    const items = ensureArrayResponse<RawHarvestRecord>(res.data, 'cosechas por estado');
    return items.map(normalizeHarvest);
  },

  create: async (payload: HarvestPayload): Promise<Harvest> => {
    const res = await apiClient.post<unknown>('/cosechas', payload);
    const data = ensureObjectResponse<RawHarvestRecord>(res.data, 'creación de cosecha');
    return normalizeHarvest(data);
  },

  update: async (id: EntityId, payload: HarvestPayload): Promise<Harvest> => {
    const encodedId = encodePathParam(id, 'id');
    const res = await apiClient.put<unknown>(`/cosechas/${encodedId}`, payload);
    const data = ensureObjectResponse<RawHarvestRecord>(res.data, 'actualización de cosecha');
    return normalizeHarvest(data);
  },

  softDelete: async (id: EntityId): Promise<unknown> => {
    const encodedId = encodePathParam(id, 'id');
    const res = await apiClient.patch(`/cosechas/${encodedId}/eliminar`, {});
    return res.data;
  },

  restore: async (id: EntityId): Promise<unknown> => {
    const encodedId = encodePathParam(id, 'id');
    const res = await apiClient.patch(`/cosechas/${encodedId}/restaurar`, {});
    return res.data;
  },
};
