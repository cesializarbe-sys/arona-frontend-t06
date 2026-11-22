import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToastProvider } from '../shared/context/ToastContext';
import { DispatchPage } from '../features/dispatches/pages/DispatchPage';
import { DISPATCHES_STORAGE_KEY } from '../features/dispatches/constants';
import {
  buildHarvestLots,
  computeLineViews,
  computeTotals,
  validateDispatch,
} from '../features/dispatches/utils/dispatchCalculations';
import { dispatchDraftReducer, createEmptyDraft } from '../features/dispatches/hooks/useDispatchDraft';
import type { Crop, Field, Harvest } from '../shared/types/domain';
import type { DispatchRecord } from '../features/dispatches/types';

const harvests: Harvest[] = [
  { id: 1, idCosecha: 1, fecha: '2026-11-01', idCampo: 'F1', idCultivo: 'C1', cantidadKg: 1000, estado: true },
  { id: 2, idCosecha: 2, fecha: '2026-11-02', idCampo: 'F1', idCultivo: 'C2', cantidadKg: 500, estado: true },
  { id: 3, idCosecha: 3, fecha: '2026-11-03', idCampo: 'F1', idCultivo: 'C2', cantidadKg: 300, estado: false },
];
const fields = [{ id: 'F1', idCampo: 'F1', nombre: 'Lote Norte', ubicacion: '', hectareas: 1, areaHectareas: 1, estado: true }] as Field[];
const crops = [
  { id: 'C1', idCultivo: 'C1', nombre: 'Palta Hass', tipoCultivo: 'PALTA' },
  { id: 'C2', idCultivo: 'C2', nombre: 'Arándano Biloxi', tipoCultivo: 'ARANDANO' },
] as Crop[];

vi.mock('../features/harvests/api/harvestsApi', () => ({ harvestsApi: { getAll: vi.fn(async () => harvests) } }));
vi.mock('../features/fields/api/fieldsApi', () => ({ fieldsApi: { getAll: vi.fn(async () => fields) } }));
vi.mock('../features/crops/api/cropsApi', () => ({ cropsApi: { getAll: vi.fn(async () => crops) } }));
vi.mock('../features/auth/context/AuthContext', () => ({
  useAuth: () => ({ currentUser: { id: 'U1' }, userName: 'Ana Torres' }),
}));

describe('Despacho: lógica de negocio', () => {
  it('descuenta del stock los kg ya despachados y excluye cosechas inactivas', () => {
    const prev = [
      { estado: 'REGISTRADO', lines: [{ harvestId: '1', cantidadKg: 400 }] },
      { estado: 'ANULADO', lines: [{ harvestId: '1', cantidadKg: 600 }] },
    ] as DispatchRecord[];
    const lots = buildHarvestLots(harvests, fields, crops, prev);
    expect(lots.map((l) => l.harvestId)).toEqual(['1', '2']);
    expect(lots[0]).toMatchObject({ disponibleKg: 600, cultivoNombre: 'Palta Hass', campoNombre: 'Lote Norte' });
  });

  it('calcula subtotales y total a partir del detalle', () => {
    const lots = buildHarvestLots(harvests, fields, crops, []);
    const views = computeLineViews(
      [
        { harvestId: '1', cantidadKg: '100', precioKg: '2.80' },
        { harvestId: '2', cantidadKg: '50,5', precioKg: '6.5' },
      ],
      new Map(lots.map((l) => [l.harvestId, l]))
    );
    expect(views.map((v) => v.subtotal)).toEqual([280, 328.25]);
    expect(computeTotals(views)).toEqual({ totalKg: 150.5, totalUsd: 608.25, lineCount: 2 });
  });

  it('valida cabecera obligatoria, detalle vacío y stock excedido', () => {
    const lots = buildHarvestLots(harvests, fields, crops, []);
    const byId = new Map(lots.map((l) => [l.harvestId, l]));
    const empty = createEmptyDraft();
    const v1 = validateDispatch(empty, [], computeTotals([]), '2026-11-22');
    expect(v1.isValid).toBe(false);
    expect(v1.header.clienteId).toBeDefined();
    expect(v1.header.puertoEmbarque).toBeDefined();
    expect(v1.detail).toMatch(/al menos un lote/);

    const draft = {
      header: { clienteId: 'CLI-001', fechaDespacho: '2026-11-22', puertoEmbarque: 'Paita', observaciones: '' },
      lines: [{ harvestId: '2', cantidadKg: '501', precioKg: '0' }],
    };
    const views = computeLineViews(draft.lines, byId);
    const v2 = validateDispatch(draft, views, computeTotals(views), '2026-11-22');
    expect(v2.lines['2'].cantidadKg).toMatch(/stock disponible/);
    expect(v2.lines['2'].precioKg).toBeDefined();
  });

  it('no duplica un lote ya agregado en el detalle', () => {
    const [lot] = buildHarvestLots(harvests, fields, crops, []);
    let s = dispatchDraftReducer(createEmptyDraft(), { type: 'ADD_LINE', lot });
    s = dispatchDraftReducer(s, { type: 'ADD_LINE', lot });
    expect(s.lines).toHaveLength(1);
    expect(s.lines[0]).toMatchObject({ cantidadKg: '1000', precioKg: '2.80' });
  });
});

