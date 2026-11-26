'use strict';

const SVG_NS = 'http://www.w3.org/2000/svg';
const HOME_TZ = 'Asia/Jakarta';
const HOME_SLOT = 7; // GMT+7, marked in ruby wherever the dial is turned

// Radii in dial units (the SVG viewBox is 1000 wide, centred on 0,0).
const RING_IN = 300;
const RING_OUT = 392;
const NUMERAL_R = 346;
const CITY_R_TOP = 434; // text on the top half grows outward from here
const CITY_R_BOTTOM = 452; // text on the bottom half grows inward from here

const place = (name, tz, code) => ({ name, tz, code });

const anchorage = place('Anchorage', 'America/Anchorage', 'ANC');
const losAngeles = place('Los Angeles', 'America/Los_Angeles', 'LAX');
const denver = place('Denver', 'America/Denver', 'DEN');
const chicago = place('Chicago', 'America/Chicago', 'CHI');
const newYork = place('New York', 'America/New_York', 'NYC');
const santiago = place('Santiago', 'America/Santiago', 'SCL');
const nuuk = place('Nuuk', 'America/Nuuk', 'GOH');
const azores = place('Azores', 'Atlantic/Azores', 'PDL');
const london = place('London', 'Europe/London', 'LON');
const paris = place('Paris', 'Europe/Paris', 'PAR');
const cairo = place('Cairo', 'Africa/Cairo', 'CAI');
const sydney = place('Sydney', 'Australia/Sydney', 'SYD');

// One city per whole-hour slot. The first candidate whose current offset
// matches the slot wins, so the ring stays right through daylight saving.
const RING = [
  [-11, place('Pago Pago', 'Pacific/Pago_Pago', 'PPG'), place('Niue', 'Pacific/Niue', 'IUE')],
  [-10, place('Honolulu', 'Pacific/Honolulu', 'HNL'), place('Tahiti', 'Pacific/Tahiti', 'PPT')],
  [-9, anchorage, place('Gambier', 'Pacific/Gambier', 'GMR')],
  [-8, losAngeles, anchorage],
  [-7, denver, losAngeles, place('Phoenix', 'America/Phoenix', 'PHX')],
  [-6, place('Mexico City', 'America/Mexico_City', 'MEX'), chicago, denver],
  [-5, newYork, chicago, place('Bogotá', 'America/Bogota', 'BOG')],
  [-4, newYork, santiago, place('Caracas', 'America/Caracas', 'CCS')],
  [-3, place('São Paulo', 'America/Sao_Paulo', 'SAO'), santiago],
  [-2, nuuk, place('Noronha', 'America/Noronha', 'FEN')],
  [-1, azores, place('Praia', 'Atlantic/Cape_Verde', 'RAI'), nuuk],
  [0, london, place('Reykjavík', 'Atlantic/Reykjavik', 'REK'), azores],
  [1, paris, london, place('Lagos', 'Africa/Lagos', 'LOS')],
  [2, cairo, paris, place('Cape Town', 'Africa/Johannesburg', 'CPT')],
  [3, place('Moscow', 'Europe/Moscow', 'MOW'), place('Istanbul', 'Europe/Istanbul', 'IST'), cairo],
  [4, place('Dubai', 'Asia/Dubai', 'DXB')],
  [5, place('Karachi', 'Asia/Karachi', 'KHI'), place('Tashkent', 'Asia/Tashkent', 'TAS')],
  [6, place('Dhaka', 'Asia/Dhaka', 'DAC')],
  [7, place('Jakarta', HOME_TZ, 'JKT')],
  [8, place('Singapore', 'Asia/Singapore', 'SIN')],
  [9, place('Tokyo', 'Asia/Tokyo', 'TYO')],
  [10, sydney, place('Brisbane', 'Australia/Brisbane', 'BNE')],
  [11, sydney, place('Nouméa', 'Pacific/Noumea', 'NOU')],
  [12, place('Auckland', 'Pacific/Auckland', 'AKL'), place('Suva', 'Pacific/Fiji', 'SUV')],
];

