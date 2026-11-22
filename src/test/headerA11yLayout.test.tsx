import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { Header } from '../shared/components/Header';
import { NotificationProvider } from '../shared/context/NotificationContext';
import { ALERT_STATUS } from '../shared/constants/domain';

function renderHeader() {
  const loadNotifications = vi.fn().mockResolvedValue([
    {
      id: 'ALT-1',
      title: 'Lote Norte — PLAGA',
      description: 'Mosca de la fruta detectada',
      date: '2026-08-25',
      type: 'PLAGA',
      status: ALERT_STATUS.PENDING,
      isRead: false,
    },
  ]);

  return render(
    <MemoryRouter>
      <NotificationProvider loadNotifications={loadNotifications} userKey="USR-1" enabled={true}>
        <Header
          userName="Ana Rojas"
          userRole="ADMINISTRADOR"
          userInitials="AR"
          onOpenMobileMenu={vi.fn()}
        />
      </NotificationProvider>
    </MemoryRouter>
  );
}

describe('Header accessibility and narrow viewport layout', () => {
  it('opens the system help dialog when clicking the help button', () => {
    renderHeader();

    const helpButton = screen.getByRole('button', { name: /Ayuda del sistema/i });
    fireEvent.click(helpButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Atajos de teclado/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Entendido/i }));
    expect(screen.queryByText(/Atajos de teclado/i)).not.toBeInTheDocument();
  });

  it('manages focus in the notifications panel and restores focus on Escape', async () => {
    renderHeader();

    const bellButton = screen.getByRole('button', { name: /Abrir panel de notificaciones/i });
    expect(bellButton).toHaveAttribute('aria-controls', 'notifications-panel');
    expect(bellButton).toHaveAttribute('aria-haspopup', 'dialog');
    expect(bellButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(bellButton);

    const panel = await screen.findByRole('dialog', { name: /Panel de notificaciones/i });
    expect(bellButton).toHaveAttribute('aria-expanded', 'true');
    expect(panel.contains(document.activeElement)).toBe(true);

    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Panel de notificaciones/i })).not.toBeInTheDocument();
    });
    expect(document.activeElement).toBe(bellButton);
  });

  it('keeps the notifications panel fluid without fixed mobile width at 320px viewport', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 320,
    });

    renderHeader();

    const bellButton = screen.getByRole('button', { name: /Abrir panel de notificaciones/i });
    fireEvent.click(bellButton);

    const panel = await screen.findByRole('dialog', { name: /Panel de notificaciones/i });
    expect(panel.className).toContain('fixed');
    expect(panel.className).toContain('inset-x-3');
    expect(panel.className).toContain('w-auto');
    expect(panel.className).toContain('max-h-[70vh]');
    expect(panel.className).toContain('overflow-y-auto');
    expect(panel.className).not.toContain('w-80');
  });
});
