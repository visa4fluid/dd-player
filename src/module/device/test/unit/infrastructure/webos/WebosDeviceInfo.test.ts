import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WebosDeviceInfo } from '../../../../infrastructure/webos/WebosDeviceInfo.js';

const navigatorDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  'navigator',
);

beforeEach(() => {
  Reflect.deleteProperty(globalThis, 'webOS');
  stub('navigator', { hardwareConcurrency: 4, deviceMemory: 3 });
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'webOS');
  restore('navigator', navigatorDescriptor);
});

describe('WebosDeviceInfo', () => {
  it('legge identità, OS, prodotto e display da webOS / Luna', async () => {
    (globalThis as { webOS?: unknown }).webOS = {
      deviceInfo: (callback: (info: Record<string, unknown>) => void) => {
        callback({
          modelName: 'OLED55',
          sdkVersion: '7.0.0',
          version: '04.50.10',
          brandName: 'LG',
          manufacturer: 'LG Electronics',
          mainboardMaker: 'LG',
          ddrSize: '3G',
          screenWidth: 3840,
          screenHeight: 2160,
          uhd: true,
          uhd8K: false,
          oled: true,
          hdr10: true,
          dolbyVision: true,
        });
      },
      service: {
        request: (
          uri: string,
          options: {
            method?: string;
            onSuccess?: (res: Record<string, unknown>) => void;
            onFailure?: () => void;
          },
        ) => {
          if (uri.includes('deviceid/getIDs') || options.method === 'deviceid/getIDs') {
            options.onSuccess?.({
              idList: [{ idType: 'LGUDID', idValue: 'lg-udid-1' }],
            });
            return;
          }
          options.onSuccess?.({
            sdkVersion: '7.0.0',
            firmwareVersion: '04.50.10',
          });
        },
      },
    };

    const device = new WebosDeviceInfo();

    await expect(device.getIdentifier()).resolves.toBe('lg-udid-1');
    await expect(device.getOs()).resolves.toEqual({
      family: 'webos',
      version: '7.0.0',
      firmwareVersion: '04.50.10',
    });
    await expect(device.getProduct()).resolves.toEqual({
      model: 'OLED55',
      brand: 'LG',
      manufacturer: 'LG Electronics',
      formFactor: 'tv',
    });
    await expect(device.getCpu()).resolves.toEqual({
      cores: 4,
      model: 'LG',
    });
    await expect(device.getMemory()).resolves.toEqual({
      totalBytes: 3 * 1024 ** 3,
    });
    await expect(device.getMonitors()).resolves.toEqual([
      {
        widthPx: 3840,
        heightPx: 2160,
        uhd: true,
        uhd8K: false,
        oled: true,
        hdr10: true,
        dolbyVision: true,
      },
    ]);
    await expect(device.getStorage()).resolves.toEqual([]);
    await expect(device.getGpu()).resolves.toEqual({});
  });

  it('fa fallback webos-<model> se Luna non restituisce LGUDID', async () => {
    (globalThis as { webOS?: unknown }).webOS = {
      deviceInfo: (callback: (info: Record<string, unknown>) => void) => {
        callback({ modelName: 'WEBOS1' });
      },
    };

    const device = new WebosDeviceInfo();
    await expect(device.getIdentifier()).resolves.toBe('webos-WEBOS1');
  });
});

function stub(key: 'navigator', value: unknown): void {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    writable: true,
    value,
  });
}

function restore(
  key: string,
  descriptor: PropertyDescriptor | undefined,
): void {
  if (descriptor) {
    Object.defineProperty(globalThis, key, descriptor);
    return;
  }

  Reflect.deleteProperty(globalThis, key);
}