const LISTS = [
  {
    key: 'indonesia',
    el: document.getElementById('list-indonesia'),
    places: [
      { name: 'Jakarta', tz: HOME_TZ, zone: 'WIB', country: 'Western Indonesia' },
      { name: 'Makassar', tz: 'Asia/Makassar', zone: 'WITA', country: 'Central Indonesia' },
      { name: 'Jayapura', tz: 'Asia/Jayapura', zone: 'WIT', country: 'Eastern Indonesia' },
    ],
  },
  {
    key: 'world',
    el: document.getElementById('list-world'),
    places: [
      { name: 'Tokyo', tz: 'Asia/Tokyo', country: 'Japan' },
      { name: 'Sydney', tz: 'Australia/Sydney', country: 'Australia' },
      { name: 'Delhi', tz: 'Asia/Kolkata', country: 'India' },
      { name: 'Mecca', tz: 'Asia/Riyadh', country: 'Saudi Arabia' },
      { name: 'Amsterdam', tz: 'Europe/Amsterdam', country: 'Netherlands' },
      { name: 'London', tz: 'Europe/London', country: 'United Kingdom' },
      { name: 'New York', tz: 'America/New_York', country: 'United States' },
      { name: 'Los Angeles', tz: 'America/Los_Angeles', country: 'United States' },
    ],
  },
  {
    key: 'f1',
    el: document.getElementById('list-f1'),
    sort: false,
    places: [
      { name: 'Sakhir', tz: 'Asia/Bahrain', code: 'BAH', zone: 'R1 Bahrain · 12–14 Mar', round: 1, country: 'Bahrain Grand Prix', dates: '12–14 Mar 2027' },
      { name: 'Jeddah', tz: 'Asia/Riyadh', code: 'JED', zone: 'R2 Saudi Arabia · 19–21 Mar', round: 2, country: 'Saudi Arabian Grand Prix', dates: '19–21 Mar 2027' },
      { name: 'Melbourne', tz: 'Australia/Melbourne', code: 'MEL', zone: 'R3 Australia · 2–4 Apr', round: 3, country: 'Australian Grand Prix', dates: '2–4 Apr 2027' },
      { name: 'Suzuka', tz: 'Asia/Tokyo', code: 'SZK', zone: 'R4 Japan · 9–11 Apr', round: 4, country: 'Japanese Grand Prix', dates: '9–11 Apr 2027' },
      { name: 'Shanghai', tz: 'Asia/Shanghai', code: 'SHA', zone: 'R5 China · 16–18 Apr', round: 5, country: 'Chinese Grand Prix', dates: '16–18 Apr 2027' },
      { name: 'Miami', tz: 'America/New_York', code: 'MIA', zone: 'R6 · 30 Apr–2 May', round: 6, country: 'Miami Grand Prix', dates: '30 Apr–2 May 2027' },
      { name: 'Montréal', tz: 'America/Toronto', code: 'YUL', zone: 'R7 Canada · 21–23 May', round: 7, country: 'Canadian Grand Prix', dates: '21–23 May 2027' },
      { name: 'Monaco', tz: 'Europe/Monaco', code: 'MCO', zone: 'R8 · 4–6 Jun', round: 8, country: 'Monaco Grand Prix', dates: '4–6 Jun 2027' },
      { name: 'Portimão', tz: 'Europe/Lisbon', code: 'PRM', zone: 'R9 Portugal · 18–20 Jun', round: 9, country: 'Portuguese Grand Prix', dates: '18–20 Jun 2027' },
      { name: 'Silverstone', tz: 'Europe/London', code: 'SIL', zone: 'R10 Great Britain · 2–4 Jul', round: 10, country: 'British Grand Prix', dates: '2–4 Jul 2027' },
      { name: 'Spielberg', tz: 'Europe/Vienna', code: 'SPB', zone: 'R11 Austria · 9–11 Jul', round: 11, country: 'Austrian Grand Prix', dates: '9–11 Jul 2027' },
      { name: 'Spa-Francorchamps', tz: 'Europe/Brussels', code: 'SPA', zone: 'R12 Belgium · 23–25 Jul', round: 12, country: 'Belgian Grand Prix', dates: '23–25 Jul 2027' },
      { name: 'Budapest', tz: 'Europe/Budapest', code: 'BUD', zone: 'R13 Hungary · 30 Jul–1 Aug', round: 13, country: 'Hungarian Grand Prix', dates: '30 Jul–1 Aug 2027' },
      { name: 'Monza', tz: 'Europe/Rome', code: 'MNZ', zone: 'R14 Italy · 3–5 Sep', round: 14, country: 'Italian Grand Prix', dates: '3–5 Sep 2027' },
      { name: 'Madrid', tz: 'Europe/Madrid', code: 'MAD', zone: 'R15 Spain · 10–12 Sep', round: 15, country: 'Spanish Grand Prix', dates: '10–12 Sep 2027' },
      { name: 'Baku', tz: 'Asia/Baku', code: 'BAK', zone: 'R16 Azerbaijan · 24–26 Sep', round: 16, country: 'Azerbaijan Grand Prix', dates: '24–26 Sep 2027' },
      { name: 'Istanbul', tz: 'Europe/Istanbul', code: 'IST', zone: 'R17 Turkey · 1–3 Oct', round: 17, country: 'Turkish Grand Prix', dates: '1–3 Oct 2027' },
      { name: 'Singapore', tz: 'Asia/Singapore', code: 'SIN', zone: 'R18 · 8–10 Oct', round: 18, country: 'Singapore Grand Prix', dates: '8–10 Oct 2027' },
      { name: 'Austin', tz: 'America/Chicago', code: 'AUS', zone: 'R19 USA · 22–24 Oct', round: 19, country: 'United States Grand Prix', dates: '22–24 Oct 2027' },
      { name: 'Mexico City', tz: 'America/Mexico_City', code: 'MEX', zone: 'R20 · 29–31 Oct', round: 20, country: 'Mexico City Grand Prix', dates: '29–31 Oct 2027' },
      { name: 'São Paulo', tz: 'America/Sao_Paulo', code: 'SAO', zone: 'R21 · 5–7 Nov', round: 21, country: 'São Paulo Grand Prix', dates: '5–7 Nov 2027' },
      { name: 'Las Vegas', tz: 'America/Los_Angeles', code: 'LAS', zone: 'R22 · 18–20 Nov', round: 22, country: 'Las Vegas Grand Prix', dates: '18–20 Nov 2027' },
      { name: 'Lusail', tz: 'Asia/Qatar', code: 'LUS', zone: 'R23 Qatar · 3–5 Dec', round: 23, country: 'Qatar Grand Prix', dates: '3–5 Dec 2027' },
      { name: 'Abu Dhabi', tz: 'Asia/Dubai', code: 'AUH', zone: 'R24 · 10–12 Dec', round: 24, country: 'Abu Dhabi Grand Prix', dates: '10–12 Dec 2027' },
    ],
  },
];

// Only offered in the "Clock for" menu.
const EXTRA = [
  place('Bangkok', 'Asia/Bangkok'),
  place('Ho Chi Minh City', 'Asia/Ho_Chi_Minh'),
  place('Kuala Lumpur', 'Asia/Kuala_Lumpur'),
  place('Manila', 'Asia/Manila'),
  place('Hong Kong', 'Asia/Hong_Kong'),
  place('Seoul', 'Asia/Seoul'),
  place('Berlin', 'Europe/Berlin'),
  place('Toronto', 'America/Toronto'),
];

// Every selectable place. The first city in a time zone claims its IANA id
// (so #Asia/Tokyo keeps working); additional cities in the same zone get a
// distinct id so selecting them shows their own name on the dial.
const PLACES = new Map();
const PRIMARY_LISTS = LISTS.filter((l) => l.key !== 'f1');
const SECONDARY_LISTS = LISTS.filter((l) => l.key === 'f1');
const ALL_SOURCES = [
  ...PRIMARY_LISTS.flatMap((l) => l.places),
  ...RING.flatMap(([, ...c]) => c),
  ...EXTRA,
  ...SECONDARY_LISTS.flatMap((l) => l.places),
];
for (const p of ALL_SOURCES) {
  const existing = [...PLACES.values()].find((k) => k.tz === p.tz && k.name === p.name);
  if (existing) {
    existing.code ??= p.code;
    p.id = existing.id;
  } else {
    const id = PLACES.has(p.tz) ? `${p.tz}:${p.name}` : p.tz;
    p.id = id;
    PLACES.set(id, { id, name: p.name, tz: p.tz, code: p.code });
  }
}

const $ = (id) => document.getElementById(id);
const dial = $('dial');
const ringGroup = $('ring');
const numeralGroup = $('numerals');
const turnGroup = $('turn');
const cityGroup = $('cities');
const pathDefs = $('paths');
const reader = $('reader');
const secondsHand = $('seconds');
const homeCity = $('home-city');
const homeTime = $('home-time');
const homeSec = $('home-sec');
const homeAmpm = $('home-ampm');
const homeDate = $('home-date');
const homeGmt = $('home-gmt');
const homePhaseIcon = $('home-phase-icon');
const caption = $('caption');
const goHome = $('go-home');
const picker = $('picker');
const panelUtc = $('panel-utc');
const skyToggle = $('sky-toggle');
const skyToggleIcon = $('sky-toggle-icon');
const skyToggleLabel = $('sky-toggle-label');
const planBanner = $('plan-banner');
const planBannerText = $('plan-banner-text');
const planBannerReset = $('plan-banner-reset');
const citySearch = $('city-search');
const searchEmpty = $('search-empty');
const f1Search = $('f1-search');
const f1Empty = $('f1-empty');

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

