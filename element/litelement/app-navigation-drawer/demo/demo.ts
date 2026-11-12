import './material.js';
import '../src/app-navigation-drawer.js';
import type { AppNavigationDrawer } from '../src/app-navigation-drawer.js';

type SwitchEl = HTMLElement & { selected: boolean };
type FieldEl = HTMLElement & { value: string };
type SliderEl = HTMLElement & { value: number };

const drawer = document.querySelector<AppNavigationDrawer>('#drawer');
const endDrawer = document.querySelector<AppNavigationDrawer>('#end-drawer');

function bind(): void {
  if (!drawer) {
    return;
  }

  const permanent = document.querySelector<SwitchEl>('#permanent');
  const temporary = document.querySelector<SwitchEl>('#temporary');
  const rail = document.querySelector<SwitchEl>('#rail');
  const expandOnHover = document.querySelector<SwitchEl>('#expand-on-hover');
  const expanded = document.querySelector<SwitchEl>('#expanded');
  const opened = document.querySelector<SwitchEl>('#opened');
  const persistent = document.querySelector<SwitchEl>('#persistent');
  const forceNarrow = document.querySelector<SwitchEl>('#force-narrow');
  const swipeOpen = document.querySelector<SwitchEl>('#swipe-open');
  const floating = document.querySelector<SwitchEl>('#floating');
  const modal = document.querySelector<SwitchEl>('#modal');
  const location = document.querySelector<FieldEl>('#location');
  const color = document.querySelector<HTMLInputElement>('#color');
  const elevation = document.querySelector<SliderEl>('#elevation');
  const elevationValue = document.querySelector<HTMLElement>('#elevation-value');
  const width = document.querySelector<FieldEl>('#width');
  const railWidth = document.querySelector<FieldEl>('#rail-width');
  const toggle = document.querySelector<HTMLElement>('#toggle-drawer');
  const openEnd = document.querySelector<HTMLElement>('#open-end');

  drawer.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', () => {
      drawer.querySelectorAll('.nav-item').forEach((node) => {
        node.classList.toggle('is-active', node === item);
      });
    });
  });

  const syncOpenedControl = () => {
    if (opened) {
      opened.selected = drawer.isOpen();
    }
  };

  const syncLeftDrawerTop = () => {
    const toolbar = document.querySelector('.toolbar');
    const top = toolbar instanceof HTMLElement ? toolbar.getBoundingClientRect().height : 56;
    if (drawer.permanent) {
      drawer.style.removeProperty('--app-navigation-drawer-top');
      return;
    }
    drawer.style.setProperty('--app-navigation-drawer-top', `${Math.round(top)}px`);
  };

  permanent?.addEventListener('change', () => {
    drawer.permanent = Boolean(permanent.selected);
    if (permanent.selected) {
      drawer.temporary = false;
      if (temporary) {
        temporary.selected = false;
      }
      drawer.opened = true;
    }
    syncLeftDrawerTop();
    syncOpenedControl();
  });
  temporary?.addEventListener('change', () => {
    drawer.temporary = Boolean(temporary.selected);
    if (temporary.selected) {
      drawer.permanent = false;
      if (permanent) {
        permanent.selected = false;
      }
    }
    syncLeftDrawerTop();
  });
  window.addEventListener('resize', syncLeftDrawerTop);
  syncLeftDrawerTop();
  rail?.addEventListener('change', () => {
    drawer.rail = Boolean(rail.selected);
  });
  expandOnHover?.addEventListener('change', () => {
    drawer.expandOnHover = Boolean(expandOnHover.selected);
  });
  expanded?.addEventListener('change', () => {
    drawer.expanded = Boolean(expanded.selected);
  });
  opened?.addEventListener('change', () => {
    drawer.opened = Boolean(opened.selected);
  });
  persistent?.addEventListener('change', () => {
    drawer.persistent = Boolean(persistent.selected);
  });
  forceNarrow?.addEventListener('change', () => {
    drawer.forceNarrow = Boolean(forceNarrow.selected);
  });
  swipeOpen?.addEventListener('change', () => {
    drawer.swipeOpen = Boolean(swipeOpen.selected);
  });
  floating?.addEventListener('change', () => {
    drawer.floating = Boolean(floating.selected);
  });
  modal?.addEventListener('change', () => {
    drawer.modal = Boolean(modal.selected);
  });
  location?.addEventListener('change', () => {
    drawer.location = location.value as AppNavigationDrawer['location'];
  });
  color?.addEventListener('input', () => {
    drawer.color = color.value;
  });
  elevation?.addEventListener('input', () => {
    const level = Number(elevation.value);
    drawer.elevation = level;
    if (elevationValue) {
      elevationValue.textContent = String(level);
    }
  });
  width?.addEventListener('input', () => {
    drawer.width = Number(width.value);
  });
  railWidth?.addEventListener('input', () => {
    drawer.railWidth = Number(railWidth.value);
  });
  toggle?.addEventListener('click', () => {
    drawer.toggle();
    syncOpenedControl();
  });
  drawer.addEventListener('opened-changed', syncOpenedControl);

  openEnd?.addEventListener('click', () => {
    endDrawer?.open();
  });
  document.querySelector('[data-close-end]')?.addEventListener('click', () => {
    endDrawer?.close();
  });
}

bind();
