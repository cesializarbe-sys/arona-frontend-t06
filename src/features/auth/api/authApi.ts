// Contract reference: docs/api-contract.md (Authentication & Users)
import {
  apiClient,
  encodePathParam,
  ensureArrayResponse,
  ensureObjectResponse,
} from '../../../shared/api/httpClient';
import type {
  AuthCredentials,
  AuthSession,
  EntityId,
  User,
  UserPayload,
} from '../../../shared/types/domain';

export interface RawUserRecord extends Record<string, unknown> {
  id?: EntityId;
  idUsuario?: EntityId;
  nombres?: string;
  apellidos?: string;
  nombreCompleto?: string;
  correo?: string;
  dni?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  rol?: string;
  area?: string;
  estado?: boolean;
  token?: string;
  // Also accept already-normalized domain keys when reading cached localStorage entries
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  nationalId?: string | null;
  phone?: string | null;
  address?: string | null;
  role?: string;
  active?: boolean;
}

interface RawUserDto {
  nombreCompleto?: string;
  nombres?: string;
  apellidos?: string;
  correo?: string;
  password?: string;
  dni?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  rol?: string;
  area?: string;
  estado?: boolean;
}

function toUserDto(payload: Partial<UserPayload>): RawUserDto {
  const dto: RawUserDto = {};
  if (payload.fullName !== undefined) dto.nombreCompleto = payload.fullName;
  if (payload.firstName !== undefined) dto.nombres = payload.firstName;
  if (payload.lastName !== undefined) dto.apellidos = payload.lastName;
  if (payload.email !== undefined) dto.correo = payload.email;
  if (payload.password !== undefined) dto.password = payload.password;
  if (payload.nationalId !== undefined) dto.dni = payload.nationalId;
  if (payload.phone !== undefined) dto.telefono = payload.phone;
  if (payload.address !== undefined) dto.direccion = payload.address;
  if (payload.role !== undefined) dto.rol = payload.role;
  if (payload.area !== undefined) dto.area = payload.area;
  if (payload.active !== undefined) dto.estado = payload.active;
  return dto;
}

export const normalizeUser = (raw: RawUserRecord | null | undefined): User | null => {
  if (!raw || typeof raw !== 'object') return null;
  const rawId = raw.id ?? raw.idUsuario;
  const firstName =
    typeof raw.firstName === 'string'
      ? raw.firstName
      : typeof raw.nombres === 'string'
      ? raw.nombres
      : '';
  const lastName =
    typeof raw.lastName === 'string'
      ? raw.lastName
      : typeof raw.apellidos === 'string'
      ? raw.apellidos
      : '';
  const email =
    typeof raw.email === 'string'
      ? raw.email
      : typeof raw.correo === 'string'
      ? raw.correo
      : '';
  const rawFullName =
    (typeof raw.fullName === 'string' && raw.fullName.trim()) ||
    (typeof raw.nombreCompleto === 'string' && raw.nombreCompleto.trim()) ||
    '';
  const fullName = rawFullName || `${firstName} ${lastName}`.trim() || email || 'Usuario';

  return {
    id: rawId != null ? String(rawId) : '',
    firstName,
    lastName,
    fullName,
    email,
    nationalId: raw.nationalId !== undefined ? raw.nationalId : raw.dni ?? null,
    phone: raw.phone !== undefined ? raw.phone : raw.telefono ?? null,
    address: raw.address !== undefined ? raw.address : raw.direccion ?? null,
    role:
      typeof raw.role === 'string'
        ? raw.role
        : typeof raw.rol === 'string'
        ? raw.rol
        : undefined,
    area: typeof raw.area === 'string' ? raw.area : undefined,
    active:
      typeof raw.active === 'boolean'
        ? raw.active
        : typeof raw.estado === 'boolean'
        ? raw.estado
        : true,
  };
};

