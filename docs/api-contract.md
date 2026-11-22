# API Contract Reference — Sociedad Agrícola Arona S.A. (`ASE251S4_T06-fe`)

This document specifies the HTTP contracts consumed by the React frontend across both backend services.

---

## 1. Transactional / Master Data Service (`VITE_API_URL`, default `http://localhost:8085/api`)

- **Authentication**: Bearer JWT attached automatically via `Authorization: Bearer <token>` header (`src/shared/api/httpClient.ts`).
- **Standard Error Responses**:
  - `400 Bad Request`: `{ message?: string, error?: string, detalle?: string }` — validation error.
  - `401 Unauthorized`: invalid/expired session. Frontend clears storage, emits `arona:session-expired`, and redirects to `/auth/login`.
  - `403 Forbidden`: `{ message?: string, detalle?: string }` — insufficient permissions. Frontend emits `arona:forbidden-access` and displays `AccessDeniedView` or toast error.
  - `404 Not Found`: `{ message?: string }` — resource not found.
  - `500 Internal Server Error`: `{ message?: string, error?: string }`.
  - `503 Service Unavailable`: upstream/database unavailable.

### 1.1 Authentication & Users (`src/features/auth/api/authApi.ts`)

| Method | Route | Query / Body | 2xx Response | Errors |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/usuarios/login` | Body: `{ correo: string (req), password: string (req) }` | `200` `RawUserRecord & { token?: string }` | `400`, `401`, `403`, `500` |
| `GET` | `/usuarios` | — | `200` `RawUserRecord[]` | `401`, `403`, `500` |
| `GET` | `/usuarios/:id` | Path: `id` (req) | `200` `RawUserRecord` | `401`, `403`, `404`, `500` |
| `POST` | `/usuarios` | Body: `{ nombreCompleto (req), nombres?, apellidos?, correo (req), password (req), dni?, telefono?, direccion?, rol (req), area (req), estado (req) }` | `201`/`200` `RawUserRecord` | `400`, `401`, `403`, `500` |
| `PUT` | `/usuarios/:id` | Path: `id` (req). Body: partial user fields or `{ password: string }` | `200` `RawUserRecord` | `400`, `401`, `403`, `404`, `500` |
| `PATCH` | `/usuarios/:id/eliminar` | Path: `id` (req). Body: `{}` | `200` status/message | `401`, `403`, `404`, `500` |
| `PATCH` | `/usuarios/:id/restaurar` | Path: `id` (req). Body: `{}` | `200` status/message | `401`, `403`, `404`, `500` |

### 1.2 Fields (`src/features/fields/api/fieldsApi.ts`)

| Method | Route | Query / Body | 2xx Response | Errors |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/campos` | — | `200` `RawFieldRecord[]` | `401`, `403`, `500` |
| `GET` | `/campos/estado/true` | — | `200` `RawFieldRecord[]` (active only) | `401`, `403`, `500` |
| `POST` | `/campos` | Body: `{ nombre (req), ubicacion (req), hectareas (req), areaHectareas (req), responsable (req), sistemaRiego (req), tipoSuelo (req), zona (req), observaciones, estado (req) }` | `201`/`200` `RawFieldRecord` | `400`, `401`, `403`, `500` |
| `PUT` | `/campos/:id` | Path: `id` (req). Body: same as `POST /campos` | `200` `RawFieldRecord` | `400`, `401`, `403`, `404`, `500` |
| `PATCH` | `/campos/:id/eliminar` | Path: `id` (req). Body: `{}` | `200` status/message | `401`, `403`, `404`, `500` |
| `PATCH` | `/campos/:id/restaurar` | Path: `id` (req). Body: `{}` | `200` status/message | `401`, `403`, `404`, `500` |
| `GET` | `/campos/export/pdf` | — | `200` `application/pdf` (`Blob`) | `401`, `403`, `500` |
| `GET` | `/campos/export/excel` | — | `200` `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`Blob`) | `401`, `403`, `500` |
| `POST` | `/campos/import/excel` | `multipart/form-data`: `file` (`.xlsx`, req) | `200` `ImportFieldsResult` | `400`, `401`, `403`, `500` |
| `POST` | `/campos/import/csv` | `multipart/form-data`: `file` (`.csv`, req) | `200` `ImportFieldsResult` | `400`, `401`, `403`, `500` |

### 1.3 Crops (`src/features/crops/api/cropsApi.ts`)

| Method | Route | Query / Body | 2xx Response | Errors |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/cultivos` | — | `200` `RawCropRecord[]` | `401`, `403`, `500` |
| `GET` | `/cultivos/estado/true` | — | `200` `RawCropRecord[]` | `401`, `403`, `500` |
| `POST` | `/cultivos` | Body: `{ nombre (req), tipoCultivo (req), frecuenciaRiegoDias (req), temperaturaIdeal (req), fechaSiembra (req), requiereSombra (req), estadoSalud (req), observaciones, idCampo (req), campoId (req) }` | `201`/`200` `RawCropRecord` | `400`, `401`, `403`, `500` |
| `PUT` | `/cultivos/:id` | Path: `id` (req). Body: same as `POST /cultivos` | `200` `RawCropRecord` | `400`, `401`, `403`, `404`, `500` |
| `PATCH` | `/cultivos/:id/eliminar` | Path: `id` (req). Body: `{}` | `200` status/message | `401`, `403`, `404`, `500` |
| `PATCH` | `/cultivos/:id/restaurar` | Path: `id` (req). Body: `{}` | `200` status/message | `401`, `403`, `404`, `500` |

