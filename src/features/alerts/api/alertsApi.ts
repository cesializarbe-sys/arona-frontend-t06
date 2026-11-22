// Contract reference: docs/api-contract.md (Phytosanitary Alerts)
import {
  apiClient,
  encodePathParam,
  ensureArrayResponse,
  ensureObjectResponse,
  USER_STORAGE_KEY,
} from '../../../shared/api/httpClient';
import type {
  AlertPayload,
  EntityId,
  PhytosanitaryAlert,
} from '../../../shared/types/domain';

interface RawAlertRecord extends Record<string, unknown> {
  id?: EntityId;
  idAlerta?: EntityId;
  idCampo?: EntityId;
  campoId?: EntityId;
  idCultivo?: EntityId | null;
  cultivoId?: EntityId | null;
  reporterUserId?: EntityId;
  idUsuarioReporta?: EntityId;
  idUsuario?: EntityId;
  campo?: { id?: EntityId; idCampo?: EntityId; nombre?: string };
  cultivo?: { id?: EntityId; idCultivo?: EntityId; nombre?: string };
  usuario?: { id?: EntityId; idUsuario?: EntityId; nombreCompleto?: string };
  tipoProblema?: string;
  fechaDeteccion?: string;
  descripcionProblema?: string;
  solucionAplicada?: string | null;
  atendida?: boolean;
  estado?: boolean;
}

function getStoredUserId(): string {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return '';
    const parsed = JSON.parse(raw) as { idUsuario?: EntityId; id?: EntityId };
    return String(parsed?.idUsuario ?? parsed?.id ?? '');
  } catch (err) {
    console.warn('[alertsApi] Unable to read stored user ID:', err);
    return '';
  }
}

function withReporterUser(payload: AlertPayload): AlertPayload {
  const reporterId = String(
    payload.reporterUserId ||
      payload.idUsuarioReporta ||
      payload.idUsuario ||
      getStoredUserId() ||
      ''
  );
  if (!reporterId) return payload;
  return {
    ...payload,
    reporterUserId: reporterId,
    idUsuarioReporta: reporterId,
    idUsuario: reporterId,
  };
}

function normalizeAlert(raw: RawAlertRecord): PhytosanitaryAlert {
  const id = raw.id ?? raw.idAlerta ?? '';
  return {
    id,
    idAlerta: raw.idAlerta ?? id,
    idCampo: raw.idCampo ?? raw.campoId ?? raw.campo?.idCampo ?? raw.campo?.id,
    campoId: raw.campoId ?? raw.idCampo,
    idCultivo: raw.idCultivo ?? raw.cultivoId ?? raw.cultivo?.idCultivo ?? raw.cultivo?.id ?? null,
    cultivoId: raw.cultivoId ?? raw.idCultivo ?? null,
    reporterUserId:
      raw.reporterUserId ??
      raw.idUsuarioReporta ??
      raw.idUsuario ??
      raw.usuario?.idUsuario ??
      raw.usuario?.id,
    idUsuarioReporta: raw.idUsuarioReporta,
    idUsuario: raw.idUsuario,
    campo: raw.campo ? { id: raw.campo.id != null ? String(raw.campo.id) : undefined, idCampo: raw.campo.idCampo != null ? String(raw.campo.idCampo) : undefined, nombre: raw.campo.nombre } : undefined,
    cultivo: raw.cultivo ? { id: raw.cultivo.id != null ? String(raw.cultivo.id) : undefined, idCultivo: raw.cultivo.idCultivo != null ? String(raw.cultivo.idCultivo) : undefined, nombre: raw.cultivo.nombre } : undefined,
    usuario: raw.usuario ? { id: raw.usuario.id != null ? String(raw.usuario.id) : raw.usuario.idUsuario != null ? String(raw.usuario.idUsuario) : undefined, fullName: raw.usuario.nombreCompleto } : undefined,
    tipoProblema: typeof raw.tipoProblema === 'string' ? raw.tipoProblema : 'OTRO',
    fechaDeteccion: typeof raw.fechaDeteccion === 'string' ? raw.fechaDeteccion : '',
    descripcionProblema: typeof raw.descripcionProblema === 'string' ? raw.descripcionProblema : '',
    solucionAplicada: raw.solucionAplicada ?? null,
    atendida: Boolean(raw.atendida || raw.solucionAplicada),
    estado: raw.estado !== false,
  };
}

export const alertsApi = {
  getAll: async (signal?: AbortSignal): Promise<PhytosanitaryAlert[]> => {
    const res = signal
      ? await apiClient.get<unknown>('/alertas', { signal })
      : await apiClient.get<unknown>('/alertas');
    const items = ensureArrayResponse<RawAlertRecord>(res.data, 'alertas fitosanitarias');
    return items.map(normalizeAlert);
  },

  getPending: async (signal?: AbortSignal): Promise<PhytosanitaryAlert[]> => {
    const res = signal
      ? await apiClient.get<unknown>('/alertas/pendientes', { signal })
      : await apiClient.get<unknown>('/alertas/pendientes');
    const items = ensureArrayResponse<RawAlertRecord>(res.data, 'alertas pendientes');
    return items.map(normalizeAlert);
  },

  create: async (payload: AlertPayload): Promise<PhytosanitaryAlert> => {
    const res = await apiClient.post<unknown>('/alertas', withReporterUser(payload));
    const data = ensureObjectResponse<RawAlertRecord>(res.data, 'creación de alerta');
    return normalizeAlert(data);
  },

  update: async (id: EntityId, payload: AlertPayload): Promise<PhytosanitaryAlert> => {
    const encodedId = encodePathParam(id, 'id');
    const res = await apiClient.put<unknown>(`/alertas/${encodedId}`, withReporterUser(payload));
    const data = ensureObjectResponse<RawAlertRecord>(res.data, 'actualización de alerta');
    return normalizeAlert(data);
  },

  attend: async (id: EntityId, solucionAplicada: string): Promise<unknown> => {
    const encodedId = encodePathParam(id, 'id');
    const res = await apiClient.patch(`/alertas/${encodedId}/atender`, { solucionAplicada });
    return res.data;
  },

  softDelete: async (id: EntityId): Promise<unknown> => {
    const encodedId = encodePathParam(id, 'id');
    const res = await apiClient.patch(`/alertas/${encodedId}/eliminar`, {});
    return res.data;
  },

  restore: async (id: EntityId): Promise<unknown> => {
    const encodedId = encodePathParam(id, 'id');
    const res = await apiClient.patch(`/alertas/${encodedId}/restaurar`, {});
    return res.data;
  },
};
