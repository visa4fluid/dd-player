import { LitElement, css, html, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

export type PaginationPosition = 'left' | 'center' | 'right';

/**
 * Paginazione di liste.
 * Replica Polymer `paper-pagination` (`@fluidnext-polymer/paper-pagination`).
 */
@customElement('lit-pagination')
export class LitPagination extends LitElement {
  /**
   * Etichetta accanto al numero di pagina, seguita dal totale pagine.
   */
  @property({ type: String, attribute: 'current-page-label' })
  currentPageLabel = 'of ';

  /**
   * Allineamento nel contenitore: `left`, `center` o `right`.
   */
  @property({ type: String, reflect: true })
  position: PaginationPosition = 'right';

  /**
   * Quanti numeri di pagina mostrare. `-1` non è usato: il massimo visibile è questo valore.
   */
  @property({ type: Number, reflect: true, attribute: 'view-page-range' })
  viewPageRange = 5;

  /**
   * Pagina corrente, 1-based.
   */
  @property({ type: Number, reflect: true })
  page = 1;

  /**
   * Totale elementi della lista.
   */
  @property({ type: Number, attribute: 'total-items' })
  totalItems = 0;

  /**
   * Elementi per pagina.
   */
  @property({ type: Number, attribute: 'item-per-page' })
  itemPerPage = 0;

  /**
   * Valori disponibili nel selettore elementi per pagina.
   */
  @property({ attribute: false })
  listNumberPerPage: number[] = [5, 10, 20, 30, 40, 50];

  /**
   * Se valorizzato, mostra le frecce. Il nome è tenuto per compatibilità con paper-pagination.
   */
  @property({ type: String, attribute: 'next-icon' })
  nextIcon = '';

  /**
   * Nome icona precedente (compatibilità paper-pagination).
   */
  @property({ type: String, attribute: 'previous-icon' })
  previousIcon = '';

  /**
   * Nasconde il selettore elementi per pagina.
   */
  @property({ type: Boolean, reflect: true, attribute: 'hide-number-element' })
  hideNumberElement = false;

  /**
   * Nasconde il campo pagina corrente.
   */
  @property({ type: Boolean, reflect: true, attribute: 'hide-page-element' })
  hidePageElement = false;

  @state()
  private inputPlaceholder = '';

  private lastItemPerPage = 0;
  private initialized = false;

  get numberPages(): number {
    if (!this.itemPerPage || this.totalItems <= 0) {
      return 0;
    }
    return Math.ceil(this.totalItems / this.itemPerPage);
  }

  get isHidden(): boolean {
    return !this.itemPerPage || this.totalItems <= this.itemPerPage;
  }

  visiblePages(): number[] {
    const pages = this.numberPages;
    const range = this.viewPageRange;
    const page = this.page;
    if (pages <= 0 || range <= 0) {
      return [];
    }
    const middle = Math.floor(range / 2);
    let first = 1;
    if (page > middle) {
      const lastCounter = range - middle;
      if (pages > range + 1 && page + range <= pages + lastCounter) {
        first = page - middle;
      } else if (pages > range + 1 && page + range > pages + lastCounter) {
        first = pages - range + 1;
      }
    }
    const numbers: number[] = [];
    for (let count = first; count < first + range && count <= pages; count += 1) {
      numbers.push(count);
    }
    return numbers;
  }

  willUpdate(changed: PropertyValues): void {
    if (changed.has('itemPerPage') && this.itemPerPage > 0) {
      this.ensureItemPerPageInList(this.itemPerPage);
      const previous = this.lastItemPerPage;
      if (previous > 0 && previous !== this.itemPerPage) {
        const firstElement = previous * (this.page - 1) + 1;
        this.page = Math.floor((firstElement - 1) / this.itemPerPage) + 1;
      }
      this.lastItemPerPage = this.itemPerPage;
    }
    if (this.numberPages > 0 && this.page > this.numberPages) {
      this.page = this.numberPages;
    }
    if (this.page < 1) {
      this.page = 1;
    }
  }

  render() {
    const hidden = this.isHidden;
    return html`
      <div
        id="container"
        class=${classMap({
          flex: true,
          'is-left': this.position === 'left',
          'is-center': this.position === 'center',
          'is-right': this.position !== 'left' && this.position !== 'center',
          'is-hidden': hidden,
        })}
      >
        ${hidden ? null : this.renderControls()}
      </div>
    `;
  }

  private renderControls() {
    return html`
      ${this.hidePageElement ? null : this.renderPageInput()}
      ${this.nextIcon ? this.renderArrow('previous') : null}
      ${this.visiblePages().map((count) => this.renderPageButton(count))}
      ${this.nextIcon ? this.renderArrow('next') : null}
      ${this.hideNumberElement ? null : this.renderItemPerPage()}
    `;
  }

  private renderPageInput() {
    return html`
      <label class="page-field">
        <span class="page-field-label">${this.currentPageLabel}${this.numberPages}</span>
        <input
          class="page-input"
          type="number"
          min="1"
          max=${this.numberPages}
          .value=${this.inputPlaceholder ? '' : String(this.page)}
          placeholder=${this.inputPlaceholder}
          @keyup=${this.onPageKeyup}
        />
      </label>
    `;
  }

  private renderArrow(kind: 'previous' | 'next') {
    const disabled = kind === 'previous' ? this.page < 2 : this.numberPages <= this.page;
    return html`
      <button
        class="arrow"
        type="button"
        ?disabled=${disabled}
        aria-label=${kind === 'previous' ? 'Pagina precedente' : 'Pagina successiva'}
        @click=${kind === 'previous' ? this.clickPrevious : this.clickNext}
      >
        ${kind === 'previous' ? this.previousGlyph() : this.nextGlyph()}
      </button>
    `;
  }

  private renderPageButton(count: number) {
    const selected = count === this.page;
    return html`
      <button
        class=${classMap({ page: true, selected })}
        type="button"
        data-page=${count}
        ?disabled=${selected}
        @click=${this.clickPage}
      >${count}</button>
    `;
  }

  private renderItemPerPage() {
    return html`
      <label class="items-field">
        <span class="items-field-label">Items</span>
        <select class="items-select" aria-label="Items" @change=${this.onItemPerPage}>
          ${this.listNumberPerPage.map((value) => html`
            <option value=${value} ?selected=${value === this.itemPerPage}>${value}</option>
          `)}
        </select>
      </label>
    `;
  }

  private clickPage = (event: Event): void => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }
    const next = Number(target.dataset.page ?? target.textContent);
    if (!Number.isFinite(next)) {
      return;
    }
    this.setPage(next);
  };

  private clickPrevious = (): void => {
    if (this.page < 2) {
      return;
    }
    this.setPage(this.page - 1);
  };

  private clickNext = (): void => {
    if (this.numberPages <= this.page) {
      return;
    }
    this.setPage(this.page + 1);
  };

  private onPageKeyup = (event: KeyboardEvent): void => {
    if (event.key !== 'Enter' && event.keyCode !== 13) {
      return;
    }
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    const next = Number.parseInt(target.value, 10);
    if (next <= this.numberPages && next >= 1) {
      this.inputPlaceholder = '';
      this.setPage(next);
      return;
    }
    this.inputPlaceholder = String(this.page);
    target.value = '';
  };

  private onItemPerPage = (event: Event): void => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }
    const next = Number.parseInt(target.value, 10);
    if (!Number.isFinite(next) || next === this.itemPerPage) {
      return;
    }
    this.itemPerPage = next;
  };

  private setPage(next: number): void {
    if (next === this.page) {
      return;
    }
    this.page = next;
    this.inputPlaceholder = '';
  }

  updated(changed: PropertyValues): void {
    this.toggleAttribute('hidden', this.isHidden);
    const select = this.renderRoot.querySelector('select.items-select');
    if (select instanceof HTMLSelectElement) {
      select.value = String(this.itemPerPage);
    }
    if (!this.initialized) {
      this.initialized = true;
      return;
    }
    if (changed.has('page')) {
      this.dispatchEvent(new CustomEvent('page-changed', {
        detail: { page: this.page },
        bubbles: true,
        composed: true,
      }));
    }
    if (changed.has('itemPerPage')) {
      this.dispatchEvent(new CustomEvent('item-per-page-changed', {
        detail: { itemPerPage: this.itemPerPage },
        bubbles: true,
        composed: true,
      }));
    }
  }

  private ensureItemPerPageInList(value: number): void {
    if (this.listNumberPerPage.includes(value)) {
      return;
    }
    this.listNumberPerPage = [...this.listNumberPerPage, value].sort((prev, next) => prev - next);
  }

  private previousGlyph() {
    return html`
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path>
      </svg>
    `;
  }

  private nextGlyph() {
    return html`
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"></path>
      </svg>
    `;
  }

  static styles = css`
    :host {
      display: block;
      color: var(--lit-pagination-color, inherit);
    }

    #container {
      display: flex;
      align-items: center;
      flex-wrap: nowrap;
      gap: var(--lit-pagination-container-gap, 4px);
      white-space: nowrap;
    }

    #container.is-left { justify-content: flex-start; }
    #container.is-center { justify-content: center; }
    #container.is-right { justify-content: flex-end; }
    #container.is-hidden { display: none; }

    .page,
    .arrow {
      box-sizing: border-box;
      display: inline-grid;
      place-items: center;
      width: var(--lit-pagination-size, 30px);
      height: var(--lit-pagination-size, 30px);
      min-width: var(--lit-pagination-size, 30px);
      padding: 0;
      margin: var(--lit-pagination-gap, 0.29em);
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: inherit;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }

    .page.selected,
    .page:disabled {
      background: var(--lit-pagination-selected-background, var(--dark-primary-color, #1a3340));
      color: var(--lit-pagination-selected-color, var(--text-primary-color, #e8eef2));
      cursor: default;
    }

    .arrow:disabled {
      opacity: 0.35;
      cursor: default;
    }

    .arrow svg {
      width: var(--lit-pagination-icon-size, 20px);
      height: var(--lit-pagination-icon-size, 20px);
      fill: currentColor;
    }

    .page-field,
    .items-field {
      display: flex;
      flex-direction: var(--lit-pagination-field-direction, column);
      align-items: var(--lit-pagination-field-align, stretch);
      justify-content: center;
      gap: var(--lit-pagination-field-gap, 0px);
      min-width: var(--lit-pagination-field-min-width, 50px);
      height: var(--lit-pagination-field-height, 60px);
      margin: var(--lit-pagination-field-margin, 0 4px);
    }

    .page-field-label,
    .items-field-label {
      font-size: var(--lit-pagination-label-size, 11px);
      line-height: 1.2;
      white-space: nowrap;
      opacity: 0.72;
    }

    .page-input,
    .items-select {
      width: var(--lit-pagination-input-width, 50px);
      min-width: var(--lit-pagination-input-width, 50px);
      height: var(--lit-pagination-input-height, 28px);
      border: 0;
      border-bottom: 1px solid currentColor;
      background: transparent;
      color: inherit;
      font: inherit;
    }

    .items-field-label {
      display: var(--lit-pagination-items-label-display, block);
    }

    .items-select {
      min-width: var(--lit-pagination-select-width, 60px);
      width: var(--lit-pagination-select-width, 60px);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'lit-pagination': LitPagination;
  }
}
