// Contract reference: docs/api-contract.md (Fields)
import {
  apiClient,
  encodePathParam,
  ensureArrayResponse,
  ensureObjectResponse,
} from '../../../shared/api/httpClient';
import type {
  EntityId,
  Field,
  FieldPayload,
  ImportFieldsResult,
} from '../../../shared/types/domain';

interface RawFieldRecord extends Record<string, unknown> {
  id?: EntityId;
  idCampo?: EntityId;
  _id?: string;
  nombre?: string;
  ubicacion?: string;
  hectareas?: number;
  areaHectareas?: number;
  responsable?: string;
  sistemaRiego?: string;
  tipoSuelo?: string;
  zona?: string;
  observaciones?: string;
  estado?: boolean;
  fechaRegistro?: string;
}

function normalizeField(raw: RawFieldRecord): Field {
  const id = raw.id != null ? String(raw.id) : raw.idCampo != null ? String(raw.idCampo) : '';
  const hectares = Number(raw.hectareas ?? raw.areaHectareas ?? 0);
  return {
    id,
    idCampo: id,
    _id: raw._id,
    nombre: typeof raw.nombre === 'string' ? raw.nombre : '',
    ubicacion: typeof raw.ubicacion === 'string' ? raw.ubicacion : '',
    hectareas: Number.isNaN(hectares) ? 0 : hectares,
    areaHectareas: Number.isNaN(hectares) ? 0 : hectares,
    responsable: typeof raw.responsable === 'string' ? raw.responsable : undefined,
    sistemaRiego: typeof raw.sistemaRiego === 'string' ? raw.sistemaRiego : undefined,
    tipoSuelo: typeof raw.tipoSuelo === 'string' ? raw.tipoSuelo : undefined,
    zona: typeof raw.zona === 'string' ? raw.zona : undefined,
    observaciones: typeof raw.observaciones === 'string' ? raw.observaciones : undefined,
    estado: raw.estado !== false,
    fechaRegistro: typeof raw.fechaRegistro === 'string' ? raw.fechaRegistro : undefined,
  };
}

async function parseBlobError(err: unknown): Promise<never> {
  const candidate = err as { response?: { data?: unknown } };
  if (candidate?.response?.data instanceof Blob) {
    const text = await candidate.response.data.text();
    try {
      candidate.response.data = JSON.parse(text);
    } catch {
      console.warn('[fieldsApi] Non-JSON error blob received during file export.');
    }
  }
  throw err;
}

export const fieldsApi = {
  getAll: async (signal?: AbortSignal): Promise<Field[]> => {
    const res = signal
      ? await apiClient.get<unknown>('/campos', { signal })
      : await apiClient.get<unknown>('/campos');
    const items = ensureArrayResponse<RawFieldRecord>(res.data, 'campos');
    return items.map(normalizeField);
  },

  getActive: async (signal?: AbortSignal): Promise<Field[]> => {
    const res = signal
      ? await apiClient.get<unknown>('/campos/estado/true', { signal })
      : await apiClient.get<unknown>('/campos/estado/true');
    const items = ensureArrayResponse<RawFieldRecord>(res.data, 'campos activos');
    return items.map(normalizeField);
  },

  create: async (field: FieldPayload): Promise<Field> => {
    const areaValue = field.hectareas ?? field.areaHectareas ?? 0;
    const payload = {
      ...field,
      areaHectareas: areaValue,
      hectareas: areaValue,
    };
    const res = await apiClient.post<unknown>('/campos', payload);
    const data = ensureObjectResponse<RawFieldRecord>(res.data, 'creación de campo');
    return normalizeField(data);
  },

  update: async (id: EntityId, field: FieldPayload): Promise<Field> => {
    const encodedId = encodePathParam(id, 'id');
    const areaValue = field.hectareas ?? field.areaHectareas ?? 0;
    const payload = {
      ...field,
      areaHectareas: areaValue,
      hectareas: areaValue,
    };
    const res = await apiClient.put<unknown>(`/campos/${encodedId}`, payload);
    const data = ensureObjectResponse<RawFieldRecord>(res.data, 'actualización de campo');
    return normalizeField(data);
  },

  softDelete: async (id: EntityId): Promise<unknown> => {
    const encodedId = encodePathParam(id, 'id');
    const res = await apiClient.patch(`/campos/${encodedId}/eliminar`, {});
    return res.data;
  },

  restore: async (id: EntityId): Promise<unknown> => {
    const encodedId = encodePathParam(id, 'id');
    const res = await apiClient.patch(`/campos/${encodedId}/restaurar`, {});
    return res.data;
  },

  exportPdf: async (): Promise<void> => {
    try {
      const res = await apiClient.get<BlobPart>('/campos/export/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'campos_arona.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      await parseBlobError(err);
    }
  },

  exportExcel: async (): Promise<void> => {
    try {
      const res = await apiClient.get<BlobPart>('/campos/export/excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(
        new Blob([res.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
      );
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'campos_arona.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      await parseBlobError(err);
    }
  },

  importExcel: async (file: File): Promise<ImportFieldsResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<ImportFieldsResult>('/campos/import/excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return ensureObjectResponse<ImportFieldsResult & Record<string, unknown>>(
      res.data,
      'importación Excel'
    );
  },

  importCsv: async (file: File): Promise<ImportFieldsResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<ImportFieldsResult>('/campos/import/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return ensureObjectResponse<ImportFieldsResult & Record<string, unknown>>(
      res.data,
      'importación CSV'
    );
  },

  importFile: async (file: File): Promise<ImportFieldsResult> => {
    if (!file) {
      throw new Error('Debe seleccionar un archivo para importar.');
    }
    const name = file.name ? file.name.toLowerCase() : '';
    if (name.endsWith('.xlsx')) {
      return fieldsApi.importExcel(file);
    }
    if (name.endsWith('.csv')) {
      return fieldsApi.importCsv(file);
    }
    throw new Error('Formato no válido. Debe seleccionar un archivo .xlsx o .csv');
  },
};
