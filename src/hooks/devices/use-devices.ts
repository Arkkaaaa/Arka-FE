import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getDevices,
  updateDeviceInventoryStatus,
  type DeviceInventoryStatus,
} from '../../api/devices.ts';
import { QUERY_KEYS } from '../../constants/query-keys.ts';

export function useDevicesQuery(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.devices.all,
    queryFn: getDevices,
    enabled,
  });
}

export function useUpdateDeviceMutation(csrfToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      deviceId,
      inventoryStatus,
    }: {
      deviceId: string;
      inventoryStatus: DeviceInventoryStatus;
    }) => updateDeviceInventoryStatus(deviceId, inventoryStatus, csrfToken),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.devices.all }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.all }),
      ]);
    },
  });
}