export const authApi = {
  login: async (credentials: AuthCredentials): Promise<AuthSession> => {
    const res = await apiClient.post<RawUserRecord>('/usuarios/login', {
      correo: credentials.email,
      password: credentials.password,
    });
    const data = ensureObjectResponse<RawUserRecord>(res.data, 'inicio de sesión');
    const user = normalizeUser(data);
    if (!user) {
      throw new Error('Respuesta de usuario inválida al iniciar sesión.');
    }
    const token =
      (typeof data.token === 'string' && data.token) ||
      btoa(
        JSON.stringify({
          id: user.id,
          email: user.email,
          ts: Date.now(),
        })
      );
    return { token, user };
  },

  loginAdmin: async (credentials: AuthCredentials): Promise<AuthSession> => {
    const res = await apiClient.post<RawUserRecord>('/usuarios/login', {
      correo: credentials.email,
      password: credentials.password,
    });
    const data = ensureObjectResponse<RawUserRecord>(res.data, 'inicio de sesión administrador');
    const user = normalizeUser(data);
    if (!user) {
      throw new Error('Respuesta de usuario inválida al iniciar sesión.');
    }
    const roleUpper = String(user.role || '').toUpperCase();
    if (roleUpper !== 'ADMINISTRADOR' && roleUpper !== 'ADMIN') {
      throw new Error('Acceso denegado: se requiere rol de Administrador');
    }
    const token =
      (typeof data.token === 'string' && data.token) ||
      btoa(
        JSON.stringify({
          id: user.id,
          email: user.email,
          role: 'ADMIN',
          ts: Date.now(),
        })
      );
    return { token, user };
  },

  register: async (userData: UserPayload): Promise<User> => {
    const res = await apiClient.post<RawUserRecord>('/usuarios', toUserDto(userData));
    const data = ensureObjectResponse<RawUserRecord>(res.data, 'registro de usuario');
    const user = normalizeUser(data);
    if (!user) throw new Error('No se pudo normalizar el usuario registrado.');
    return user;
  },

  getUserById: async (id: EntityId, signal?: AbortSignal): Promise<User> => {
    const encodedId = encodePathParam(id, 'id');
    const res = await apiClient.get<RawUserRecord>(`/usuarios/${encodedId}`, { signal });
    const data = ensureObjectResponse<RawUserRecord>(res.data, 'usuario');
    const user = normalizeUser(data);
    if (!user) throw new Error('Usuario no encontrado.');
    return user;
  },

  getProfile: async (id: EntityId, signal?: AbortSignal): Promise<User> => {
    return authApi.getUserById(id, signal);
  },

  getAllUsers: async (signal?: AbortSignal): Promise<User[]> => {
    const res = await apiClient.get<unknown>('/usuarios', { signal });
    const items = ensureArrayResponse<RawUserRecord>(res.data, 'usuarios');
    return items.map(normalizeUser).filter((u): u is User => u !== null);
  },

  createUser: async (payload: UserPayload): Promise<User> => {
    const res = await apiClient.post<RawUserRecord>('/usuarios', toUserDto(payload));
    const data = ensureObjectResponse<RawUserRecord>(res.data, 'creación de usuario');
    const user = normalizeUser(data);
    if (!user) throw new Error('Respuesta inválida al crear usuario.');
    return user;
  },

  updateUser: async (id: EntityId, payload: Partial<UserPayload>): Promise<User> => {
    const encodedId = encodePathParam(id, 'id');
    const res = await apiClient.put<RawUserRecord>(`/usuarios/${encodedId}`, toUserDto(payload));
    const data = ensureObjectResponse<RawUserRecord>(res.data, 'actualización de usuario');
    const user = normalizeUser(data);
    if (!user) throw new Error('Respuesta inválida al actualizar usuario.');
    return user;
  },

  deleteUser: async (id: EntityId): Promise<unknown> => {
    const encodedId = encodePathParam(id, 'id');
    const res = await apiClient.patch(`/usuarios/${encodedId}/eliminar`, {});
    return res.data;
  },

  restoreUser: async (id: EntityId): Promise<unknown> => {
    const encodedId = encodePathParam(id, 'id');
    const res = await apiClient.patch(`/usuarios/${encodedId}/restaurar`, {});
    return res.data;
  },

  changePassword: async (id: EntityId, password: string): Promise<unknown> => {
    const encodedId = encodePathParam(id, 'id');
    const res = await apiClient.put(`/usuarios/${encodedId}`, { password });
    return res.data;
  },
};
