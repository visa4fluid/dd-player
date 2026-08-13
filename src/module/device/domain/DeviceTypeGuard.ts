import type { DeviceCpu } from './DeviceCpu.js';
import type { DeviceFormFactor } from './DeviceFormFactor.js';
import type { DeviceGpu } from './DeviceGpu.js';
import type { DeviceMemory } from './DeviceMemory.js';
import type { DeviceMonitor } from './DeviceMonitor.js';
import type { DeviceOs } from './DeviceOs.js';
import type { DevicePlatformFamily } from './DevicePlatformFamily.js';
import type { DeviceProduct } from './DeviceProduct.js';
import type { DeviceStorageKind } from './DeviceStorageKind.js';
import type { DeviceStorageVolume } from './DeviceStorageVolume.js';

const FAMILIES: readonly DevicePlatformFamily[] = [
  'webos',
  'tizen',
  'android',
  'pc',
  'web',
];

const FORM_FACTORS: readonly DeviceFormFactor[] = [
  'tv',
  'set-top',
  'tablet',
  'phone',
  'pc',
  'kiosk',
  'unknown',
];

const STORAGE_KINDS: readonly DeviceStorageKind[] = [
  'internal',
  'external',
  'unknown',
];

/**
 * Indica se il valore è una famiglia di piattaforma nota.
 *
 * @param value - Valore da verificare.
 * @returns `true` se `value` è una {@link DevicePlatformFamily}.
 */
export function isDevicePlatformFamily(
  value: unknown,
): value is DevicePlatformFamily {
  return (
    typeof value === 'string' &&
    (FAMILIES as readonly string[]).includes(value)
  );
}

/**
 * Indica se il valore è un form factor noto.
 *
 * @param value - Valore da verificare.
 * @returns `true` se `value` è un {@link DeviceFormFactor}.
 */
export function isDeviceFormFactor(value: unknown): value is DeviceFormFactor {
  return (
    typeof value === 'string' &&
    (FORM_FACTORS as readonly string[]).includes(value)
  );
}

/**
 * Indica se il valore è una natura di storage nota.
 *
 * @param value - Valore da verificare.
 * @returns `true` se `value` è un {@link DeviceStorageKind}.
 */
export function isDeviceStorageKind(value: unknown): value is DeviceStorageKind {
  return (
    typeof value === 'string' &&
    (STORAGE_KINDS as readonly string[]).includes(value)
  );
}

/**
 * Indica se il valore è uno snapshot OS di dominio valido.
 *
 * @param value - Valore da verificare.
 * @returns `true` se `value` soddisfa {@link DeviceOs}.
 */
export function isDeviceOs(value: unknown): value is DeviceOs {
  if (!isRecord(value) || !isDevicePlatformFamily(value.family)) {
    return false;
  }

  return isOptionalString(value.version) && isOptionalString(value.firmwareVersion);
}

/**
 * Indica se il valore è uno snapshot di prodotto di dominio valido.
 *
 * @param value - Valore da verificare.
 * @returns `true` se `value` soddisfa {@link DeviceProduct}.
 */
export function isDeviceProduct(value: unknown): value is DeviceProduct {
  if (!isRecord(value) || !isDeviceFormFactor(value.formFactor)) {
    return false;
  }

  return (
    isOptionalString(value.model) &&
    isOptionalString(value.manufacturer) &&
    isOptionalString(value.brand)
  );
}

/**
 * Indica se il valore è uno snapshot CPU di dominio valido.
 *
 * @param value - Valore da verificare.
 * @returns `true` se `value` soddisfa {@link DeviceCpu}.
 */
export function isDeviceCpu(value: unknown): value is DeviceCpu {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isOptionalString(value.architecture) &&
    isOptionalString(value.model) &&
    isOptionalFiniteNumber(value.cores)
  );
}

/**
 * Indica se il valore è uno snapshot GPU di dominio valido.
 *
 * @param value - Valore da verificare.
 * @returns `true` se `value` soddisfa {@link DeviceGpu}.
 */
export function isDeviceGpu(value: unknown): value is DeviceGpu {
  if (!isRecord(value)) {
    return false;
  }

  return isOptionalString(value.renderer) && isOptionalString(value.vendor);
}

/**
 * Indica se il valore è uno snapshot memoria di dominio valido.
 *
 * @param value - Valore da verificare.
 * @returns `true` se `value` soddisfa {@link DeviceMemory}.
 */
export function isDeviceMemory(value: unknown): value is DeviceMemory {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isOptionalFiniteNumber(value.totalBytes) &&
    isOptionalFiniteNumber(value.availableBytes)
  );
}

/**
 * Indica se il valore è uno snapshot monitor di dominio valido.
 *
 * @param value - Valore da verificare.
 * @returns `true` se `value` soddisfa {@link DeviceMonitor}.
 */
export function isDeviceMonitor(value: unknown): value is DeviceMonitor {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isOptionalString(value.id) &&
    isOptionalFiniteNumber(value.widthPx) &&
    isOptionalFiniteNumber(value.heightPx) &&
    isOptionalFiniteNumber(value.dpi) &&
    isOptionalFiniteNumber(value.refreshHz) &&
    isOptionalBoolean(value.uhd) &&
    isOptionalBoolean(value.uhd8K) &&
    isOptionalBoolean(value.hdr10) &&
    isOptionalBoolean(value.dolbyVision) &&
    isOptionalBoolean(value.oled)
  );
}

/**
 * Indica se il valore è uno snapshot di volume di storage di dominio valido.
 *
 * @param value - Valore da verificare.
 * @returns `true` se `value` soddisfa {@link DeviceStorageVolume}.
 */
export function isDeviceStorageVolume(
  value: unknown,
): value is DeviceStorageVolume {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return false;
  }

  return (
    (value.kind === undefined || isDeviceStorageKind(value.kind)) &&
    isOptionalFiniteNumber(value.totalBytes) &&
    isOptionalFiniteNumber(value.freeBytes)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}

function isOptionalFiniteNumber(value: unknown): boolean {
  return value === undefined || (typeof value === 'number' && Number.isFinite(value));
}

function isOptionalBoolean(value: unknown): boolean {
  return value === undefined || typeof value === 'boolean';
}
