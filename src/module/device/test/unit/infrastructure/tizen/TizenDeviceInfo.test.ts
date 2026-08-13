import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TizenDeviceInfo } from '../../../../infrastructure/tizen/TizenDeviceInfo.js';

const navigatorDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  'navigator',
);
const screenDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'screen');

beforeEach(() => {
  Reflect.deleteProperty(globalThis, 'tizen');
  Reflect.deleteProperty(globalThis, 'webapis');
  stub('navigator', { hardwareConcurrency: 2 });
  stub('screen', { width: 1920, height: 1080 });
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'tizen');
  Reflect.deleteProperty(globalThis, 'webapis');
  restore('navigator', navigatorDescriptor);
  restore('screen', screenDescriptor);
});

describe('TizenDeviceInfo', () => {
  it('legge identità e profilo dalle API Tizen', async () => {
    (globalThis as { webapis?: unknown }).webapis = {
      productinfo: {
        getDuid: () => 'tizen-duid',
        getRealModel: () => 'UN55AU',
        getFirmware: () => 'T-KSUQEUC-1234',
      },
    };
    (globalThis as { tizen?: unknown }).tizen = {
      systeminfo: {
        getCapability: (key: string) => {
          const values: Record<string, string> = {
            'http://tizen.org/feature/platform.version': '6.5',
            'http://tizen.org/feature/platform.name': 'Tizen',
            'http://tizen.org/system/manufacturer': 'Samsung',
            'http://tizen.org/feature/platform.core.cpu.arch': 'armv7',
          };
          return values[key];
        },
        getTotalMemory: () => 2 * 1024 ** 3,
        getAvailableMemory: () => 1 * 1024 ** 3,
        getPropertyValue: (
          property: string,
          success: (value: unknown) => void,
        ) => {
          if (property === 'DISPLAY') {
            success({ resolutionWidth: 3840, resolutionHeight: 2160, dpi: 80 });
            return;
          }
          if (property === 'STORAGE') {
            success({
              units: [
                {
                  type: 'INTERNAL',
                  capacity: 32 * 1024 ** 3,
                  availableCapacity: 10 * 1024 ** 3,
                },
              ],
            });
          }
        },
      },
    };

    const device = new TizenDeviceInfo();

    await expect(device.getIdentifier()).resolves.toBe('tizen-duid');
    await expect(device.getOs()).resolves.toEqual({
      family: 'tizen',
      version: '6.5',
      firmwareVersion: 'T-KSUQEUC-1234',
    });
    await expect(device.getProduct()).resolves.toEqual({
      model: 'UN55AU',
      manufacturer: 'Samsung',
      formFactor: 'tv',
    });
    await expect(device.getCpu()).resolves.toEqual({
      architecture: 'armv7',
      cores: 2,
    });
    await expect(device.getMemory()).resolves.toEqual({
      totalBytes: 2 * 1024 ** 3,
      availableBytes: 1 * 1024 ** 3,
    });
    await expect(device.getMonitors()).resolves.toEqual([
      { widthPx: 3840, heightPx: 2160, dpi: 80 },
    ]);
    await expect(device.getStorage()).resolves.toEqual([
      {
        id: 'INTERNAL',
        kind: 'internal',
        totalBytes: 32 * 1024 ** 3,
        freeBytes: 10 * 1024 ** 3,
      },
    ]);
    await expect(device.getGpu()).resolves.toEqual({});
  });

  it('usa fallback tizen-<model> senza DUID', async () => {
    (globalThis as { webapis?: unknown }).webapis = {
      productinfo: {
        getModel: () => 'UE43',
      },
    };

    const device = new TizenDeviceInfo();
    await expect(device.getIdentifier()).resolves.toBe('tizen-UE43');
  });
});

function stub(key: 'navigator' | 'screen', value: unknown): void {
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
