/**
 * Informazioni sulla GPU del device host.
 *
 * Di solito arriva da WebGL o da un bridge nativo; l’oggetto può essere vuoto.
 */
export type DeviceGpu = {
  /**
   * Nome del renderer, se esposto.
   */
  renderer?: string;

  /**
   * Vendor GPU, se esposto.
   */
  vendor?: string;
};
