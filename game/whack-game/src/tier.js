// Device tier: MOBILE = cheaper rendering (lower DPR, no bloom, merged meshes / fewer outlines).
const params = new URLSearchParams(location.search);
const touch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
const coarse = matchMedia('(pointer: coarse)').matches;
export const MOBILE = params.has('low') || (!params.has('high') && ((touch && (coarse || innerWidth < 900)) || (navigator.hardwareConcurrency || 8) <= 4));
export const TOUCH = touch;
if (MOBILE) document.documentElement.classList.add('mobile');
if (touch) document.documentElement.classList.add('touch');
