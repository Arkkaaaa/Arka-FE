import { DeviceDtoSchema, type DeviceDto } from '@/schemas';
import { z } from 'zod';
import { apiGet } from '../config/api-client.ts';
import { API_ENDPOINTS } from '../constants/api.ts';

const DevicesSchema = z.array(DeviceDtoSchema);

export function getDevices(): Promise<DeviceDto[]> {
  return apiGet(API_ENDPOINTS.devices.list, DevicesSchema);
}