### 1.4 Harvests (`src/features/harvests/api/harvestsApi.ts`)

| Method | Route | Query / Body | 2xx Response | Errors |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/cosechas` | — | `200` `RawHarvestRecord[]` | `401`, `403`, `500` |
| `POST` | `/cosechas` | Body: `{ fecha (req), idCampo (req), idCultivo (req), cantidadKg (req), cantidadUnidades (req), observaciones }` | `201`/`200` `RawHarvestRecord` | `400`, `401`, `403`, `500` |
| `PUT` | `/cosechas/:id` | Path: `id` (req). Body: same as `POST /cosechas` | `200` `RawHarvestRecord` | `400`, `401`, `403`, `404`, `500` |
| `PATCH` | `/cosechas/:id/eliminar` | Path: `id` (req). Body: `{}` | `200` status/message | `401`, `403`, `404`, `500` |
| `PATCH` | `/cosechas/:id/restaurar` | Path: `id` (req). Body: `{}` | `200` status/message | `401`, `403`, `404`, `500` |

### 1.5 Field Activities (`src/features/activities/api/activitiesApi.ts`)

| Method | Route | Query / Body | 2xx Response | Errors |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/actividades-campo` | — | `200` `RawActivityRecord[]` | `401`, `403`, `500` |
| `POST` | `/actividades-campo` | Body: `{ tipoActividad (req), fecha (req), idCampo (req), idCultivo (nullable), observaciones }` | `201`/`200` `RawActivityRecord` | `400`, `401`, `403`, `500` |
| `PUT` | `/actividades-campo/:id` | Path: `id` (req). Body: same as `POST` | `200` `RawActivityRecord` | `400`, `401`, `403`, `404`, `500` |
| `PATCH` | `/actividades-campo/:id/eliminar` | Path: `id` (req). Body: `{}` | `200` status/message | `401`, `403`, `404`, `500` |
| `PATCH` | `/actividades-campo/:id/restaurar` | Path: `id` (req). Body: `{}` | `200` status/message | `401`, `403`, `404`, `500` |

### 1.6 Phytosanitary Alerts (`src/features/alerts/api/alertsApi.ts`)

