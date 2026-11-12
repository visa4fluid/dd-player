import './material.js';
import '../src/lit-grid.js';
import type { LitGrid } from '../src/lit-grid.js';

type SwitchEl = HTMLElement & { selected: boolean };
type FieldEl = HTMLElement & { value: string };
type SliderEl = HTMLElement & { value: number };

const grid = document.querySelector<LitGrid>('#grid');
const dump = document.querySelector<HTMLElement>('#dump');

function refreshDump(): void {
  if (!grid || !dump) {
    return;
  }
  dump.textContent = JSON.stringify(grid.serialize(), null, 2);
}

function bind(): void {
  if (!grid) {
    return;
  }

  const draggable = document.querySelector<SwitchEl>('#draggable');
  const resizable = document.querySelector<SwitchEl>('#resizable');
  const overlappable = document.querySelector<SwitchEl>('#overlappable');
  const animated = document.querySelector<SwitchEl>('#animated');
  const colAutogrow = document.querySelector<SwitchEl>('#col-autogrow');
  const rowAutogrow = document.querySelector<SwitchEl>('#row-autogrow');
  const colNoScroll = document.querySelector<SwitchEl>('#col-no-scroll');
  const rowNoScroll = document.querySelector<SwitchEl>('#row-no-scroll');
  const showGrid = document.querySelector<SwitchEl>('#show-grid');
  const cellWidth = document.querySelector<SliderEl>('#cell-width');
  const cellHeight = document.querySelector<SliderEl>('#cell-height');
  const cellMargin = document.querySelector<SliderEl>('#cell-margin');
  const colCount = document.querySelector<FieldEl>('#col-count');
  const rowCount = document.querySelector<FieldEl>('#row-count');
  const widgetMinWidth = document.querySelector<FieldEl>('#widget-min-width');
  const widgetMinHeight = document.querySelector<FieldEl>('#widget-min-height');
  const cellWidthValue = document.querySelector<HTMLElement>('#cell-width-value');
  const cellHeightValue = document.querySelector<HTMLElement>('#cell-height-value');
  const cellMarginValue = document.querySelector<HTMLElement>('#cell-margin-value');

  const refreshSizeControls = (): void => {
    if (cellWidth) {
      cellWidth.value = Math.round(grid.cellWidth);
    }
    if (cellHeight) {
      cellHeight.value = Math.round(grid.cellHeight);
    }
    if (colCount) {
      colCount.value = String(grid.colCount);
    }
    if (rowCount) {
      rowCount.value = String(grid.rowCount);
    }
    if (cellWidthValue) {
      cellWidthValue.textContent = String(Math.round(grid.cellWidth));
    }
    if (cellHeightValue) {
      cellHeightValue.textContent = String(Math.round(grid.cellHeight));
    }
  };

  const sync = (fn: () => void) => () => {
    fn();
    requestAnimationFrame(refreshSizeControls);
    refreshDump();
  };

  draggable?.addEventListener('change', sync(() => {
    grid.draggable = draggable.selected;
  }));
  resizable?.addEventListener('change', sync(() => {
    grid.resizable = resizable.selected;
  }));
  overlappable?.addEventListener('change', sync(() => {
    grid.overlappable = overlappable.selected;
  }));
  animated?.addEventListener('change', sync(() => {
    grid.animated = animated.selected;
  }));
  colAutogrow?.addEventListener('change', sync(() => {
    grid.colAutogrow = colAutogrow.selected;
  }));
  rowAutogrow?.addEventListener('change', sync(() => {
    grid.rowAutogrow = rowAutogrow.selected;
  }));
  colNoScroll?.addEventListener('change', sync(() => {
    grid.colNoScroll = colNoScroll.selected;
  }));
  rowNoScroll?.addEventListener('change', sync(() => {
    grid.rowNoScroll = rowNoScroll.selected;
  }));
  showGrid?.addEventListener('change', sync(() => {
    grid.showGrid = showGrid.selected;
  }));
  cellWidth?.addEventListener('input', sync(() => {
    grid.cellWidth = cellWidth.value;
    if (cellWidthValue) {
      cellWidthValue.textContent = String(cellWidth.value);
    }
  }));
  cellHeight?.addEventListener('input', sync(() => {
    grid.cellHeight = cellHeight.value;
    if (cellHeightValue) {
      cellHeightValue.textContent = String(cellHeight.value);
    }
  }));
  cellMargin?.addEventListener('input', sync(() => {
    grid.cellMargin = cellMargin.value;
    if (cellMarginValue) {
      cellMarginValue.textContent = String(cellMargin.value);
    }
  }));
  colCount?.addEventListener('input', sync(() => {
    grid.colCount = Number(colCount.value);
  }));
  rowCount?.addEventListener('input', sync(() => {
    grid.rowCount = Number(rowCount.value);
  }));
  widgetMinWidth?.addEventListener('input', sync(() => {
    grid.widgetMinWidth = Number(widgetMinWidth.value) || 0;
  }));
  widgetMinHeight?.addEventListener('input', sync(() => {
    grid.widgetMinHeight = Number(widgetMinHeight.value) || 0;
  }));

  grid.addEventListener('move', refreshDump);
  grid.addEventListener('resize', refreshDump);
  refreshDump();
}

bind();
