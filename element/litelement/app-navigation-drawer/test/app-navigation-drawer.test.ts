import { afterEach, describe, expect, it } from 'vitest';
import { AppNavigationDrawer } from '../src/app-navigation-drawer.js';

async function mount(markup: string): Promise<AppNavigationDrawer> {
  document.body.innerHTML = markup;
  const el = document.querySelector('app-navigation-drawer');
  if (!el) {
    throw new Error('app-navigation-drawer non montato');
  }
  await el.updateComplete;
  return el;
}

function panel(el: AppNavigationDrawer): HTMLElement {
  const node = el.shadowRoot?.querySelector('.panel');
  if (!(node instanceof HTMLElement)) {
    throw new Error('pannello non trovato');
  }
  return node;
}

function scrim(el: AppNavigationDrawer): HTMLElement {
  const node = el.shadowRoot?.querySelector('.scrim');
  if (!(node instanceof HTMLElement)) {
    throw new Error('scrim non trovato');
  }
  return node;
}

describe('app-navigation-drawer', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('si registra come custom element', () => {
    expect(customElements.get('app-navigation-drawer')).toBe(AppNavigationDrawer);
  });

  it('proietta gli slot prepend, default e append', async () => {
    const el = await mount(`
      <app-navigation-drawer permanent>
        <span slot="prepend" id="pre">logo</span>
        <button id="mid">Host</button>
        <span slot="append" id="post">extra</span>
      </app-navigation-drawer>
    `);
    const assigned = (selector: string) => {
      const slot = el.shadowRoot?.querySelector(selector);
      return slot instanceof HTMLSlotElement ? slot.assignedElements().map((n) => n.id) : [];
    };
    expect(assigned('slot[name="prepend"]')).toEqual(['pre']);
    expect(assigned('slot:not([name])')).toEqual(['mid']);
    expect(assigned('slot[name="append"]')).toEqual(['post']);
  });

  it('usa le larghezze rail e piena', async () => {
    const el = await mount('<app-navigation-drawer rail rail-width="56" width="280"></app-navigation-drawer>');
    expect(el.currentWidth()).toBe(56);
    expect(el.getWidth()).toBe(56);
    el.rail = false;
    expect(el.currentWidth()).toBe(280);
  });

  it('expanded e expand-on-hover allargano la rail', async () => {
    const el = await mount('<app-navigation-drawer rail width="256" expand-on-hover></app-navigation-drawer>');
    expect(el.isRailExpanded()).toBe(false);
    panel(el).dispatchEvent(new Event('mouseenter'));
    await el.updateComplete;
    expect(el.isRailExpanded()).toBe(true);
    expect(el.currentWidth()).toBe(256);
    expect(el.hasAttribute('data-expanded')).toBe(true);
    panel(el).dispatchEvent(new Event('mouseleave'));
    await el.updateComplete;
    el.expanded = true;
    await el.updateComplete;
    expect(el.currentWidth()).toBe(256);
  });

  it('applica colore e immagine come custom property', async () => {
    const el = await mount('<app-navigation-drawer color="#3D9A8A" image="https://example.com/bg.jpg"></app-navigation-drawer>');
    await el.updateComplete;
    expect(el.style.getPropertyValue('--app-navigation-drawer-background')).toBe('#3D9A8A');
    expect(el.style.getPropertyValue('--app-navigation-drawer-image')).toContain('example.com/bg.jpg');
  });

  it('floating toglie l ombra', async () => {
    const el = await mount('<app-navigation-drawer elevation="4" floating></app-navigation-drawer>');
    await el.updateComplete;
    expect(el.style.getPropertyValue('--app-navigation-drawer-shadow')).toBe('none');
    expect(el.hasAttribute('data-elevated')).toBe(false);
  });

  it('elevation 0 toglie data-elevated', async () => {
    const el = await mount('<app-navigation-drawer elevation="2"></app-navigation-drawer>');
    await el.updateComplete;
    expect(el.hasAttribute('data-elevated')).toBe(true);
    el.elevation = 0;
    await el.updateComplete;
    expect(el.hasAttribute('data-elevated')).toBe(false);
  });

  it('elevation cambia l ombra', async () => {
    const el = await mount('<app-navigation-drawer elevation="1"></app-navigation-drawer>');
    await el.updateComplete;
    const low = el.style.getPropertyValue('--app-navigation-drawer-shadow');
    el.elevation = 5;
    await el.updateComplete;
    const high = el.style.getPropertyValue('--app-navigation-drawer-shadow');
    expect(low).not.toBe('none');
    expect(high).not.toBe(low);
    expect(el.hasAttribute('data-elevated')).toBe(true);
    expect(low).toContain('6px 0');
    expect(high).toContain('28px 0');
    expect(panel(el).style.boxShadow).toBe(high);
    el.location = 'end';
    await el.updateComplete;
    expect(el.style.getPropertyValue('--app-navigation-drawer-shadow')).toContain('-28px 0');
    expect(panel(el).style.boxShadow).toContain('-28px 0');
  });

  it('location end si riflette sull host', async () => {
    const el = await mount('<app-navigation-drawer location="start"></app-navigation-drawer>');
    el.location = 'end';
    await el.updateComplete;
    expect(el.getAttribute('location')).toBe('end');
  });

  it('permanent riserva lo spazio e resta aperto', async () => {
    const el = await mount('<app-navigation-drawer permanent rail rail-width="56"></app-navigation-drawer>');
    expect(el.isOpen()).toBe(true);
    expect(el.isOverlay()).toBe(false);
    expect(el.reservedWidth()).toBe(56);
    expect(el.style.getPropertyValue('--app-navigation-drawer-reserved')).toBe('56px');
    el.close();
    await el.updateComplete;
    expect(el.isOpen()).toBe(true);
  });

  it('temporary e force-narrow sono overlay senza spazio riservato', async () => {
    const el = await mount('<app-navigation-drawer temporary opened width="256"></app-navigation-drawer>');
    expect(el.isOverlay()).toBe(true);
    expect(el.narrow).toBe(true);
    expect(el.reservedWidth()).toBe(0);
    expect(el.hasAttribute('overlay')).toBe(true);
    el.temporary = false;
    el.opened = false;
    el.forceNarrow = true;
    await el.updateComplete;
    expect(el.isOverlay()).toBe(true);
    expect(el.reservedWidth()).toBe(0);
  });

  it('open close toggle emettono opened-changed', async () => {
    const el = await mount('<app-navigation-drawer temporary></app-navigation-drawer>');
    const values: boolean[] = [];
    el.addEventListener('opened-changed', (event) => {
      values.push((event as CustomEvent<{ value: boolean }>).detail.value);
    });
    el.open();
    await el.updateComplete;
    el.toggle();
    await el.updateComplete;
    expect(el.opened).toBe(false);
    expect(values).toEqual([true, false]);
  });

  it('lo scrim chiude il drawer temporary', async () => {
    const el = await mount('<app-navigation-drawer temporary opened></app-navigation-drawer>');
    expect(scrim(el).hasAttribute('data-open')).toBe(true);
    scrim(el).click();
    await el.updateComplete;
    expect(el.opened).toBe(false);
  });

  it('persistent non chiude su scrim o Escape', async () => {
    const el = await mount('<app-navigation-drawer temporary opened persistent></app-navigation-drawer>');
    scrim(el).click();
    await el.updateComplete;
    expect(el.opened).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await el.updateComplete;
    expect(el.opened).toBe(true);
  });

  it('Escape chiude l overlay se non persistent', async () => {
    const el = await mount('<app-navigation-drawer temporary opened></app-navigation-drawer>');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await el.updateComplete;
    expect(el.opened).toBe(false);
  });

  it('resetLayout usa il mobile-breakpoint', async () => {
    const el = await mount('<app-navigation-drawer opened mobile-breakpoint="800"></app-navigation-drawer>');
    el.resetLayout(1200);
    await el.updateComplete;
    expect(el.isOverlay()).toBe(false);
    expect(el.reservedWidth()).toBe(256);
    el.resetLayout(600);
    await el.updateComplete;
    expect(el.isOverlay()).toBe(true);
    expect(el.reservedWidth()).toBe(0);
  });

  it('mobile true/false sovrascrive il breakpoint', async () => {
    const el = await mount('<app-navigation-drawer opened></app-navigation-drawer>');
    el.resetLayout(1600);
    el.mobile = true;
    await el.updateComplete;
    expect(el.isOverlay()).toBe(true);
    el.mobile = false;
    await el.updateComplete;
    expect(el.isOverlay()).toBe(false);
  });

  it('syncSwipe apre e chiude con swipe-open', async () => {
    const el = await mount('<app-navigation-drawer temporary swipe-open width="200"></app-navigation-drawer>');
    el.syncSwipe(100);
    await el.updateComplete;
    expect(el.opened).toBe(true);
    el.syncSwipe(-100);
    await el.updateComplete;
    expect(el.opened).toBe(false);
  });

  it('modal mostra lo scrim quando la rail e espansa', async () => {
    const el = await mount('<app-navigation-drawer permanent rail modal expanded></app-navigation-drawer>');
    expect(el.isRailExpanded()).toBe(true);
    expect(scrim(el).hasAttribute('data-open')).toBe(true);
  });
});
