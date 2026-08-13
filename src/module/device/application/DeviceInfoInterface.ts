import type { DeviceCpu } from '../domain/DeviceCpu.js';
import type { DeviceGpu } from '../domain/DeviceGpu.js';
import type { DeviceMemory } from '../domain/DeviceMemory.js';
import type { DeviceMonitor } from '../domain/DeviceMonitor.js';
import type { DeviceOs } from '../domain/DeviceOs.js';
import type { DeviceProduct } from '../domain/DeviceProduct.js';
import type { DeviceStorageVolume } from '../domain/DeviceStorageVolume.js';

/**
 * Contratto application per recuperare i dati del device host:
 * identificativo, OS, prodotto, CPU, GPU, memoria, monitor e storage.
 *
 * Le implementazioni vivono in infrastructure (adapter di piattaforma).
 */
export interface DeviceInfoInterface {
  /**
   * Restituisce l’identificativo stabile del device.
   *
   * @returns Identificativo del device.
   */
  getIdentifier(): Promise<string>;

  /**
   * Restituisce famiglia e versione del sistema operativo (e firmware, se disponibile).
   *
   * @returns Snapshot OS di dominio.
   */
  getOs(): Promise<DeviceOs>;

  /**
   * Restituisce modello, manufacturer e form factor del prodotto.
   *
   * @returns Snapshot di prodotto di dominio.
   */
  getProduct(): Promise<DeviceProduct>;

  /**
   * Restituisce le informazioni sulla CPU.
   *
   * @returns Snapshot CPU di dominio.
   */
  getCpu(): Promise<DeviceCpu>;

  /**
   * Restituisce le informazioni sulla GPU.
   *
   * @returns Snapshot GPU di dominio.
   */
  getGpu(): Promise<DeviceGpu>;

  /**
   * Restituisce le informazioni sulla memoria RAM (totale e disponibile).
   *
   * @returns Snapshot memoria di dominio, in byte.
   */
  getMemory(): Promise<DeviceMemory>;

  /**
   * Restituisce le informazioni sui monitor / display collegati.
   *
   * @returns Elenco dei monitor; può essere vuoto se nulla è esposto.
   */
  getMonitors(): Promise<readonly DeviceMonitor[]>;

  /**
   * Restituisce le informazioni sullo storage.
   *
   * @returns Elenco delle unità; `[]` se la piattaforma non le espone.
   */
  getStorage(): Promise<readonly DeviceStorageVolume[]>;
}
