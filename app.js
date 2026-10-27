'use strict';

const SVG_NS = 'http://www.w3.org/2000/svg';
const HOME_TZ = 'Asia/Jakarta';
const HOME_SLOT = 7; // GMT+7, marked in red wherever the dial is turned

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
    el: document.getElementById('list-indonesia'),
    places: [
      { name: 'Jakarta', tz: HOME_TZ, zone: 'WIB' },
      { name: 'Makassar', tz: 'Asia/Makassar', zone: 'WITA' },
      { name: 'Jayapura', tz: 'Asia/Jayapura', zone: 'WIT' },
    ],
  },
  {
    el: document.getElementById('list-world'),
    places: [
      { name: 'Tokyo', tz: 'Asia/Tokyo' },
      { name: 'Sydney', tz: 'Australia/Sydney' },
      { name: 'Delhi', tz: 'Asia/Kolkata' },
      { name: 'Mecca', tz: 'Asia/Riyadh' },
      { name: 'Amsterdam', tz: 'Europe/Amsterdam' },
      { name: 'London', tz: 'Europe/London' },
      { name: 'New York', tz: 'America/New_York' },
      { name: 'Los Angeles', tz: 'America/Los_Angeles' },
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

// Every selectable place, one per time zone.
const PLACES = new Map();
for (const p of [...LISTS.flatMap((l) => l.places), ...RING.flatMap(([, ...c]) => c), ...EXTRA]) {
  const known = PLACES.get(p.tz);
  if (!known) PLACES.set(p.tz, { name: p.name, tz: p.tz, code: p.code });
  else known.code ??= p.code;
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
const caption = $('caption');
const goHome = $('go-home');
const picker = $('picker');

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
// const reduceMotion = { matches: false };

let format = readFormat();
let ref = PLACES.get(HOME_TZ); // the place the clock is set to

/* Time zone maths */

const partFormats = new Map();

// Wall-clock fields for a zone, plus its offset from UTC in minutes.
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

// "Tuesday evening, 27 October": the words back up what the sky shows.
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

// Which ink reads on the ring at this hour. Mid-twilight gets its own token
// because the best choice there differs between light and dark themes.
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
  if (node.textContent !== text) node.textContent = text;
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

/* SVG helpers */

function svg(name, attrs, parent) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (parent) parent.append(node);
  return node;
}

// Degrees measured clockwise from 12 o'clock.
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

/* Dial finish: sunburst, seconds track and slot ticks. Built once. */

function buildFinish() {
  const sunburst = $('sunburst');
  for (let i = 0; i < 180; i++) radial(36, 262, i * 2, {}, sunburst);

  const track = $('track');
  for (let s = 0; s < 60; s++) {
    radial(s % 5 ? 280 : 272, 290, s * 6, { class: s % 5 ? '' : 'is-five' }, track);
  }

  // Ticks on the outer edge line up with the city slots and turn with them.
  for (let q = 0; q < 96; q++) {
    const slotTick = q % 4 === 0;
    radial(slotTick ? 474 : 484, 491, q * 3.75, { class: slotTick ? 'slot-tick' : 'fine-tick' }, turnGroup);
  }
  radial(462, 491, HOME_SLOT * 15, { class: 'home-tick' }, turnGroup);
}

/* The 24-hour ring */

function sunGlyph(parent) {
  const g = svg('g', { class: 'glyph sun' }, parent);
  svg('circle', { r: 7.5 }, g);
  for (let i = 0; i < 8; i++) radial(11.5, 17, i * 45, {}, g);
  return g;
}

function moonGlyph(parent) {
  const g = svg('g', { class: 'glyph moon' }, parent);
  svg('circle', { r: 12, class: 'moon-lit' }, g);
  svg('circle', { r: 10.5, cx: 6, cy: -4, class: 'moon-shade' }, g);
  return g;
}

function buildRing() {
  // Five-minute slices keep dawn and dusk smooth.
  for (let q = 0; q < 288; q++) {
    const a0 = q * 1.25;
    svg('path', {
      d: sectorPath(RING_IN, RING_OUT, a0, a0 + 1.25 + 0.15),
      style: `fill: ${skyColor((q + 0.5) / 12)}`,
    }, ringGroup);
  }
  for (let half = 0; half < 48; half++) {
    const hour = half / 2;
    const isHalf = half % 2 === 1;
    radial(RING_OUT - (isHalf ? 9 : 16), RING_OUT, hour * 15, {
      class: `tick ${inkFor(hour)}${isHalf ? ' is-half' : ''}`,
    }, ringGroup);
  }
  // Noon and midnight get a sun and a moon, as on a watchmaker's world timer.
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

// Build the 24 slot labels once; names are filled in by nameSlots().
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

// Pick a city for every slot. The selected city takes its own slot,
// except Jakarta's, which always stays Jakarta.
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
      if (pick) label.dataset.tz = pick.tz;
      else delete label.dataset.tz;
    });
  });
  if (changed) fitCityLabels();
}

