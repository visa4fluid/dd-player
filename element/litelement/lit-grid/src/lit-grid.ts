import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { TileCoords } from './TileCoords.js';

const RESIZE_TOP = new Set(['top', 'top-right', 'top-left']);
const RESIZE_LEFT = new Set(['left', 'top-left', 'bottom-left']);
const RESIZE_WIDTH = new Set(['left', 'right', 'bottom-right', 'bottom-left', 'top-right', 'top-left']);
const RESIZE_HEIGHT = new Set(['top', 'bottom', 'top-right', 'bottom-right', 'bottom-left', 'top-left']);

type PointerKind = 'move' | 'resize';

type PointerSession = {
  kind: PointerKind;
  tile: HTMLElement;
  pointerId: number;
  resizeType: string;
  originLeft: number;
  originTop: number;
  originWidth: number;
  originHeight: number;
  lastX: number;
  lastY: number;
};

/**
 * Griglia di tile trascinabili e ridimensionabili.
 * Replica Polymer `paper-grid` (`@fluidnext-polymer/paper-grid`).
 */
@customElement('lit-grid')
export class LitGrid extends LitElement {
  /**
   * Altezza in px dell'unità verticale.
   */
  @property({ type: Number, reflect: true, attribute: 'cell-height' })
  cellHeight = 100;

  /**
   * Larghezza in px dell'unità orizzontale.
   */
  @property({ type: Number, reflect: true, attribute: 'cell-width' })
  cellWidth = 100;

  /**
   * Margine in px tra le celle.
   */
  @property({ type: Number, reflect: true, attribute: 'cell-margin' })
  cellMargin = 0;

  /**
   * Larghezza minima di una tile in celle.
   */
  @property({ type: Number, reflect: true, attribute: 'min-width' })
  minWidth = 1;

  /**
   * Larghezza massima di una tile in celle. `Infinity` = nessun limite.
   */
  @property({ type: Number, attribute: 'max-width' })
  maxWidth = Infinity;

  /**
   * Altezza minima di una tile in celle.
   */
  @property({ type: Number, reflect: true, attribute: 'min-height' })
  minHeight = 1;

  /**
   * Altezza massima di una tile in celle. `Infinity` = nessun limite.
   */
  @property({ type: Number, attribute: 'max-height' })
  maxHeight = Infinity;

  /**
   * Larghezza minima in px dei componenti nella griglia. `0` = nessun vincolo extra.
   * Non modifica `cell-width` né le dimensioni della griglia.
   */
  @property({ type: Number, reflect: true, attribute: 'widget-min-width' })
  widgetMinWidth = 0;

  /**
   * Altezza minima in px dei componenti nella griglia. `0` = nessun vincolo extra.
   * Non modifica `cell-height` né le dimensioni della griglia.
   */
  @property({ type: Number, reflect: true, attribute: 'widget-min-height' })
  widgetMinHeight = 0;

  /**
   * Numero di colonne.
   */
  @property({ type: Number, reflect: true, attribute: 'col-count' })
  colCount = 10;

  /**
   * Numero di righe.
   */
  @property({ type: Number, reflect: true, attribute: 'row-count' })
  rowCount = 10;

  /**
   * Espande le colonne se una tile esce dal bordo destro.
   */
  @property({ type: Boolean, reflect: true, attribute: 'col-autogrow' })
  colAutogrow = false;

  /**
   * Espande le righe se una tile esce dal bordo basso.
   */
  @property({ type: Boolean, reflect: true, attribute: 'row-autogrow' })
  rowAutogrow = false;

  /**
   * Se `true`, blocca il drag orizzontale nel perimetro visibile e non apre lo scroll X.
   * Con `col-autogrow` aggiunge colonne per occupare la larghezza del contenitore.
   */
  @property({ type: Boolean, reflect: true, attribute: 'col-no-scroll' })
  colNoScroll = false;

  /**
   * Se `true`, blocca il drag verticale nel perimetro visibile e non apre lo scroll Y.
   * Con `row-autogrow` aggiunge righe per occupare l'altezza del contenitore.
   */
  @property({ type: Boolean, reflect: true, attribute: 'row-no-scroll' })
  rowNoScroll = false;

  /**
   * Anima spostamenti e resize.
   */
  @property({ type: Boolean, reflect: true })
  animated = false;

  /**
   * Abilita il trascinamento delle tile.
   */
  @property({ type: Boolean, reflect: true })
  draggable = false;

  /**
   * Abilita il resize dalle maniglie `[resize]`.
   */
  @property({ type: Boolean, reflect: true })
  resizable = false;