let format = readFormat();
let ref = PLACES.get(HOME_TZ);
let activeView = 'dial';
let activeFilter = 'all';

/* Inline Celestial Icons (accessible alongside color/text) */

const ICONS = {
  sun: '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1"/></svg>',
  twilight: '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 11.5h12M4.5 11.5a3.5 3.5 0 0 1 7 0M8 4v2M3.8 6.4l1.2 1.2M12.2 6.4L11 7.6"/></svg>',
  moon: '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12.5 10.2A5.2 5.2 0 0 1 5.8 3.5a5.2 5.2 0 1 0 6.7 6.7Z"/></svg>',
};

function phaseFor(hour) {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 5 && h < 7.5) return { key: 'twilight', label: 'Dawn', icon: ICONS.twilight, isNight: false };
  if (h >= 7.5 && h < 17) return { key: 'day', label: 'Daylight', icon: ICONS.sun, isNight: false };
  if (h >= 17 && h < 19.5) return { key: 'twilight', label: 'Dusk', icon: ICONS.twilight, isNight: h >= 18 };
  return { key: 'night', label: 'Night', icon: ICONS.moon, isNight: true };
}

/* Time zone maths */

const partFormats = new Map();

function zoned(tz, date) {
  let fmt = partFormats.get(tz);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    partFormats.set(tz, fmt);
  }
  const p = {};
  for (const { type, value } of fmt.formatToParts(date)) p[type] = Number(value);
  const h = p.hour % 24;
  const wall = Date.UTC(p.year, p.month - 1, p.day, h, p.minute, p.second);
  const instant = Math.floor(date.getTime() / 1000) * 1000;
  return {
    h,
    m: p.minute,
    s: p.second,
    offset: Math.round((wall - instant) / 60000),
    day: p.year * 10000 + p.month * 100 + p.day,
  };
}

const formatters = new Map();

function cachedFormat(key, make) {
  if (!formatters.has(key)) formatters.set(key, make());
  return formatters.get(key);
}

function partOfDay(hour) {
  if (hour < 5) return 'early morning';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

function longDate(tz, date, hour) {
  const fmt = cachedFormat(`date:${tz}`, () => new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, weekday: 'long', day: 'numeric', month: 'long',
  }));
  const p = {};
  for (const { type, value } of fmt.formatToParts(date)) p[type] = value;
  return `${p.weekday} ${partOfDay(hour)}, ${p.day} ${p.month}`;
}

function zoneName(tz, date) {
  const fmt = cachedFormat(`zone:${tz}`, () => new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, timeZoneName: 'long',
  }));
  return fmt.formatToParts(date).find((p) => p.type === 'timeZoneName')?.value ?? tz;
}

// 1 in full daylight, 0 at night, ramping through dawn (5–7) and dusk (17–19).
function daylight(hour) {
  const h = ((hour % 24) + 24) % 24;
  if (h < 5 || h >= 19) return 0;
  if (h >= 7 && h < 17) return 1;
  return h < 7 ? (h - 5) / 2 : (19 - h) / 2;
}

function skyColor(hour) {
  const pct = Math.round(daylight(hour) * 100);
  return `color-mix(in oklab, var(--day) ${pct}%, var(--night))`;
}

function inkFor(hour) {
  const d = daylight(hour);
  if (d === 0.5) return 'on-twilight';
  return d > 0.5 ? 'on-day' : 'on-night';
}

/* Formatting */

const pad = (n) => String(n).padStart(2, '0');

function clockParts(h, m) {
  if (format === '12') {
    return { hm: `${h % 12 || 12}:${pad(m)}`, ampm: h < 12 ? 'AM' : 'PM' };
  }
  return { hm: `${pad(h)}:${pad(m)}`, ampm: '' };
}

function gmtLabel(minutes) {
  if (minutes === 0) return 'GMT';
  const abs = Math.abs(minutes);
  const m = abs % 60;
  return `GMT${minutes < 0 ? '−' : '+'}${Math.floor(abs / 60)}${m ? `:${pad(m)}` : ''}`;
}

function duration(minutes, short = false) {
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const parts = [];
  if (h) parts.push(`${h} ${h === 1 ? 'hour' : 'hours'}`);
  if (m) parts.push(short ? `${m} min` : `${m} ${m === 1 ? 'minute' : 'minutes'}`);
  return parts.join(' ');
}

function describeGap(minutes) {
  if (minutes === 0) return 'same time';
  return `${duration(minutes)} ${minutes > 0 ? 'ahead' : 'behind'}`;
}

const capitalise = (text) => text.charAt(0).toUpperCase() + text.slice(1);

function setText(node, text) {
  if (node && node.textContent !== text) node.textContent = text;
}

/* Settings */

function readFormat() {
  try {
    const saved = localStorage.getItem('world-time:format');
    if (saved === '12' || saved === '24') return saved;
  } catch {}
  return '24';
}

function saveFormat(value) {
  try {
    localStorage.setItem('world-time:format', value);
  } catch {}
}

/* Atmosphere Sky Mode Button */

const SKY_MODES = [
  { id: 'auto', label: 'Solar', icon: ICONS.twilight },
  { id: 'night', label: 'Nocturne', icon: ICONS.moon },
  { id: 'day', label: 'Daylight', icon: ICONS.sun },
];

function renderSkyToggle() {
  const mode = window.getSkyMode ? window.getSkyMode() : 'auto';
  const info = SKY_MODES.find((m) => m.id === mode) ?? SKY_MODES[0];
  skyToggleIcon.innerHTML = info.icon;
  setText(skyToggleLabel, info.label);
  skyToggle.setAttribute('aria-label', `Atmosphere mode: ${info.label}. Click to switch.`);
}

skyToggle.addEventListener('click', () => {
  const current = window.getSkyMode ? window.getSkyMode() : 'auto';
  const idx = SKY_MODES.findIndex((m) => m.id === current);
  const next = SKY_MODES[(idx + 1) % SKY_MODES.length];
  if (window.setSkyMode) window.setSkyMode(next.id, !reduceMotion.matches);
  renderSkyToggle();
});

/* SVG helpers */

function svg(name, attrs, parent) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (parent) parent.append(node);
  return node;
}

function polar(r, deg) {
  const a = (deg * Math.PI) / 180;
  return [r * Math.sin(a), -r * Math.cos(a)];
}

