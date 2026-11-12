import { afterEach, describe, expect, it } from 'vitest';
import { AppHeader } from '../src/app-header.js';

async function mount(markup: string): Promise<AppHeader> {
  document.body.innerHTML = markup;
  const el = document.querySelector('app-header');
  if (!el) {
    throw new Error('app-header non montato');
  }
  await el.updateComplete;
  return el;
}

function bar(el: AppHeader): HTMLElement {
  const node = el.shadowRoot?.querySelector('.bar');
  if (!(node instanceof HTMLElement)) {
    throw new Error('barra non trovata');
  }
  return node;
}

describe('app-header', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('si registra come custom element', () => {
    expect(customElements.get('app-header')).toBe(AppHeader);
  });

  it('mostra il title', async () => {
    const el = await mount('<app-header title="Regista"></app-header>');
    expect(el.shadowRoot?.textContent).toContain('Regista');
  });

  it('proietta gli slot start, default, end e extension', async () => {
    const el = await mount(`
      <app-header>
        <button slot="start" id="start">menu</button>
        <span id="mid">centro</span>
        <button slot="end" id="end">auth</button>
        <div slot="extension" id="ext">extra</div>
      </app-header>
    `);
    const assigned = (selector: string) => {
      const slot = el.shadowRoot?.querySelector(selector);
      return slot instanceof HTMLSlotElement ? slot.assignedElements().map((n) => n.id) : [];
    };
    const names = (name: string) => assigned(`slot[name="${name}"]`);
    const unnamed = assigned('slot:not([name])');
    expect(names('start')).toEqual(['start']);
    expect(unnamed).toEqual(['mid']);
    expect(names('end')).toEqual(['end']);
    expect(names('extension')).toEqual(['ext']);
  });

  it('usa le altezze della density', async () => {
    const el = await mount('<app-header density="compact"></app-header>');
    expect(el.restingHeight()).toBe(48);
    el.density = 'comfortable';
    expect(el.restingHeight()).toBe(56);
    el.density = 'default';
    expect(el.restingHeight()).toBe(64);
    el.density = 'prominent';
    expect(el.restingHeight()).toBe(128);
    el.height = 80;
    expect(el.restingHeight()).toBe(80);
  });

  it('applica colore e immagine come custom property', async () => {
    const el = await mount('<app-header color="#3D9A8A" image="https://example.com/bg.jpg"></app-header>');
    await el.updateComplete;
    expect(bar(el).style.getPropertyValue('--app-header-background')).toBe('#3D9A8A');
    expect(bar(el).style.getPropertyValue('--app-header-image')).toContain('example.com/bg.jpg');
  });

  it('flat toglie l ombra', async () => {
    const el = await mount('<app-header elevation="4" flat></app-header>');
    await el.updateComplete;
    expect(bar(el).style.getPropertyValue('--app-header-shadow')).toBe('none');
  });

  it('elevate / waterfall aggiungono ombra solo dopo lo scroll', async () => {
    const el = await mount('<app-header scroll-behavior="elevate" elevation="3"></app-header>');
    await el.updateComplete;
    expect(bar(el).style.getPropertyValue('--app-header-shadow')).toBe('none');
    el.syncScroll(40);
    await el.updateComplete;
    expect(bar(el).style.getPropertyValue('--app-header-shadow')).not.toBe('none');
  });

  it('reveals nasconde in discesa e mostra in salita', async () => {
    const el = await mount('<app-header reveals></app-header>');
    el.syncScroll(20);
    el.syncScroll(80);
    await el.updateComplete;
    expect(bar(el).hasAttribute('data-concealed')).toBe(true);
    el.syncScroll(30);
    await el.updateComplete;
    expect(bar(el).hasAttribute('data-concealed')).toBe(false);
  });

  it('condenses riduce l altezza allo scroll', async () => {
    const el = await mount('<app-header condenses density="prominent"></app-header>');
    expect(el.restingHeight()).toBe(128);
    el.syncScroll(0);
    await el.updateComplete;
    expect(bar(el).style.getPropertyValue('--app-header-height')).toBe('128px');
    el.syncScroll(80);
    await el.updateComplete;
    const height = Number.parseInt(bar(el).style.getPropertyValue('--app-header-height'), 10);
    expect(height).toBeLessThan(128);
    expect(height).toBeGreaterThanOrEqual(64);
  });

  it('ascolta lo scroll di un target interno', async () => {
    const el = await mount(`
      <div>
        <div id="pane" style="height: 80px; overflow: auto;">
          <div style="height: 400px;"></div>
        </div>
        <app-header reveals scroll-target="#pane"></app-header>
      </div>
    `);
    const pane = document.querySelector('#pane');
    if (!(pane instanceof HTMLElement)) {
      throw new Error('pane mancante');
    }
    pane.scrollTop = 120;
    pane.dispatchEvent(new Event('scroll'));
    await el.updateComplete;
    expect(bar(el).hasAttribute('data-concealed')).toBe(true);
  });
});
