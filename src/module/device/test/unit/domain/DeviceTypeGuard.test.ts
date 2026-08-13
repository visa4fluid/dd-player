import { describe, expect, it } from 'vitest';
import {
  isDeviceCpu,
  isDeviceFormFactor,
  isDeviceGpu,
  isDeviceMemory,
  isDeviceMonitor,
  isDeviceOs,
  isDevicePlatformFamily,
  isDeviceProduct,
  isDeviceStorageKind,
  isDeviceStorageVolume,
} from '../../../domain/DeviceTypeGuard.js';

describe('isDevicePlatformFamily', () => {
  it('accetta le famiglie note', () => {
    expect(isDevicePlatformFamily('webos')).toBe(true);
    expect(isDevicePlatformFamily('tizen')).toBe(true);
    expect(isDevicePlatformFamily('android')).toBe(true);
    expect(isDevicePlatformFamily('pc')).toBe(true);
    expect(isDevicePlatformFamily('web')).toBe(true);
  });

  it('rifiuta valori sconosciuti', () => {
    expect(isDevicePlatformFamily('ios')).toBe(false);
    expect(isDevicePlatformFamily('')).toBe(false);
    expect(isDevicePlatformFamily(1)).toBe(false);
    expect(isDevicePlatformFamily(undefined)).toBe(false);
  });
});

describe('isDeviceFormFactor', () => {
  it('accetta i form factor noti', () => {
    expect(isDeviceFormFactor('tv')).toBe(true);
    expect(isDeviceFormFactor('set-top')).toBe(true);
    expect(isDeviceFormFactor('unknown')).toBe(true);
  });

  it('rifiuta valori sconosciuti', () => {
    expect(isDeviceFormFactor('android')).toBe(false);
    expect(isDeviceFormFactor(null)).toBe(false);
  });
});

describe('isDeviceStorageKind', () => {
  it('accetta le nature note e rifiuta i token vendor', () => {
    expect(isDeviceStorageKind('internal')).toBe(true);
    expect(isDeviceStorageKind('INTERNAL')).toBe(false);
  });
});

describe('isDeviceOs', () => {
  it('accetta uno snapshot minimo con sola family', () => {
    expect(isDeviceOs({ family: 'webos' })).toBe(true);
  });

  it('accetta versione e firmware opzionali', () => {
    expect(
      isDeviceOs({
        family: 'tizen',
        version: '6.5',
        firmwareVersion: 'T-KSUQEUC-1234',
      }),
    ).toBe(true);
  });

  it('rifiuta family assente o tipi errati', () => {
    expect(isDeviceOs({})).toBe(false);
    expect(isDeviceOs({ family: 'ios' })).toBe(false);
    expect(isDeviceOs({ family: 'android', version: 14 })).toBe(false);
    expect(isDeviceOs([{ family: 'webos' }])).toBe(false);
  });
});

describe('isDeviceProduct', () => {
  it('accetta formFactor e campi anagrafici opzionali', () => {
    expect(isDeviceProduct({ formFactor: 'tv' })).toBe(true);
    expect(
      isDeviceProduct({
        formFactor: 'phone',
        model: 'Pixel 8',
        manufacturer: 'Google',
        brand: 'google',
      }),
    ).toBe(true);
  });

  it('rifiuta formFactor sconosciuto', () => {
    expect(isDeviceProduct({ formFactor: 'android' })).toBe(false);
    expect(isDeviceProduct({ formFactor: 'tv', model: 55 })).toBe(false);
  });
});

describe('isDeviceCpu', () => {
  it('accetta oggetto vuoto o campi noti', () => {
    expect(isDeviceCpu({})).toBe(true);
    expect(
      isDeviceCpu({ architecture: 'armv7', model: 'Cortex-A53', cores: 4 }),
    ).toBe(true);
  });

  it('rifiuta core non finiti', () => {
    expect(isDeviceCpu({ cores: Number.NaN })).toBe(false);
    expect(isDeviceCpu({ cores: '4' })).toBe(false);
    expect(isDeviceCpu(null)).toBe(false);
  });
});

describe('isDeviceGpu', () => {
  it('accetta oggetto vuoto o renderer/vendor', () => {
    expect(isDeviceGpu({})).toBe(true);
    expect(isDeviceGpu({ renderer: 'Mali-G52', vendor: 'ARM' })).toBe(true);
  });

  it('rifiuta tipi errati', () => {
    expect(isDeviceGpu({ renderer: 1 })).toBe(false);
  });
});

describe('isDeviceMemory', () => {
  it('accetta byte finiti e rifiuta etichette vendor', () => {
    expect(isDeviceMemory({})).toBe(true);
    expect(
      isDeviceMemory({
        totalBytes: 3 * 1024 ** 3,
        availableBytes: 1 * 1024 ** 3,
      }),
    ).toBe(true);
    expect(isDeviceMemory({ totalBytes: Number.POSITIVE_INFINITY })).toBe(false);
    expect(isDeviceMemory({ availableBytes: '3G' })).toBe(false);
  });
});

describe('isDeviceMonitor', () => {
  it('accetta geometria e capability del pannello', () => {
    expect(isDeviceMonitor({})).toBe(true);
    expect(
      isDeviceMonitor({
        id: 'DISPLAY-0',
        widthPx: 3840,
        heightPx: 2160,
        dpi: 80,
        refreshHz: 60,
        uhd: true,
        uhd8K: false,
        hdr10: true,
        dolbyVision: true,
        oled: true,
      }),
    ).toBe(true);
  });

  it('rifiuta tipi errati', () => {
    expect(isDeviceMonitor({ widthPx: '3840' })).toBe(false);
    expect(isDeviceMonitor({ uhd: 'true' })).toBe(false);
  });
});

describe('isDeviceStorageVolume', () => {
  it('richiede id e accetta kind di dominio', () => {
    expect(isDeviceStorageVolume({ id: 'INTERNAL' })).toBe(true);
    expect(
      isDeviceStorageVolume({
        id: 'INTERNAL',
        kind: 'internal',
        totalBytes: 32 * 1024 ** 3,
        freeBytes: 10 * 1024 ** 3,
      }),
    ).toBe(true);
  });

  it('rifiuta id assente o kind vendor', () => {
    expect(isDeviceStorageVolume({})).toBe(false);
    expect(isDeviceStorageVolume({ id: 'usb', kind: 'USB_DEVICE' })).toBe(false);
    expect(isDeviceStorageVolume({ id: 'INTERNAL', totalBytes: Number.NaN })).toBe(
      false,
    );
  });
});