const fixed = (n) => n.toFixed(2);
const wrap180 = (deg) => ((deg % 360) + 540) % 360 - 180;

function radial(r0, r1, deg, attrs, parent) {
  const [x1, y1] = polar(r0, deg);
  const [x2, y2] = polar(r1, deg);
  return svg('line', { x1: fixed(x1), y1: fixed(y1), x2: fixed(x2), y2: fixed(y2), ...attrs }, parent);
}

function sectorPath(r0, r1, a0, a1) {
  const [x0, y0] = polar(r1, a0);
  const [x1, y1] = polar(r1, a1);
  const [x2, y2] = polar(r0, a1);
  const [x3, y3] = polar(r0, a0);
  return `M${fixed(x0)} ${fixed(y0)}A${r1} ${r1} 0 0 1 ${fixed(x1)} ${fixed(y1)}` +
    `L${fixed(x2)} ${fixed(y2)}A${r0} ${r0} 0 0 0 ${fixed(x3)} ${fixed(y3)}Z`;
}

function arcPath(r, a0, a1, clockwise) {
  const [x0, y0] = polar(r, a0);
  const [x1, y1] = polar(r, a1);
  return `M${fixed(x0)} ${fixed(y0)}A${r} ${r} 0 0 ${clockwise ? 1 : 0} ${fixed(x1)} ${fixed(y1)}`;
}

/* Dial finish: guilloché, sunburst, seconds track, cardinal jewels, and slot ticks */

function buildFinish() {
  const guilloche = $('guilloche');
  for (let r = 80; r <= 252; r += 16) {
    svg('circle', { r }, guilloche);
  }

  const sunburst = $('sunburst');
  for (let i = 0; i < 180; i++) radial(44, 260, i * 2, {}, sunburst);

  const track = $('track');
  for (let s = 0; s < 60; s++) {
    if (s % 15 === 0) {
      const [cx, cy] = polar(281, s * 6);
      const deg = s * 6;
      svg('path', {
        d: 'M0 -9 L5.5 0 L0 9 L-5.5 0 Z',
        class: 'cardinal-jewel',
        transform: `translate(${fixed(cx)} ${fixed(cy)}) rotate(${deg})`,
      }, track);
    } else {
      radial(s % 5 ? 280 : 272, 290, s * 6, { class: s % 5 ? '' : 'is-five' }, track);
    }
  }

  for (let q = 0; q < 96; q++) {
    const slotTick = q % 4 === 0;
    radial(slotTick ? 473 : 482, 488, q * 3.75, { class: slotTick ? 'slot-tick' : 'fine-tick' }, turnGroup);
  }
  radial(460, 488, HOME_SLOT * 15, { class: 'home-tick' }, turnGroup);
}

/* The 24-hour celestial ring */

function sunGlyph(parent) {
  const g = svg('g', { class: 'glyph sun' }, parent);
  svg('circle', { r: 7.5 }, g);
  for (let i = 0; i < 8; i++) radial(11.5, 17, i * 45, {}, g);
  return g;
}

function moonGlyph(parent) {
  const g = svg('g', { class: 'glyph moon' }, parent);
  svg('circle', { r: 12, class: 'moon-lit' }, g);
  svg('circle', { r: 10.5, cx: 5.5, cy: -3.5, class: 'moon-shade' }, g);
  return g;
}

function buildRing() {
  for (let q = 0; q < 288; q++) {
    const a0 = q * 1.25;
    svg('path', {
      d: sectorPath(RING_IN, RING_OUT, a0, a0 + 1.25 + 0.16),
      style: `fill: ${skyColor((q + 0.5) / 12)}`,
    }, ringGroup);
  }

  // Delicate engraved gold stars tucked in the midnight arc (hours 20..4)
  const starSpecs = [
    [322, 308, 1.8], [368, 322, 1.4], [318, 338, 1.3], [362, 349, 1.9],
    [326, 12, 1.6], [366, 26, 1.4], [322, 42, 1.7], [364, 54, 1.3],
    [340, 294, 1.4], [338, 66, 1.5],
  ];
  for (const [r, deg, rad] of starSpecs) {
    const [cx, cy] = polar(r, deg);
    svg('circle', { cx: fixed(cx), cy: fixed(cy), r: rad, class: 'ring-star' }, ringGroup);
  }

  for (let half = 0; half < 48; half++) {
    const hour = half / 2;
    const isHalf = half % 2 === 1;
    radial(RING_OUT - (isHalf ? 9 : 16), RING_OUT, hour * 15, {
      class: `tick ${inkFor(hour)}${isHalf ? ' is-half' : ''}`,
    }, ringGroup);
  }

  return Array.from({ length: 24 }, (_, h) => {
    const g = svg('g', {}, numeralGroup);
    if (h === 12) sunGlyph(g);
    else if (h === 0) moonGlyph(g);
    else svg('text', { class: `numeral ${inkFor(h)}` }, g);
    return g;
  });
}

buildFinish();
const numerals = buildRing();

function labelNumerals() {
  numerals.forEach((g, h) => {
    const text = g.querySelector('text');
    if (text) setText(text, format === '12' ? String(h % 12 || 12) : String(h));
  });
}

/* The city ring */

let slots = [];

function buildCityRing() {
  slots = RING.map(([slot]) => {
    const id = `slot-${slot + 12}`;
    const path = svg('path', { id, fill: 'none' }, pathDefs);
    const labels = ['long', 'short'].map((variant) => {
      const text = svg('text', {
        class: `city-label ${variant}${slot === HOME_SLOT ? ' is-home' : ''}`,
        'data-slot': slot,
      }, cityGroup);
      svg('textPath', { href: `#${id}`, startOffset: '50%' }, text);
      return text;
    });
    return { slot, path, labels, bottom: null };
  });
}

function nameSlots(now) {
  const used = new Set([ref.tz]);
  const refOffset = zoned(ref.tz, now).offset;
  let changed = false;
  RING.forEach(([slot, ...candidates], i) => {
    let pick;
    if (slot === HOME_SLOT) pick = candidates[0];
    else if (refOffset === slot * 60 && ref.tz !== HOME_TZ) pick = ref;
    else pick = candidates.find((c) => !used.has(c.tz) && zoned(c.tz, now).offset === slot * 60);
    if (pick) used.add(pick.tz);

    const gmt = gmtLabel(slot * 60);
    const names = [pick ? pick.name : gmt, pick ? (pick.code ?? pick.name.slice(0, 3).toUpperCase()) : gmt];
    slots[i].labels.forEach((label, j) => {
      if (label.firstChild.textContent !== names[j]) {
        label.firstChild.textContent = names[j];
        changed = true;
      }
      if (pick) label.dataset.tz = pick.id;
      else delete label.dataset.tz;
    });
  });
  if (changed) fitCityLabels();
}

