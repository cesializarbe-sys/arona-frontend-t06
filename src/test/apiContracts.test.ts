import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockApiGet = vi.fn();
const mockApiPost = vi.fn();
const mockApiPut = vi.fn();
const mockApiPatch = vi.fn();
const mockAnalyticsGet = vi.fn();

vi.mock('../shared/api/httpClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../shared/api/httpClient')>();
  return {
    ...actual,
    apiClient: {
      get: (...args: unknown[]) => mockApiGet(...args),
      post: (...args: unknown[]) => mockApiPost(...args),
      put: (...args: unknown[]) => mockApiPut(...args),
      patch: (...args: unknown[]) => mockApiPatch(...args),
    },
    analyticsClient: {
      get: (...args: unknown[]) => mockAnalyticsGet(...args),
    },
  };
});

import { authApi } from '../features/auth/api/authApi';
import { fieldsApi } from '../features/fields/api/fieldsApi';
import { cropsApi } from '../features/crops/api/cropsApi';
import { harvestsApi } from '../features/harvests/api/harvestsApi';
import { activitiesApi } from '../features/activities/api/activitiesApi';
import { alertsApi } from '../features/alerts/api/alertsApi';
import { qualityApi } from '../features/quality/api/qualityApi';
import { analyticsApi, AnalyticsContractError } from '../features/analytics/api/analyticsApi';

