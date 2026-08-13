import type { DeviceInfoInterface } from '../../application/DeviceInfoInterface.js';
import type { DeviceCpu } from '../../domain/DeviceCpu.js';
import type { DeviceGpu } from '../../domain/DeviceGpu.js';
import type { DeviceMemory } from '../../domain/DeviceMemory.js';
import type { DeviceMonitor } from '../../domain/DeviceMonitor.js';
import type { DeviceOs } from '../../domain/DeviceOs.js';
import type { DeviceProduct } from '../../domain/DeviceProduct.js';
import type { DeviceStorageVolume } from '../../domain/DeviceStorageVolume.js';
import {
  callNumber,
  callString,
  omitUndefined,
  readHostNavigator,
  readHostScreen,
  readWebGlRenderer,
} from '../HostHelper.js';
import { readAndroidBridge } from './AndroidHelper.js';

/**
 * Adapter Android per {@link DeviceInfoInterface}.
 *
 * Usa un eventuale bridge nativo (`FluidAndroidDevice`) e, in mancanza, UA / WebView.
 */
export class AndroidDeviceInfo implements DeviceInfoInterface {
  /**
   * Restituisce l’identificativo stabile del device (bridge nativo, altrimenti fallback).
   *
   * @returns Identificativo del device.
   */
  async getIdentifier(): Promise<string> {
    const fromBridge = callString(() => readAndroidBridge()?.getIdentifier?.());
    if (fromBridge) {
      return fromBridge;
    }

    const product = await this.getProduct();
    return `android-${product.model ?? 'android'}`;
  }

  /**
   * Restituisce famiglia e versione di Android.
   *
   * @returns Dati OS / piattaforma del device.
   */
  async getOs(): Promise<DeviceOs> {
    const { userAgent } = readHostNavigator();
    const fromBridge = callString(() => readAndroidBridge()?.getOsVersion?.());
    const fromUa = userAgent ? /Android\s+([\d.]+)/i.exec(userAgent)?.[1] : undefined;

    return {
      family: 'android',
      ...omitUndefined({ version: fromBridge ?? fromUa }),
    };
  }

  /**
   * Restituisce modello, manufacturer e form factor del prodotto Android.
   *
   * @returns Dati di prodotto del device.
   */
  async getProduct(): Promise<DeviceProduct> {
    const { userAgent } = readHostNavigator();
    const isTv = Boolean(
      userAgent && /Android TV|SMART-TV|BRAVIA|AOSP TV/i.test(userAgent),
    );

    return {
      formFactor: isTv ? 'tv' : 'unknown',
      ...omitUndefined({
        model: callString(() => readAndroidBridge()?.getModel?.()),
        manufacturer: callString(() => readAndroidBridge()?.getManufacturer?.()),
        brand: callString(() => readAndroidBridge()?.getBrand?.()),
      }),
    };
  }

  /**
   * Restituisce le informazioni sulla CPU, se il runtime le espone.
   *
   * @returns Dati CPU del device.
   */
  async getCpu(): Promise<DeviceCpu> {
    const { hardwareConcurrency } = readHostNavigator();
    return omitUndefined({ cores: hardwareConcurrency });
  }

  /**
   * Restituisce le informazioni sulla GPU, se disponibili.
   *
   * @returns Dati GPU del device.
   */
  async getGpu(): Promise<DeviceGpu> {
    return omitUndefined({ renderer: readWebGlRenderer() });
  }

  /**
   * Restituisce le informazioni sulla memoria RAM.
   *
   * @returns Dati memoria del device.
   */
  async getMemory(): Promise<DeviceMemory> {
    const totalBytes = callNumber(() => readAndroidBridge()?.getTotalMemoryBytes?.());
    const availableBytes = callNumber(
      () => readAndroidBridge()?.getAvailableMemoryBytes?.(),
    );
    const { deviceMemoryGb } = readHostNavigator();
    const fromNavigator =
      deviceMemoryGb !== undefined ? Math.round(deviceMemoryGb * 1024 ** 3) : undefined;

    return omitUndefined({
      totalBytes: totalBytes ?? fromNavigator,
      availableBytes,
    });
  }

  /**
   * Restituisce i monitor / display collegati.
   *
   * @returns Dati dei monitor del device.
   */
  async getMonitors(): Promise<readonly DeviceMonitor[]> {
    const screen = readHostScreen();
    return [omitUndefined({ widthPx: screen.widthPx, heightPx: screen.heightPx })];
  }

  /**
   * Restituisce le informazioni sullo storage (richiede bridge nativo).
   *
   * @returns Dati storage del device.
   */
  async getStorage(): Promise<readonly DeviceStorageVolume[]> {
    return [];
  }
}
