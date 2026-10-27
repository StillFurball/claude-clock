'use strict';

// The page background is the sky over the selected city at its local time.
// With a light system theme the page itself flips light at 06:00 and dark at
// 18:00, so text always sits on a sky it can be read against: every light-sky
// colour below stays above ~0.63 relative luminance and every dark one below
// ~0.05, which keeps secondary text at 4.5:1 or better. With a dark system
// theme the page stays dark and daytime is a deep blue instead.

(() => {
  const NIGHT = { top: '#070b16', bottom: '#111a30', glow: '#3a2a4a', glowA: 0, stars: 1, sun: 0 };
  const frame = (h, top, bottom, glow, glowA, stars, sun) => ({ h, top, bottom, glow, glowA, stars, sun });

  // Light system theme. The pairs at 5.999/6 and 17.999/18 are the theme flips.
  const LIGHT = [
    { h: 0, ...NIGHT },
    { h: 4.5, ...NIGHT, top: '#080d1b', bottom: '#131c35' },
    frame(5.5, '#0d1530', '#1d2547', '#7a4558', 0.35, 0.45, 0),
    frame(5.999, '#121c3f', '#232c52', '#7a4558', 0.45, 0.2, 0),
    frame(6, '#ccd3e8', '#f0dccc', '#f5c4a2', 0.55, 0, 0.2),
    frame(7.5, '#cddfee', '#edefe8', '#f7dfc0', 0.25, 0, 0.6),
    frame(12, '#c6dbee', '#ecf1ee', '#fff4d8', 0, 0, 1),
    frame(16, '#c9d8ea', '#efeadf', '#f6dcb4', 0.3, 0, 0.8),
    frame(17.5, '#d6d2e3', '#f3dac4', '#f2b68c', 0.5, 0, 0.35),
    frame(17.999, '#d8cfde', '#f2d4bf', '#efab84', 0.55, 0, 0.2),
    frame(18, '#151e40', '#2a2b54', '#7a4558', 0.45, 0.2, 0),
    frame(19, '#0b1226', '#172040', '#4a3050', 0.2, 0.7, 0),
    { h: 20.5, ...NIGHT },
    { h: 24, ...NIGHT },
  ];

  // Dark system theme: the same nights, with a deep blue day.
  const DARK = [
    { h: 0, ...NIGHT },
    { h: 4.5, ...NIGHT, top: '#080d1b', bottom: '#131c35' },
    frame(5.5, '#0d1530', '#1d2547', '#7a4558', 0.35, 0.45, 0),
    frame(6.5, '#142449', '#262c4f', '#7a4a58', 0.4, 0.1, 0.1),
    frame(8, '#17305a', '#1c2b4a', '#5a4a50', 0.15, 0, 0.3),
    frame(12, '#1a3560', '#1d2f4f', '#5a4a50', 0, 0, 0.4),
    frame(16, '#19305a', '#232b4a', '#6a4a40', 0.25, 0, 0.3),
    frame(17.5, '#172650', '#2a2a4c', '#7a4558', 0.4, 0, 0.1),
    frame(18.5, '#10183a', '#1f2446', '#5a3a50', 0.3, 0.3, 0),
    { h: 20, ...NIGHT },
    { h: 24, ...NIGHT },
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
    const i = frames.findIndex((f) => f.h > hour);
    const a = frames[i - 1];
    const b = frames[i];
    const t = (hour - a.h) / (b.h - a.h);
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

  const root = document.documentElement;
  const layer = document.getElementById('sky');
  // const darkScheme = matchMedia('(prefers-color-scheme: dark)');
  const darkScheme = { matches: false, addEventListener() {} };

  const themeColor = document.querySelector('meta[name="theme-color"]');
  let lastHour = 12;
  let painted = false;

  function apply(h, theme) {
    const sky = sample(darkScheme.matches ? DARK : LIGHT, h);
    root.dataset.theme = theme;

    // The sun crosses the page from sunrise at 06:00 to sunset at 18:00.
    const p = Math.min(1, Math.max(0, (h - 6) / 12));
    const set = (name, value) => layer.style.setProperty(name, value);
    set('--sky-top', sky.top);
    set('--sky-bottom', sky.bottom);
    set('--glow', sky.glow);
    set('--glow-a', sky.glowA.toFixed(3));
    set('--stars', sky.stars.toFixed(3));
    set('--sun-a', sky.sun.toFixed(3));
    set('--sun-x', `${(8 + 84 * p).toFixed(1)}%`);
    set('--sun-y', `${(78 - 62 * Math.sin(Math.PI * p)).toFixed(1)}%`);
    themeColor?.setAttribute('content', sky.top);
  }

  // `hour` is the selected city's local time as a fraction, e.g. 18.75.
  // `animate` fades the sky; `crossfade` also lets a day/night theme flip
  // crossfade the whole page (skipped while the time slider is dragged).
  function paintSky(hour, animate = true, crossfade = true) {
    const h = ((hour % 24) + 24) % 24;
    lastHour = h;
    const theme = darkScheme.matches || h < 6 || h >= 18 ? 'night' : 'day';
    const flips = painted && root.dataset.theme !== theme;

    if (flips && animate && crossfade && document.startViewTransition) {
      // The page crossfade carries the sky too, so it snaps underneath.
      layer.classList.remove('is-fading');
      document.startViewTransition(() => apply(h, theme));
      return;
    }
    // No fade on the very first paint, so the page never opens on the wrong sky.
    layer.classList.toggle('is-fading', animate && painted);
    painted = true;
    apply(h, theme);
  }

  darkScheme.addEventListener('change', () => paintSky(lastHour));

  window.paintSky = paintSky;
})();
