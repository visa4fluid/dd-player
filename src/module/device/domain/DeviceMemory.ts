/**
 * Memoria RAM del device host, in byte.
 *
 * Assente ≠ zero: i campi mancano se la piattaforma non li misura.
 */
export type DeviceMemory = {
  /**
   * RAM totale in byte, se nota.
   */
  totalBytes?: number;

  /**
   * RAM disponibile in byte, se nota.
   */
  availableBytes?: number;
};