  /**
   * Permette alle tile di sovrapporsi.
   */
  @property({ type: Boolean, reflect: true })
  overlappable = false;

  /**
   * Mostra il reticolato a puntini delle celle, allineato a
   * `cell-width`, `cell-height` e `cell-margin`.
   */
  @property({ type: Boolean, reflect: true, attribute: 'show-grid' })
  showGrid = false;

  private observer: MutationObserver | null = null;
  private sizeObserver: ResizeObserver | null = null;
  private session: PointerSession | null = null;
  private placeholder: HTMLElement | null = null;
  private lockedScroll: { node: HTMLElement; left: number; top: number }[] = [];
  private portOverflow: {
    node: HTMLElement;
    overflow: string;
    overflowX: string;
    overflowY: string;
  } | null = null;

  /**
   * Larghezza della griglia in px.
   */
  gridWidth(): number {
    return this.cellWidth * this.colCount + this.cellMargin * Math.max(this.colCount - 1, 0);
  }

  /**
   * Altezza della griglia in px.
   */
  gridHeight(): number {
    return this.cellHeight * this.rowCount + this.cellMargin * Math.max(this.rowCount - 1, 0);
  }

  /**
   * Colonne che stanno nella viewport dello scroll-port. Fallback a `col-count`.
   */
  visibleColCount(): number {
    return this.visibleCellCount(this.cellWidth, this.visibleSize().width, this.colCount);
  }

  /**
   * Righe che stanno nella viewport dello scroll-port. Fallback a `row-count`.
   */
  visibleRowCount(): number {
    return this.visibleCellCount(this.cellHeight, this.visibleSize().height, this.rowCount);
  }

  /**
   * Blocca left/top della tile nel perimetro visibile se `*-no-scroll` è attivo.
   */
  clampDragPixels(left: number, top: number, widthPx: number, heightPx: number): { left: number; top: number } {
    const bounds = this.visibleBounds();
    const next = { left, top };
    if (this.colNoScroll) {
      const limit = Math.min(bounds.left + bounds.width, this.gridWidth());
      const maxLeft = Math.max(bounds.left, limit - widthPx);
      next.left = Math.min(Math.max(left, bounds.left), maxLeft);
    }
    if (this.rowNoScroll) {
      const limit = Math.min(bounds.top + bounds.height, this.gridHeight());
      const maxTop = Math.max(bounds.top, limit - heightPx);
      next.top = Math.min(Math.max(top, bounds.top), maxTop);
    }
    return next;
  }

  /**
   * Posiziona le tile e aggiorna le CSS custom property.
   */
  computeStyles(): void {
    this.style.setProperty('--grid-width', `${this.gridWidth()}px`);
    this.style.setProperty('--grid-height', `${this.gridHeight()}px`);
    this.style.setProperty('--grid-cell-width', `${this.cellWidth}px`);
    this.style.setProperty('--grid-cell-height', `${this.cellHeight}px`);
    this.style.setProperty('--grid-cell-margin', `${this.cellMargin}px`);
    this.style.setProperty(
      '--grid-move-animation-transition',
      this.animated ? 'top 0.5s ease, left 0.5s ease' : 'none',
    );
    this.style.setProperty(
      '--grid-resize-animation-transition',
      this.animated ? 'top 0.5s ease, left 0.5s ease, width 0.5s ease, height 0.5s ease' : 'none',
    );
    this.enforceWidgetMins();
    this.layoutTiles();
  }

  /**
   * Porta a runtime ogni tile almeno a `widget-min-width` / `widget-min-height`.
   * Non modifica celle o dimensioni della griglia.
   */
  enforceWidgetMins(): void {
    for (const tile of this.tiles()) {
      if (
        this.session?.tile === tile
        || tile.hasAttribute('collapsed')
        || tile.classList.contains('is-min')
      ) {
        continue;
      }
      const coords = this.getCoordinates(tile);
      const minCols = this.minTileCols(tile);
      const minRows = this.minTileRows(tile);
      if (coords.width < minCols) {
        tile.setAttribute('width', String(minCols));
      }
      if (coords.height < minRows) {
        tile.setAttribute('height', String(minRows));
      }
    }
  }

