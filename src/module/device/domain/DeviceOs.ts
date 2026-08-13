import type { DevicePlatformFamily } from './DevicePlatformFamily.js';

/**
 * Famiglia e versione del sistema operativo host (e firmware, se disponibile).
 *
 * I campi opzionali restano assenti se la piattaforma non li espone.
 */
export type DeviceOs = {
  /**
   * Piattaforma su cui gira Fluid Player.
   */
  family: DevicePlatformFamily;

  /**
   * Versione OS / SDK, se esposta.
   */
  version?: string;

  /**
   * Versione firmware del vendor, se esposta.
   */
  firmwareVersion?: string;
};
