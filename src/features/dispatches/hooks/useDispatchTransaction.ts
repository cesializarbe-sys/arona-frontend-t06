import { useCallback, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { useToast } from '../../../shared/context/ToastContext';
import { extractApiErrorMessage } from '../../../shared/api/errorUtils';
import { dispatchesApi } from '../api/dispatchesApi';
import { EXPORT_CLIENTS } from '../constants';
import { useDispatchCatalogs } from './useDispatchCatalogs';
import { useDispatchDraft } from './useDispatchDraft';
import {
  buildHarvestLots,
  computeLineViews,
  computeTotals,
  validateDispatch,
} from '../utils/dispatchCalculations';
import type { DispatchCreatePayload, DispatchRecord, HarvestLot } from '../types';

/**
 * Orquesta la transacción cabecera-detalle de la vista DispatchPage:
 * catálogos → borrador (useReducer) → valores derivados (useMemo) → validación → envío.
 *
 * Entidades: Despacho, Línea de despacho, Lote de cosecha (con Campo y Cultivo) y Usuario responsable.
 * Persistencia: el borrador vive en estado local de React. Solo `submit` (vía dispatchesApi)
 * y `annul` escriben en localStorage ('arona:despachos'). Los lotes se leen de sus propias APIs.
 */
export function useDispatchTransaction() {
  const catalogs = useDispatchCatalogs();
  const { harvests, fields, crops, dispatches, setDispatches } = catalogs;
  const { draft, setHeaderField, addLine, updateLine, removeLine, reset } = useDispatchDraft();
  const { currentUser, userName } = useAuth();
  const toast = useToast();

  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<DispatchRecord | null>(null);
  const [annullingId, setAnnullingId] = useState<string | null>(null);
  // Guard síncrono: evita doble envío incluso antes de que React re-renderice el botón deshabilitado.
  const submittingRef = useRef(false);

  // ---- Derivados (sin duplicar estado) ----
  const lots = useMemo(
    () => buildHarvestLots(harvests, fields, crops, dispatches),
    [harvests, fields, crops, dispatches]
  );
  const lotsById = useMemo(() => new Map(lots.map((l) => [l.harvestId, l])), [lots]);
  const lineViews = useMemo(() => computeLineViews(draft.lines, lotsById), [draft.lines, lotsById]);
  const totals = useMemo(() => computeTotals(lineViews), [lineViews]);
  const validation = useMemo(() => validateDispatch(draft, lineViews, totals), [draft, lineViews, totals]);
  const selectedIds = useMemo(() => new Set(draft.lines.map((l) => l.harvestId)), [draft.lines]);
  const selectedClient = EXPORT_CLIENTS.find((c) => c.id === draft.header.clienteId) ?? null;

  const handleAddLot = useCallback(
    (lot: HarvestLot) => {
      if (selectedIds.has(lot.harvestId)) {
        toast.info(`El lote #${lot.harvestId} ya está en el detalle; modifique su cantidad.`);
        return;
      }
      addLine(lot);
      setLastCreated(null);
    },
    [addLine, selectedIds, toast]
  );

  const submit = useCallback(async () => {
    if (submittingRef.current) return;
    setSubmitAttempted(true);
    setSubmitError(null);

    if (!validation.isValid) {
      toast.warning('Revise los campos marcados antes de confirmar la orden.');
      return;
    }
    if (!selectedClient) return;

    submittingRef.current = true;
    setIsSubmitting(true);

    const payload: DispatchCreatePayload = {
      clienteId: selectedClient.id,
      clienteNombre: selectedClient.razonSocial,
      clientePais: selectedClient.pais,
      fechaDespacho: draft.header.fechaDespacho,
      puertoEmbarque: draft.header.puertoEmbarque,
      observaciones: draft.header.observaciones.trim(),
      responsableId: currentUser?.id ?? null,
      responsableNombre: userName,
      lines: lineViews.map((l) => ({
        harvestId: l.harvestId,
        campoNombre: l.lot?.campoNombre ?? '—',
        cultivoNombre: l.lot?.cultivoNombre ?? '—',
        cantidadKg: l.cantidadNum,
        precioKg: l.precioNum,
        subtotal: l.subtotal,
      })),
      totalKg: totals.totalKg,
      totalUsd: totals.totalUsd,
    };
    const harvestedKg = new Map(lots.map((l) => [l.harvestId, l.cantidadCosechadaKg]));

    try {
      const created = await dispatchesApi.create(payload, harvestedKg);
      setDispatches((prev) => [created, ...prev]);
      setLastCreated(created);
      reset();
      setSubmitAttempted(false);
      toast.success(`Orden ${created.codigo} registrada correctamente.`);
    } catch (err) {
      // El borrador NO se limpia: el usuario conserva todo lo ingresado.
      const message = extractApiErrorMessage(err, 'No se pudo registrar la orden de despacho.');
      setSubmitError(err instanceof Error && err.name === 'DispatchApiError' ? err.message : message);
      toast.error('No se pudo registrar la orden. Sus datos se conservaron.');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [currentUser, draft.header, lineViews, lots, reset, selectedClient, setDispatches, toast, totals, userName, validation.isValid]);

  const annul = useCallback(
    async (id: string) => {
      setAnnullingId(id);
      try {
        const updated = await dispatchesApi.annul(id);
        setDispatches((prev) => prev.map((d) => (d.id === id ? updated : d)));
        toast.success(`Orden ${updated.codigo} anulada. El stock fue liberado.`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'No se pudo anular la orden.');
      } finally {
        setAnnullingId(null);
      }
    },
    [setDispatches, toast]
  );

  const discardDraft = useCallback(() => {
    reset();
    setSubmitAttempted(false);
    setSubmitError(null);
  }, [reset]);

  return {
    // catálogos
    isLoadingCatalogs: catalogs.isLoading,
    catalogError: catalogs.errorMessage,
    reloadCatalogs: catalogs.reload,
    lots,
    dispatches,
    // borrador
    draft,
    setHeaderField,
    updateLine,
    removeLine,
    handleAddLot,
    discardDraft,
    selectedIds,
    // derivados
    lineViews,
    totals,
    validation,
    showErrors: submitAttempted,
    responsableNombre: userName,
    // envío
    submit,
    isSubmitting,
    submitError,
    dismissSubmitError: () => setSubmitError(null),
    lastCreated,
    dismissLastCreated: () => setLastCreated(null),
    annul,
    annullingId,
  };
}