  /**
   * Espande la griglia se la tile è fuori dai limiti e l'autogrow è attivo.
   */
  ensureSpace(tile: HTMLElement): void {
    const coords = this.getCoordinates(tile);
    if (this.rowAutogrow) {
      const needed = coords.row + coords.height;
      const max = this.rowNoScroll ? Math.min(needed, this.visibleRowCount()) : needed;
      this.rowCount = Math.max(this.rowCount, max);
    }
    if (this.colAutogrow) {
      const needed = coords.col + coords.width;
      const max = this.colNoScroll ? Math.min(needed, this.visibleColCount()) : needed;
      this.colCount = Math.max(this.colCount, max);
    }
  }

  /**
   * Legge `col`, `row`, `width`, `height` da una tile.
   */
  getCoordinates(tile: HTMLElement): TileCoords {
    return {
      col: Number(tile.getAttribute('col') ?? 0),
      row: Number(tile.getAttribute('row') ?? 0),
      width: Number(tile.getAttribute('width') ?? 1),
      height: Number(tile.getAttribute('height') ?? 1),
    };
  }

  /**
   * Cella più vicina a una coordinata in px.
   */
  getClosestPosition(
    x: number,
    y: number,
    rows = 1,
    cols = 1,
    floorHalf = false,
  ): { col: number; row: number } {
    const colRatio = (x + this.cellMargin / 2) / (this.cellWidth + this.cellMargin);
    const rowRatio = (y + this.cellMargin / 2) / (this.cellHeight + this.cellMargin);
    const raw = floorHalf
      ? {
          col: colRatio % 0.5 === 0 ? Math.floor(colRatio) : Math.round(colRatio),
          row: rowRatio % 0.5 === 0 ? Math.floor(rowRatio) : Math.round(rowRatio),
        }
      : {
          col: Math.round(colRatio),
          row: Math.round(rowRatio),
        };
    return {
      col: Math.max(Math.min(raw.col, this.maxAxisIndex('col', cols)), 0),
      row: Math.max(Math.min(raw.row, this.maxAxisIndex('row', rows)), 0),
    };
  }

  /**
   * Dimensione in celle più vicina a width/height in px.
   */
  getClosestSize(
    width: number,
    height: number,
    maxWidth = this.colCount,
    maxHeight = this.rowCount,
  ): { width: number; height: number } {
    const size = {
      width: Math.round((width + this.cellMargin / 2) / (this.cellWidth + this.cellMargin)),
      height: Math.round((height + this.cellMargin / 2) / (this.cellHeight + this.cellMargin)),
    };
    return {
      width: Math.max(Math.min(size.width, this.maxAxisSpan('col', maxWidth)), this.minTileCols()),
      height: Math.max(Math.min(size.height, this.maxAxisSpan('row', maxHeight)), this.minTileRows()),
    };
  }

  /**
   * Celle minime in larghezza per rispettare `min-width` e `widget-min-width`.
   */
  minTileCols(tile?: HTMLElement): number {
    const fromTile = tile ? Number(tile.getAttribute('min-width')) : Number.NaN;
    const cellMin = Number.isFinite(fromTile) && fromTile > 0 ? fromTile : this.minWidth;
    return Math.max(cellMin, this.spanCountForPixels(this.widgetMinWidth, this.cellWidth));
  }

  /**
   * Celle minime in altezza per rispettare `min-height` e `widget-min-height`.
   */
  minTileRows(tile?: HTMLElement): number {
    const fromTile = tile ? Number(tile.getAttribute('min-height')) : Number.NaN;
    const cellMin = Number.isFinite(fromTile) && fromTile > 0 ? fromTile : this.minHeight;
    return Math.max(cellMin, this.spanCountForPixels(this.widgetMinHeight, this.cellHeight));
  }

  /**
   * Tile diretta figlia di `lit-grid` che ospita la maniglia di resize.
   */
  getResizerHost(resizer: HTMLElement): HTMLElement | undefined {
    let current: HTMLElement | null = resizer;
    while (current && current.parentElement !== this) {
      current = current.parentElement;
    }
    if (!current || current === this || current === resizer) {
      return undefined;
    }
    return current;
  }

  /**
   * Serializza posizione e dimensione di tutte le tile (senza placeholder).
   */
  serialize(): TileCoords[] {
    return this.tiles().map((tile) => this.getCoordinates(tile));
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.observer = new MutationObserver((records) => {
      for (const record of records) {
        this.upgradeEvents(record);
      }
      this.computeStyles();
    });
    this.observer.observe(this, { childList: true, attributes: true, subtree: false });
    this.addEventListener('pointerdown', this.onPointerDown);
    this.syncSizeWatch();
    this.growToFill();
  }

  override disconnectedCallback(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.sizeObserver?.disconnect();
    this.sizeObserver = null;
    this.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('resize', this.onWindowResize);
    this.unlockScroll();
    this.restorePortOverflow();
    super.disconnectedCallback();
  }