function layoutCityRing() {
  for (const s of slots) {
    const angle = wrap180(s.slot * 15 + dialTurn);
    const bottom = Math.abs(angle) > 90;
    const d = bottom
      ? arcPath(CITY_R_BOTTOM, angle + 14, angle - 14, false)
      : arcPath(CITY_R_TOP, angle - 14, angle + 14, true);
    s.path.setAttribute('d', d);
  }
}

function fitCityLabels() {
  if (activeView !== 'dial') return;
  const room = (2 * Math.PI * CITY_R_TOP * 13) / 360;
  for (const label of cityGroup.querySelectorAll('.city-label.long')) {
    const onPath = label.firstChild;
    onPath.removeAttribute('textLength');
    try {
      if (label.getComputedTextLength() > room) {
        onPath.setAttribute('textLength', fixed(room));
        onPath.setAttribute('lengthAdjust', 'spacingAndGlyphs');
      }
    } catch {}
  }
}

/* Turning the dial */

let utcAngle = 0;
let dialTurn = 0;
let wind = 0;
let turning = false;

function drawDial() {
  const r = dialTurn - utcAngle + wind;
  ringGroup.setAttribute('transform', `rotate(${fixed(r)})`);
  numerals.forEach((g, h) => {
    const [x, y] = polar(NUMERAL_R, h * 15 + r);
    g.setAttribute('transform', `translate(${fixed(x)} ${fixed(y)})`);
  });
  turnGroup.setAttribute('transform', `rotate(${fixed(dialTurn)})`);
}

const turnFor = (offsetMinutes) => -offsetMinutes / 4;

function turnTo(target, animate) {
  const from = dialTurn;
  const delta = wrap180(target - from);
  if (!animate || reduceMotion.matches || Math.abs(delta) < 0.01) {
    dialTurn = from + delta;
    drawDial();
    layoutCityRing();
    return;
  }
  turning = true;
  reader.style.transition = 'none';
  const start = performance.now();
  const length = 650 + Math.abs(delta) * 2.5;
  const frame = (t) => {
    const k = Math.min(1, (t - start) / length);
    const c = 1.4;
    const eased = 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2;
    dialTurn = from + delta * eased;
    drawDial();
    layoutCityRing();
    if (reading) placeReader();
    if (k < 1) {
      requestAnimationFrame(frame);
    } else {
      turning = false;
      reader.style.transition = '';
    }
  };
  requestAnimationFrame(frame);
}

/* The reading caliper */

let readerAngle = 0;
let reading = null;
let clearTimer = 0;

function placeReader() {
  const target = wrap180(reading.offset / 4 + dialTurn);
  readerAngle += wrap180(target - readerAngle);
  reader.style.transform = `rotate(${fixed(readerAngle)}deg)`;
}

function showOnDial(p) {
  clearTimeout(clearTimer);
  if (p.id === ref.id) {
    reading = null;
    clearDial(true);
    return;
  }
  if (!dial.classList.contains('is-reading')) {
    reader.style.transition = 'none';
    reader.style.transform = 'rotate(0deg)';
    readerAngle = 0;
    reader.getBoundingClientRect();
    reader.style.transition = '';
  }
  reading = p;
  placeReader();
  dial.classList.add('is-reading');
  const slot = p.offset / 60;
  for (const label of cityGroup.querySelectorAll('.city-label')) {
    label.classList.toggle('is-target', Number(label.dataset.slot) === slot);
  }
}

function clearDial(now = false) {
  clearTimeout(clearTimer);
  const clear = () => {
    dial.classList.remove('is-reading');
    for (const label of cityGroup.querySelectorAll('.is-target')) label.classList.remove('is-target');
  };
  if (now) clear();
  else clearTimer = setTimeout(clear, 150);
}

/* Observatory Panel Lists (Dial View) */

const placeByRow = new Map();

function buildLists() {
  for (const list of LISTS) {
    for (const p of list.places) {
      const item = document.createElement('li');
      const row = document.createElement('button');
      row.type = 'button';
      row.className = `city${p.tz === HOME_TZ ? ' is-home' : ''}`;
      row.innerHTML =
        '<span class="swatch" aria-hidden="true"></span>' +
        '<span class="city-name"></span>' +
        '<span class="city-time"><span class="hm"></span><span class="ampm"></span></span>' +
        '<span class="city-gap"></span>';
      row.querySelector('.city-name').textContent = p.name;
      item.append(row);
      placeByRow.set(row, p);
      Object.assign(p, {
        item,
        row,
        swatch: row.querySelector('.swatch'),
        hm: row.querySelector('.hm'),
        ampm: row.querySelector('.ampm'),
        gap: row.querySelector('.city-gap'),
        searchBlob: `${p.name} ${p.zone ?? ''} ${p.country ?? ''} ${p.code ?? ''}`.toLowerCase(),
      });

      const hide = () => {
        if (reading !== p) return;
        const focused = placeByRow.get(document.activeElement);
        if (focused && focused !== p) {
          showOnDial(focused);
        } else {
          reading = null;
          clearDial();
        }
      };
      row.addEventListener('pointerenter', () => showOnDial(p));
      row.addEventListener('focus', () => showOnDial(p));
      row.addEventListener('pointerleave', () => {
        if (document.activeElement !== row) hide();
      });
      row.addEventListener('blur', hide);
      row.addEventListener('click', () => selectPlace(p.id));
      list.el.append(item);
    }
  }
}

function applyPanelFilters() {
  const query = citySearch.value.trim().toLowerCase();
  let totalVisible = 0;

  for (const list of LISTS) {
    const groupEl = document.querySelector(`.city-group[data-group="${list.key}"]`);
    const groupAllowed = activeFilter === 'all' || activeFilter === list.key;
    let visibleInGroup = 0;

    for (const p of list.places) {
      const match = groupAllowed && (!query || p.searchBlob.includes(query));
      p.item.hidden = !match;
      if (match) visibleInGroup++;
    }

    groupEl.hidden = visibleInGroup === 0;
    const countBadge = groupEl.querySelector('.group-count');
    if (countBadge) setText(countBadge, String(visibleInGroup));
    totalVisible += visibleInGroup;
  }

  searchEmpty.hidden = totalVisible > 0;
}

citySearch.addEventListener('input', applyPanelFilters);
for (const pill of document.querySelectorAll('.filter-pill')) {
  pill.addEventListener('click', () => {
    activeFilter = pill.dataset.filter;
    for (const btn of document.querySelectorAll('.filter-pill')) {
      const active = btn === pill;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    }
    applyPanelFilters();
  });
}

