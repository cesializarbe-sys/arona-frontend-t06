import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { ToastProvider } from '../shared/context/ToastContext';
import { ensureArrayResponse, ensureObjectResponse, encodePathParam } from '../shared/api/httpClient';

vi.mock('../features/auth/api/authApi', () => ({
  authApi: {
    login: vi.fn(),
  },
}));

describe('Form validation and API contract guards', () => {
  it('shows accessible validation errors when login form is submitted empty', () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    const emailInput = screen.getByLabelText(/Correo Electrónico/i);
    const passwordInput = screen.getByLabelText(/^Contraseña$/i);

    expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(/El correo es requerido/i)).toBeInTheDocument();
    expect(screen.getByText(/La contraseña es requerida/i)).toBeInTheDocument();
  });

  it('validates email format and minimum password length', () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Correo Electrónico/i), {
      target: { value: 'invalid-email' },
    });
    fireEvent.change(screen.getByLabelText(/^Contraseña$/i), {
      target: { value: '123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    expect(screen.getByText(/correo electrónico válido/i)).toBeInTheDocument();
    expect(screen.getByText(/Mínimo 6 caracteres/i)).toBeInTheDocument();
  });

  it('rejects malformed API responses and invalid path parameters', () => {
    expect(() => ensureArrayResponse({ unexpected: true }, 'campos')).toThrow(
      /Respuesta inválida del servidor al consultar campos/i
    );
    expect(() => ensureObjectResponse(null, 'campo')).toThrow(
      /Respuesta inválida del servidor para campo/i
    );
    expect(() => encodePathParam('   ', 'campo')).toThrow(
      /Parámetro de ruta obligatorio ausente/i
    );
    expect(encodePathParam('field/123', 'campo')).toBe('field%2F123');
  });
});
