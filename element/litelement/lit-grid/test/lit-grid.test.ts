import { afterEach, describe, expect, it } from 'vitest';
import { LitGrid } from '../src/lit-grid.js';

async function mount(markup: string): Promise<LitGrid> {
  document.body.innerHTML = markup;
  const el = document.querySelector('lit-grid');
  if (!el) {
    throw new Error('lit-grid non montato');
  }
  await el.updateComplete;
  return el;
}

describe('lit-grid', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('si registra come custom element', () => {
    expect(customElements.get('lit-grid')).toBe(LitGrid);
  });

  it('mostra il reticolato se show-grid è attivo', async () => {
    const el = await mount('<lit-grid show-grid cell-width="80" cell-height="64" cell-margin="8"></lit-grid>');
    expect(el.showGrid).toBe(true);
    const guide = el.renderRoot.querySelector('.grid-guide');
    expect(guide).toBeInstanceOf(SVGElement);
    expect((guide as SVGElement).hasAttribute('hidden')).toBe(false);
    const pattern = el.renderRoot.querySelector('#lit-grid-cells');
    expect(pattern?.getAttribute('width')).toBe('88');
    expect(pattern?.getAttribute('height')).toBe('72');
  });

  it('calcola larghezza e altezza della griglia', async () => {
    const el = await mount('<lit-grid cell-width="80" cell-height="40" cell-margin="10" col-count="3" row-count="2"></lit-grid>');
    expect(el.gridWidth()).toBe(80 * 3 + 10 * 2);
    expect(el.gridHeight()).toBe(40 * 2 + 10);
    expect(el.style.getPropertyValue('--grid-width')).toBe('260px');
    expect(el.style.getPropertyValue('--grid-height')).toBe('90px');
  });

  it('posiziona le tile da col row width height', async () => {
    const el = await mount(`
      <lit-grid cell-width="100" cell-height="50" cell-margin="10" col-count="4" row-count="4">
        <div id="tile" col="1" row="2" width="2" height="1"></div>
      </lit-grid>
    `);
    const tile = el.querySelector('#tile');
    expect(tile).toBeInstanceOf(HTMLElement);
    if (!(tile instanceof HTMLElement)) {
      return;
    }
    expect(tile.style.left).toBe('110px');
    expect(tile.style.top).toBe('120px');
    expect(tile.style.width).toBe('210px');
    expect(tile.style.height).toBe('50px');
  });

  it('legge le coordinate e serializza le tile', async () => {
    const el = await mount(`
      <lit-grid col-count="6" row-count="4">
        <div col="0" row="0" width="2" height="1"></div>
        <div col="2" row="1" width="1" height="2"></div>
        <div placeholder></div>
      </lit-grid>
    `);
    expect(el.serialize()).toEqual([
      { col: 0, row: 0, width: 2, height: 1 },
      { col: 2, row: 1, width: 1, height: 2 },
    ]);
  });

  it('trova la posizione più vicina e resta nei limiti', async () => {
    const el = await mount('<lit-grid cell-width="100" cell-height="100" cell-margin="0" col-count="4" row-count="3"></lit-grid>');
    expect(el.getClosestPosition(0, 0, 1, 1)).toEqual({ col: 0, row: 0 });
    expect(el.getClosestPosition(250, 80, 1, 2)).toEqual({ col: 2, row: 1 });
    expect(el.getClosestPosition(900, 900, 1, 1)).toEqual({ col: 3, row: 2 });
  });

  it('trova la dimensione più vicina', async () => {
    const el = await mount('<lit-grid cell-width="100" cell-height="50" cell-margin="0" col-count="4" row-count="4"></lit-grid>');
    expect(el.getClosestSize(240, 90)).toEqual({ width: 2, height: 2 });
    expect(el.getClosestSize(10, 10)).toEqual({ width: 1, height: 1 });
  });

  it('impone widget-min-width e widget-min-height senza cambiare la griglia', async () => {
    const el = await mount('<lit-grid cell-width="80" cell-height="64" cell-margin="8" col-count="8" row-count="6" widget-min-width="160" widget-min-height="120"></lit-grid>');
    expect(el.cellWidth).toBe(80);
    expect(el.cellHeight).toBe(64);
    expect(el.colCount).toBe(8);
    expect(el.rowCount).toBe(6);
    expect(el.minTileCols()).toBe(2);
    expect(el.minTileRows()).toBe(2);
    expect(el.getClosestSize(10, 10)).toEqual({ width: 2, height: 2 });
  });

  it('aggiorna a runtime i widget più piccoli di widget-min-width e widget-min-height', async () => {
    const el = await mount(`
      <lit-grid cell-width="80" cell-height="64" cell-margin="8" col-count="8" row-count="6">
        <div id="small" col="0" row="0" width="1" height="1"></div>
        <div id="ok" col="3" row="0" width="3" height="3"></div>
      </lit-grid>
    `);
    const small = el.querySelector('#small');
    const ok = el.querySelector('#ok');
    expect(small).toBeInstanceOf(HTMLElement);
    expect(ok).toBeInstanceOf(HTMLElement);
    if (!(small instanceof HTMLElement) || !(ok instanceof HTMLElement)) {
      return;
    }
    expect(small.getAttribute('width')).toBe('1');
    expect(small.getAttribute('height')).toBe('1');
    el.widgetMinWidth = 160;
    el.widgetMinHeight = 120;
    await el.updateComplete;
    expect(small.getAttribute('width')).toBe('2');
    expect(small.getAttribute('height')).toBe('2');
    expect(ok.getAttribute('width')).toBe('3');
    expect(ok.getAttribute('height')).toBe('3');
    expect(el.cellWidth).toBe(80);
    expect(el.cellHeight).toBe(64);
    expect(el.colCount).toBe(8);
    expect(el.rowCount).toBe(6);
  });

  it('espande le righe con row-autogrow', async () => {
    const el = await mount(`
      <lit-grid row-count="2" row-autogrow>
        <div id="tile" col="0" row="3" width="1" height="2"></div>
      </lit-grid>
    `);
    const tile = el.querySelector('#tile');
    expect(tile).toBeInstanceOf(HTMLElement);
    if (tile instanceof HTMLElement) {
      el.ensureSpace(tile);
    }
    expect(el.rowCount).toBe(5);
  });

  it('trova la tile che ospita la maniglia di resize', async () => {
    const el = await mount(`
      <lit-grid resizable>
        <div id="tile" col="0" row="0" width="1" height="1">
          <span id="grip" resize="bottom-right"></span>
        </div>
      </lit-grid>
    `);
    const grip = el.querySelector('#grip');
    const tile = el.querySelector('#tile');
    expect(grip).toBeInstanceOf(HTMLElement);
    expect(tile).toBeInstanceOf(HTMLElement);
    if (grip instanceof HTMLElement && tile instanceof HTMLElement) {
      expect(el.getResizerHost(grip)).toBe(tile);
    }
  });

  it('non espande oltre la viewport se row-no-scroll è attivo', async () => {
    const wrap = document.createElement('div');
    wrap.style.width = '200px';
    wrap.style.height = '120px';
    wrap.style.overflow = 'auto';
    document.body.appendChild(wrap);
    wrap.innerHTML = `
      <lit-grid cell-width="50" cell-height="40" cell-margin="0" col-count="2" row-count="2" row-autogrow row-no-scroll>
        <div id="tile" col="0" row="4" width="1" height="2"></div>
      </lit-grid>
    `;
    const el = wrap.querySelector('lit-grid');
    if (!el) {
      throw new Error('lit-grid non montato');
    }
    await el.updateComplete;
    const tile = el.querySelector('#tile');
    expect(el.rowNoScroll).toBe(true);
    expect(el.visibleRowCount()).toBeLessThan(10);
    if (tile instanceof HTMLElement) {
      el.ensureSpace(tile);
    }
    expect(el.rowCount).toBeLessThanOrEqual(el.visibleRowCount());
    expect(el.rowCount).toBeLessThan(5);
    wrap.remove();
  });

  it('con autogrow e no-scroll aggiunge colonne e righe per riempire il contenitore', async () => {
    const wrap = document.createElement('div');
    Object.defineProperties(wrap, {
      clientWidth: { configurable: true, get: () => 400 },
      clientHeight: { configurable: true, get: () => 240 },
    });
    document.body.appendChild(wrap);
    wrap.innerHTML = `
      <lit-grid
        cell-width="80"
        cell-height="40"
        cell-margin="0"
        col-count="2"
        row-count="2"
        col-autogrow
        row-autogrow
        col-no-scroll
        row-no-scroll
      ></lit-grid>
    `;
    const el = wrap.querySelector('lit-grid');
    if (!el) {
      throw new Error('lit-grid non montato');
    }
    await el.updateComplete;
    el.growToFill();
    await el.updateComplete;
    expect(el.colCount).toBe(5);
    expect(el.rowCount).toBe(6);
    expect(el.gridWidth()).toBe(400);
    expect(el.gridHeight()).toBe(240);
    expect(wrap.style.overflowX === 'hidden' || getComputedStyle(wrap).overflowX === 'hidden').toBe(true);
    wrap.remove();
  });

  it('blocca il drag nel perimetro visibile se col-no-scroll è attivo', async () => {
    const wrap = document.createElement('div');
    wrap.style.width = '200px';
    wrap.style.height = '200px';
    wrap.style.overflow = 'auto';
    document.body.appendChild(wrap);
    wrap.innerHTML = '<lit-grid cell-width="50" cell-height="50" cell-margin="0" col-count="8" row-count="8" col-no-scroll></lit-grid>';
    const el = wrap.querySelector('lit-grid');
    if (!el) {
      throw new Error('lit-grid non montato');
    }
    await el.updateComplete;
    const clamped = el.clampDragPixels(900, 10, 50, 50);
    expect(clamped.left).toBeLessThanOrEqual(150);
    expect(clamped.left).toBeGreaterThanOrEqual(0);
    wrap.remove();
  });

  it('non apre lo scroll X se col-no-scroll è attivo', async () => {
    const wrap = document.createElement('div');
    wrap.style.width = '240px';
    wrap.style.padding = '20px';
    wrap.style.overflow = 'auto';
    document.body.appendChild(wrap);
    wrap.innerHTML = `
      <lit-grid cell-width="50" cell-height="50" cell-margin="0" col-count="4" row-count="4" col-autogrow col-no-scroll>
        <div id="tile" col="0" row="0" width="1" height="1"></div>
      </lit-grid>
    `;
    const el = wrap.querySelector('lit-grid');
    if (!el) {
      throw new Error('lit-grid non montato');
    }
    await el.updateComplete;
    expect(wrap.style.overflowX).toBe('hidden');
    expect(el.clampDragPixels(-80, 10, 50, 50).left).toBe(0);
    expect(el.clampDragPixels(900, 10, 50, 50).left).toBeLessThanOrEqual(el.gridWidth() - 50);
    const tile = el.querySelector('#tile');
    if (tile instanceof HTMLElement) {
      tile.setAttribute('col', '8');
      el.ensureSpace(tile);
    }
    expect(el.colCount).toBeLessThanOrEqual(el.visibleColCount());
    wrap.remove();
  });

  it('non blocca il drag se col-no-scroll è spento', async () => {
    const wrap = document.createElement('div');
    wrap.style.width = '200px';
    wrap.style.height = '200px';
    wrap.style.overflow = 'auto';
    document.body.appendChild(wrap);
    wrap.innerHTML = '<lit-grid cell-width="50" cell-height="50" cell-margin="0" col-count="8" row-count="8"></lit-grid>';
    const el = wrap.querySelector('lit-grid');
    if (!el) {
      throw new Error('lit-grid non montato');
    }
    await el.updateComplete;
    expect(el.clampDragPixels(900, 10, 50, 50)).toEqual({ left: 900, top: 10 });
    wrap.remove();
  });

  it('emette move al drop di una tile', async () => {
    const el = await mount(`
      <lit-grid draggable cell-width="100" cell-height="100" cell-margin="0" col-count="4" row-count="4">
        <div id="tile" col="0" row="0" width="1" height="1"></div>
      </lit-grid>
    `);
    const tile = el.querySelector('#tile');
    expect(tile).toBeInstanceOf(HTMLElement);
    if (!(tile instanceof HTMLElement)) {
      return;
    }
    let moved = false;
    tile.addEventListener('move', () => {
      moved = true;
    });
    tile.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true, button: 0, pointerId: 1, clientX: 10, clientY: 10 }));
    window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 1, clientX: 130, clientY: 10 }));
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1, clientX: 130, clientY: 10 }));
    expect(moved).toBe(true);
    expect(Number(tile.getAttribute('col'))).toBeGreaterThanOrEqual(0);
  });
});
