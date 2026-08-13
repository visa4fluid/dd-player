import type { DeviceInfoInterface } from '../../application/DeviceInfoInterface.js';
import type { DeviceCpu } from '../../domain/DeviceCpu.js';
import type { DeviceGpu } from '../../domain/DeviceGpu.js';
import type { DeviceMemory } from '../../domain/DeviceMemory.js';
import type { DeviceMonitor } from '../../domain/DeviceMonitor.js';
import type { DeviceOs } from '../../domain/DeviceOs.js';
import type { DeviceProduct } from '../../domain/DeviceProduct.js';
import type { DeviceStorageVolume } from '../../domain/DeviceStorageVolume.js';
import {
  asNumber,
  asString,
  callNumber,
  callString,
  omitUndefined,
  readHostNavigator,
  readHostScreen,
  readWebGlRenderer,
} from '../HostHelper.js';
import { mapStorageKind, readProductInfo, readSystemInfo } from './TizenHelper.js';

/**
 * Adapter Tizen TV per {@link DeviceInfoInterface}.
 *
 * Usa `webapis.productinfo`, `tizen.systeminfo` e fallback browser.
 */
export class TizenDeviceInfo implements DeviceInfoInterface {
  /**
   * Restituisce l’identificativo stabile del device (DUID se disponibile).
   *
   * @returns Identificativo del device.
   */
  async getIdentifier(): Promise<string> {
    const duid = callString(() => readProductInfo()?.getDuid?.());
    if (duid) {
      return duid;
    }

    const model = callString(() => readProductInfo()?.getModel?.()) ?? 'tizen';
    return `tizen-${model}`;
  }

  /**
   * Restituisce famiglia e versione del sistema operativo Tizen.
   *
   * @returns Dati OS / piattaforma del device.
   */
  async getOs(): Promise<DeviceOs> {
    const systeminfo = readSystemInfo();
    return {
      family: 'tizen',
      ...omitUndefined({
        version: asString(
          systeminfo?.getCapability?.('http://tizen.org/feature/platform.version'),
        ),
        firmwareVersion:
          callString(() => readProductInfo()?.getFirmware?.()) ??
          callString(() => readProductInfo()?.getVersion?.()),
      }),
    };
  }

  /**
   * Restituisce modello, manufacturer e form factor della TV Tizen.
   *
   * @returns Dati di prodotto del device.
   */
  async getProduct(): Promise<DeviceProduct> {
    const systeminfo = readSystemInfo();
    const product = readProductInfo();
    return {
      formFactor: 'tv',
      ...omitUndefined({
        model:
          callString(() => product?.getRealModel?.()) ??
          callString(() => product?.getModel?.()) ??
          asString(systeminfo?.getCapability?.('http://tizen.org/system/model_name')),
        manufacturer: asString(
          systeminfo?.getCapability?.('http://tizen.org/system/manufacturer'),
        ),
      }),
    };
  }

  /**
   * Restituisce le informazioni sulla CPU, se esposte.
   *
   * @returns Dati CPU del device.
   */
  async getCpu(): Promise<DeviceCpu> {
    const { hardwareConcurrency } = readHostNavigator();
    return omitUndefined({
      architecture: asString(
        readSystemInfo()?.getCapability?.('http://tizen.org/feature/platform.core.cpu.arch'),
      ),
      cores: hardwareConcurrency,
    });
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
    const systeminfo = readSystemInfo();
    return omitUndefined({
      totalBytes: callNumber(() => systeminfo?.getTotalMemory?.()),
      availableBytes: callNumber(() => systeminfo?.getAvailableMemory?.()),
    });
  }

  /**
   * Restituisce i monitor / display della TV.
   *
   * @returns Dati dei monitor del device.
   */
  async getMonitors(): Promise<readonly DeviceMonitor[]> {
    const display = await this.#property('DISPLAY');
    const screen = readHostScreen();
    const first = Array.isArray(display) ? display[0] : display;

    return [
      omitUndefined({
        widthPx: asNumber(first?.resolutionWidth) ?? screen.widthPx,
        heightPx: asNumber(first?.resolutionHeight) ?? screen.heightPx,
        dpi: asNumber(first?.dpi) ?? asNumber(first?.dotsPerInchWidth),
      }),
    ];
  }

  /**
   * Restituisce le unità di storage esposte da SystemInfo.
   *
   * @returns Dati storage del device.
   */
  async getStorage(): Promise<readonly DeviceStorageVolume[]> {
    const storage = await this.#property('STORAGE');
    const units = Array.isArray(storage)
      ? storage
      : storage?.units && Array.isArray(storage.units)
        ? storage.units
        : [];

    return units.map((unit, index) => ({
      id: asString(unit.type) ?? `storage-${index}`,
      ...omitUndefined({
        kind: mapStorageKind(asString(unit.type)),
        totalBytes: asNumber(unit.capacity),
        freeBytes: asNumber(unit.availableCapacity),
      }),
    }));
  }

  #property(
    name: string,
  ): Promise<Record<string, unknown> | Record<string, unknown>[] | undefined> {
    const systeminfo = readSystemInfo();
    if (!systeminfo?.getPropertyValue) {
      return Promise.resolve(undefined);
    }

    return new Promise((resolve) => {
      systeminfo.getPropertyValue?.(
        name,
        (value) => resolve(value),
        () => resolve(undefined),
      );
    });
  }
}
