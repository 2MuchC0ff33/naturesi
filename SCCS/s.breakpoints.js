h53200
s 00048/00000/00000
d D 1.1 26/04/12 13:56:44 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:44 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
// breakpoints.js — Read CSS breakpoint tokens and expose matchMedia helpers
// Prefer reading values from CSS custom properties defined in
// assets/css/partials/settings/breakpoints.css (e.g. --bp-md: 900px).

const FALLBACKS = {
  sm: 640,
  md: 900,
  lg: 1200,
};

function readCssBreakpoint(name) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return FALLBACKS[name] || null;
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(`--bp-${name}`);
    if (!v) return FALLBACKS[name] || null;
    const num = parseInt(v.trim().replace(/px$/i, ''), 10);
    return Number.isFinite(num) ? num : FALLBACKS[name] || null;
  } catch (e) {
    return FALLBACKS[name] || null;
  }
}

export function mqMax(name) {
  const px = readCssBreakpoint(name);
  if (!px) return window.matchMedia('(max-width: 0px)');
  return window.matchMedia(`(max-width: ${px}px)`);
}

export function mqMin(name) {
  const px = readCssBreakpoint(name);
  if (!px) return window.matchMedia('(min-width: 99999px)');
  return window.matchMedia(`(min-width: ${px}px)`);
}

export function isBelow(name) {
  return mqMax(name).matches;
}

export function isAtLeast(name) {
  return mqMin(name).matches;
}

export default {
  mqMax,
  mqMin,
  isBelow,
  isAtLeast,
};
E 1