  override updated(): void {
    this.syncSizeWatch();
    this.syncPortOverflow();
    this.growToFill();
    this.computeStyles();
    this.upgradeEvents();
  }

  override render() {
    const stepX = this.cellWidth + this.cellMargin;
    const stepY = this.cellHeight + this.cellMargin;
    const cellW = Math.max(this.cellWidth - 1.5, 0);
    const cellH = Math.max(this.cellHeight - 1.5, 0);
    return html`
      <div class="container" part="container">
        <svg class="grid-guide" part="grid" aria-hidden="true" ?hidden=${!this.showGrid}>
          <defs>
            <pattern
              id="lit-grid-cells"
              width=${stepX}
              height=${stepY}
              patternUnits="userSpaceOnUse"
            >
              <rect
                x="0.75"
                y="0.75"
                width=${cellW}
                height=${cellH}
                fill="none"
                stroke="currentColor"
                stroke-width="1.25"
                stroke-dasharray="0.1 5"
                stroke-linecap="round"
              ></rect>
              <circle cx="0.75" cy="0.75" r="1.15" fill="currentColor"></circle>
              <circle cx=${this.cellWidth - 0.75} cy="0.75" r="1.15" fill="currentColor"></circle>
              <circle cx="0.75" cy=${this.cellHeight - 0.75} r="1.15" fill="currentColor"></circle>
              <circle
                cx=${this.cellWidth - 0.75}
                cy=${this.cellHeight - 0.75}
                r="1.15"
                fill="currentColor"
              ></circle>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lit-grid-cells)"></rect>
        </svg>
        <slot></slot>
      </div>
    `;
  }

  /**
   * Con autogrow + no-scroll aggiunge colonne/righe per occupare il contenitore
   * senza aprire lo scroll.
   */
  growToFill(): void {
    const fillsCol = this.fillsCol();
    const fillsRow = this.fillsRow();
    if (!fillsCol && !fillsRow) {
      this.style.removeProperty('width');
      this.style.removeProperty('height');
      return;
    }
    const box = this.measureContainer();
    if (!box) {
      return;
    }
    if (fillsCol && box.width > 0) {
      const cols = this.visibleCellCount(this.cellWidth, box.width, this.colCount);
      if (this.colCount !== cols) {
        this.colCount = cols;
      }
      this.style.width = `${this.gridWidth()}px`;
    }
    if (fillsRow && box.height > 0) {
      const rows = this.visibleCellCount(this.cellHeight, box.height, this.rowCount);
      if (this.rowCount !== rows) {
        this.rowCount = rows;
      }
      this.style.height = `${box.height}px`;
    }
  }

  private fillsCol(): boolean {
    return this.colAutogrow && this.colNoScroll;
  }

  private fillsRow(): boolean {
    return this.rowAutogrow && this.rowNoScroll;
  }

  private measureContainer(): { width: number; height: number } | null {
    const parent = this.parentElement;
    if (!parent) {
      return null;
    }
    const style = getComputedStyle(parent);
    const padX = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
    const padY = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
    return {
      width: Math.max(0, parent.clientWidth - padX),
      height: Math.max(0, parent.clientHeight - padY),
    };
  }

  private syncSizeWatch(): void {
    const watch = this.fillsCol() || this.fillsRow();
    if (!watch) {
      this.sizeObserver?.disconnect();
      this.sizeObserver = null;
      window.removeEventListener('resize', this.onWindowResize);
      return;
    }
    window.addEventListener('resize', this.onWindowResize);
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    if (!this.sizeObserver) {
      this.sizeObserver = new ResizeObserver(() => {
        this.growToFill();
        this.computeStyles();
      });
    }
    const parent = this.parentElement;
    if (parent) {
      this.sizeObserver.disconnect();
      this.sizeObserver.observe(parent);
    }
  }

  private onWindowResize = (): void => {
    this.growToFill();
    this.computeStyles();
  };

  private maxAxisIndex(axis: 'col' | 'row', span: number): number {
    const autogrow = axis === 'col' ? this.colAutogrow : this.rowAutogrow;
    const lock = axis === 'col' ? this.colNoScroll : this.rowNoScroll;
    if (autogrow && !lock) {
      return Infinity;
    }
    const limit = lock
      ? (axis === 'col' ? this.visibleColCount() : this.visibleRowCount())
      : (axis === 'col' ? this.colCount : this.rowCount);
    return Math.max(limit - span, 0);
  }

