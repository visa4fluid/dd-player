/**
 * Un monitor / display collegato al device host.
 *
 * Unità: pixel. Le capability AV del pannello (UHD, HDR, OLED) stanno qui.
 */
export type DeviceMonitor = {
  /**
   * Identificativo del display, se ci sono più uscite.
   */
  id?: string;

  /**
   * Larghezza in pixel, se nota.
   */
  widthPx?: number;

  /**
   * Altezza in pixel, se nota.
   */
  heightPx?: number;

  /**
   * Densità in DPI, se esposta.
   */
  dpi?: number;

  /**
   * Frequenza di aggiornamento in Hertz, se esposta.
   */
  refreshHz?: number;

  /**
   * Supporto Ultra HD, se esposto.
   */
  uhd?: boolean;

  /**
   * Supporto 8K, se esposto.
   */
  uhd8K?: boolean;

  /**
   * Supporto HDR10, se esposto.
   */
  hdr10?: boolean;

  /**
   * Supporto Dolby Vision, se esposto.
   */
  dolbyVision?: boolean;

  /**
   * Pannello OLED, se esposto.
   */
  oled?: boolean;
};
