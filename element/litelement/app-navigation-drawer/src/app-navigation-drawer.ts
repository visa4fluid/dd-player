import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

export type DrawerLocation = 'start' | 'end' | 'left' | 'right';

const MOBILE_CONVERTER = {
  fromAttribute(value: string | null): boolean | null {
    if (value === null) {
      return null;
    }
    return value !== 'false';
  },
  toAttribute(value: boolean | null): string | null {
    if (value === null) {
      return null;
    }
    return value ? '' : 'false';
  },
};

/**
 * Pannello di navigazione laterale in stile Material.
 * Combina Polymer `app-drawer` (opened, persistent, swipe-open)
 * e Vuetify `v-navigation-drawer` (rail, permanent, temporary, expand-on-hover).
 */
@customElement('app-navigation-drawer')
export class AppNavigationDrawer extends LitElement {
  /**
   * Come Polymer: il drawer è visibile. Con `permanent` resta sempre aperto.
   */
  @property({ type: Boolean, reflect: true })
  opened = false;

  /**
   * Come Polymer / Vuetify: clic sullo scrim, Escape e swipe non chiudono.
   */
  @property({ type: Boolean, reflect: true })
  persistent = false;

  /**
   * Come Polymer: swipe dal bordo per aprire (e swipe indietro per chiudere).
   */
  @property({ type: Boolean, reflect: true, attribute: 'swipe-open' })
  swipeOpen = false;

  /**
   * Come Polymer: durata della transizione in millisecondi.
   */
  @property({ type: Number, attribute: 'transition-duration' })
  transitionDuration = 200;

  /**
   * Come Vuetify: sempre visibile, ignora il breakpoint.
   */
  @property({ type: Boolean, reflect: true })
  permanent = false;

  /**
   * Come Vuetify: sempre overlay con scrim.
   */
  @property({ type: Boolean, reflect: true })
  temporary = false;

  /**
   * Come Vuetify: larghezza compatta, da icone.
   */
  @property({ type: Boolean, reflect: true })
  rail = false;

  /**
   * Larghezza in px quando `rail` è attivo.
   */
  @property({ type: Number, attribute: 'rail-width' })
  railWidth = 56;

  /**
   * Larghezza piena in px (Polymer `--app-drawer-width`, default 256).
   */
  @property({ type: Number })
  width = 256;

  /**
   * Come Vuetify: da rail a larghezza piena al passaggio del mouse.
   */
  @property({ type: Boolean, reflect: true, attribute: 'expand-on-hover' })
  expandOnHover = false;

  /**
   * Come Vuetify: espande la rail a larghezza piena (overlay sul contenuto).
   */
  @property({ type: Boolean, reflect: true })
  expanded = false;

  /**
   * Come Vuetify: niente bordo / ombra di contenitore.
   */
  @property({ type: Boolean, reflect: true })
  floating = false;

  /**
   * Bordo dello schermo. `start`/`left` e `end`/`right` sono equivalenti.
   */
  @property({ type: String, reflect: true })
  location: DrawerLocation = 'start';

  /**
   * Colore di sfondo CSS.
   */
  @property({ type: String })
  color = '';

  /**
   * Ombre Material da 0 a 5.
   */
  @property({ type: Number })
  elevation = 0;

  /**
   * URL dell'immagine di sfondo.
   */
  @property({ type: String })
  image = '';

  /**
   * Mostra lo scrim quando il drawer è overlay e aperto.
   */
  @property({ type: Boolean })
  scrim = true;

  /**
   * Come Vuetify: `true` overlay, `false` desktop, `null` dal breakpoint.
   */
  @property({ converter: MOBILE_CONVERTER })
  mobile: boolean | null = null;

  /**
   * Soglia in px sotto la quale il drawer diventa overlay.
   */
  @property({ type: Number, attribute: 'mobile-breakpoint' })
  mobileBreakpoint = 1280;

  /**
   * Come Vuetify: non ricalcola overlay al resize.
   */
  @property({ type: Boolean, attribute: 'disable-resize-watcher' })
  disableResizeWatcher = false;

  /**
   * Come Vuetify: `position: absolute` invece di `fixed` in overlay.
   */
  @property({ type: Boolean, reflect: true })
  absolute = false;

  /**
   * Come Vuetify: scrim anche quando la rail è espansa.
   */
  @property({ type: Boolean, reflect: true })
  modal = false;

  /**
   * Come Polymer `app-drawer-layout`: sempre overlay.
   */
  @property({ type: Boolean, reflect: true, attribute: 'force-narrow' })
  forceNarrow = false;

