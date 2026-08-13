type AndroidDeviceBridge = {
  getIdentifier?: () => string;
  getOsVersion?: () => string;
  getModel?: () => string;
  getManufacturer?: () => string;
  getBrand?: () => string;
  getTotalMemoryBytes?: () => number;
  getAvailableMemoryBytes?: () => number;
};

/**
 * Legge il bridge nativo `FluidAndroidDevice`, se iniettato nel WebView.
 *
 * @returns Bridge, oppure `undefined`.
 */
export function readAndroidBridge(): AndroidDeviceBridge | undefined {
  return (globalThis as { FluidAndroidDevice?: AndroidDeviceBridge }).FluidAndroidDevice;
}
