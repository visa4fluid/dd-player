import { afterEach, describe, expect, it } from 'vitest';
import { LitTooltip } from '../src/lit-tooltip.js';

async function mount(markup: string): Promise<LitTooltip> {
  document.body.innerHTML = markup;
  const el = document.querySelector('lit-tooltip');
  if (!el) {
    throw new Error('lit-tooltip non montato');
  }
  await el.updateComplete;
  return el;
}

function bubble(el: LitTooltip): HTMLElement {
  const node = el.shadowRoot?.querySelector('#tooltip');
  if (!(node instanceof HTMLElement)) {
    throw new Error('tooltip non trovato');
  }
  return node;
}

function stubRect(el: Element, box: { left: number; top: number; width: number; height: number }): void {
  el.getBoundingClientRect = () => {
    const right = box.left + box.width;
    const bottom = box.top + box.height;
    return {
      x: box.left,
      y: box.top,
      left: box.left,
      top: box.top,
      right,
      bottom,
      width: box.width,
      height: box.height,
      toJSON() {
        return this;
      },
    };
  };
}

describe('lit-tooltip', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('si registra come custom element', () => {
    expect(customElements.get('lit-tooltip')).toBe(LitTooltip);
  });

  it('ha ruolo tooltip', async () => {
    const el = await mount('<lit-tooltip>Hint</lit-tooltip>');
    expect(el.getAttribute('role')).toBe('tooltip');
    expect(el.tabIndex).toBe(-1);
  });

  it('resta nascosto finché non viene mostrato', async () => {
    const el = await mount('<lit-tooltip>Hint</lit-tooltip>');
    expect(el.isShowing()).toBe(false);
    expect(bubble(el).classList.contains('hidden')).toBe(true);
  });

  it('show rivela il contenuto e hide lo nasconde', async () => {
    const el = await mount('<button id="a">A</button><lit-tooltip for="a">Hint</lit-tooltip>');
    el.show();
    await el.updateComplete;
    expect(el.isShowing()).toBe(true);
    expect(bubble(el).classList.contains('hidden')).toBe(false);
    expect(bubble(el).classList.contains('fade-in-animation')).toBe(true);
    expect(el.textContent).toContain('Hint');
    el.hide();
    await el.updateComplete;
    expect(el.isShowing()).toBe(false);
  });

  it('non mostra un tooltip vuoto', async () => {
    const el = await mount('<lit-tooltip></lit-tooltip>');
    el.show();
    await el.updateComplete;
    expect(el.isShowing()).toBe(false);
    expect(bubble(el).classList.contains('hidden')).toBe(true);
  });

  it('ancora il tooltip all elemento for', async () => {
    const el = await mount('<button id="save">Salva</button><lit-tooltip for="save">Salva</lit-tooltip>');
    expect(el.target).toBe(document.querySelector('#save'));
  });

  it('senza for usa il genitore come ancora', async () => {
    const el = await mount('<span id="wrap"><lit-tooltip>Info</lit-tooltip></span>');
    expect(el.target?.id).toBe('wrap');
  });

  it('in manual-mode ignora hover e risponde a show', async () => {
    const el = await mount(
      '<button id="m">Manuale</button><lit-tooltip for="m" manual-mode>Manuale</lit-tooltip>',
    );
    const button = document.querySelector('#m');
    button?.dispatchEvent(new Event('mouseenter'));
    await el.updateComplete;
    expect(el.isShowing()).toBe(false);
    el.show();
    await el.updateComplete;
    expect(el.isShowing()).toBe(true);
  });

  it('hover sull ancora apre e lascia chiude', async () => {
    const el = await mount('<button id="h">Hover</button><lit-tooltip for="h">Hover me</lit-tooltip>');
    const button = document.querySelector('#h');
    button?.dispatchEvent(new Event('mouseenter'));
    await el.updateComplete;
    expect(el.isShowing()).toBe(true);
    button?.dispatchEvent(new Event('mouseleave'));
    await el.updateComplete;
    expect(el.isShowing()).toBe(false);
  });

  it('playAnimation entry e exit mappano show e hide', async () => {
    const el = await mount('<lit-tooltip>Anim</lit-tooltip>');
    el.playAnimation('entry');
    await el.updateComplete;
    expect(el.isShowing()).toBe(true);
    el.playAnimation('exit');
    await el.updateComplete;
    expect(el.isShowing()).toBe(false);
  });

  it('posiziona sotto l ancora di default', async () => {
    const el = await mount('<button id="p">Pos</button><lit-tooltip for="p">Sotto</lit-tooltip>');
    const button = document.querySelector('#p');
    if (!(button instanceof HTMLElement)) {
      throw new Error('ancora mancante');
    }
    stubRect(button, { left: 100, top: 40, width: 40, height: 20 });
    el.show();
    await el.updateComplete;
    stubRect(bubble(el), { left: 0, top: 0, width: 80, height: 24 });
    el.updatePosition();
    expect(el.style.left).toBe('80px');
    expect(el.style.top).toBe('74px');
  });

  it('posiziona a sinistra se position è left', async () => {
    const el = await mount('<button id="l">L</button><lit-tooltip for="l" position="left">Sx</lit-tooltip>');
    const button = document.querySelector('#l');
    if (!(button instanceof HTMLElement)) {
      throw new Error('ancora mancante');
    }
    stubRect(button, { left: 200, top: 80, width: 40, height: 20 });
    el.show();
    await el.updateComplete;
    stubRect(bubble(el), { left: 0, top: 0, width: 50, height: 20 });
    el.updatePosition();
    expect(el.position).toBe('left');
    expect(el.style.left).toBe('136px');
    expect(el.style.top).toBe('80px');
  });

  it('fit-to-visible-bounds tiene il tooltip in viewport', async () => {
    const el = await mount(
      '<button id="f">F</button><lit-tooltip for="f" fit-to-visible-bounds>Fit</lit-tooltip>',
    );
    const button = document.querySelector('#f');
    if (!(button instanceof HTMLElement)) {
      throw new Error('ancora mancante');
    }
    stubRect(button, { left: 10, top: 10, width: 20, height: 10 });
    el.show();
    await el.updateComplete;
    stubRect(bubble(el), { left: 0, top: 0, width: 120, height: 30 });
    el.updatePosition();
    expect(Number.parseInt(el.style.left, 10)).toBeGreaterThanOrEqual(8);
    expect(Number.parseInt(el.style.top, 10)).toBeGreaterThanOrEqual(8);
  });

  it('propaga animation-delay sulla custom property', async () => {
    const el = await mount('<lit-tooltip animation-delay="120">Delay</lit-tooltip>');
    expect(el.style.getPropertyValue('--lit-tooltip-delay-in')).toBe('120ms');
    el.animationDelay = 0;
    await el.updateComplete;
    expect(el.style.getPropertyValue('--paper-tooltip-delay-in')).toBe('0ms');
  });
});