// Lay the labels along the rim for the current turn of the dial, keeping
// every name upright: top-half names sit on a clockwise arc, bottom-half
// names on an anticlockwise one.
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

// Squeeze any name that would spill past its 15° slot.
function fitCityLabels() {
  const room = (2 * Math.PI * CITY_R_TOP * 13) / 360;
  for (const label of cityGroup.querySelectorAll('.city-label.long')) {
    const onPath = label.firstChild;
    onPath.removeAttribute('textLength');
    if (label.getComputedTextLength() > room) {
      onPath.setAttribute('textLength', fixed(room));
      onPath.setAttribute('lengthAdjust', 'spacingAndGlyphs');
    }
  }
}

/* Turning the dial */

let utcAngle = 0; // UTC time of day as degrees on the 24-hour ring
let dialTurn = 0; // rotation that brings the selected city to 12 o'clock
let wind = 0; // extra turn of the 24-hour ring during the opening animation
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

// Turn the whole dial so the selected city comes to 12 o'clock, with a small
// overshoot as it settles, like a bezel clicking into place.
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

/* The reading line */

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
  if (p.tz === ref.tz) {
    reading = null;
    clearDial(true);
    return;
  }
  if (!dial.classList.contains('is-reading')) {
    // Swing out from 12 o'clock each time, so the gap is visible as movement.
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

// Deferred so sliding from one row to the next keeps the line moving
// instead of snapping back to 12 o'clock in between.
function clearDial(now = false) {
  clearTimeout(clearTimer);
  const clear = () => {
    dial.classList.remove('is-reading');
    for (const label of cityGroup.querySelectorAll('.is-target')) label.classList.remove('is-target');
  };
  if (now) clear();
  else clearTimer = setTimeout(clear, 150);
}

/* City lists */

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
      row.addEventListener('click', () => selectPlace(p.tz));
      list.el.append(item);
    }
  }
}

function renderLists(now, refZone) {
  for (const list of LISTS) {
    for (const p of list.places) {
      const z = zoned(p.tz, now);
      p.offset = z.offset;
      const { hm, ampm } = clockParts(z.h, z.m);
      setText(p.hm, hm);
      setText(p.ampm, ampm);
      p.swatch.style.background = skyColor(z.h + z.m / 60);

      const selected = p.tz === ref.tz;
      p.row.setAttribute('aria-pressed', String(selected));
      let text;
      if (selected) {
        text = 'Shown on the dial';
      } else {
        const parts = [];
        if (p.zone) parts.push(p.zone);
        if (z.day > refZone.day) parts.push('tomorrow');
        if (z.day < refZone.day) parts.push('yesterday');
        parts.push(describeGap(z.offset - refZone.offset));
        text = capitalise(parts.join(', '));
      }
      setText(p.gap, text);
    }

    // Furthest ahead first; only touch the DOM when the order actually changes.
    const sorted = [...list.places].sort((a, b) => b.offset - a.offset);
    if (sorted.some((p, i) => list.el.children[i] !== p.item)) {
      list.el.append(...sorted.map((p) => p.item));
    }
  }
  if (reading) showOnDial(reading);
}

/* The "Clock for" menu */

let pickerSignature = '';

function renderPicker(now) {
  const entries = [...PLACES.values()]
    .map((p) => ({ ...p, offset: zoned(p.tz, now).offset }))
    .sort((a, b) => b.offset - a.offset || a.name.localeCompare(b.name));
  const signature = entries.map((e) => `${e.tz}${e.offset}`).join('|');
  if (signature !== pickerSignature) {
    pickerSignature = signature;
    picker.replaceChildren(...entries.map((e) => new Option(`${e.name} (${gmtLabel(e.offset)})`, e.tz)));
  }
  picker.value = ref.tz;
}

