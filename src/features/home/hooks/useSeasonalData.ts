import { useCallback, useEffect, useState } from 'react';
import seasonalService from '../../../services/api/seasonal.service';
import { SeasonalItem } from '../types/home.types';

const toSeasonalItem = (item: any): SeasonalItem => {
  const status = (item?.status || 'high-harvest') as SeasonalItem['status'];
  return {
    id: item?.id || item?.name || `seasonal-${Date.now()}`,
    name: item?.name || item?.title || 'Seasonal ingredient',
    image: item?.image || item?.imageUrl,
    status,
    badge:
      item?.badge
      || item?.season
      || (status === 'high-harvest' ? 'High Harvest' : status === 'low-price' ? 'Low Price' : 'Limited'),
  };
};

const useSeasonalData = (limit = 10) => {
  const [items, setItems] = useState<SeasonalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await seasonalService.getSeasonalFoods({ limit });
      setItems((response.data?.items || []).map(toSeasonalItem));
    } catch (err) {
      console.error('Seasonal data load error:', err);
      setError((err as Error)?.message || 'Could not load seasonal foods');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    items,
    loading,
    error,
    refresh,
  };
};

export default useSeasonalData;
