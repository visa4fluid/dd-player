import type { DeviceFormFactor } from './DeviceFormFactor.js';

/**
 * Modello, manufacturer, brand e form factor del prodotto host.
 *
 * I campi opzionali restano assenti se la piattaforma non li espone.
 */
export type DeviceProduct = {
  /**
   * Modello commerciale o di produzione, se esposto.
   */
  model?: string;

  /**
   * Produttore hardware, se esposto.
   */
  manufacturer?: string;

  /**
   * Marchio commerciale, se esposto.
   */
  brand?: string;

  /**
   * Forma del prodotto (TV, phone, PC, …), distinta dalla piattaforma.
   */
  formFactor: DeviceFormFactor;
};
