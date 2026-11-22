/**
 * Centralized date and time formatting utilities across UI views and exports.
 */

export function formatDate(dateValue?: string | null): string {
  if (!dateValue) return '';
  if (dateValue.includes('/')) return dateValue;
  try {
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return dateValue;
    return `${String(parsed.getDate()).padStart(2, '0')}/${String(
      parsed.getMonth() + 1
    ).padStart(2, '0')}/${parsed.getFullYear()}`;
  } catch {
    return dateValue;
  }
}

export function backendDateToInput(dateStr?: string | null): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr.split('T')[0];
}

export function inputDateToBackend(dateStr?: string | null): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

export function formatRelativeDate(dateValue?: string | null): string {
  if (!dateValue) return '';
  try {
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return dateValue;
    const now = new Date();
    const diffMs = now.getTime() - parsed.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    return formatDate(dateValue);
  } catch {
    return dateValue;
  }
}

export function formatExportDate(date: Date): string {
  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatExportTime(date: Date): string {
  return date.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatExportTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(
    date.getHours()
  )}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
