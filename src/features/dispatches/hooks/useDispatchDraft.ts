import { useCallback, useReducer } from 'react';
import { referencePriceFor, todayInputDate } from '../utils/dispatchCalculations';
import type { DispatchDraft, DispatchHeaderDraft, DispatchLineDraft, HarvestLot } from '../types';

type Action =
  | { type: 'SET_HEADER'; field: keyof DispatchHeaderDraft; value: string }
  | { type: 'ADD_LINE'; lot: HarvestLot }
  | { type: 'UPDATE_LINE'; harvestId: string; field: 'cantidadKg' | 'precioKg'; value: string }
  | { type: 'REMOVE_LINE'; harvestId: string }
  | { type: 'RESET' };

export function createEmptyDraft(): DispatchDraft {
  return {
    header: { clienteId: '', fechaDespacho: todayInputDate(), puertoEmbarque: '', observaciones: '' },
    lines: [],
  };
}

export function dispatchDraftReducer(state: DispatchDraft, action: Action): DispatchDraft {
  switch (action.type) {
    case 'SET_HEADER':
      return { ...state, header: { ...state.header, [action.field]: action.value } };
    case 'ADD_LINE': {
      // Un lote solo puede aparecer una vez: se modifica su cantidad en la línea existente.
      if (state.lines.some((l) => l.harvestId === action.lot.harvestId)) return state;
      const line: DispatchLineDraft = {
        harvestId: action.lot.harvestId,
        cantidadKg: String(action.lot.disponibleKg),
        precioKg: referencePriceFor(action.lot.tipoCultivo).toFixed(2),
      };
      return { ...state, lines: [...state.lines, line] };
    }
    case 'UPDATE_LINE':
      return {
        ...state,
        lines: state.lines.map((l) =>
          l.harvestId === action.harvestId ? { ...l, [action.field]: action.value } : l
        ),
      };
    case 'REMOVE_LINE':
      return { ...state, lines: state.lines.filter((l) => l.harvestId !== action.harvestId) };
    case 'RESET':
      return createEmptyDraft();
    default:
      return state;
  }
}

export function useDispatchDraft() {
  const [draft, dispatch] = useReducer(dispatchDraftReducer, undefined, createEmptyDraft);

  const setHeaderField = useCallback(
    (field: keyof DispatchHeaderDraft, value: string) => dispatch({ type: 'SET_HEADER', field, value }),
    []
  );
  const addLine = useCallback((lot: HarvestLot) => dispatch({ type: 'ADD_LINE', lot }), []);
  const updateLine = useCallback(
    (harvestId: string, field: 'cantidadKg' | 'precioKg', value: string) =>
      dispatch({ type: 'UPDATE_LINE', harvestId, field, value }),
    []
  );
  const removeLine = useCallback((harvestId: string) => dispatch({ type: 'REMOVE_LINE', harvestId }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return { draft, setHeaderField, addLine, updateLine, removeLine, reset };
}