/* The selected city */

function renderCaption(now, refZone) {
  const away = ref.tz !== HOME_TZ;
  document.body.classList.toggle('is-away', away);
  goHome.hidden = !away;
  homeCity.classList.toggle('is-home', !away);
  setText(homeCity, ref.name);
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

function renderHome(refZone) {
  const { hm, ampm } = clockParts(refZone.h, refZone.m);
  setText(homeTime, hm);
  homeTime.dateTime = `${pad(refZone.h)}:${pad(refZone.m)}:${pad(refZone.s)}`;
  setText(homeSec, pad(refZone.s));
  setText(homeAmpm, ampm);
  homeAmpm.hidden = !ampm;
  if (!planShift) document.title = `${hm}${ampm ? ` ${ampm}` : ''} in ${ref.name}`;
}

function selectPlace(tz, animate = true) {
  const next = PLACES.get(tz);
  if (!next || next === ref) return;
  ref = next;
  try {
    history.replaceState(null, '', tz === HOME_TZ ? location.pathname + location.search : `#${tz}`);
  } catch {}
  if (reading && reading.tz === tz) {
    reading = null;
    clearDial(true);
  }
  // Start the turn first, so render() doesn't snap the dial there instead.
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

// The pointer only ever moves forward, so the tick never spins backwards at :00.
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

/* Plan a time */

const QUARTER_HOUR = 15 * 60000;
const planInput = $('plan');
const planOut = $('plan-out');
const planReset = $('plan-reset');
let planShift = 0; // minutes from now; 0 means the live clock

// A planned time starts from the current quarter hour so it lands on round times.
function clockNow() {
  const now = Date.now();
  if (!planShift) return new Date(now);
  return new Date(Math.floor(now / QUARTER_HOUR) * QUARTER_HOUR + planShift * 60000);
}

function renderPlan() {
  const planning = planShift !== 0;
  document.body.classList.toggle('is-planning', planning);
  planReset.hidden = !planning;
  if (!planning) {
    planOut.textContent = 'Showing now';
    planInput.setAttribute('aria-valuetext', 'Now');
    return;
  }
  const z = zoned(ref.tz, clockNow());
  const { hm, ampm } = clockParts(z.h, z.m);
  const when = planShift > 0 ? `in ${duration(planShift, true)}` : `${duration(planShift, true)} ago`;
  const text = `${hm}${ampm ? ` ${ampm}` : ''} in ${ref.name}, ${when}`;
  planOut.textContent = text;
  planInput.setAttribute('aria-valuetext', text);
}

let sliding = false; // a page crossfade would fight a drag, so skip it then

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
planInput.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && planShift) setPlan(0);
});

/* Clock */

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
    renderCaption(now, refZone);
    renderPicker(now);
    // Daylight saving can move the selected city between slots.
    const target = turnFor(refZone.offset);
    if (!turning && Math.abs(wrap180(target - dialTurn)) > 0.01) turnTo(target, false);
  }
  renderHome(refZone);
  tickSeconds(refZone.s);
  utcAngle = ((Math.floor(now.getTime() / 1000) / 240) % 360 + 360) % 360;
  if (!turning) drawDial();
}

function tick() {
  render(clockNow());
  setTimeout(tick, 1000 - (Date.now() % 1000) + 10);
}

// On load the 24-hour ring winds into place, the one orchestrated moment on the page.
function intro() {
  if (reduceMotion.matches) return;
  const start = performance.now();
  const length = 1700;
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
labelNumerals();

// A link like index.html#Asia/Tokyo opens with the clock set to Tokyo.
const linked = decodeURIComponent(location.hash.slice(1));
if (PLACES.has(linked)) ref = PLACES.get(linked);
dialTurn = turnFor(zoned(ref.tz, new Date()).offset);
layoutCityRing();
render(new Date(), true);
intro();
tick();

window.addEventListener('hashchange', () => {
  const tz = decodeURIComponent(location.hash.slice(1)) || HOME_TZ;
  if (PLACES.has(tz)) selectPlace(tz);
});

// Full names are hidden on small dials and can't be measured until shown again.
document.fonts?.ready.then(fitCityLabels);
new ResizeObserver(fitCityLabels).observe(dial);
