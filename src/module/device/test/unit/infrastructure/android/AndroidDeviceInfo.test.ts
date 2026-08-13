import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AndroidDeviceInfo } from '../../../../infrastructure/android/AndroidDeviceInfo.js';

const navigatorDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  'navigator',
);
const screenDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'screen');

beforeEach(() => {
  Reflect.deleteProperty(globalThis, 'FluidAndroidDevice');
  stub('navigator', { userAgent: 'Mozilla/5.0 (Linux; Android 14)' });
  stub('screen', { width: 1080, height: 1920 });
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'FluidAndroidDevice');
  restore('navigator', navigatorDescriptor);
  restore('screen', screenDescriptor);
});

describe('AndroidDeviceInfo', () => {
  it('usa il bridge nativo per identità, OS, prodotto e memoria', async () => {
    (globalThis as { FluidAndroidDevice?: unknown }).FluidAndroidDevice = {
      getIdentifier: () => 'android-id-1',
      getOsVersion: () => '14',
      getModel: () => 'Pixel 8',
      getManufacturer: () => 'Google',
      getBrand: () => 'google',
      getTotalMemoryBytes: () => 8 * 1024 ** 3,
      getAvailableMemoryBytes: () => 3 * 1024 ** 3,
    };

    const device = new AndroidDeviceInfo();

    await expect(device.getIdentifier()).resolves.toBe('android-id-1');
    await expect(device.getOs()).resolves.toEqual({
      family: 'android',
      version: '14',
    });
    await expect(device.getProduct()).resolves.toEqual({
      model: 'Pixel 8',
      manufacturer: 'Google',
      brand: 'google',
      formFactor: 'unknown',
    });
    await expect(device.getMemory()).resolves.toEqual({
      totalBytes: 8 * 1024 ** 3,
      availableBytes: 3 * 1024 ** 3,
    });
  });

  it('fa fallback su UA se il bridge manca', async () => {
    stub('navigator', {
      userAgent: 'Mozilla/5.0 (Linux; Android 13; BRAVIA) Android TV',
      hardwareConcurrency: 4,
      deviceMemory: 2,
    });

    const device = new AndroidDeviceInfo();

    await expect(device.getIdentifier()).resolves.toBe('android-android');
    await expect(device.getOs()).resolves.toEqual({
      family: 'android',
      version: '13',
    });
    await expect(device.getProduct()).resolves.toMatchObject({
      formFactor: 'tv',
    });
    await expect(device.getCpu()).resolves.toEqual({ cores: 4 });
    await expect(device.getMemory()).resolves.toEqual({
      totalBytes: 2 * 1024 ** 3,
    });
    await expect(device.getMonitors()).resolves.toEqual([
      { widthPx: 1080, heightPx: 1920 },
    ]);
    await expect(device.getStorage()).resolves.toEqual([]);
    await expect(device.getGpu()).resolves.toEqual({});
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
