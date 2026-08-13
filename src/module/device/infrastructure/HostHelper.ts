/**
 * Accesso minimale al runtime host (browser / WebView) senza dipendere da `lib.dom`.
 *
 * @returns User agent, core CPU e RAM approssimata se esposti dal navigator.
 */
export function readHostNavigator(): {
  userAgent?: string;
  hardwareConcurrency?: number;
  deviceMemoryGb?: number;
} {
  const nav = (globalThis as { navigator?: Record<string, unknown> }).navigator;
  if (!nav) {
    return {};
  }

  const userAgent = typeof nav.userAgent === 'string' ? nav.userAgent : undefined;
  const hardwareConcurrency =
    typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : undefined;
  const deviceMemoryGb =
    typeof nav.deviceMemory === 'number' ? nav.deviceMemory : undefined;

  return {
    ...(userAgent !== undefined ? { userAgent } : {}),
    ...(hardwareConcurrency !== undefined ? { hardwareConcurrency } : {}),
    ...(deviceMemoryGb !== undefined ? { deviceMemoryGb } : {}),
  };
}

/**
 * Legge la risoluzione dello schermo principale, se esposta.
 *
 * @returns Larghezza e altezza in pixel, se disponibili.
 */
export function readHostScreen(): { widthPx?: number; heightPx?: number } {
  const screen = (globalThis as { screen?: { width?: number; height?: number } }).screen;
  const widthPx = typeof screen?.width === 'number' ? screen.width : undefined;
  const heightPx = typeof screen?.height === 'number' ? screen.height : undefined;

  return {
    ...(widthPx !== undefined ? { widthPx } : {}),
    ...(heightPx !== undefined ? { heightPx } : {}),
  };
}

/**
 * Tenta di leggere il renderer GPU via WebGL, se il runtime lo consente.
 *
 * @returns Nome del renderer, se disponibile.
 */
export function readWebGlRenderer(): string | undefined {
  const doc = (globalThis as { document?: { createElement: (tag: string) => unknown } })
    .document;
  if (!doc) {
    return undefined;
  }

  try {
    const canvas = doc.createElement('canvas') as {
      getContext: (id: string) => unknown;
    };
    const gl = canvas.getContext('webgl') as
      | {
          getExtension: (name: string) => { UNMASKED_RENDERER_WEBGL?: number } | null;
          getParameter: (name: number) => unknown;
        }
      | null;
    if (!gl) {
      return undefined;
    }

    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext?.UNMASKED_RENDERER_WEBGL;
    if (param === undefined) {
      return undefined;
    }

    const renderer = gl.getParameter(param);
    return typeof renderer === 'string' ? renderer : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Restituisce una copia dell’oggetto senza chiavi il cui valore è `undefined`.
 *
 * Utile per i value object di domain con `exactOptionalPropertyTypes`.
 *
 * @param value - Oggetto da compattare.
 * @returns Oggetto senza proprietà `undefined`.
 */
export function omitUndefined<T extends Record<string, unknown>>(
  value: T,
): { [K in keyof T]?: Exclude<T[K], undefined> } {
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (item !== undefined) {
      result[key] = item;
    }
  }

  return result as { [K in keyof T]?: Exclude<T[K], undefined> };
}

/**
 * Converte etichette memoria tipo `"3G"` in byte.
 *
 * @param label - Valore grezzo della piattaforma.
 * @returns Byte totali, se il formato è riconosciuto.
 */
export function parseMemoryLabel(label: string): number | undefined {
  const match = /^(\d+(?:\.\d+)?)\s*([gmk])i?b?$/i.exec(label.trim());
  if (!match) {
    return undefined;
  }

  const amount = Number(match[1]);
  const unit = match[2]?.toLowerCase();
  if (!Number.isFinite(amount) || !unit) {
    return undefined;
  }

  const factor = unit === 'g' ? 1024 ** 3 : unit === 'm' ? 1024 ** 2 : 1024;
  return Math.round(amount * factor);
}

/**
 * Restituisce `value` se è una stringa, altrimenti `undefined`.
 *
 * @param value - Valore da interpretare.
 * @returns Stringa, oppure `undefined`.
 */
export function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/**
 * Restituisce `value` se è un numero, altrimenti `undefined`.
 *
 * @param value - Valore da interpretare.
 * @returns Numero, oppure `undefined`.
 */
export function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

/**
 * Interpreta un booleano, inclusi `"true"` / `"false"` delle API vendor.
 *
 * @param value - Valore da interpretare.
 * @returns Booleano, oppure `undefined`.
 */
export function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return undefined;
}

/**
 * Esegue `read` e restituisce una stringa non vuota, ignorando errori del runtime vendor.
 *
 * @param read - Lettura da API nativa.
 * @returns Stringa, oppure `undefined`.
 */
export function callString(read: () => string | undefined): string | undefined {
  try {
    const value = read();
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Esegue `read` e restituisce un numero finito, ignorando errori del runtime vendor.
 *
 * @param read - Lettura da API nativa.
 * @returns Numero, oppure `undefined`.
 */
export function callNumber(read: () => number | undefined): number | undefined {
  try {
    const value = read();
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  } catch {
    return undefined;
  }
}