  @state()
  private hovered = false;

  @state()
  private viewportMobile = false;

  private dragStartX = 0;
  private dragging = false;

  /**
   * Il drawer è visibile (permanent oppure `opened`).
   */
  isOpen(): boolean {
    return this.permanent || this.opened;
  }

  /**
   * Overlay sul contenuto, come `narrow` di Polymer `app-drawer-layout`.
   */
  isOverlay(): boolean {
    if (this.temporary || this.forceNarrow) {
      return true;
    }
    if (this.permanent) {
      return false;
    }
    if (this.mobile !== null) {
      return this.mobile;
    }
    if (this.disableResizeWatcher) {
      return false;
    }
    return this.viewportMobile;
  }

  /**
   * Alias Polymer / Vuetify di `isOverlay()`.
   */
  get narrow(): boolean {
    return this.isOverlay();
  }

  /**
   * Rail espansa (hover o `expanded`), sopra il contenuto.
   */
  isRailExpanded(): boolean {
    return this.rail && (this.expanded || (this.expandOnHover && this.hovered));
  }

  /**
   * Larghezza visiva del pannello in px.
   */
  currentWidth(): number {
    if (this.isRailExpanded()) {
      return this.width;
    }
    if (this.rail) {
      return this.railWidth;
    }
    return this.width;
  }

  /**
   * Come Polymer `getWidth()`.
   */
  getWidth(): number {
    return this.currentWidth();
  }

  /**
   * Spazio riservato nel layout. La rail espansa non lo cambia.
   */
  reservedWidth(): number {
    if (this.isOverlay()) {
      return 0;
    }
    if (!this.isOpen()) {
      return 0;
    }
    return this.rail ? this.railWidth : this.width;
  }

  /**
   * Ricalcola overlay dal viewport. `viewportWidth` serve ai test.
   *
   * @param viewportWidth - Larghezza finestra in px
   */
  resetLayout(viewportWidth = window.innerWidth): void {
    this.viewportMobile = viewportWidth < this.mobileBreakpoint;
  }

  /**
   * Apre il drawer.
   */
  open(): void {
    if (this.opened) {
      return;
    }
    this.opened = true;
  }

  /**
   * Chiude il drawer. No-op se `permanent`.
   */
  close(): void {
    if (this.permanent || !this.opened) {
      return;
    }
    this.opened = false;
  }

  /**
   * Inverte aperto / chiuso.
   */
  toggle(): void {
    if (this.isOpen()) {
      this.close();
      return;
    }
    this.open();
  }

  /**
   * Applica un trascinamento orizzontale. Usata anche dai test.
   *
   * @param deltaX - Spostamento in px (positivo verso destra)
   */
  syncSwipe(deltaX: number): void {
    const threshold = this.currentWidth() * 0.35;
    const towardsEnd = this.isEnd() ? deltaX < 0 : deltaX > 0;
    const distance = Math.abs(deltaX);
    if (distance < threshold) {
      return;
    }
    if (!this.isOpen() && this.swipeOpen && towardsEnd) {
      this.open();
      return;
    }
    if (this.isOpen() && this.canDismiss() && !towardsEnd) {
      this.close();
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.resetLayout();
    window.addEventListener('resize', this.onResize);
    document.addEventListener('keydown', this.onKeydown);
  }

  override disconnectedCallback(): void {
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('keydown', this.onKeydown);
    super.disconnectedCallback();
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('opened') && changed.get('opened') !== undefined) {
      this.dispatchEvent(new CustomEvent('opened-changed', {
        detail: { value: this.opened },
        bubbles: true,
        composed: true,
      }));
    }

    this.toggleAttribute('overlay', this.isOverlay());
    this.toggleAttribute('data-expanded', this.isRailExpanded());
    this.toggleAttribute('data-elevated', this.elevation > 0 && !this.floating);
    this.style.setProperty('--app-navigation-drawer-reserved', `${this.reservedWidth()}px`);
    this.style.setProperty('--app-navigation-drawer-current-width', `${this.currentWidth()}px`);
    this.style.setProperty('--app-navigation-drawer-duration', `${this.transitionDuration}ms`);
    this.style.setProperty('--app-navigation-drawer-shadow', this.currentShadow());
    if (this.color) {
      this.style.setProperty('--app-navigation-drawer-background', this.color);
    } else {
      this.style.removeProperty('--app-navigation-drawer-background');
    }
    if (this.image) {
      this.style.setProperty('--app-navigation-drawer-image', `url("${this.image}")`);
    } else {
      this.style.removeProperty('--app-navigation-drawer-image');
    }
  }

