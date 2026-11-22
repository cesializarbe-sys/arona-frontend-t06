/**
 * Centralized domain constants for Sociedad Agrícola Arona S.A.
 */

export const ALERT_PROBLEM_TYPES = ['PLAGA', 'ENFERMEDAD', 'OTRO'] as const;
export type AlertProblemType = (typeof ALERT_PROBLEM_TYPES)[number];

export const ALERT_STATUS = {
  PENDING: 'PENDIENTE',
  ATTENDED: 'ATENDIDO',
} as const;

export const ALERT_STATUSES = [ALERT_STATUS.PENDING, ALERT_STATUS.ATTENDED] as const;
export type AlertStatus = (typeof ALERT_STATUSES)[number];

export const QUALITY_DICTA = ['APROBADO', 'RECHAZADO', 'OBSERVADO'] as const;
export type QualityDictum = (typeof QUALITY_DICTA)[number];

export const CROP_TYPES = ['MANDARINA', 'PALTA', 'ARANDANO', 'CAQUI'] as const;
export type CropType = (typeof CROP_TYPES)[number];

export const CROP_HEALTH_STATUSES = ['BUENO', 'EN_RIESGO', 'CON_PROBLEMAS'] as const;
export type CropHealthStatus = (typeof CROP_HEALTH_STATUSES)[number];

export const ACTIVITY_TYPES = [
  'RIEGO',
  'PODA',
  'FUMIGACION',
  'FERTILIZACION',
  'DESHIERBE',
  'OTRO',
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const USER_ROLES = ['ADMINISTRADOR', 'ENCARGADO'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_AREAS = [
  'CAMPO',
  'PLANTA',
  'ALMACEN',
  'CALIDAD',
  'ADMINISTRACION',
] as const;
export type UserArea = (typeof USER_AREAS)[number];

export const CALIBERS = ['PEQUEÑO', 'MEDIANO', 'GRANDE', 'EXTRA_GRANDE'] as const;
export const FRUIT_STATUSES = ['BUENA', 'DAÑADA', 'DESCARTE'] as const;
export const THRESHOLD_STATUSES = ['BAJO_UMBRAL', 'NORMAL'] as const;

export const IRRIGATION_SYSTEMS = ['Goteo', 'Aspersión', 'Microaspersión', 'Gravedad'] as const;
