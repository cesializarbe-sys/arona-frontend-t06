import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { ToastProvider } from '../shared/context/ToastContext';
import { AccessDeniedView } from '../shared/components/AccessDeniedView';
import { TOKEN_STORAGE_KEY } from '../shared/api/httpClient';

const mockLogin = vi.fn();

vi.mock('../features/auth/api/authApi', () => ({
  authApi: {
    login: (...args: unknown[]) => mockLogin(...args),
    loginAdmin: vi.fn(),
    register: vi.fn(),
    updateProfile: vi.fn(),
    getAllUsers: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  },
}));

describe('Auth flow and role access UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('submits valid login credentials and stores authenticated session', async () => {
    mockLogin.mockResolvedValue({
      token: 'jwt-test-token-123',
      user: {
        id: '7',
        firstName: 'Ana',
        lastName: 'Rojas',
        fullName: 'Ana Rojas',
        email: 'ana@agrosoft.pe',
        role: 'ENCARGADO',
        active: true,
      },
    });

    render(
      <MemoryRouter initialEntries={['/auth/login']}>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<div>Dashboard Mock</div>} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Correo Electrónico/i), {
      target: { value: 'ana@agrosoft.pe' },
    });
    fireEvent.change(screen.getByLabelText(/^Contraseña$/i), {
      target: { value: 'secret123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'ana@agrosoft.pe',
        password: 'secret123',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Dashboard Mock')).toBeInTheDocument();
    });
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('jwt-test-token-123');
  });

  it('shows server error feedback when credentials are rejected', async () => {
    mockLogin.mockRejectedValue(new Error('Credenciales incorrectas'));

    render(
      <MemoryRouter initialEntries={['/auth/login']}>
        <ToastProvider>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Correo Electrónico/i), {
      target: { value: 'wrong@agrosoft.pe' },
    });
    fireEvent.change(screen.getByLabelText(/^Contraseña$/i), {
      target: { value: 'badpass' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    expect(await screen.findByText(/Credenciales incorrectas/i)).toBeInTheDocument();
  });

  it('renders an explicit 403 access denied view for restricted routes', () => {
    render(
      <MemoryRouter>
        <AccessDeniedView />
      </MemoryRouter>
    );

    expect(screen.getByText(/Acceso Denegado \(403\)/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Volver al Inicio/i })).toHaveAttribute(
      'href',
      '/dashboard'
    );
  });
});
