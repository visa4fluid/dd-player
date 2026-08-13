import { describe, expect, it } from 'vitest';
import { mapStorageKind } from '../../../../infrastructure/tizen/TizenHelper.js';

describe('mapStorageKind', () => {
  it('mappa i type Tizen su kind di dominio', () => {
    expect(mapStorageKind('INTERNAL')).toBe('internal');
    expect(mapStorageKind('USB_DEVICE')).toBe('external');
    expect(mapStorageKind('USB_HOST')).toBe('external');
    expect(mapStorageKind('MMC')).toBe('external');
    expect(mapStorageKind('UNKNOWN')).toBe('unknown');
    expect(mapStorageKind(undefined)).toBeUndefined();
  });
});