| Method | Route | Query / Body | 2xx Response | Errors |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/alertas` | — | `200` `RawAlertRecord[]` | `401`, `403`, `500` |
| `GET` | `/alertas/pendientes` | — | `200` `RawAlertRecord[]` | `401`, `403`, `500` |
| `POST` | `/alertas` | Body: `{ idCampo (req), campoId (req), idCultivo (nullable), cultivoId (nullable), reporterUserId (req), idUsuarioReporta (req), idUsuario (req), tipoProblema (req), fechaDeteccion (req), descripcionProblema (req) }` | `201`/`200` `RawAlertRecord` | `400`, `401`, `403`, `500` |
| `PUT` | `/alertas/:id` | Path: `id` (req). Body: same as `POST /alertas` | `200` `RawAlertRecord` | `400`, `401`, `403`, `404`, `500` |
| `PATCH` | `/alertas/:id/atender` | Path: `id` (req). Body: `{ solucionAplicada: string (req) }` | `200` `RawAlertRecord` | `400`, `401`, `403`, `404`, `500` |
| `PATCH` | `/alertas/:id/eliminar` | Path: `id` (req). Body: `{}` | `200` status/message | `401`, `403`, `404`, `500` |
| `PATCH` | `/alertas/:id/restaurar` | Path: `id` (req). Body: `{}` | `200` status/message | `401`, `403`, `404`, `500` |

### 1.7 Quality Reviews (`src/features/quality/api/qualityApi.ts`)

| Method | Route | Query / Body | 2xx Response | Errors |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/revisiones-calidad` | — | `200` `RawQualityRecord[]` | `401`, `403`, `500` |
| `POST` | `/revisiones-calidad` | Body: `{ idCosecha: number (req), idSupervisor: string (req), cumpleRequisitos: boolean (req), observaciones: string, fecha: string (req) }` | `201`/`200` `RawQualityRecord` | `400`, `401`, `403`, `500` |
| `PUT` | `/revisiones-calidad/:id` | Path: `id` (req). Body: same as `POST` | `200` `RawQualityRecord` | `400`, `401`, `403`, `404`, `500` |
| `PATCH` | `/revisiones-calidad/:id/eliminar` | Path: `id` (req). Body: `{}` | `200` status/message | `401`, `403`, `404`, `500` |
| `PATCH` | `/revisiones-calidad/:id/restaurar` | Path: `id` (req). Body: `{}` | `200` status/message | `401`, `403`, `404`, `500` |

---

## 2. Analytics Service (`VITE_ANALYTICS_API_URL`, default `http://localhost:5000/api`)

- **Read-only Flask service** (16 `GET` endpoints, no request body).
- **Access Control**: Backend does not enforce authentication; admin-only access is enforced in the frontend via `AdminRoute`.
- **Standard Error Responses (all 16 endpoints)**:
  - `400 Bad Request`: `{ error: string, detalle: string, parametro?: string }` (invalid filter parameter or enum value).
  - `500 Internal Server Error`: `{ error: string, detalle: string, parametro?: string, id_solicitud?: string }`.
  - `503 Service Unavailable`: `{ error: string, detalle: string, parametro?: string, id_solicitud?: string }` + header `Retry-After` (MongoDB / SQL Server unavailable).
- **Valid Enum Values (uppercase)**:
  - `tipoCultivo` / `tipo_cultivo`: `MANDARINA`, `PALTA`, `ARANDANO`, `CAQUI`
  - `calibre`: `PEQUEÑO`, `MEDIANO`, `GRANDE`, `EXTRA_GRANDE`
  - `estado_fruta`: `BUENA`, `DAÑADA`, `DESCARTE`
  - `estado_umbral`: `BAJO_UMBRAL`, `NORMAL`
  - `tipoProblema` / `tipo_problema`: `PLAGA`, `ENFERMEDAD`, `OTRO`
  - `estadoAlerta` / `estado_alerta`: `PENDIENTE`, `ATENDIDO`
  - `tipoActividad`: `RIEGO`, `PODA`, `FUMIGACION`, `FERTILIZACION`, `DESHIERBE`, `OTRO`
  - `rol`: `ADMINISTRADOR`, `ENCARGADO`
  - `area`: `CAMPO`, `PLANTA`, `ALMACEN`, `CALIDAD`, `ADMINISTRACION`
  - Field IDs: `CMP-###`. Dates: `YYYY-MM-DD`. All query params are optional.

