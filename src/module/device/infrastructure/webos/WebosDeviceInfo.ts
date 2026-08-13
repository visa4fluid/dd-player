import type { DeviceInfoInterface } from '../../application/DeviceInfoInterface.js';
import type { DeviceCpu } from '../../domain/DeviceCpu.js';
import type { DeviceGpu } from '../../domain/DeviceGpu.js';
import type { DeviceMemory } from '../../domain/DeviceMemory.js';
import type { DeviceMonitor } from '../../domain/DeviceMonitor.js';
import type { DeviceOs } from '../../domain/DeviceOs.js';
import type { DeviceProduct } from '../../domain/DeviceProduct.js';
import type { DeviceStorageVolume } from '../../domain/DeviceStorageVolume.js';
import {
  asBoolean,
  asNumber,
  asString,
  omitUndefined,
  parseMemoryLabel,
  readHostNavigator,
  readHostScreen,
  readWebGlRenderer,
} from '../HostHelper.js';
import { readWebOs } from './WebosHelper.js';

/**
 * Adapter webOS TV per {@link DeviceInfoInterface}.
 *
 * Usa `webOS.deviceInfo`, Luna (`tv.systemproperty`, device unique ID) e fallback browser.
 */
export class WebosDeviceInfo implements DeviceInfoInterface {
  #info: Record<string, unknown> | undefined;

  /**
   * Restituisce l’identificativo stabile del device (LGUDID se disponibile).
   *
   * @returns Identificativo del device.
   */
  async getIdentifier(): Promise<string> {
    const ids = await this.#luna('luna://com.webos.service.sm', 'deviceid/getIDs', {
      idType: ['LGUDID'],
    });
    const idList = ids?.idList;
    if (Array.isArray(idList)) {
      const lgudid = idList.find(
        (item): item is { idValue: string } =>
          typeof item === 'object' &&
          item !== null &&
          (item as { idType?: string }).idType === 'LGUDID' &&
          typeof (item as { idValue?: string }).idValue === 'string',
      );
      if (lgudid) {
        return lgudid.idValue;
      }
    }

    const info = await this.#deviceInfo();
    const model = typeof info.modelName === 'string' ? info.modelName : 'webos';
    return `webos-${model}`;
  }

  /**
   * Restituisce famiglia e versione del sistema operativo webOS.
   *
   * @returns Dati OS / piattaforma del device.
   */
  async getOs(): Promise<DeviceOs> {
    const info = await this.#deviceInfo();
    const system = await this.#luna(
      'luna://com.webos.service.tv.systemproperty',
      'getSystemInfo',
      { keys: ['firmwareVersion', 'sdkVersion'] },
    );

    return {
      family: 'webos',
      ...omitUndefined({
        version: asString(info.sdkVersion) ?? asString(system?.sdkVersion),
        firmwareVersion: asString(info.version) ?? asString(system?.firmwareVersion),
      }),
    };
  }

  /**
   * Restituisce modello, manufacturer e form factor della TV webOS.
   *
   * @returns Dati di prodotto del device.
   */
  async getProduct(): Promise<DeviceProduct> {
    const info = await this.#deviceInfo();
    return {
      formFactor: 'tv',
      ...omitUndefined({
        model: asString(info.modelName),
        brand: asString(info.brandName),
        manufacturer: asString(info.manufacturer),
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
    const info = await this.#deviceInfo();
    return omitUndefined({
      cores: hardwareConcurrency,
      model: asString(info.mainboardMaker),
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
    const info = await this.#deviceInfo();
    const label = asString(info.ddrSize);
    const fromLabel = label ? parseMemoryLabel(label) : undefined;
    const { deviceMemoryGb } = readHostNavigator();
    const fromNavigator =
      deviceMemoryGb !== undefined ? Math.round(deviceMemoryGb * 1024 ** 3) : undefined;

    return omitUndefined({
      totalBytes: fromLabel ?? fromNavigator,
    });
  }

  /**
   * Restituisce i monitor / display della TV.
   *
   * @returns Dati dei monitor del device.
   */
  async getMonitors(): Promise<readonly DeviceMonitor[]> {
    const info = await this.#deviceInfo();
    const screen = readHostScreen();
    return [
      omitUndefined({
        widthPx: asNumber(info.screenWidth) ?? screen.widthPx,
        heightPx: asNumber(info.screenHeight) ?? screen.heightPx,
        uhd: asBoolean(info.uhd),
        uhd8K: asBoolean(info.uhd8K),
        oled: asBoolean(info.oled),
        hdr10: asBoolean(info.hdr10),
        dolbyVision: asBoolean(info.dolbyVision),
      }),
    ];
  }

  /**
   * Restituisce le informazioni sullo storage (non esposte in modo uniforme su webOS).
   *
   * @returns Dati storage del device.
   */
  async getStorage(): Promise<readonly DeviceStorageVolume[]> {
    return [];
  }

  async #deviceInfo(): Promise<Record<string, unknown>> {
    if (this.#info) {
      return this.#info;
    }

    const webOS = readWebOs();
    if (!webOS?.deviceInfo) {
      this.#info = {};
      return this.#info;
    }

    this.#info = await new Promise<Record<string, unknown>>((resolve) => {
      webOS.deviceInfo?.((info) => {
        resolve(info ?? {});
      });
    });
    return this.#info;
  }

  async #luna(
    uri: string,
    method: string,
    parameters: Record<string, unknown>,
  ): Promise<Record<string, unknown> | undefined> {
    const webOS = readWebOs();
    if (!webOS?.service?.request) {
      return undefined;
    }

    return new Promise((resolve) => {
      webOS.service?.request(uri, {
        method,
        parameters,
        onSuccess: (res) => resolve(res),
        onFailure: () => resolve(undefined),
      });
    });
  }
}