  override render() {
    const visible = this.isOpen();
    const overlay = this.isOverlay();
    const showScrim = this.shouldShowScrim();

    return html`
      <div
        class="scrim"
        part="scrim"
        ?data-open=${showScrim}
        @click=${this.onScrimClick}
      ></div>
      <div
        class="edge"
        part="edge"
        @pointerdown=${this.onPointerDown}
        @pointerup=${this.onPointerUp}
      ></div>
      <aside
        class="panel"
        part="panel"
        style=${styleMap({ 'box-shadow': this.currentShadow() })}
        ?data-open=${visible}
        ?data-overlay=${overlay}
        @pointerdown=${this.onPointerDown}
        @pointerup=${this.onPointerUp}
        @mouseenter=${this.onEnter}
        @mouseleave=${this.onLeave}
        @transitionend=${this.onTransitionEnd}
      >
        <div class="prepend" part="prepend"><slot name="prepend"></slot></div>
        <div class="content" part="content"><slot></slot></div>
        <div class="append" part="append"><slot name="append"></slot></div>
      </aside>
    `;
  }

  private shouldShowScrim(): boolean {
    if (!this.scrim) {
      return false;
    }
    if (this.modal && this.isRailExpanded()) {
      return true;
    }
    return this.isOverlay() && this.isOpen();
  }

  private canDismiss(): boolean {
    return !this.permanent && !this.persistent;
  }

  private isEnd(): boolean {
    return this.location === 'end' || this.location === 'right';
  }

  private currentShadow(): string {
    if (this.floating) {
      return 'none';
    }
    const level = Math.min(Math.max(this.elevation, 0), 5);
    const set = this.isEnd() ? SHADOWS_END : SHADOWS_START;
    return set[level] ?? 'none';
  }

  private onScrimClick = (): void => {
    if (this.canDismiss()) {
      this.close();
    }
  };

  private onKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') {
      return;
    }
    if (this.isOverlay() && this.isOpen() && this.canDismiss()) {
      this.close();
    }
  };

  private onResize = (): void => {
    if (this.disableResizeWatcher) {
      return;
    }
    this.resetLayout();
  };

  private onEnter = (): void => {
    this.hovered = true;
  };

  private onLeave = (): void => {
    this.hovered = false;
  };

  private onTransitionEnd = (event: TransitionEvent): void => {
    if (event.target !== event.currentTarget) {
      return;
    }
    this.dispatchEvent(new CustomEvent('app-drawer-transitioned', {
      bubbles: true,
      composed: true,
    }));
  };

  private onPointerDown = (event: PointerEvent): void => {
    if (!this.swipeOpen) {
      return;
    }
    this.dragging = true;
    this.dragStartX = event.clientX;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (!this.dragging) {
      return;
    }
    this.dragging = false;
    this.syncSwipe(event.clientX - this.dragStartX);
  };

  static override styles = css`
    :host {
      display: block;
      position: relative;
      z-index: 2;
      overflow: visible;
      width: var(--app-navigation-drawer-reserved, 0px);
      flex: 0 0 var(--app-navigation-drawer-reserved, 0px);
      color: var(--app-navigation-drawer-on-background, #e8eef2);
      pointer-events: none;
    }

    .scrim,
    .edge,
    .panel {
      pointer-events: auto;
    }

    .scrim {
      position: fixed;
      inset: 0;
      top: var(--app-navigation-drawer-top, 0px);
      z-index: 16;
      background: var(--app-navigation-drawer-scrim, rgba(0, 0, 0, 0.42));
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--app-navigation-drawer-duration, 200ms) ease;
    }

    .scrim[data-open] {
      opacity: 1;
      pointer-events: auto;
    }

    .edge {
      display: none;
      position: fixed;
      top: var(--app-navigation-drawer-top, 0px);
      bottom: 0;
      width: 20px;
      z-index: 15;
    }

    :host([swipe-open][overlay]:not([opened])) .edge {
      display: block;
    }

    :host([location='start']) .edge,
    :host([location='left']) .edge {
      left: 0;
    }

    :host([location='end']) .edge,
    :host([location='right']) .edge {
      right: 0;
    }

    .panel {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      width: var(--app-navigation-drawer-current-width, 256px);
      height: 100%;
      min-height: 100%;
      overflow: visible;
      background-color: var(--app-navigation-drawer-background, #152832);
      background-image: var(--app-navigation-drawer-image, none);
      background-size: cover;
      background-position: center;
      box-shadow: var(--app-navigation-drawer-shadow, none);
      border-inline-end: 1px solid var(--app-navigation-drawer-border, rgba(126, 200, 188, 0.18));
      transform: translateX(0);
      transition:
        transform var(--app-navigation-drawer-duration, 200ms) ease,
        width var(--app-navigation-drawer-duration, 200ms) ease,
        box-shadow 180ms ease;
    }

    :host([floating]) .panel,
    :host([data-elevated]) .panel {
      border-inline-end: 0;
    }

    :host([overlay]) .panel,
    :host([absolute]) .panel {
      position: fixed;
      top: var(--app-navigation-drawer-top, 0px);
      bottom: 0;
      height: auto;
      min-height: 0;
      z-index: 17;
    }

    :host([absolute]) .panel,
    :host([absolute]) .scrim,
    :host([absolute]) .edge {
      position: absolute;
    }

    :host([location='start']) .panel,
    :host([location='left']) .panel {
      left: 0;
      right: auto;
    }

    :host([location='end']) .panel,
    :host([location='right']) .panel {
      right: 0;
      left: auto;
      border-inline-end: 0;
      border-inline-start: 1px solid var(--app-navigation-drawer-border, rgba(126, 200, 188, 0.18));
    }

    :host([floating][location='end']) .panel,
    :host([floating][location='right']) .panel,
    :host([data-elevated][location='end']) .panel,
    :host([data-elevated][location='right']) .panel {
      border-inline-start: 0;
    }

    :host([overlay]) .panel:not([data-open]),
    :host([absolute]:not([permanent])) .panel:not([data-open]) {
      transform: translateX(-110%);
    }

    :host([overlay][location='end']) .panel:not([data-open]),
    :host([overlay][location='right']) .panel:not([data-open]),
    :host([absolute][location='end']:not([permanent])) .panel:not([data-open]),
    :host([absolute][location='right']:not([permanent])) .panel:not([data-open]) {
      transform: translateX(110%);
    }

    .prepend,
    .append {
      flex: 0 0 auto;
    }

    .content {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: auto;
      scrollbar-width: none;
    }

    .content::-webkit-scrollbar {
      display: none;
    }
  `;
}

