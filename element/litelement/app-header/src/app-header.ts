import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * Barra superiore di applicazione in stile Material.
 * Combina i comportamenti di Polymer `app-header` (fixed, reveals, condenses, waterfall)
 * e di Vuetify `v-app-bar` (density, elevation, title, scroll-behavior).
 */
@customElement('app-header')
export class AppHeader extends LitElement {
  /**
   * Resta ancorata in cima (o in basso se `location` è `bottom`) durante lo scroll.
   */
  @property({ type: Boolean, reflect: true })
  fixed = false;

  /**
   * Come Polymer: scompare scorrendo in giù e ricompare scorrendo in su.
   */
  @property({ type: Boolean, reflect: true })
  reveals = false;

  /**
   * Riduce l'altezza mentre si scorre, fino all'altezza della density base.
   */
  @property({ type: Boolean, reflect: true })
  condenses = false;

  /**
   * Toglie l'ombra, come `flat` di Vuetify.
   */
  @property({ type: Boolean, reflect: true })
  flat = false;

  /**
   * Titolo testuale della barra (slot di default resta disponibile).
   */
  @property({ type: String })
  title = '';

  /**
   * Colore di sfondo CSS (`#152832`, `rgb(...)`, token).
   */
  @property({ type: String })
  color = '';

  /**
   * Ombre Material da 0 a 5. Ignorata se `flat`.
   */
  @property({ type: Number })
  elevation = 2;

  /**
   * Altezza esplicita in px. Se 0 si usa quella della density.
   */
  @property({ type: Number })
  height = 0;

  /**
   * Altezza della barra: compact 48, comfortable 56, default 64, prominent 128.
   */
  @property({ type: String, reflect: true })
  density: 'default' | 'comfortable' | 'compact' | 'prominent' = 'default';

  /**
   * Comportamenti allo scroll, separati da spazio: `hide`, `elevate`.
   */
  @property({ type: String, attribute: 'scroll-behavior' })
  scrollBehavior = '';

  /**
   * Selettore CSS dell'elemento che scrolla. Vuoto = `window`.
   */
  @property({ type: String, attribute: 'scroll-target' })
  scrollTarget = '';

  /**
   * Pixel di scroll prima di attivare hide / elevate / condenses.
   */
  @property({ type: Number, attribute: 'scroll-threshold' })
  scrollThreshold = 0;

  /**
   * URL dell'immagine di sfondo.
   */
  @property({ type: String })
  image = '';

  /**
   * Effetti Polymer: oggi `waterfall` (ombra dopo lo scroll).
   */
  @property({ type: String })
  effects = '';

  /**
   * Posizione della barra.
   */
  @property({ type: String, reflect: true })
  location: 'top' | 'bottom' = 'top';

  @state()
  private scrolled = false;

  @state()
  private concealed = false;

  @state()
  private progress = 0;

  private lastY = 0;
  private scrollRoot: EventTarget | null = null;

  /**
   * Altezza di riposo in pixel, density o `height`.
   */
  restingHeight(): number {
    if (this.height > 0) {
      return this.height;
    }
    switch (this.density) {
      case 'compact':
        return 48;
      case 'comfortable':
        return 56;
      case 'prominent':
        return 128;
      default:
        return 64;
    }
  }

  /**
   * Altezza minima quando la barra è condensata.
   */
  condensedHeight(): number {
    if (this.density === 'prominent' || this.height > 64) {
      return 64;
    }
    return this.restingHeight();
  }

  /**
   * Sincronizza lo stato allo scroll corrente. Usata anche dai test.
   *
   * @param y - Offset verticale in pixel
   */
  syncScroll(y: number): void {
    const threshold = this.scrollThreshold;
    const goingDown = y > this.lastY;
    this.scrolled = y > threshold;
    this.lastY = y;

    const hide = this.reveals || this.hasBehavior('hide');
    this.concealed = hide && goingDown && y > Math.max(threshold, 8);

    if (this.condenses) {
      const span = Math.max(this.restingHeight() - this.condensedHeight(), 1);
      this.progress = Math.min(Math.max((y - threshold) / span, 0), 1);
    } else {
      this.progress = this.scrolled ? 1 : 0;
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.bindScroll();
  }

  override disconnectedCallback(): void {
    this.unbindScroll();
    super.disconnectedCallback();
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('scrollTarget')) {
      this.bindScroll();
    }
  }

