'use strict';

// The page background is the sky over the selected city at its local time.
// Every light-sky colour stays above ~0.63 relative luminance and every dark
// one below ~0.05, keeping secondary text at 4.5:1 contrast or better.

(() => {
  const NIGHT = { top: '#050914', bottom: '#0e1830', glow: '#3b2850', glowA: 0, stars: 1, sun: 0 };
  const frame = (h, top, bottom, glow, glowA, stars, sun) => ({ h, top, bottom, glow, glowA, stars, sun });

  // Light / champagne-sky palette. The pairs at 5.999/6 and 17.999/18 are the theme flips.
  const LIGHT = [
    { h: 0, ...NIGHT },
    { h: 4.5, ...NIGHT, top: '#070d1d', bottom: '#121d38' },
    frame(5.5, '#0d1633', '#1e274a', '#8c4e64', 0.4, 0.45, 0),
    frame(5.999, '#121d42', '#262f58', '#98566a', 0.5, 0.2, 0),
    frame(6, '#cfd6ea', '#f4e0ce', '#f7c59f', 0.62, 0, 0.25),
    frame(7.5, '#cddfed', '#f1eee4', '#f8e0be', 0.3, 0, 0.65),
    frame(12, '#c8ddef', '#eff2ec', '#fff5dc', 0, 0, 1),
    frame(16, '#cbd9ea', '#f2ebde', '#f7ddb4', 0.32, 0, 0.8),
    frame(17.5, '#d9d3e5', '#f5dbc6', '#f4b589', 0.56, 0, 0.38),
    frame(17.999, '#dbd0e0', '#f4d5c0', '#f0a980', 0.6, 0, 0.22),
    frame(18, '#141e42', '#2c2c56', '#8d4d62', 0.48, 0.2, 0),
    frame(19, '#0a1228', '#172142', '#4f3255', 0.24, 0.72, 0),
    { h: 20.5, ...NIGHT },
    { h: 24, ...NIGHT },
  ];

  // Nocturne / dark sky palette: deep obsidian nights with a royal sapphire day.
  const DARK = [
    { h: 0, ...NIGHT },
    { h: 4.5, ...NIGHT, top: '#070d1d', bottom: '#121d38' },
    frame(5.5, '#0d1633', '#1e274a', '#8c4e64', 0.4, 0.45, 0),
    frame(6.5, '#13244a', '#262c52', '#8a5260', 0.44, 0.14, 0.14),
    frame(8, '#142f59', '#1b2b4c', '#685058', 0.18, 0, 0.34),
    frame(12, '#173664', '#1b3054', '#5c4e56', 0, 0, 0.46),
    frame(16, '#162f58', '#242b4e', '#745044', 0.28, 0, 0.34),
    frame(17.5, '#152550', '#2b2a4e', '#864a5d', 0.44, 0, 0.14),
    frame(18.5, '#0e173a', '#1e2348', '#5f3b54', 0.32, 0.34, 0),
    { h: 20, ...NIGHT },
    { h: 24, ...NIGHT },
  ];

  // Always-bright champagne palette when the user explicitly selects Daylight mode.
  const DAY_ONLY = [
    frame(0, '#cfd6e8', '#e7e8ee', '#dcd6ec', 0.25, 0, 0.15),
    frame(5, '#cfd5e9', '#ece2de', '#eccab6', 0.42, 0, 0.2),
    frame(6, '#cfd6ea', '#f4e0ce', '#f7c59f', 0.62, 0, 0.25),
    frame(7.5, '#cddfed', '#f1eee4', '#f8e0be', 0.3, 0, 0.65),
    frame(12, '#c8ddef', '#eff2ec', '#fff5dc', 0, 0, 1),
    frame(16, '#cbd9ea', '#f2ebde', '#f7ddb4', 0.32, 0, 0.8),
    frame(17.5, '#d9d3e5', '#f5dbc6', '#f4b589', 0.56, 0, 0.38),
    frame(19.5, '#d1d5e7', '#e9e5ec', '#e5c8cc', 0.34, 0, 0.18),
    frame(24, '#cfd6e8', '#e7e8ee', '#dcd6ec', 0.25, 0, 0.15),
  ];

  /* Colours are blended in OKLab so dusk doesn't pass through grey. */

  const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const toGamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

  function toOklab(hex) {
    const n = parseInt(hex.slice(1), 16);
    const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => toLinear(v / 255));
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [
      0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    ];
  }

  function toHex([L, a, b]) {
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    const rgb = [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ];
    const channel = (c) => Math.round(Math.min(1, Math.max(0, toGamma(c))) * 255).toString(16).padStart(2, '0');
    return `#${rgb.map(channel).join('')}`;
  }

  function blend(a, b, t) {
    const pa = toOklab(a);
    const pb = toOklab(b);
    return toHex(pa.map((v, i) => v + (pb[i] - v) * t));
  }

  function sample(frames, hour) {
    const h = ((hour % 24) + 24) % 24;
    const i = frames.findIndex((f) => f.h > h);
    const idx = i <= 0 ? 1 : i;
    const a = frames[idx - 1];
    const b = frames[idx];
    const t = b.h === a.h ? 0 : (h - a.h) / (b.h - a.h);
    const mix = (key) => a[key] + (b[key] - a[key]) * t;
    return {
      top: blend(a.top, b.top, t),
      bottom: blend(a.bottom, b.bottom, t),
      glow: blend(a.glow, b.glow, t),
      glowA: mix('glowA'),
      stars: mix('stars'),
      sun: mix('sun'),
    };
  }

  function readSkyMode() {
    try {
      const saved = localStorage.getItem('world-time:sky-mode');
      if (saved === 'auto' || saved === 'night' || saved === 'day') return saved;
    } catch {}
    return 'auto';
  }

  const root = document.documentElement;
  const layer = document.getElementById('sky');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  let skyMode = readSkyMode();
  let lastHour = 12;
  let painted = false;

  function paletteForMode() {
    if (skyMode === 'night') return DARK;
    if (skyMode === 'day') return DAY_ONLY;
    return LIGHT;
  }

  function themeFor(h) {
    if (skyMode === 'night') return 'night';
    if (skyMode === 'day') return 'day';
    return h < 6 || h >= 18 ? 'night' : 'day';
  }

  function apply(h, theme) {
    const sky = sample(paletteForMode(), h);
    root.dataset.theme = theme;
    root.dataset.skyMode = skyMode;

    // The sun crosses the page from sunrise at 06:00 to sunset at 18:00.
    const p = Math.min(1, Math.max(0, (h - 6) / 12));
    const set = (name, value) => layer.style.setProperty(name, value);
    set('--sky-top', sky.top);
    set('--sky-bottom', sky.bottom);
    set('--glow', sky.glow);
    set('--glow-a', sky.glowA.toFixed(3));
    set('--stars', sky.stars.toFixed(3));
    set('--sun-a', sky.sun.toFixed(3));
    set('--sun-x', `${(10 + 80 * p).toFixed(1)}%`);
    set('--sun-y', `${(78 - 60 * Math.sin(Math.PI * p)).toFixed(1)}%`);
    themeColor?.setAttribute('content', sky.top);
  }

  function paintSky(hour, animate = true, crossfade = true) {
    const h = ((hour % 24) + 24) % 24;
    lastHour = h;
    const theme = themeFor(h);
    const flips = painted && root.dataset.theme !== theme;

    if (flips && animate && crossfade && document.startViewTransition) {
      layer.classList.remove('is-fading');
      document.startViewTransition(() => apply(h, theme));
      return;
    }
    layer.classList.toggle('is-fading', animate && painted);
    painted = true;
    apply(h, theme);
  }

  function setSkyMode(mode, animate = true) {
    if (mode !== 'auto' && mode !== 'night' && mode !== 'day') return;
    skyMode = mode;
    try {
      localStorage.setItem('world-time:sky-mode', mode);
    } catch {}
    paintSky(lastHour, animate, true);
  }

  function getSkyMode() {
    return skyMode;
  }

  // Returns live OKLab-blended sky colors for any city's local hour (used for cards).
  function skyColorsForHour(hour) {
    const h = ((hour % 24) + 24) % 24;
    const isNight = h < 6 || h >= 18;
    const sampled = sample(LIGHT, h);
    return { ...sampled, isNight };
  }

  window.paintSky = paintSky;
  window.setSkyMode = setSkyMode;
  window.getSkyMode = getSkyMode;
  window.skyColorsForHour = skyColorsForHour;
})();
