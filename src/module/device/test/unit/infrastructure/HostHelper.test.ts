import { afterEach, describe, expect, it } from 'vitest';
import {
  asBoolean,
  asNumber,
  asString,
  callNumber,
  callString,
  omitUndefined,
  parseMemoryLabel,
  readHostNavigator,
  readHostScreen,
  readWebGlRenderer,
} from '../../../infrastructure/HostHelper.js';

const descriptors = {
  navigator: Object.getOwnPropertyDescriptor(globalThis, 'navigator'),
  screen: Object.getOwnPropertyDescriptor(globalThis, 'screen'),
  document: Object.getOwnPropertyDescriptor(globalThis, 'document'),
};

afterEach(() => {
  restore('navigator', descriptors.navigator);
  restore('screen', descriptors.screen);
  restore('document', descriptors.document);
});

describe('asString / asNumber / asBoolean', () => {
  it('accetta solo il tipo atteso', () => {
    expect(asString('lg')).toBe('lg');
    expect(asString(1)).toBeUndefined();
    expect(asNumber(4)).toBe(4);
    expect(asNumber('4')).toBeUndefined();
    expect(asBoolean(true)).toBe(true);
    expect(asBoolean('true')).toBe(true);
    expect(asBoolean('false')).toBe(false);
    expect(asBoolean('yes')).toBeUndefined();
  });
});

describe('callString / callNumber', () => {
  it('ignora errori e valori vuoti del runtime vendor', () => {
    expect(callString(() => 'ok')).toBe('ok');
    expect(callString(() => '')).toBeUndefined();
    expect(
      callString(() => {
        throw new Error('missing api');
      }),
    ).toBeUndefined();
    expect(callNumber(() => 8)).toBe(8);
    expect(callNumber(() => Number.NaN)).toBeUndefined();
  });
});

describe('omitUndefined', () => {
  it('rimuove le chiavi con valore undefined', () => {
    expect(omitUndefined({ family: 'webos', version: undefined })).toEqual({
      family: 'webos',
    });
  });
});

describe('parseMemoryLabel', () => {
  it('converte etichette tipo 3G in byte', () => {
    expect(parseMemoryLabel('3G')).toBe(3 * 1024 ** 3);
    expect(parseMemoryLabel('512M')).toBe(512 * 1024 ** 2);
    expect(parseMemoryLabel('1024k')).toBe(1024 * 1024);
  });

  it('restituisce undefined se il formato non è riconosciuto', () => {
    expect(parseMemoryLabel('unknown')).toBeUndefined();
  });
});

describe('readHostNavigator', () => {
  it('legge userAgent, core e deviceMemory', () => {
    stub('navigator', {
      userAgent: 'Android 14',
      hardwareConcurrency: 8,
      deviceMemory: 4,
    });

    expect(readHostNavigator()).toEqual({
      userAgent: 'Android 14',
      hardwareConcurrency: 8,
      deviceMemoryGb: 4,
    });
  });

  it('restituisce un oggetto vuoto senza navigator', () => {
    stub('navigator', undefined);
    expect(readHostNavigator()).toEqual({});
  });
});

describe('readHostScreen', () => {
  it('legge larghezza e altezza', () => {
    stub('screen', { width: 1920, height: 1080 });
    expect(readHostScreen()).toEqual({ widthPx: 1920, heightPx: 1080 });
  });
});

describe('readWebGlRenderer', () => {
  it('restituisce undefined senza document', () => {
    stub('document', undefined);
    expect(readWebGlRenderer()).toBeUndefined();
  });

  it('legge il renderer da WEBGL_debug_renderer_info', () => {
    stub('document', {
      createElement: () => ({
        getContext: () => ({
          getExtension: () => ({ UNMASKED_RENDERER_WEBGL: 37446 }),
          getParameter: (name: number) =>
            name === 37446 ? 'Mock GPU' : undefined,
        }),
      }),
    });

    expect(readWebGlRenderer()).toBe('Mock GPU');
  });
});

function stub(key: 'navigator' | 'screen' | 'document', value: unknown): void {
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