  private maxAxisSpan(axis: 'col' | 'row', requestedMax: number): number {
    const autogrow = axis === 'col' ? this.colAutogrow : this.rowAutogrow;
    const lock = axis === 'col' ? this.colNoScroll : this.rowNoScroll;
    if (autogrow && !lock) {
      return Infinity;
    }
    if (lock) {
      const visible = axis === 'col' ? this.visibleColCount() : this.visibleRowCount();
      return Math.min(requestedMax, visible);
    }
    return requestedMax;
  }

  private spanCountForPixels(px: number, cell: number): number {
    if (px <= 0) {
      return 1;
    }
    const step = cell + this.cellMargin;
    if (step <= 0) {
      return 1;
    }
    return Math.max(1, Math.ceil((px + this.cellMargin) / step));
  }

  private visibleCellCount(cell: number, portSize: number, fallback: number): number {
    const step = cell + this.cellMargin;
    if (step <= 0 || portSize <= 0) {
      return fallback;
    }
    return Math.max(1, Math.floor((portSize + this.cellMargin) / step));
  }

  private scrollPort(): HTMLElement | Window {
    if (this.portOverflow?.node?.isConnected) {
      return this.portOverflow.node;
    }
    let node = this.parentElement;
    let sized: HTMLElement | null = null;
    while (node) {
      const style = getComputedStyle(node);
      const inline = `${node.style.overflow}${node.style.overflowX}${node.style.overflowY}`;
      if (/(auto|scroll|overlay)/.test(`${style.overflowX}${style.overflowY}${inline}`)) {
        return node;
      }
      if (!sized && (node.clientWidth > 0 || node.clientHeight > 0)) {
        sized = node;
      }
      node = node.parentElement;
    }
    return sized ?? window;
  }

