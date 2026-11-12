import { LitElement, css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * Etichetta che compare su hover e focus.
 * Replica Polymer `paper-tooltip` (`@PolymerElements/paper-tooltip`).
 */
@customElement('lit-tooltip')
export class LitTooltip extends LitElement {
  /**
   * Id dell'ancora, sibling o nello stesso root. Vuoto = genitore.
   */
  @property({ type: String })
  for = '';

  /**
   * Se true, show/hide solo via API (`show`, `hide`, `playAnimation`).
   */
  @property({ type: Boolean, reflect: true, attribute: 'manual-mode' })
  manualMode = false;

  /**
   * Lato dell'ancora: `top`, `right`, `bottom`, `left`.
   */
  @property({ type: String, reflect: true })
  position: TooltipPosition = 'bottom';

  /**
   * Tiene il tooltip dentro la viewport.
   */
  @property({ type: Boolean, reflect: true, attribute: 'fit-to-visible-bounds' })
  fitToVisibleBounds = false;

  /**
   * Distanza in px tra tooltip e ancora.
   */
  @property({ type: Number })
  offset = 14;

  /**
   * Ritardo in ms prima dell'animazione di ingresso.
   */
  @property({ type: Number, attribute: 'animation-delay' })
  animationDelay = 500;

  /**
   * Classe CSS di ingresso. Vuoto = `fade-in-animation`.
   */
  @property({ type: String, attribute: 'animation-entry' })
  animationEntry = '';

  /**
   * Classe CSS di uscita. Vuoto = `fade-out-animation`.
   */
  @property({ type: String, attribute: 'animation-exit' })
  animationExit = '';

  @state()
  private showing = false;

  @state()
  private animationPlaying = false;

  @state()
  private entryClass = '';

  @state()
  private exitClass = '';

  @state()
  private cancelClass = false;

  @query('#tooltip')
  private tooltipEl?: HTMLElement;

  private targetEl: Element | null = null;
  private readonly onTargetEnter = () => {
    this.show();
  };
  private readonly onTargetLeave = () => {
    this.hide();
  };
  private readonly onReposition = () => {
    if (this.showing) {
      this.updatePosition();
    }
  };
  private readonly onAnimationEnd = () => {
    this.animationPlaying = false;
    if (!this.showing) {
      this.exitClass = '';
    }
  };

  static styles = css`
    :host {
      display: block;
      position: fixed;
      outline: none;
      z-index: 1002;
      pointer-events: none;
      user-select: none;
      cursor: default;
    }

    :host([hidden]) {
      display: none !important;
    }

    #tooltip {
      display: block;
      outline: none;
      font-size: var(--lit-tooltip-font-size, var(--paper-tooltip-font-size, 10px));
      line-height: 1;
      background-color: var(--lit-tooltip-background, var(--paper-tooltip-background, #616161));
      color: var(--lit-tooltip-text-color, var(--paper-tooltip-text-color, white));
      padding: 8px;
      border-radius: 2px;
      opacity: var(--lit-tooltip-opacity, var(--paper-tooltip-opacity, 0.9));
    }

    @keyframes keyFrameScaleUp {
      0% { transform: scale(0); }
      100% { transform: scale(1); }
    }

    @keyframes keyFrameScaleDown {
      0% { transform: scale(1); }
      100% { transform: scale(0); }
    }

    @keyframes keyFrameFadeInOpacity {
      0% { opacity: 0; }
      100% { opacity: var(--lit-tooltip-opacity, var(--paper-tooltip-opacity, 0.9)); }
    }

    @keyframes keyFrameFadeOutOpacity {
      0% { opacity: var(--lit-tooltip-opacity, var(--paper-tooltip-opacity, 0.9)); }
      100% { opacity: 0; }
    }

    .fade-in-animation {
      opacity: 0;
      animation-delay: var(--lit-tooltip-delay-in, var(--paper-tooltip-delay-in, 500ms));
      animation-name: keyFrameFadeInOpacity;
      animation-iteration-count: 1;
      animation-timing-function: ease-in;
      animation-duration: var(--lit-tooltip-duration-in, var(--paper-tooltip-duration-in, 500ms));
      animation-fill-mode: forwards;
    }

    .fade-out-animation {
      opacity: var(--lit-tooltip-opacity, var(--paper-tooltip-opacity, 0.9));
      animation-delay: var(--lit-tooltip-delay-out, var(--paper-tooltip-delay-out, 0ms));
      animation-name: keyFrameFadeOutOpacity;
      animation-iteration-count: 1;
      animation-timing-function: ease-in;
      animation-duration: var(--lit-tooltip-duration-out, var(--paper-tooltip-duration-out, 500ms));
      animation-fill-mode: forwards;
    }

    .scale-up-animation {
      transform: scale(0);
      opacity: var(--lit-tooltip-opacity, var(--paper-tooltip-opacity, 0.9));
      animation-delay: var(--lit-tooltip-delay-in, var(--paper-tooltip-delay-in, 500ms));
      animation-name: keyFrameScaleUp;
      animation-iteration-count: 1;
      animation-timing-function: ease-in;
      animation-duration: var(--lit-tooltip-duration-in, var(--paper-tooltip-duration-in, 500ms));
      animation-fill-mode: forwards;
    }

    .scale-down-animation {
      transform: scale(1);
      opacity: var(--lit-tooltip-opacity, var(--paper-tooltip-opacity, 0.9));
      animation-delay: var(--lit-tooltip-delay-out, var(--paper-tooltip-delay-out, 500ms));
      animation-name: keyFrameScaleDown;
      animation-iteration-count: 1;
      animation-timing-function: ease-in;
      animation-duration: var(--lit-tooltip-duration-out, var(--paper-tooltip-duration-out, 500ms));
      animation-fill-mode: forwards;
    }

    .cancel-animation {
      animation-delay: -30s !important;
    }

    .hidden {
      display: none !important;
    }
  `;

  /**
   * Ancora del tooltip: elemento `for` oppure il genitore.
   */
  get target(): Element | null {
    const root = this.getRootNode();
    if (this.for) {
      if (root instanceof Document || root instanceof ShadowRoot) {
        return root.getElementById(this.for);
      }
      return document.getElementById(this.for);
    }
    return this.parentElement;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'tooltip');
    this.tabIndex = -1;
    this.syncDelayVar();
    this.findTarget();
    window.addEventListener('resize', this.onReposition);
    window.addEventListener('scroll', this.onReposition, true);
  }

  disconnectedCallback(): void {
    this.removeListeners();
    window.removeEventListener('resize', this.onReposition);
    window.removeEventListener('scroll', this.onReposition, true);
    super.disconnectedCallback();
  }

  protected updated(changed: Map<string, unknown>): void {
    if (changed.has('for') || changed.has('manualMode')) {
      this.findTarget();
    }
    if (changed.has('animationDelay')) {
      this.syncDelayVar();
    }
    if (changed.has('position') && this.showing) {
      this.updatePosition();
    }
  }

  /**
   * Compatibilità paper-tooltip: `entry` mostra, `exit` nasconde.
   */
  playAnimation(type: 'entry' | 'exit'): void {
    if (type === 'entry') {
      this.show();
      return;
    }
    if (type === 'exit') {
      this.hide();
    }
  }

  /**
   * Interrompe l'animazione e lascia il tooltip nello stato corrente.
   */
  cancelAnimation(): void {
    this.cancelClass = true;
    this.animationPlaying = false;
  }

  /**
   * Mostra il tooltip.
   */
  show(): void {
    if (this.showing || !this.hasContent()) {
      return;
    }
    this.showing = true;
    this.cancelClass = false;
    this.exitClass = '';
    this.entryClass = this.animationType('entry');
    this.animationPlaying = true;
    void this.updateComplete.then(() => this.updatePosition());
  }

  /**
   * Nasconde il tooltip.
   */
  hide(): void {
    if (!this.showing) {
      return;
    }
    this.showing = false;
    if (this.animationPlaying) {
      this.resetHidden();
      return;
    }
    this.entryClass = '';
    this.cancelClass = false;
    this.exitClass = this.animationType('exit');
    this.animationPlaying = true;
  }

  /**
   * Ricalcola left/top rispetto all'ancora.
   */
  updatePosition(): void {
    const target = this.targetEl ?? this.target;
    const tooltip = this.tooltipEl;
    if (!target || !tooltip || tooltip.classList.contains('hidden')) {
      return;
    }
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const width = tooltipRect.width || tooltip.offsetWidth;
    const height = tooltipRect.height || tooltip.offsetHeight;
    const centerX = targetRect.left + (targetRect.width - width) / 2;
    const centerY = targetRect.top + (targetRect.height - height) / 2;
    let left = centerX;
    let top = targetRect.bottom + this.offset;
    switch (this.position) {
      case 'top':
        left = centerX;
        top = targetRect.top - height - this.offset;
        break;
      case 'left':
        left = targetRect.left - width - this.offset;
        top = centerY;
        break;
      case 'right':
        left = targetRect.right + this.offset;
        top = centerY;
        break;
      default:
        break;
    }
    if (this.fitToVisibleBounds) {
      left = Math.min(Math.max(8, left), window.innerWidth - width - 8);
      top = Math.min(Math.max(8, top), window.innerHeight - height - 8);
    }
    this.style.left = `${Math.round(left)}px`;
    this.style.top = `${Math.round(top)}px`;
  }

  /**
   * True se il tooltip è visibile o in ingresso.
   */
  isShowing(): boolean {
    return this.showing;
  }

  protected render() {
    const hidden = !this.showing && !this.exitClass;
    const classes: Record<string, boolean> = {
      hidden,
      'cancel-animation': this.cancelClass,
    };
    if (this.entryClass) {
      classes[this.entryClass] = true;
    }
    if (this.exitClass) {
      classes[this.exitClass] = true;
    }
    return html`
      <div
        id="tooltip"
        class=${classMap(classes)}
        @animationend=${this.onAnimationEnd}
      >
        <slot></slot>
      </div>
    `;
  }

  private hasContent(): boolean {
    if ((this.textContent ?? '').trim() !== '') {
      return true;
    }
    const slot = this.shadowRoot?.querySelector('slot');
    if (!(slot instanceof HTMLSlotElement)) {
      return false;
    }
    return slot.assignedNodes().some((node) => (node.textContent ?? '').trim() !== '');
  }

  private animationType(kind: 'entry' | 'exit'): string {
    if (kind === 'entry' && this.animationEntry) {
      return this.animationEntry;
    }
    if (kind === 'exit' && this.animationExit) {
      return this.animationExit;
    }
    return kind === 'entry' ? 'fade-in-animation' : 'fade-out-animation';
  }

  private findTarget(): void {
    this.removeListeners();
    this.targetEl = this.target;
    if (!this.manualMode) {
      this.addListeners();
    }
  }

  private addListeners(): void {
    if (!this.targetEl) {
      return;
    }
    this.targetEl.addEventListener('mouseenter', this.onTargetEnter);
    this.targetEl.addEventListener('focus', this.onTargetEnter, true);
    this.targetEl.addEventListener('mouseleave', this.onTargetLeave);
    this.targetEl.addEventListener('blur', this.onTargetLeave, true);
    this.targetEl.addEventListener('click', this.onTargetLeave);
  }

  private removeListeners(): void {
    if (!this.targetEl) {
      return;
    }
    this.targetEl.removeEventListener('mouseenter', this.onTargetEnter);
    this.targetEl.removeEventListener('focus', this.onTargetEnter, true);
    this.targetEl.removeEventListener('mouseleave', this.onTargetLeave);
    this.targetEl.removeEventListener('blur', this.onTargetLeave, true);
    this.targetEl.removeEventListener('click', this.onTargetLeave);
  }

  private resetHidden(): void {
    this.animationPlaying = false;
    this.entryClass = '';
    this.exitClass = '';
    this.cancelClass = false;
  }

  private syncDelayVar(): void {
    const delay = `${this.animationDelay}ms`;
    this.style.setProperty('--lit-tooltip-delay-in', delay);
    this.style.setProperty('--paper-tooltip-delay-in', delay);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lit-tooltip': LitTooltip;
  }
}