  override render() {
    const height = this.currentHeight();
    const shadow = this.currentShadow();
    const style = [
      `--app-header-height: ${height}px`,
      `--app-header-shadow: ${shadow}`,
      this.color ? `--app-header-background: ${this.color}` : '',
      this.image ? `--app-header-image: url("${this.image}")` : '',
    ]
      .filter(Boolean)
      .join('; ');

    return html`
      <header
        class="bar"
        part="bar"
        style=${style}
        ?data-concealed=${this.concealed}
        ?data-scrolled=${this.scrolled}
      >
        <div class="row">
          <div class="start"><slot name="start"></slot></div>
          <div class="title">
            ${this.title ? html`<span class="title-text">${this.title}</span>` : null}
            <slot></slot>
          </div>
          <div class="end"><slot name="end"></slot></div>
        </div>
        <div class="extension"><slot name="extension"></slot></div>
      </header>
    `;
  }

  private currentHeight(): number {
    const rest = this.restingHeight();
    if (!this.condenses) {
      return rest;
    }
    const sticky = this.condensedHeight();
    return Math.round(rest - (rest - sticky) * this.progress);
  }

  private currentShadow(): string {
    if (this.flat) {
      return 'none';
    }
    const elevate = this.hasBehavior('elevate') || this.effects.includes('waterfall');
    const level = elevate && !this.scrolled ? 0 : this.elevation;
    return SHADOWS[Math.min(Math.max(level, 0), 5)] ?? 'none';
  }

  private hasBehavior(name: string): boolean {
    return this.scrollBehavior.split(/\s+/).includes(name);
  }

  private bindScroll(): void {
    this.unbindScroll();
    const target = this.resolveTarget();
    this.scrollRoot = target;
    target.addEventListener('scroll', this.onScroll, { passive: true });
  }

  private unbindScroll(): void {
    this.scrollRoot?.removeEventListener('scroll', this.onScroll);
    this.scrollRoot = null;
  }

  private resolveTarget(): EventTarget {
    if (this.scrollTarget) {
      const found = this.getRootNode() instanceof ShadowRoot
        ? document.querySelector(this.scrollTarget)
        : (this.getRootNode() as Document | ShadowRoot).querySelector(this.scrollTarget);
      if (found) {
        return found;
      }
      return document.querySelector(this.scrollTarget) ?? window;
    }
    return window;
  }

  private onScroll = (): void => {
    const target = this.scrollRoot;
    if (target instanceof Window) {
      this.syncScroll(window.scrollY);
      return;
    }
    if (target instanceof Element) {
      this.syncScroll(target.scrollTop);
    }
  };

  static override styles = css`
    :host {
      display: block;
      z-index: 8;
      color: var(--app-header-on-background, #e8eef2);
    }

    :host([fixed]) {
      position: sticky;
      top: 0;
    }

    :host([fixed][location='bottom']) {
      top: auto;
      bottom: 0;
    }

    .bar {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      min-height: var(--app-header-height, 64px);
      height: var(--app-header-height, 64px);
      padding: 0 8px;
      background-color: var(--app-header-background, #152832);
      background-image: var(--app-header-image, none);
      background-size: cover;
      background-position: center;
      box-shadow: var(--app-header-shadow, none);
      transform: translateY(0);
      transition:
        transform 180ms ease,
        box-shadow 180ms ease,
        height 180ms ease,
        min-height 180ms ease;
    }

    .bar[data-concealed] {
      transform: translateY(-110%);
    }

    :host([location='bottom']) .bar[data-concealed] {
      transform: translateY(110%);
    }

    .row {
      display: flex;
      align-items: center;
      flex: 1;
      min-height: 0;
      gap: 8px;
    }

    .start,
    .end {
      display: flex;
      align-items: center;
      gap: 4px;
      flex: 0 0 auto;
    }

    .title {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
      font-size: 1.125rem;
      font-weight: 500;
      letter-spacing: 0.01em;
    }

    .title-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .extension {
      display: flex;
      align-items: center;
    }
  `;
}

const SHADOWS = [
  'none',
  '0 1px 2px rgba(0, 0, 0, 0.28)',
  '0 2px 6px rgba(0, 0, 0, 0.32)',
  '0 4px 10px rgba(0, 0, 0, 0.36)',
  '0 8px 16px rgba(0, 0, 0, 0.4)',
  '0 12px 24px rgba(0, 0, 0, 0.44)',
] as const;

declare global {
  interface HTMLElementTagNameMap {
    'app-header': AppHeader;
  }
}