  private visibleSize(): { width: number; height: number } {
    const port = this.scrollPort();
    if (!(port instanceof HTMLElement)) {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    const style = getComputedStyle(port);
    const padX = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
    const padY = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
    return {
      width: Math.max(0, (port.clientWidth || port.getBoundingClientRect().width) - padX),
      height: Math.max(0, (port.clientHeight || port.getBoundingClientRect().height) - padY),
    };
  }

  private visibleBounds(): { left: number; top: number; width: number; height: number } {
    const size = this.visibleSize();
    const port = this.scrollPort();
    const left = port instanceof HTMLElement ? port.scrollLeft : window.scrollX;
    const top = port instanceof HTMLElement ? port.scrollTop : window.scrollY;
    return {
      left: Math.max(0, left),
      top: Math.max(0, top),
      width: size.width,
      height: size.height,
    };
  }

  private syncPortOverflow(): void {
    const lockX = this.colNoScroll;
    const lockY = this.rowNoScroll;
    if (!lockX && !lockY) {
      this.restorePortOverflow();
      return;
    }
    const port = this.scrollPort();
    const node = port instanceof HTMLElement ? port : document.documentElement;
    if (!this.portOverflow || this.portOverflow.node !== node) {
      this.restorePortOverflow();
      this.portOverflow = {
        node,
        overflow: node.style.overflow,
        overflowX: node.style.overflowX,
        overflowY: node.style.overflowY,
      };
    }
    node.style.overflowX = lockX ? 'hidden' : this.portOverflow.overflowX;
    node.style.overflowY = lockY ? 'hidden' : this.portOverflow.overflowY;
  }

  private restorePortOverflow(): void {
    if (!this.portOverflow) {
      return;
    }
    const { node, overflow, overflowX, overflowY } = this.portOverflow;
    node.style.overflow = overflow;
    node.style.overflowX = overflowX;
    node.style.overflowY = overflowY;
    this.portOverflow = null;
  }

  private lockScroll(): void {
    this.unlockScroll();
    this.toggleAttribute('data-lock-x', this.colNoScroll);
    this.toggleAttribute('data-lock-y', this.rowNoScroll);
    if (!this.colNoScroll && !this.rowNoScroll) {
      return;
    }
    const port = this.scrollPort();
    const node = port instanceof HTMLElement ? port : document.documentElement;
    this.lockedScroll.push({
      node,
      left: port instanceof HTMLElement ? port.scrollLeft : window.scrollX,
      top: port instanceof HTMLElement ? port.scrollTop : window.scrollY,
    });
    node.addEventListener('scroll', this.onPortScroll);
    node.addEventListener('wheel', this.onPortWheel, { passive: false });
  }

  private restoreLockedScroll(): void {
    for (const entry of this.lockedScroll) {
      if (entry.node === document.documentElement) {
        window.scrollTo(
          this.colNoScroll ? entry.left : window.scrollX,
          this.rowNoScroll ? entry.top : window.scrollY,
        );
        continue;
      }
      if (this.colNoScroll) {
        entry.node.scrollLeft = entry.left;
      }
      if (this.rowNoScroll) {
        entry.node.scrollTop = entry.top;
      }
    }
  }

  private unlockScroll(): void {
    this.restoreLockedScroll();
    for (const entry of this.lockedScroll) {
      entry.node.removeEventListener('scroll', this.onPortScroll);
      entry.node.removeEventListener('wheel', this.onPortWheel);
    }
    this.lockedScroll = [];
    this.removeAttribute('data-lock-x');
    this.removeAttribute('data-lock-y');
  }

  private onPortScroll = (): void => {
    this.restoreLockedScroll();
  };

  private onPortWheel = (event: WheelEvent): void => {
    if (this.colNoScroll && event.deltaX) {
      event.preventDefault();
    }
    if (this.rowNoScroll && event.deltaY) {
      event.preventDefault();
    }
  };

  private tiles(): HTMLElement[] {
    return [...this.children].filter((node): node is HTMLElement => {
      return node instanceof HTMLElement && !node.hasAttribute('placeholder');
    });
  }

  private layoutTiles(): void {
    for (const tile of [...this.children]) {
      if (!(tile instanceof HTMLElement)) {
        continue;
      }
      if (tile.hasAttribute('placeholder')) {
        this.placeholder = tile;
        if (!this.session) {
          tile.style.display = 'none';
        }
      }
      if (this.session?.tile === tile) {
        continue;
      }
      this.applyCoords(tile, this.getCoordinates(tile));
    }
  }

  private applyCoords(tile: HTMLElement, coords: TileCoords): void {
    tile.style.left = `${this.offsetFor(coords.col, this.cellWidth)}px`;
    tile.style.top = `${this.offsetFor(coords.row, this.cellHeight)}px`;
    tile.style.width = `${this.spanFor(coords.width, this.cellWidth)}px`;
    tile.style.height = `${this.spanFor(coords.height, this.cellHeight)}px`;
  }

  private offsetFor(index: number, cell: number): number {
    return index * cell + index * this.cellMargin;
  }

  private spanFor(count: number, cell: number): number {
    return count * cell + Math.max(count - 1, 0) * this.cellMargin;
  }

  private upgradeEvents(record?: MutationRecord): void {
    if (record) {
      for (const node of record.addedNodes) {
        if (node instanceof HTMLElement && node.hasAttribute('placeholder')) {
          this.placeholder = node;
        }
      }
    } else {
      const found = [...this.children].find((node) => {
        return node instanceof HTMLElement && node.hasAttribute('placeholder');
      });
      if (found instanceof HTMLElement) {
        this.placeholder = found;
      }
    }
  }

  private ensurePlaceholder(): HTMLElement {
    if (this.placeholder && this.placeholder.isConnected) {
      return this.placeholder;
    }
    const node = document.createElement('div');
    node.setAttribute('placeholder', '');
    this.appendChild(node);
    this.placeholder = node;
    return node;
  }

  private isOverlapping(
    col: number,
    row: number,
    width: number,
    height: number,
    exceptions: HTMLElement[] = [],
  ): HTMLElement | false {
    for (const child of this.tiles()) {
      if (exceptions.includes(child)) {
        continue;
      }
      const other = this.getCoordinates(child);
      const overlap =
        col <= other.col + other.width - 1
        && row <= other.row + other.height - 1
        && col + width - 1 >= other.col
        && row + height - 1 >= other.row;
      if (overlap) {
        return child;
      }
    }
    return false;
  }

  private isWithinConstraints(value: number, min = 1, max = Infinity): boolean {
    return value >= min && value <= max;
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return;
    }
    const path = event.composedPath();
    const resizer = path.find((node): node is HTMLElement => {
      return node instanceof HTMLElement && node.hasAttribute('resize');
    });
    if (resizer && this.resizable) {
      const tile = this.getResizerHost(resizer);
      if (!tile) {
        return;
      }
      this.beginSession(event, tile, 'resize', resizer.getAttribute('resize') ?? 'bottom-right');
      return;
    }
    if (!this.draggable) {
      return;
    }
    const tile = path.find((node): node is HTMLElement => {
      return node instanceof HTMLElement && node.parentElement === this && !node.hasAttribute('placeholder');
    });
    if (!tile) {
      return;
    }
    this.beginSession(event, tile, 'move', '');
  };