const SHADOWS_START = [
  'none',
  '0 0 0 1px rgba(126, 200, 188, 0.22), 6px 0 14px rgba(0, 0, 0, 0.55), 3px 0 6px rgba(126, 200, 188, 0.28)',
  '0 0 0 1px rgba(126, 200, 188, 0.26), 10px 0 22px rgba(0, 0, 0, 0.6), 5px 0 10px rgba(126, 200, 188, 0.32)',
  '0 0 0 1px rgba(126, 200, 188, 0.3), 14px 0 30px rgba(0, 0, 0, 0.65), 7px 0 14px rgba(126, 200, 188, 0.36)',
  '0 0 0 1px rgba(126, 200, 188, 0.34), 20px 0 40px rgba(0, 0, 0, 0.7), 10px 0 20px rgba(126, 200, 188, 0.4)',
  '0 0 0 1px rgba(126, 200, 188, 0.4), 28px 0 56px rgba(0, 0, 0, 0.78), 14px 0 28px rgba(126, 200, 188, 0.48)',
] as const;

const SHADOWS_END = [
  'none',
  '0 0 0 1px rgba(126, 200, 188, 0.22), -6px 0 14px rgba(0, 0, 0, 0.55), -3px 0 6px rgba(126, 200, 188, 0.28)',
  '0 0 0 1px rgba(126, 200, 188, 0.26), -10px 0 22px rgba(0, 0, 0, 0.6), -5px 0 10px rgba(126, 200, 188, 0.32)',
  '0 0 0 1px rgba(126, 200, 188, 0.3), -14px 0 30px rgba(0, 0, 0, 0.65), -7px 0 14px rgba(126, 200, 188, 0.36)',
  '0 0 0 1px rgba(126, 200, 188, 0.34), -20px 0 40px rgba(0, 0, 0, 0.7), -10px 0 20px rgba(126, 200, 188, 0.4)',
  '0 0 0 1px rgba(126, 200, 188, 0.4), -28px 0 56px rgba(0, 0, 0, 0.78), -14px 0 28px rgba(126, 200, 188, 0.48)',
] as const;

declare global {
  interface HTMLElementTagNameMap {
    'app-navigation-drawer': AppNavigationDrawer;
  }
}
