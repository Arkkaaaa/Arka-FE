import { DashboardSummaryDtoSchema } from '@/schemas';
import type { z } from 'zod';
import { apiGet } from '../config/api-client.ts';
import { API_ENDPOINTS } from '../constants/api.ts';

export function getDashboardSummary(): Promise<z.infer<typeof DashboardSummaryDtoSchema>> {
  return apiGet(API_ENDPOINTS.dashboard.summary, DashboardSummaryDtoSchema);
}
