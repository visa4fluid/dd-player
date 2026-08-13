import type { DeviceStorageKind } from './DeviceStorageKind.js';

/**
 * Un’unità di storage del device host, in byte.
 *
 * `id` distingue le volume; `[]` dal probe significa nessuna unità esposta.
 */
export type DeviceStorageVolume = {
  /**
   * Identificativo stabile dell’unità (es. `INTERNAL`, `storage-0`).
   */
  id: string;

  /**
   * Natura dell’unità, se distinguibile.
   */
  kind?: DeviceStorageKind;

  /**
   * Capacità totale in byte, se nota.
   */
  totalBytes?: number;

  /**
   * Spazio libero in byte, se noto.
   */
  freeBytes?: number;
};
