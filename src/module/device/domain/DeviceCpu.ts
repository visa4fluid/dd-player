/**
 * Informazioni sulla CPU del device host.
 *
 * Tutti i campi sono opzionali: molte piattaforme non espongono modello o architettura.
 */
export type DeviceCpu = {
  /**
   * Architettura della CPU, se esposta (es. `armv7`).
   */
  architecture?: string;

  /**
   * Nome o modello della CPU, se esposto.
   */
  model?: string;

  /**
   * Numero di core visibili al runtime, se esposto.
   */
  cores?: number;
};