function renderLists(now, refZone) {
  for (const list of LISTS) {
    for (const p of list.places) {
      const z = zoned(p.tz, now);
      p.offset = z.offset;
      const localHour = z.h + z.m / 60;
      const phase = phaseFor(localHour);
      const { hm, ampm } = clockParts(z.h, z.m);
      setText(p.hm, hm);
      setText(p.ampm, ampm);
      p.swatch.style.background = skyColor(localHour);
      p.swatch.classList.toggle('is-night', phase.isNight);
      if (p.swatch.dataset.phase !== phase.key) {
        p.swatch.dataset.phase = phase.key;
        p.swatch.innerHTML = phase.icon;
      }

      const selected = p.id === ref.id;
      p.row.setAttribute('aria-pressed', String(selected));
      let text;
      if (selected) {
        text = 'Active on the timepiece';
      } else {
        const parts = [];
        if (p.zone) parts.push(p.zone);
        if (z.day > refZone.day) parts.push('tomorrow');
        if (z.day < refZone.day) parts.push('yesterday');
        parts.push(describeGap(z.offset - refZone.offset));
        text = capitalise(parts.join(' · '));
      }
      setText(p.gap, text);
    }

    if (list.sort !== false) {
      const sorted = [...list.places].sort((a, b) => b.offset - a.offset);
      if (sorted.some((p, i) => list.el.children[i] !== p.item)) {
        list.el.append(...sorted.map((p) => p.item));
      }
    }
  }
  if (reading) showOnDial(reading);
}

/* ==========================================================================
   PAGE 2: WORLD ATLAS GALLERY CARDS
   ========================================================================== */

const atlasIndonesiaEl = $('atlas-indonesia');
const atlasWorldEl = $('atlas-world');
const atlasSummary = $('atlas-summary');
const atlasRefCity = $('atlas-ref-city');
const atlasRefTime = $('atlas-ref-time');
const atlasCards = [];

function createAtlasCard(p, container) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = `atlas-card${p.tz === HOME_TZ ? ' is-home' : ''}`;
  card.innerHTML =
    '<div class="atlas-sky-band">' +
      '<span class="atlas-phase"><span class="atlas-phase-icon" aria-hidden="true"></span><span class="atlas-phase-label"></span></span>' +
      '<span class="atlas-gmt"></span>' +
    '</div>' +
    '<div class="atlas-body">' +
      '<div class="atlas-top-row">' +
        '<span class="atlas-city"></span>' +
        '<span class="atlas-zone-tag"></span>' +
      '</div>' +
      '<div class="atlas-clock"><span class="atlas-hm"></span><span class="atlas-ampm"></span></div>' +
      '<div class="atlas-solar-bar" aria-hidden="true"><span class="atlas-solar-dot"></span></div>' +
      '<div class="atlas-foot">' +
        '<span class="atlas-gap"></span>' +
        '<span class="atlas-cta">Set dial →</span>' +
      '</div>' +
    '</div>';

  card.querySelector('.atlas-city').textContent = p.name;
  const tag = card.querySelector('.atlas-zone-tag');
  if (p.zone || p.country) tag.textContent = p.zone ?? p.country;
  else tag.hidden = true;

  card.addEventListener('click', () => {
    selectPlace(p.id, true);
    switchView('dial');
  });

  container.append(card);
  atlasCards.push({
    p,
    container,
    card,
    band: card.querySelector('.atlas-sky-band'),
    phaseIcon: card.querySelector('.atlas-phase-icon'),
    phaseLabel: card.querySelector('.atlas-phase-label'),
    gmt: card.querySelector('.atlas-gmt'),
    hm: card.querySelector('.atlas-hm'),
    ampm: card.querySelector('.atlas-ampm'),
    solarBar: card.querySelector('.atlas-solar-bar'),
    gap: card.querySelector('.atlas-gap'),
    cta: card.querySelector('.atlas-cta'),
  });
}

function buildAtlas() {
  const idList = LISTS.find((l) => l.key === 'indonesia');
  const worldList = LISTS.find((l) => l.key === 'world');
  for (const p of idList.places) createAtlasCard(p, atlasIndonesiaEl);
  for (const p of worldList.places) createAtlasCard(p, atlasWorldEl);
}

function renderAtlas(now, refZone) {
  setText(atlasSummary, `Every destination illuminated by its real-time local sky, measured against ${ref.name}.`);
  setText(atlasRefCity, `${ref.name} · ${gmtLabel(refZone.offset)}`);
  const refParts = clockParts(refZone.h, refZone.m);
  setText(atlasRefTime, `${refParts.hm}${refParts.ampm ? ` ${refParts.ampm}` : ''}`);

  for (const entry of atlasCards) {
    const { p, card, band, phaseIcon, phaseLabel, gmt, hm, ampm, solarBar, gap, cta } = entry;
    const z = zoned(p.tz, now);
    const localHour = z.h + z.m / 60;
    const phase = phaseFor(localHour);
    const time = clockParts(z.h, z.m);

    setText(hm, time.hm);
    setText(ampm, time.ampm);
    setText(gmt, gmtLabel(z.offset));
    setText(phaseLabel, `${capitalise(partOfDay(z.h))}`);
    if (phaseIcon.dataset.phase !== phase.key) {
      phaseIcon.dataset.phase = phase.key;
      phaseIcon.innerHTML = phase.icon;
    }

    // Live OKLab local sky wash for each city card's header band
    if (window.skyColorsForHour) {
      const sky = window.skyColorsForHour(localHour);
      card.style.setProperty('--card-sky-top', sky.top);
      card.style.setProperty('--card-sky-bottom', sky.bottom);
      card.style.setProperty('--card-sky-ink', sky.isNight ? '#eef2fb' : '#16213a');
      band.classList.toggle('is-light', !sky.isNight);
    }

    solarBar.style.setProperty('--solar-pct', `${((localHour / 24) * 100).toFixed(1)}%`);

    const selected = p.id === ref.id;
    card.classList.toggle('is-selected', selected);
    setText(cta, selected ? 'Active dial' : 'Set dial →');

    if (selected) {
      setText(gap, 'Current reference meridian');
    } else {
      const parts = [];
      if (z.day > refZone.day) parts.push('Tomorrow');
      else if (z.day < refZone.day) parts.push('Yesterday');
      else parts.push('Today');
      parts.push(describeGap(z.offset - refZone.offset));
      setText(gap, parts.join(' · '));
    }
  }

  // Sort world cards furthest ahead first
  const worldEntries = atlasCards
    .filter((e) => e.container === atlasWorldEl)
    .sort((a, b) => b.p.offset - a.p.offset);
  if (worldEntries.some((e, i) => atlasWorldEl.children[i] !== e.card)) {
    atlasWorldEl.append(...worldEntries.map((e) => e.card));
  }
}

