import { useCallback, useEffect, useState } from 'react';
import { harvestsApi } from '../../harvests/api/harvestsApi';
import { fieldsApi } from '../../fields/api/fieldsApi';
import { cropsApi } from '../../crops/api/cropsApi';
import { dispatchesApi } from '../api/dispatchesApi';
import { extractApiErrorMessage, isRequestCanceled } from '../../../shared/api/errorUtils';
import { useLatestRequest } from '../../../shared/hooks/useLatestRequest';
import type { Crop, Field, Harvest } from '../../../shared/types/domain';
import type { DispatchRecord } from '../types';

/** Carga las entidades que intervienen en la transacción (cosechas, campos, cultivos, despachos). */
export function useDispatchCatalogs() {
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [dispatches, setDispatches] = useState<DispatchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { begin } = useLatestRequest();

  const reload = useCallback(async () => {
    const { signal, isCurrent } = begin();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [h, f, c, d] = await Promise.all([
        harvestsApi.getAll(signal),
        fieldsApi.getAll(signal).catch(() => [] as Field[]),
        cropsApi.getAll(signal).catch(() => [] as Crop[]),
        dispatchesApi.getAll(signal),
      ]);
      if (!isCurrent()) return;
      setHarvests(h);
      setFields(f);
      setCrops(c);
      setDispatches(d);
    } catch (err) {
      if (!isCurrent() || isRequestCanceled(err)) return;
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setErrorMessage(extractApiErrorMessage(err, 'No se pudieron cargar los lotes de cosecha.'));
    } finally {
      if (isCurrent()) setIsLoading(false);
    }
  }, [begin]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { harvests, fields, crops, dispatches, setDispatches, isLoading, errorMessage, reload };
}
