type WebOsApi = {
  deviceInfo?: (callback: (info: Record<string, unknown>) => void) => void;
  service?: {
    request: (
      uri: string,
      options: {
        method?: string;
        parameters?: Record<string, unknown>;
        onSuccess?: (res: Record<string, unknown>) => void;
        onFailure?: (res: Record<string, unknown>) => void;
        onComplete?: (res: Record<string, unknown>) => void;
      },
    ) => void;
  };
};

/**
 * Legge l’API `webOS` esposta dal runtime TV, se presente.
 *
 * @returns Oggetto `webOS`, oppure `undefined`.
 */
export function readWebOs(): WebOsApi | undefined {
  return (globalThis as { webOS?: WebOsApi }).webOS;
}
