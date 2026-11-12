import '../src/app-header.js';
import type { AppHeader } from '../src/app-header.js';

const main = document.querySelector<AppHeader>('#main-header');
const scrollHeader = document.querySelector<AppHeader>('#scroll-header');

function bind(): void {
  if (!main || !scrollHeader) {
    return;
  }

  const title = document.querySelector<HTMLInputElement>('#title');
  const color = document.querySelector<HTMLInputElement>('#color');
  const density = document.querySelector<HTMLSelectElement>('#density');
  const elevation = document.querySelector<HTMLInputElement>('#elevation');
  const flat = document.querySelector<HTMLInputElement>('#flat');
  const fixed = document.querySelector<HTMLInputElement>('#fixed');
  const location = document.querySelector<HTMLSelectElement>('#location');
  const reveals = document.querySelector<HTMLInputElement>('#reveals');
  const condenses = document.querySelector<HTMLInputElement>('#condenses');
  const elevate = document.querySelector<HTMLInputElement>('#elevate');
  const hide = document.querySelector<HTMLInputElement>('#hide');
  const threshold = document.querySelector<HTMLInputElement>('#threshold');

  title?.addEventListener('input', () => {
    main.title = title.value;
  });
  color?.addEventListener('input', () => {
    main.color = color.value;
  });
  density?.addEventListener('change', () => {
    main.density = density.value as AppHeader['density'];
    scrollHeader.density = condenses?.checked ? 'prominent' : density.value as AppHeader['density'];
  });
  elevation?.addEventListener('input', () => {
    main.elevation = Number(elevation.value);
    scrollHeader.elevation = Number(elevation.value);
  });
  flat?.addEventListener('change', () => {
    main.flat = flat.checked;
  });
  fixed?.addEventListener('change', () => {
    main.fixed = fixed.checked;
  });
  location?.addEventListener('change', () => {
    main.location = location.value as AppHeader['location'];
  });

  const applyScroll = () => {
    const parts = [
      elevate?.checked ? 'elevate' : '',
      hide?.checked ? 'hide' : '',
    ].filter(Boolean);
    scrollHeader.reveals = Boolean(reveals?.checked);
    scrollHeader.condenses = Boolean(condenses?.checked);
    scrollHeader.scrollBehavior = parts.join(' ');
    scrollHeader.effects = elevate?.checked ? 'waterfall' : '';
    scrollHeader.scrollThreshold = Number(threshold?.value ?? 0);
    scrollHeader.density = condenses?.checked ? 'prominent' : 'default';
  };

  reveals?.addEventListener('change', applyScroll);
  condenses?.addEventListener('change', applyScroll);
  elevate?.addEventListener('change', applyScroll);
  hide?.addEventListener('change', applyScroll);
  threshold?.addEventListener('input', applyScroll);
}

bind();
