import { DashboardActivityDtoSchema, DashboardSummaryDtoSchema } from '@/schemas';
import type { z } from 'zod';
import { apiGet } from '../config/api-client.ts';
import { API_ENDPOINTS } from '../constants/api.ts';

export function getDashboardActivity(): Promise<z.infer<typeof DashboardActivityDtoSchema>> {
  return apiGet(API_ENDPOINTS.dashboard.activity, DashboardActivityDtoSchema);
}

export function getDashboardSummary(): Promise<z.infer<typeof DashboardSummaryDtoSchema>> {
  return apiGet(API_ENDPOINTS.dashboard.summary, DashboardSummaryDtoSchema);
}
