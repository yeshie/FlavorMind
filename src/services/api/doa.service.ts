import axios, { AxiosInstance } from 'axios';
import { DOA_CONFIG } from '../../constants/config';

export interface DoaSeasonalCrop {
  id?: string;
  name: string;
  season?: string;
  availability?: string;
  district?: string;
  province?: string;
  price?: number;
  imageUrl?: string;
}

export interface DoaSeasonalQuery {
  district?: string;
  province?: string;
  crop?: string;
  season?: string;
  limit?: number;
}

const normalizeCrop = (item: any, index: number): DoaSeasonalCrop => ({
  id: item?.id || item?.cropId || item?.code || `doa-${index}`,
  name: item?.name || item?.crop || item?.commodity || 'Seasonal crop',
  season: item?.season || item?.harvestSeason || item?.period || '',
  availability: item?.availability || item?.status || '',
  district: item?.district || item?.districtName || '',
  province: item?.province || item?.provinceName || '',
  price: Number(item?.price || item?.marketPrice || item?.avgPrice || 0),
  imageUrl: item?.imageUrl || item?.image || '',
});

class DoaService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: DOA_CONFIG.BASE_URL,
      timeout: 10000,
      headers: DOA_CONFIG.API_KEY
        ? { Authorization: `Bearer ${DOA_CONFIG.API_KEY}` }
        : undefined,
    });
  }

  async getSeasonalCrops(query?: DoaSeasonalQuery): Promise<DoaSeasonalCrop[]> {
    const response = await this.client.get('/seasonal-crops', { params: query });
    const payload = response.data?.data || response.data?.items || response.data || [];
    const items = Array.isArray(payload) ? payload : payload.items || payload.crops || [];
    return items.map(normalizeCrop);
  }
}

export default new DoaService();
