import { DeviceDtoSchema, UpdateDeviceRequestSchema, type DeviceDto } from '@/schemas';
import { z } from 'zod';
import { apiGet, apiPatch, requestBody } from '../config/api-client.ts';
import { API_ENDPOINTS } from '../constants/api.ts';

const DevicesSchema = z.array(DeviceDtoSchema);

export type DeviceInventoryStatus = 'ACTIVE' | 'RETIRED';

export function getDevices(): Promise<DeviceDto[]> {
  return apiGet(API_ENDPOINTS.devices.list, DevicesSchema);
}

export function updateDeviceInventoryStatus(
  deviceId: string,
  inventoryStatus: DeviceInventoryStatus,
  csrfToken: string,
): Promise<DeviceDto> {
  return apiPatch(
    API_ENDPOINTS.devices.detail(deviceId),
    requestBody(UpdateDeviceRequestSchema, { inventoryStatus }),
    DeviceDtoSchema,
    csrfToken,
  );
}