### 2.1 Dashboard & Analytics Summary (4 endpoints)

| Method | Route | Query Params | 200 Response Type |
| :--- | :--- | :--- | :--- |
| `GET` | `/dashboard` | — | `AnalyticsDashboardPayload` (`{ mongoDB, sqlServer }`) |
| `GET` | `/analytics/salud-cultivos` | — | `CropHealthPayload` |
| `GET` | `/analytics/riesgo-fitosanitario` | — | `PhytosanitaryRiskPayload` |
| `GET` | `/analytics/actividad-operacional` | — | `OperationalActivityAnalysisPayload` |

### 2.2 Historical Indicators (6 endpoints)

| # | Method | Route | Optional Query Params | 200 Response Type |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `GET` | `/indicadores/produccion-por-cultivo` | `tipoCultivo` | `ProductionByCropResponse` |
| 2 | `GET` | `/indicadores/alertas-por-campo` | `estadoAlerta`, `tipoProblema`, `top` | `AlertsByFieldResponse` |
| 3 | `GET` | `/indicadores/actividad-operacional` | `tipoActividad`, `campoId`, `fechaDesde`, `fechaHasta`, `top` | `OperationalActivityResponse` |
| 4 | `GET` | `/indicadores/ocupacion-por-zona` | `zona` | `OccupancyByZoneResponse` |
| 5 | `GET` | `/indicadores/productividad-usuarios` | `rol`, `area`, `top` | `UserProductivityResponse` |
| 6 | `GET` | `/indicadores/diversificacion-cultivos` | `campoId`, `minCultivos` | `CropDiversificationResponse` |

### 2.3 Dynamic Indicators (6 endpoints)

All 6 return the uniform `IndicatorEnvelope<TRow, TSummary>` (`{ indicador, filtros_aplicados, total_registros, datos: TRow[], resumen?, paginacion? }`):

| # | Method | Route | Optional Query Params | 200 Response Type |
| :---: | :--- | :--- | :--- | :--- |
| 7 | `GET` | `/indicadores/rendimiento-por-hectarea` | `fecha_inicio`, `fecha_fin`, `zona`, `id_campo` | `YieldPerHectareResponse` |
| 8 | `GET` | `/indicadores/calidad-por-calibre` | `fecha_inicio`, `fecha_fin`, `calibre`, `estado_fruta` | `QualityByCaliberResponse` |
| 9 | `GET` | `/indicadores/cumplimiento-revisiones` | `fecha_inicio`, `fecha_fin`, `id_campo`, `id_usuario_supervisor` | `ReviewComplianceResponse` |
| 10 | `GET` | `/indicadores/cobertura-inventario` | `tipo_cultivo`, `estado_umbral`, `fecha_ingreso_inicio`, `fecha_ingreso_fin`, `page` (>=1), `size` (1–100, default 50) | `InventoryCoverageResponse` |
| 11 | `GET` | `/indicadores/exportabilidad-por-cultivo` | `fecha_inicio`, `fecha_fin`, `tipo_cultivo`, `apto_exportacion` (`"true"`/`"false"`) | `ExportabilityByCropResponse` |
| 12 | `GET` | `/indicadores/tiempo-resolucion-alertas` | `tipo_problema`, `estado_alerta`, `id_campo`, `fecha_inicio`, `fecha_fin` | `AlertResolutionTimeResponse` |
