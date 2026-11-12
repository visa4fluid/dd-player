import '../src/lit-tooltip.js';
import type { LitTooltip } from '../src/lit-tooltip.js';

const tooltip = document.querySelector<LitTooltip>('#manual-tooltip');
document.querySelector('#start-show')?.addEventListener('click', () => {
  tooltip?.playAnimation('entry');
});
document.querySelector('#start-hide')?.addEventListener('click', () => {
  tooltip?.playAnimation('exit');
});
document.querySelector('#cancel')?.addEventListener('click', () => {
  tooltip?.cancelAnimation();
});