/* ==========================================================================
   PAGE 3: FORMULA 1 2027 GRAND PRIX CHRONOMETER
   ========================================================================== */

const f1GridEl = $('f1-grid');
const f1Summary = $('f1-summary');
const f1Cards = [];

function buildF1() {
  const f1List = LISTS.find((l) => l.key === 'f1');
  for (const p of f1List.places) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'f1-card';
    card.innerHTML =
      '<div class="f1-top">' +
        `<span class="f1-round">Round ${pad(p.round)}</span>` +
        `<span class="f1-date">${p.dates}</span>` +
      '</div>' +
      '<div class="f1-main">' +
        '<div>' +
          `<div class="f1-circuit">${p.name}</div>` +
          `<div class="f1-country">${p.country}</div>` +
        '</div>' +
        `<span class="f1-code">${p.code}</span>` +
      '</div>' +
      '<div class="f1-time-row">' +
        '<div class="f1-clock"><span class="f1-hm"></span><span class="f1-ampm"></span></div>' +
        '<span class="f1-phase-pill"><span class="f1-phase-icon" aria-hidden="true"></span><span class="f1-phase-text"></span></span>' +
      '</div>' +
      '<div class="f1-gap"></div>';

    card.addEventListener('click', () => {
      selectPlace(p.id, true);
      switchView('dial');
    });

    f1GridEl.append(card);
    f1Cards.push({
      p,
      card,
      hm: card.querySelector('.f1-hm'),
      ampm: card.querySelector('.f1-ampm'),
      phaseIcon: card.querySelector('.f1-phase-icon'),
      phaseText: card.querySelector('.f1-phase-text'),
      gap: card.querySelector('.f1-gap'),
      searchBlob: `r${p.round} round ${pad(p.round)} ${p.name} ${p.country} ${p.dates} ${p.code}`.toLowerCase(),
    });
  }
}

function applyF1Filter() {
  const query = f1Search.value.trim().toLowerCase();
  let visible = 0;
  for (const entry of f1Cards) {
    const match = !query || entry.searchBlob.includes(query);
    entry.card.hidden = !match;
    if (match) visible++;
  }
  f1Empty.hidden = visible > 0;
}

f1Search.addEventListener('input', applyF1Filter);

function renderF1(now, refZone) {
  setText(f1Summary, `24 Grands Prix from Sakhir to Abu Dhabi — live local paddock time compared with ${ref.name}.`);

  for (const entry of f1Cards) {
    const { p, card, hm, ampm, phaseIcon, phaseText, gap } = entry;
    const z = zoned(p.tz, now);
    const localHour = z.h + z.m / 60;
    const phase = phaseFor(localHour);
    const time = clockParts(z.h, z.m);

    setText(hm, time.hm);
    setText(ampm, time.ampm);
    setText(phaseText, `${phase.label} · ${gmtLabel(z.offset)}`);
    if (phaseIcon.dataset.phase !== phase.key) {
      phaseIcon.dataset.phase = phase.key;
      phaseIcon.innerHTML = phase.icon;
    }

    if (window.skyColorsForHour) {
      const sky = window.skyColorsForHour(localHour);
      card.style.setProperty('--card-sky-top', sky.top);
      card.style.setProperty('--card-sky-bottom', sky.bottom);
    }

    const selected = p.id === ref.id;
    card.classList.toggle('is-selected', selected);

    if (selected) {
      setText(gap, 'Active on timepiece · Click to return to dial');
    } else {
      const parts = [];
      if (z.day > refZone.day) parts.push('Tomorrow');
      else if (z.day < refZone.day) parts.push('Yesterday');
      parts.push(`${describeGap(z.offset - refZone.offset)} vs ${ref.name}`);
      setText(gap, capitalise(parts.join(' · ')));
    }
  }
}

/* ==========================================================================
   PAGE NAVIGATION (DIAL / ATLAS / F1 2027)
   ========================================================================== */

const VIEW_ELS = {
  dial: $('view-dial'),
  atlas: $('view-atlas'),
  f1: $('view-f1'),
};

function applyView(viewName) {
  activeView = viewName;
  for (const [key, el] of Object.entries(VIEW_ELS)) {
    el.hidden = key !== viewName;
  }
  for (const btn of document.querySelectorAll('.nav-tab')) {
    if (btn.dataset.view === viewName) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  }
  updatePlanBanner();
  if (viewName === 'dial') {
    requestAnimationFrame(fitCityLabels);
  }
  window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'instant' : 'smooth' });
}

function switchView(viewName) {
  if (viewName === activeView || !VIEW_ELS[viewName]) return;
  if (!reduceMotion.matches && document.startViewTransition) {
    document.startViewTransition(() => applyView(viewName));
  } else {
    applyView(viewName);
  }
}

for (const btn of document.querySelectorAll('.nav-tab')) {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
}

/* The "Clock for" menu */

let pickerSignature = '';

function renderPicker(now) {
  const entries = [...PLACES.values()]
    .map((p) => ({ ...p, offset: zoned(p.tz, now).offset }))
    .sort((a, b) => b.offset - a.offset || a.name.localeCompare(b.name));
  const signature = entries.map((e) => `${e.id}${e.offset}`).join('|');
  if (signature !== pickerSignature) {
    pickerSignature = signature;
    picker.replaceChildren(...entries.map((e) => new Option(`${e.name} (${gmtLabel(e.offset)})`, e.id)));
  }
  picker.value = ref.id;
}

/* The selected city */

function renderCaption(now, refZone) {
  const away = ref.tz !== HOME_TZ;
  document.body.classList.toggle('is-away', away);
  goHome.hidden = !away;
  homeCity.classList.toggle('is-home', !away);
  setText(homeCity, ref.name);
  setText(homeGmt, gmtLabel(refZone.offset));

  const phase = phaseFor(refZone.h + refZone.m / 60);
  if (homePhaseIcon.dataset.phase !== phase.key) {
    homePhaseIcon.dataset.phase = phase.key;
    homePhaseIcon.innerHTML = phase.icon;
  }

  if (!away) {
    setText(caption, 'Western Indonesia Time (WIB), GMT+7. Bangkok, Hanoi and Phnom Penh share this time.');
    return;
  }
  const gap = refZone.offset - zoned(HOME_TZ, now).offset;
  const relation = gap === 0
    ? 'Same time as Jakarta.'
    : `${capitalise(duration(gap))} ${gap > 0 ? 'ahead of' : 'behind'} Jakarta.`;
  setText(caption, `${zoneName(ref.tz, now)}, ${gmtLabel(refZone.offset)}. ${relation}`);
}

