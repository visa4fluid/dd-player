import '../src/lit-pagination.js';
import type { LitPagination, PaginationPosition } from '../src/lit-pagination.js';

const TITLES = Array.from({ length: 48 }, (_, index) => `Elemento ${index + 1}`);

const pagination = document.querySelector<LitPagination>('#pager');
const list = document.querySelector<HTMLElement>('#list');
const status = document.querySelector<HTMLElement>('#status');
const position = document.querySelector<HTMLSelectElement>('#position');
const viewPageRange = document.querySelector<HTMLInputElement>('#view-page-range');
const totalItems = document.querySelector<HTMLInputElement>('#total-items');
const pageLabel = document.querySelector<HTMLInputElement>('#page-label');
const hidePage = document.querySelector<HTMLInputElement>('#hide-page');
const hideNumber = document.querySelector<HTMLInputElement>('#hide-number');

function renderList(): void {
  if (!pagination || !list) {
    return;
  }
  const perPage = pagination.itemPerPage;
  const start = Math.max(pagination.page - 1, 0) * perPage;
  const visible = TITLES.slice(0, pagination.totalItems).slice(start, start + perPage);
  list.replaceChildren(...visible.map((title) => {
    const row = document.createElement('div');
    row.className = 'item';
    row.textContent = title;
    return row;
  }));
  if (status) {
    const pages = pagination.numberPages;
    status.textContent = pages
      ? `Pagina ${pagination.page} di ${pages} · ${pagination.totalItems} elementi, ${perPage} per pagina`
      : 'Nessuna pagina: servono elementi e un numero per pagina.';
  }
}

position?.addEventListener('change', () => {
  if (!pagination || !position) {
    return;
  }
  const next = position.value;
  if (next === 'left' || next === 'center' || next === 'right') {
    pagination.position = next satisfies PaginationPosition;
  }
});

viewPageRange?.addEventListener('input', () => {
  if (!pagination || !viewPageRange) {
    return;
  }
  const next = Number(viewPageRange.value);
  if (Number.isFinite(next) && next >= 1) {
    pagination.viewPageRange = next;
  }
});

totalItems?.addEventListener('input', () => {
  if (!pagination || !totalItems) {
    return;
  }
  const next = Number(totalItems.value);
  if (Number.isFinite(next) && next >= 0) {
    pagination.totalItems = next;
    renderList();
  }
});

pageLabel?.addEventListener('input', () => {
  if (!pagination || !pageLabel) {
    return;
  }
  pagination.currentPageLabel = pageLabel.value;
});

hidePage?.addEventListener('change', () => {
  if (!pagination || !hidePage) {
    return;
  }
  pagination.hidePageElement = hidePage.checked;
});

hideNumber?.addEventListener('change', () => {
  if (!pagination || !hideNumber) {
    return;
  }
  pagination.hideNumberElement = hideNumber.checked;
});

pagination?.addEventListener('page-changed', renderList);
pagination?.addEventListener('item-per-page-changed', renderList);
renderList();
