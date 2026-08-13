import type { DeviceStorageKind } from '../../domain/DeviceStorageKind.js';

type TizenSystemInfo = {
  getCapability?: (key: string) => unknown;
  getTotalMemory?: () => number;
  getAvailableMemory?: () => number;
  getPropertyValue?: (
    property: string,
    success: (value: Record<string, unknown> | Record<string, unknown>[]) => void,
    error?: (err: unknown) => void,
  ) => void;
};

type TizenProductInfo = {
  getDuid?: () => string;
  getModel?: () => string;
  getModelCode?: () => string;
  getFirmware?: () => string;
  getVersion?: () => string;
  getRealModel?: () => string;
};

/**
 * Legge `tizen.systeminfo`, se il runtime lo espone.
 *
 * @returns API SystemInfo, oppure `undefined`.
 */
export function readSystemInfo(): TizenSystemInfo | undefined {
  return (globalThis as { tizen?: { systeminfo?: TizenSystemInfo } }).tizen?.systeminfo;
}

/**
 * Legge `webapis.productinfo`, se il runtime lo espone.
 *
 * @returns API ProductInfo, oppure `undefined`.
 */
export function readProductInfo(): TizenProductInfo | undefined {
  return (globalThis as { webapis?: { productinfo?: TizenProductInfo } }).webapis
    ?.productinfo;
}

/**
 * Mappa il `type` Tizen STORAGE su {@link DeviceStorageKind}.
 *
 * @param type - Valore `INTERNAL` / `USB_DEVICE` / … della piattaforma.
 * @returns Natura di storage di dominio, se ricavabile.
 */
export function mapStorageKind(type: string | undefined): DeviceStorageKind | undefined {
  if (type === undefined) {
    return undefined;
  }

  if (type === 'INTERNAL') {
    return 'internal';
  }

  if (type === 'USB_DEVICE' || type === 'USB_HOST' || type === 'MMC') {
    return 'external';
  }

  return 'unknown';
}