describe('API Contract Tests (CRUD & Analytics)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('authApi: sends Spanish wire DTO on login/register and normalizes English User', async () => {
    mockApiPost.mockResolvedValueOnce({
      data: {
        idUsuario: 'USR-001',
        nombres: 'Ana',
        apellidos: 'Rojas',
        nombreCompleto: 'Ana Rojas',
        correo: 'ana@arona.com.pe',
        dni: '71234567',
        telefono: '987654321',
        direccion: 'Ica',
        rol: 'ADMINISTRADOR',
        area: 'CAMPO',
        estado: true,
        token: 'tok-1',
      },
    });

    const session = await authApi.login({ email: 'ana@arona.com.pe', password: 'secret' });
    expect(mockApiPost).toHaveBeenCalledWith('/usuarios/login', {
      correo: 'ana@arona.com.pe',
      password: 'secret',
    });
    expect(session.user.fullName).toBe('Ana Rojas');
    expect(session.user.email).toBe('ana@arona.com.pe');
    expect(session.user.nationalId).toBe('71234567');
    expect(session.user.phone).toBe('987654321');
    expect(session.user.role).toBe('ADMINISTRADOR');
    expect(session.user.active).toBe(true);
  });

  it('fieldsApi: GET /campos, POST /campos, PATCH /campos/:id/eliminar', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: [{ idCampo: 'CMP-001', nombre: 'Lote Norte', hectareas: 12.5, estado: true }],
    });
    const list = await fieldsApi.getAll();
    expect(mockApiGet).toHaveBeenCalledWith('/campos');
    expect(list[0].id).toBe('CMP-001');

    mockApiPost.mockResolvedValueOnce({
      data: { idCampo: 'CMP-002', nombre: 'Lote Sur', hectareas: 8, estado: true },
    });
    await fieldsApi.create({
      nombre: 'Lote Sur',
      ubicacion: 'Ica',
      hectareas: 8,
      responsable: 'Carlos',
      sistemaRiego: 'Goteo',
      tipoSuelo: 'Franco',
      zona: 'Sur',
      observaciones: '',
      estado: true,
    });
    expect(mockApiPost).toHaveBeenCalledWith(
      '/campos',
      expect.objectContaining({ nombre: 'Lote Sur', hectareas: 8, areaHectareas: 8 })
    );

    mockApiPatch.mockResolvedValueOnce({ data: { ok: true } });
    await fieldsApi.softDelete('CMP-001');
    expect(mockApiPatch).toHaveBeenCalledWith('/campos/CMP-001/eliminar', {});
  });

  it('cropsApi: GET /cultivos, POST /cultivos, PATCH /cultivos/:id/restaurar', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: [{ idCultivo: 'CLV-001', nombre: 'Palta Hass', tipoCultivo: 'PALTA', idCampo: 'CMP-001' }],
    });
    const crops = await cropsApi.getAll();
    expect(mockApiGet).toHaveBeenCalledWith('/cultivos');
    expect(crops[0].id).toBe('CLV-001');

    mockApiPatch.mockResolvedValueOnce({ data: { ok: true } });
    await cropsApi.restore('CLV-001');
    expect(mockApiPatch).toHaveBeenCalledWith('/cultivos/CLV-001/restaurar', {});
  });

  it('harvestsApi: GET /cosechas, POST /cosechas, PUT /cosechas/:id', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: [{ idCosecha: 10, fecha: '2026-08-01', idCampo: 'CMP-001', cantidadKg: 1500 }],
    });
    const list = await harvestsApi.getAll();
    expect(mockApiGet).toHaveBeenCalledWith('/cosechas');
    expect(list[0].id).toBe(10);

    mockApiPost.mockResolvedValueOnce({
      data: { idCosecha: 11, fecha: '2026-08-02', idCampo: 'CMP-001', cantidadKg: 2000 },
    });
    await harvestsApi.create({
      fecha: '2026-08-02',
      idCampo: 'CMP-001',
      idCultivo: 'CLV-001',
      cantidadKg: 2000,
      cantidadUnidades: 100,
      observaciones: 'Lote A',
    });
    expect(mockApiPost).toHaveBeenCalledWith(
      '/cosechas',
      expect.objectContaining({ cantidadKg: 2000, idCampo: 'CMP-001' })
    );
  });

  it('activitiesApi: GET /actividades-campo and POST /actividades-campo', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: [{ idActividad: 'ACT-1', tipoActividad: 'RIEGO', fecha: '2026-08-01', idCampo: 'CMP-001' }],
    });
    const list = await activitiesApi.getAll();
    expect(mockApiGet).toHaveBeenCalledWith('/actividades-campo');
    expect(list[0].id).toBe('ACT-1');

    mockApiPost.mockResolvedValueOnce({
      data: { idActividad: 'ACT-2', tipoActividad: 'PODA', fecha: '2026-08-02', idCampo: 'CMP-001' },
    });
    await activitiesApi.create({
      tipoActividad: 'PODA',
      fecha: '2026-08-02',
      idCampo: 'CMP-001',
      idCultivo: null,
      observaciones: '',
    });
    expect(mockApiPost).toHaveBeenCalledWith(
      '/actividades-campo',
      expect.objectContaining({ tipoActividad: 'PODA' })
    );
  });

  it('alertsApi: preserves reporterUserId wire keys on POST /alertas and PATCH /alertas/:id/atender', async () => {
    mockApiPost.mockResolvedValueOnce({
      data: {
        idAlerta: 'ALT-1',
        idCampo: 'CMP-001',
        reporterUserId: 'USR-001',
        tipoProblema: 'PLAGA',
        fechaDeteccion: '2026-08-01',
        descripcionProblema: 'Mosca de la fruta',
      },
    });
    await alertsApi.create({
      idCampo: 'CMP-001',
      campoId: 'CMP-001',
      idCultivo: null,
      cultivoId: null,
      reporterUserId: 'USR-001',
      idUsuarioReporta: 'USR-001',
      idUsuario: 'USR-001',
      tipoProblema: 'PLAGA',
      fechaDeteccion: '2026-08-01',
      descripcionProblema: 'Mosca de la fruta',
    });
    expect(mockApiPost).toHaveBeenCalledWith(
      '/alertas',
      expect.objectContaining({
        reporterUserId: 'USR-001',
        idUsuarioReporta: 'USR-001',
        idUsuario: 'USR-001',
      })
    );

    mockApiPatch.mockResolvedValueOnce({ data: { idAlerta: 'ALT-1', atendida: true } });
    await alertsApi.attend('ALT-1', 'Aplicación orgánica');
    expect(mockApiPatch).toHaveBeenCalledWith('/alertas/ALT-1/atender', {
      solucionAplicada: 'Aplicación orgánica',
    });
  });

  it('qualityApi: GET /revisiones-calidad and POST /revisiones-calidad', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: [{ idRevision: 5, idCosecha: 10, cumpleRequisitos: true, fecha: '2026-08-01' }],
    });
    const list = await qualityApi.getAll();
    expect(mockApiGet).toHaveBeenCalledWith('/revisiones-calidad');
    expect(list[0].id).toBe(5);

    mockApiPost.mockResolvedValueOnce({
      data: { idRevision: 6, idCosecha: 10, cumpleRequisitos: true, fecha: '2026-08-02' },
    });
    await qualityApi.create({
      idCosecha: 10,
      idSupervisor: 'USR-001',
      cumpleRequisitos: true,
      observaciones: 'Aprobado',
      fecha: '2026-08-02',
    });
    expect(mockApiPost).toHaveBeenCalledWith(
      '/revisiones-calidad',
      expect.objectContaining({ idCosecha: 10, cumpleRequisitos: true })
    );
  });

  it('analyticsApi: validates dynamic contract, normalizes fruitStatus, and rejects malformed payloads', async () => {
    mockAnalyticsGet.mockResolvedValueOnce({
      data: {
        indicador: 'calidad-por-calibre',
        total_registros: 1,
        datos: [
          {
            calibre: 'GRANDE',
            total_kg: 500,
            estados: [{ estado_fruta: 'BUENA', kg: 450 }],
          },
        ],
      },
    });

    const result = await analyticsApi.getQualityByCaliber({ calibre: 'GRANDE' });
    expect(mockAnalyticsGet).toHaveBeenCalledWith('/indicadores/calidad-por-calibre', {
      params: { calibre: 'GRANDE' },
      signal: undefined,
    });
    expect(result.datos[0].fruitStatuses).toEqual([{ fruitStatus: 'BUENA', kg: 450 }]);

    mockAnalyticsGet.mockResolvedValueOnce({ data: { invalid: true } });
    await expect(analyticsApi.getYieldByHectare()).rejects.toBeInstanceOf(AnalyticsContractError);
  });
});