function renderHome(refZone, now) {
  const { hm, ampm } = clockParts(refZone.h, refZone.m);
  setText(homeTime, hm);
  homeTime.dateTime = `${pad(refZone.h)}:${pad(refZone.m)}:${pad(refZone.s)}`;
  setText(homeSec, pad(refZone.s));
  setText(homeAmpm, ampm);
  homeAmpm.hidden = !ampm;

  const utcH = pad(now.getUTCHours());
  const utcM = pad(now.getUTCMinutes());
  setText(panelUtc, `UTC ${utcH}:${utcM}`);

  if (!planShift) document.title = `${hm}${ampm ? ` ${ampm}` : ''} in ${ref.name} · World Time`;
}

function selectPlace(id, animate = true) {
  const next = PLACES.get(id);
  if (!next || next === ref) return;
  ref = next;
  try {
    const hash = `#${id.replace(/ /g, '%20')}`;
    history.replaceState(null, '', id === HOME_TZ ? location.pathname + location.search : hash);
  } catch {}
  if (reading && reading.id === id) {
    reading = null;
    clearDial(true);
  }
  const now = clockNow();
  turnTo(turnFor(zoned(ref.tz, now).offset), animate);
  renderPlan();
  render(now, true);
}

picker.addEventListener('change', () => selectPlace(picker.value));
goHome.addEventListener('click', () => selectPlace(HOME_TZ));
cityGroup.addEventListener('click', (event) => {
  const label = event.target.closest('[data-tz]');
  if (label) selectPlace(label.dataset.tz);
});

/* The seconds track */

let secondsAngle = 0;
let lastSecond = null;

function tickSeconds(s) {
  if (lastSecond === null) {
    secondsAngle = s * 6;
    secondsHand.style.transition = 'none';
  } else if (s !== lastSecond) {
    secondsAngle += (((s - lastSecond) % 60) + 60) % 60 * 6;
    secondsHand.style.transition = '';
  }
  lastSecond = s;
  secondsHand.style.transform = `rotate(${secondsAngle}deg)`;
}

/* Plan a time (Time Travel Scrubber + Presets) */

const QUARTER_HOUR = 15 * 60000;
const planInput = $('plan');
const planOut = $('plan-out');
const planReset = $('plan-reset');
let planShift = 0;

function clockNow() {
  const now = Date.now();
  if (!planShift) return new Date(now);
  return new Date(Math.floor(now / QUARTER_HOUR) * QUARTER_HOUR + planShift * 60000);
}

function updatePlanBanner() {
  planBanner.hidden = !planShift || activeView === 'dial';
}

function renderPlan() {
  const planning = planShift !== 0;
  document.body.classList.toggle('is-planning', planning);
  planReset.hidden = !planning;
  updatePlanBanner();

  for (const chip of document.querySelectorAll('.preset-chip')) {
    chip.classList.toggle('is-active', Number(chip.dataset.shift) === planShift);
  }

  if (!planning) {
    planOut.textContent = 'Showing live time';
    planInput.setAttribute('aria-valuetext', 'Now');
    return;
  }
  const z = zoned(ref.tz, clockNow());
  const { hm, ampm } = clockParts(z.h, z.m);
  const when = planShift > 0 ? `in ${duration(planShift, true)}` : `${duration(planShift, true)} ago`;
  const text = `${hm}${ampm ? ` ${ampm}` : ''} in ${ref.name} · ${when}`;
  planOut.textContent = text;
  planBannerText.textContent = `Time travel preview: ${text}`;
  planInput.setAttribute('aria-valuetext', text);
}

let sliding = false;

function setPlan(minutes, fromSlider = false) {
  planShift = minutes;
  planInput.value = String(minutes);
  renderPlan();
  sliding = fromSlider;
  render(clockNow(), true);
  sliding = false;
}

planInput.addEventListener('input', () => setPlan(Number(planInput.value), true));
planReset.addEventListener('click', () => {
  setPlan(0);
  planInput.focus();
});
planBannerReset.addEventListener('click', () => setPlan(0));
planInput.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && planShift) setPlan(0);
});
for (const chip of document.querySelectorAll('.preset-chip')) {
  chip.addEventListener('click', () => setPlan(Number(chip.dataset.shift)));
}

/* Main Clock Loop */

let lastMinute = -1;

function render(now, force = false) {
  const refZone = zoned(ref.tz, now);
  const minute = Math.floor(now.getTime() / 60000);
  if (force || minute !== lastMinute) {
    lastMinute = minute;
    homeDate.textContent = longDate(ref.tz, now, refZone.h);
    paintSky(refZone.h + refZone.m / 60, !reduceMotion.matches, !sliding);
    nameSlots(now);
    renderLists(now, refZone);
    renderAtlas(now, refZone);
    renderF1(now, refZone);
    renderCaption(now, refZone);
    renderPicker(now);
    const target = turnFor(refZone.offset);
    if (!turning && Math.abs(wrap180(target - dialTurn)) > 0.01) turnTo(target, false);
  }
  renderHome(refZone, now);
  tickSeconds(refZone.s);
  utcAngle = ((Math.floor(now.getTime() / 1000) / 240) % 360 + 360) % 360;
  if (!turning) drawDial();
}

function tick() {
  render(clockNow());
  setTimeout(tick, 1000 - (Date.now() % 1000) + 10);
}

function intro() {
  if (reduceMotion.matches) return;
  const start = performance.now();
  const length = 1600;
  wind = 150;
  const frame = (t) => {
    const k = Math.min(1, (t - start) / length);
    wind = 150 * (1 - k) ** 4;
    if (!turning) drawDial();
    if (k < 1) requestAnimationFrame(frame);
  };
  drawDial();
  requestAnimationFrame(frame);
}

for (const input of document.querySelectorAll('input[name="format"]')) {
  input.checked = input.value === format;
  input.addEventListener('change', () => {
    format = input.value;
    saveFormat(format);
    labelNumerals();
    renderPlan();
    render(clockNow(), true);
  });
}

buildCityRing();
buildLists();
buildAtlas();
buildF1();
labelNumerals();
renderSkyToggle();

const linked = decodeURIComponent(location.hash.slice(1));
if (PLACES.has(linked)) ref = PLACES.get(linked);
const initialView = new URLSearchParams(location.search).get('view');
if (initialView && VIEW_ELS[initialView]) applyView(initialView);
dialTurn = turnFor(zoned(ref.tz, new Date()).offset);
layoutCityRing();
render(new Date(), true);
intro();
tick();

window.addEventListener('hashchange', () => {
  const tz = decodeURIComponent(location.hash.slice(1)) || HOME_TZ;
  if (PLACES.has(tz)) selectPlace(tz);
});

document.fonts?.ready.then(fitCityLabels);
new ResizeObserver(fitCityLabels).observe(dial);