  private beginSession(
    event: PointerEvent,
    tile: HTMLElement,
    kind: PointerKind,
    resizeType: string,
  ): void {
    const styles = window.getComputedStyle(tile);
    const placeholder = this.ensurePlaceholder();
    const coords = this.getCoordinates(tile);
    placeholder.setAttribute('col', String(coords.col));
    placeholder.setAttribute('row', String(coords.row));
    placeholder.setAttribute('width', String(coords.width));
    placeholder.setAttribute('height', String(coords.height));
    placeholder.style.display = 'block';
    this.applyCoords(placeholder, coords);
    tile.style.transition = 'none';
    tile.style.zIndex = '1';
    this.session = {
      kind,
      tile,
      pointerId: event.pointerId,
      resizeType,
      originLeft: parseFloat(styles.left) || 0,
      originTop: parseFloat(styles.top) || 0,
      originWidth: parseFloat(styles.width) || this.spanFor(coords.width, this.cellWidth),
      originHeight: parseFloat(styles.height) || this.spanFor(coords.height, this.cellHeight),
      lastX: event.clientX,
      lastY: event.clientY,
    };
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    try {
      tile.setPointerCapture(event.pointerId);
    } catch {
      // happy-dom o pointer già rilasciato
    }
    this.lockScroll();
    event.preventDefault();
  }

  private onPointerMove = (event: PointerEvent): void => {
    const session = this.session;
    if (!session || event.pointerId !== session.pointerId) {
      return;
    }
    const ddx = event.clientX - session.lastX;
    const ddy = event.clientY - session.lastY;
    session.lastX = event.clientX;
    session.lastY = event.clientY;
    this.restoreLockedScroll();
    if (session.kind === 'move') {
      this.trackMove(session, ddx, ddy);
    } else {
      this.trackResize(session, ddx, ddy);
    }
    event.preventDefault();
  };

  private onPointerUp = (event: PointerEvent): void => {
    const session = this.session;
    if (!session || event.pointerId !== session.pointerId) {
      return;
    }
    const placeholder = this.ensurePlaceholder();
    const next = this.getCoordinates(placeholder);
    session.tile.setAttribute('col', String(next.col));
    session.tile.setAttribute('row', String(next.row));
    session.tile.setAttribute('width', String(next.width));
    session.tile.setAttribute('height', String(next.height));
    session.tile.style.left = '';
    session.tile.style.top = '';
    session.tile.style.width = '';
    session.tile.style.height = '';
    session.tile.style.zIndex = '';
    session.tile.style.transition = this.animated
      ? (session.kind === 'resize'
        ? 'var(--grid-resize-animation-transition)'
        : 'var(--grid-move-animation-transition)')
      : '';
    placeholder.style.display = 'none';
    try {
      session.tile.releasePointerCapture(event.pointerId);
    } catch {
      // pointer già rilasciato
    }
    this.session = null;
    this.unlockScroll();
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.computeStyles();
    session.tile.dispatchEvent(new CustomEvent(session.kind === 'move' ? 'move' : 'resize', {
      bubbles: true,
      composed: true,
      detail: { grid: this, tile: session.tile },
    }));
  };

  private trackMove(session: PointerSession, ddx: number, ddy: number): void {
    const rawLeft = (parseFloat(session.tile.style.left) || session.originLeft) + ddx;
    const rawTop = (parseFloat(session.tile.style.top) || session.originTop) + ddy;
    const coords = this.getCoordinates(session.tile);
    const widthPx = this.spanFor(coords.width, this.cellWidth);
    const heightPx = this.spanFor(coords.height, this.cellHeight);
    const clamped = this.clampDragPixels(rawLeft, rawTop, widthPx, heightPx);
    const left = clamped.left;
    const top = clamped.top;
    const position = this.getClosestPosition(left, top, coords.height, coords.width);
    session.tile.style.left = `${left}px`;
    session.tile.style.top = `${top}px`;
    session.originLeft = left;
    session.originTop = top;
    if (this.overlappable || !this.isOverlapping(position.col, position.row, coords.width, coords.height, [session.tile])) {
      const placeholder = this.ensurePlaceholder();
      placeholder.setAttribute('col', String(position.col));
      placeholder.setAttribute('row', String(position.row));
      this.applyCoords(placeholder, { ...coords, col: position.col, row: position.row });
      this.ensureSpace(placeholder);
    }
  }