describe('Despacho: vista transaccional', () => {
  beforeEach(() => localStorage.clear());

  const renderPage = () =>
    render(
      <ToastProvider>
        <DispatchPage />
      </ToastProvider>
    );

  const fillHeader = () => {
    fireEvent.change(screen.getByLabelText(/Cliente importador/i), { target: { value: 'CLI-002' } });
    fireEvent.change(screen.getByLabelText(/Puerto de embarque/i), { target: { value: 'Paita' } });
  };

  it('muestra errores si se confirma sin cabecera ni detalle', async () => {
    renderPage();
    await screen.findByRole('button', { name: /Agregar lote 1/i });
    fireEvent.click(screen.getByRole('button', { name: /Confirmar despacho/i }));
    expect(screen.getByLabelText(/Cliente importador/i)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(/Agregue al menos un lote/i)).toBeInTheDocument();
  });

  it('registra la orden una sola vez, bloquea el botón y actualiza el stock', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /Agregar lote 1/i }));
    fillHeader();
    fireEvent.change(screen.getByLabelText(/Cantidad en kg del lote 1/i), { target: { value: '250' } });
    expect(screen.getByTestId('total-usd')).toHaveTextContent('$700.00');

    const submit = screen.getByRole('button', { name: /Confirmar despacho/i });
    fireEvent.click(submit);
    fireEvent.click(submit); // doble clic
    expect(screen.getByRole('button', { name: /Registrando orden/i })).toBeDisabled();

    await screen.findByText(/Orden DSP-00001 registrada/i, undefined, { timeout: 3000 });
    const stored = JSON.parse(localStorage.getItem(DISPATCHES_STORAGE_KEY) ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].totalKg).toBe(250);

    const picker = screen.getByRole('region', { name: /Lotes disponibles/i });
    expect(within(picker).getByText('750 kg')).toBeInTheDocument();
  });

  it('conserva los datos ingresados si el registro falla', async () => {
    localStorage.setItem(
      DISPATCHES_STORAGE_KEY,
      JSON.stringify([])
    );
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /Agregar lote 2/i }));
    fillHeader();
    // Otro usuario consume el stock mientras se arma la orden
    localStorage.setItem(
      DISPATCHES_STORAGE_KEY,
      JSON.stringify([
        { id: 'x', codigo: 'DSP-00009', estado: 'REGISTRADO', creadoEn: '2026-01-01', lines: [{ harvestId: '2', cantidadKg: 400 }] },
      ])
    );
    fireEvent.click(screen.getByRole('button', { name: /Confirmar despacho/i }));

    await screen.findByText(/Stock insuficiente en el lote #2/i, undefined, { timeout: 3000 });
    expect(screen.getByLabelText(/Cliente importador/i)).toHaveValue('CLI-002');
    expect(screen.getByLabelText(/Cantidad en kg del lote 2/i)).toHaveValue('500');
    expect(screen.getByRole('button', { name: /Confirmar despacho/i })).toBeEnabled();
  });
});