  private trackResize(session: PointerSession, ddx: number, ddy: number): void {
    const type = session.resizeType;
    const isTop = RESIZE_TOP.has(type);
    const isLeft = RESIZE_LEFT.has(type);
    const isWidth = RESIZE_WIDTH.has(type);
    const isHeight = RESIZE_HEIGHT.has(type);
    const rawLeft = (parseFloat(session.tile.style.left) || session.originLeft) + (isLeft ? ddx : 0);
    const rawTop = (parseFloat(session.tile.style.top) || session.originTop) + (isTop ? ddy : 0);
    const width = (parseFloat(session.tile.style.width) || session.originWidth) + (isLeft ? -ddx : isWidth ? ddx : 0);
    const height = (parseFloat(session.tile.style.height) || session.originHeight) + (isTop ? -ddy : isHeight ? ddy : 0);
    const clamped = this.clampDragPixels(rawLeft, rawTop, width, height);
    const left = clamped.left;
    const top = clamped.top;
    const coords = this.getCoordinates(session.tile);
    const position = this.getClosestPosition(left, top, 1, 1, isTop || isLeft);
    const size = this.getClosestSize(
      width,
      height,
      isLeft ? coords.width + coords.col : this.colCount - coords.col,
      isTop ? coords.height + coords.row : this.rowCount - coords.row,
    );
    const minWidth = this.minTileCols(session.tile);
    const maxWidth = Number(session.tile.getAttribute('max-width')) || this.maxWidth;
    const minHeight = this.minTileRows(session.tile);
    const maxHeight = Number(session.tile.getAttribute('max-height')) || this.maxHeight;
    const minWidthPx = this.spanFor(minWidth, this.cellWidth);
    const minHeightPx = this.spanFor(minHeight, this.cellHeight);
    if (isLeft && width >= minWidthPx) {
      session.tile.style.left = `${left}px`;
    }
    if (isTop && height >= minHeightPx) {
      session.tile.style.top = `${top}px`;
    }
    if (isWidth && width >= minWidthPx) {
      session.tile.style.width = `${width}px`;
    }
    if (isHeight && height >= minHeightPx) {
      session.tile.style.height = `${height}px`;
    }
    if (this.overlappable || !this.isOverlapping(position.col, position.row, size.width, size.height, [session.tile])) {
      const placeholder = this.ensurePlaceholder();
      if (isTop && this.isWithinConstraints(size.height, minHeight, maxHeight)) {
        placeholder.setAttribute('row', String(position.row));
      }
      if (isLeft && this.isWithinConstraints(size.width, minWidth, maxWidth)) {
        placeholder.setAttribute('col', String(position.col));
      }
      if (isWidth && this.isWithinConstraints(size.width, minWidth, maxWidth)) {
        placeholder.setAttribute('width', String(size.width));
      }
      if (isHeight && this.isWithinConstraints(size.height, minHeight, maxHeight)) {
        placeholder.setAttribute('height', String(size.height));
      }
      this.applyCoords(placeholder, this.getCoordinates(placeholder));
      this.ensureSpace(placeholder);
    }
  }

  static override styles = css`
    :host {
      display: inline-block;
      position: relative;
      vertical-align: top;
      box-sizing: border-box;
    }

    :host([col-no-scroll]) {
      overflow-x: hidden;
      max-width: 100%;
    }

    :host([row-no-scroll]) {
      overflow-y: hidden;
      max-height: 100%;
    }

    :host([col-autogrow][col-no-scroll]),
    :host([row-autogrow][row-no-scroll]) {
      display: block;
    }

    :host([data-lock-x]),
    :host([data-lock-y]),
    :host([col-no-scroll]),
    :host([row-no-scroll]) {
      touch-action: none;
    }

    .container {
      position: relative;
      width: var(--grid-width, 0px);
      height: var(--grid-height, 0px);
    }

    .grid-guide {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      color: var(--lit-grid-dot, rgba(126, 200, 188, 0.55));
    }

    .grid-guide[hidden] {
      display: none;
    }

    :host([col-no-scroll]) .container {
      overflow-x: hidden;
    }

    :host([row-no-scroll]) .container {
      overflow-y: hidden;
    }

    ::slotted(*) {
      display: block;
      position: absolute;
      box-sizing: border-box;
      transition: var(--grid-move-animation-transition, none);
      user-select: none;
      -webkit-user-select: none;
    }

    ::slotted([placeholder]) {
      display: none;
      pointer-events: none;
      background: var(--paper-grid-background-placeholder, #afafaf);
      transition: none;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'lit-grid': LitGrid;
  }
}
