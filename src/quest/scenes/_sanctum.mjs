// Shared art for the final boss (scenes lich1, lich2, lich3, victory). Not a scene itself: only
// those four modules import it. The Lich's sanctum: a vast dark hall with green-lit pillars and
// braziers, floating rune circles, VEL'KRANN the Legacy Lich hovering over THE UNTESTED MONOLITH,
// trapped village souls swirling round it, and the party at the bottom of the stage.
import {
  W, ptext, twidth, actor, actorSize, pathArt, sprite, use, flipbook, float, bob, flicker, blink, pulse,
  particles, glow, radial, def, rng, squash,
} from '../engine.mjs';

export const STAGE_H = 360;          // same stage height in all four scenes (shared background)
export const TOP = 44, BOTTOM = TOP + STAGE_H; // stage y range
export const HORIZON = 296;          // back wall meets the floor
export const FEET = 398;             // the party stands here
export const MONO = { x: 338, w: 224, base: 340, h: 148, depth: 22 }; // the Monolith (front face)
export const LICH_PX = 4;
const rep = 'repeatCount="indefinite"';

// ── tiny grid helpers (sprites.mjs keeps its own private) ────────────────
const mirror = (rows) => rows.map((r) => r + [...r].reverse().join(''));
function paint(grid, x, y, rows) {
  const g = grid.map((r) => [...r]);
  rows.forEach((row, j) => [...row].forEach((c, i) => { if (c !== '.' && g[y + j]) g[y + j][x + i] = c === '_' ? '.' : c; }));
  return g.map((r) => r.join(''));
}
const maskOf = (g) => g.map((r) => r.replace(/[^.]/g, 'X'));

// ── filters & gradients (shared, "sanctum-" prefix) ──────────────────────
def('sanctum-blur', '<filter id="sanctum-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>');
def('sanctum-blur6', '<filter id="sanctum-blur6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>');
def('sanctum-ray', '<linearGradient id="sanctum-ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2b8" stop-opacity=".55"/><stop offset="1" stop-color="#ffd34d" stop-opacity="0"/></linearGradient>');
def('sanctum-gray', '<linearGradient id="sanctum-gray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a6ff4d" stop-opacity=".22"/><stop offset="1" stop-color="#a6ff4d" stop-opacity="0"/></linearGradient>');

// ── VEL'KRANN, the Legacy Lich (44×40, mirrored halves) ──────────────────
let LICH = mirror([
  '.............G....G..G',
  '.............Gg...GG.G',
  '.............GGg..GGgG',
  '.............GJGGgGGJG',
  '.............GGGGGGGGG',
  '.............ggggggggg',
  '..........KHHHKBBBBBBB',
  '.........KHHHKBBBBBBBB',
  '.........KHHKBBBBBBBBB',
  '........KHHHKBKKKKKBBB',
  '........KHHKBBKEEWKBBB',
  '........KHHKBBKEEEKBBB',
  '........KHHKBBbKKKKBBK',
  '........KHHKbBBBBBBBBK',
  '........KHHHKbBBBBBBBB',
  '........KHHHKbBKBKBKBK',
  '........KHHHHKbKBKBKBK',
  '.......KHHHHHKKKKKKKKK',
  '...KhhhHHHHHHHHHHHHGgG',
  '...KhhHHHHhHHHHHHHHHGG',
  '...KhHHHHhHHHHHHHKHHHH',
  '...KHHHHhHHHHHHHKHHHHH',
  '....KHHhHHHHHHHKHHHHHH',
  '....KHHhHHHHHHKHHHHrHH',
  '....KHhHHHHHHHKHHHHrHH',
  '.....KhHHHHHHKHHHHHrHH',
  '.....KhHHHHHHKHHHHHHrH',
  '.....KhHHHHHKHHHHHHHrH',
  '.....KHHHHHHKHHHHHHHHH',
  '......KHHHHKHHHHHHHHHH',
  '......KHHHHKHHHHHHHHHH',
  '......KHHHKHHHHHHHKHHH',
  '......KHHK.KHHHHHKHHHH',
  '......KHHK.KHHHHK.KHHH',
  '.......KHK..KHHHK.KHHH',
  '.......KHK..KHHK..KHHK',
  '........K....KHK...KHK',
  '.............KHK...KK.',
  '..............K.......',
  '......................',
]);
// skeletal hands raised to the sides, claws up, sleeves running back to the shoulders
const HAND = [
  'K.K.K...',
  'B.B.B...',
  'BKBKBK.K',
  'BKBKBKKB',
  'bBBBBBBB',
  'KbBBBBbK',
  '.KBBBBK.',
  '.KhhhhK.',
  '.KhrhhhK',
  '..KhrhhK',
  '..KhhhhH',
  '...KhhhH',
  '....KhhH',
  '....KhhH',
];
LICH = paint(LICH, 0, 4, HAND);
LICH = paint(LICH, 36, 4, HAND.map((r) => [...r].reverse().join('')));
// a little ribcage peeking through the robe
LICH = paint(LICH, 17, 20, ['KBKB', 'BKBK', 'KBKB']);
LICH = paint(LICH, 23, 20, ['BKBK', 'KBKB', 'BKBK']);
const LICH_PAL = {
  K: '#020402', H: '#1a2e10', h: '#3a6020', r: '#5f9a30', B: '#dfe9cf', b: '#8f9e80',
  E: '#a6ff4d', W: '#f6ffe0', G: '#f6c84e', g: '#a06c18', J: '#a6ff4d',
};
export const LICH_W = LICH[0].length, LICH_H = LICH.length;

/** Dither-erase the lower part of a grid (pixels vanish more toward the bottom). */
function dissolveGrid(g, seed, from = 0.25) {
  const r = rng(seed), h = g.length;
  return g.map((row, y) => {
    const t = (y / h - from) / (1 - from);
    return [...row].map((c) => (c !== '.' && t > 0 && r() < t * 0.95 ? '.' : c)).join('');
  });
}

/**
 * The Lich. (x, y) top-left; bobbing float, green flame aura, flickering eyes.
 * opts: px, dissolve (victory: half of him gone to dust), aura (strength).
 */
export function lich(x, y, { px = LICH_PX, dissolve = false, aura = 1 } = {}) {
  const grid = dissolve ? dissolveGrid(LICH, 7, 0.1) : LICH;
  const w = LICH_W * px, h = LICH_H * px, cx = x + w / 2;
  let s = '';
  // green flame aura: the silhouette, offset in four directions, blurred and flickering
  const m = sprite('sanctumLichM', maskOf(grid), px, { X: 'inherit' });
  if (aura) {
    s += glow(cx, y + h * 0.42, w * 0.95, '#a6ff4d', { opacity: 0.32 * aura, pulse: true, dur: 2.4 });
    const halo = [[-6, 0], [6, 0], [0, -7], [0, 4], [-4, -5], [4, -5]].map(([dx, dy]) => use(m, x + dx, y + dy)).join('');
    s += flicker(`<g fill="#a6ff4d" opacity="${(0.5 * aura).toFixed(2)}" filter="url(#sanctum-blur)">${halo}</g>`, { dur: 0.9, min: 0.5 });
    // flame tongues licking up off the shoulders and the crown
    s += particles({ seed: 31, n: 18, x: x + px * 4, y: y + px * 16, w: w - px * 8, h: px * 10, colors: ['#a6ff4d', '#d8ff9a', '#4fbf1a'], size: [3, 6], dy: -70, dx: 0, dur: 1.6, opacity: 0.85 * aura, group: 2 });
    s += particles({ seed: 32, n: 8, x: cx - px * 6, y: y, w: px * 12, h: px * 4, colors: ['#d8ff9a', '#a6ff4d'], size: [2, 4], dy: -40, dur: 1.2, opacity: 0.8 * aura, group: 2 });
  }
  let body = pathArt(grid, px, x, y, LICH_PAL);
  // the eyes: an extra bright glow that flares now and then
  const ex = [x + 15 * px, x + 26 * px], ey = y + 10 * px;
  body += ex.map((e) => glow(e + px * 1.5, ey + px, px * 6, '#a6ff4d', { opacity: dissolve ? 0.35 : 0.8 })).join('');
  body += flicker(ex.map((e) => `<rect x="${e}" y="${ey}" width="${px * 3}" height="${px * 2}" fill="#a6ff4d"/><rect x="${e + px * (e === ex[0] ? 2 : 0)}" y="${ey}" width="${px}" height="${px}" fill="#f6ffe0"/>`).join(''), { dur: 1.7, min: 0.6 });
  s += float(body, { dy: -8, dur: 3.2 });
  return s;
}

// ── green-flame brazier ──────────────────────────────────────────────────
const GFL = { K: '#020402', R: '#2f8a12', O: '#a6ff4d', o: '#d8ff9a', W: '#f6ffe0' };
const GFLAMES = [
  ['...R...', '..ROR..', '..OoO..', '.ROooR.', '.OoWoO.', 'ROoWoOR', '.OoooO.'],
  ['..R....', '..OR...', '.ROoR..', '.OoooR.', 'ROoWoO.', '.OoWoOR', '.OoooO.'],
  ['....R..', '...RO..', '..ROoR.', '.ROooO.', '.OoWoOR', 'ROoWoO.', '.OoooO.'],
];
const BOWL = ['KKKKKKKKK', 'KggggggK.', '.KgggggK.', '..KgggK..', '...KgK...'].map((r) => r.padEnd(9, '.'));
function brazier(x, y, delay = 0, px = 4) {
  const ids = GFLAMES.map((f, i) => sprite(`sanctumFlame${i}`, f, px, GFL));
  return glow(x + 4.5 * px, y - px * 2, px * 30, '#a6ff4d', { opacity: 0.3, pulse: true, dur: 1.3 + delay })
    + pathArt(BOWL, px, x, y, { K: '#020402', g: '#3a4a3a' })
    + flipbook(ids, 0.12, x + px, y - px * 7, delay);
}

// ── the hall ─────────────────────────────────────────────────────────────
function pillar(x, w, { lit = '#a6ff4d', seed = 1 } = {}) {
  const r = rng(seed);
  let s = `<rect x="${x}" y="${TOP}" width="${w}" height="${HORIZON - TOP}" fill="#111a14"/>`;
  // green rim light on the side facing the Monolith + dark side
  const toCentre = x + w / 2 < W / 2;
  s += `<rect x="${toCentre ? x + w - 6 : x}" y="${TOP}" width="6" height="${HORIZON - TOP}" fill="${lit}" opacity=".35"/>`;
  s += `<rect x="${toCentre ? x : x + w - 6}" y="${TOP}" width="6" height="${HORIZON - TOP}" fill="#070b08"/>`;
  // stone courses
  let d = '';
  for (let y = TOP + 18; y < HORIZON; y += 22) d += `M${x} ${y}h${w}v2h-${w}z`;
  for (let i = 0; i < 6; i++) d += `M${x + 6 + Math.round(r() * (w - 16))} ${TOP + 30 + Math.round(r() * (HORIZON - TOP - 60))}h4v10h-4z`;
  s += `<path d="${d}" fill="#0a100c"/>`;
  // capital + base
  s += `<rect x="${x - 8}" y="${HORIZON - 14}" width="${w + 16}" height="14" fill="#1c2a20"/><rect x="${x - 8}" y="${HORIZON - 14}" width="${w + 16}" height="3" fill="#2d4433"/>`;
  return s;
}
function backWall() {
  let s = '';
  // banded darkness, greener toward the Monolith's glow
  const bands = ['#020403', '#030604', '#040805', '#050a06', '#060d08', '#08110a', '#0a150c', '#0c190e'];
  const bh = (HORIZON - TOP) / bands.length;
  bands.forEach((c, i) => { s += `<rect x="0" y="${(TOP + i * bh).toFixed(1)}" width="${W}" height="${(bh + 1).toFixed(1)}" fill="${c}"/>`; });
  // distant gothic arches (very dark) between the pillars
  for (const [ax, aw] of [[150, 92], [356, 188], [658, 92]]) {
    const ay = TOP + 40;
    s += `<path d="M${ax} ${HORIZON}V${ay + aw / 2}Q${ax} ${ay} ${ax + aw / 2} ${ay - 10}Q${ax + aw} ${ay} ${ax + aw} ${ay + aw / 2}V${HORIZON}z" fill="#010201" stroke="#16231a" stroke-width="4"/>`;
  }
  // a faint green shaft from above onto the Monolith
  s += `<path d="M380 ${TOP}h140l70 ${HORIZON - TOP}h-280z" fill="url(#sanctum-gray)"/>`;
  return s;
}
function floor() {
  let s = `<rect x="0" y="${HORIZON}" width="${W}" height="${BOTTOM - HORIZON}" fill="#0b120d"/>`;
  // receding flagstone rows + radial joints to a vanishing point behind the Monolith
  let d = '';
  for (const [y, h] of [[HORIZON + 10, 2], [HORIZON + 26, 2], [HORIZON + 48, 3], [HORIZON + 78, 3]]) d += `M0 ${y}h${W}v${h}H0z`;
  s += `<path d="${d}" fill="#060a07"/>`;
  let l = '';
  for (let i = -8; i <= 8; i++) { const x0 = 450 + i * 42, x1 = 450 + i * 130; l += `M${x0} ${HORIZON}L${x1} ${BOTTOM}`; }
  s += `<path d="${l}" stroke="#060a07" stroke-width="3" fill="none"/>`;
  s += `<rect x="0" y="${HORIZON}" width="${W}" height="3" fill="#1c2a20"/>`;
  // the Monolith's green light pooled on the floor
  s += `<ellipse cx="450" cy="${MONO.base + 4}" rx="320" ry="46" fill="${radial('#a6ff4d', 0.28)}"/>`;
  return s;
}
// pixel rune marks (3×5) dotted round the circles
const RUNES = ['###/#.#/##./#.#/#.#', '#.#/###/.#./.#./.#.', '###/..#/.#./#../###', '#../#.#/###/..#/..#', '.#./###/.#./#.#/#.#', '##./#.#/##./#../#..'];
function runeMark(i, x, y, u, fill) {
  let d = '';
  RUNES[i % RUNES.length].split('/').forEach((row, ry) => [...row].forEach((c, rx) => { if (c === '#') d += `M${x + rx * u} ${y + ry * u}h${u}v${u}h-${u}z`; }));
  return `<path d="${d}" fill="${fill}"/>`;
}
/** A floating rune circle (vertical disc seen face-on), slowly turning. */
export function runeCircle(cx, cy, r, { color = '#a6ff4d', dur = 18, reverse = false, op = 0.7 } = {}) {
  let inner = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="2"/>`;
  inner += `<circle cx="${cx}" cy="${cy}" r="${r - 12}" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="6 5"/>`;
  // inner hexagram
  const pts = (off) => [0, 1, 2].map((k) => { const a = off + k * 2.0944; return `${(cx + Math.cos(a) * (r - 14)).toFixed(1)} ${(cy + Math.sin(a) * (r - 14)).toFixed(1)}`; }).join(' ');
  inner += `<polygon points="${pts(-1.5708)}" fill="none" stroke="${color}" stroke-width="1.5"/><polygon points="${pts(1.5708)}" fill="none" stroke="${color}" stroke-width="1.5"/>`;
  for (let k = 0; k < 8; k++) { const a = k * 0.785; inner += runeMark(k, Math.round(cx + Math.cos(a) * (r - 6) - 3), Math.round(cy + Math.sin(a) * (r - 6) - 5), 2, color); }
  const v = reverse ? `360 ${cx} ${cy};0 ${cx} ${cy}` : `0 ${cx} ${cy};360 ${cx} ${cy}`;
  return `<g opacity="${op}">${glow(cx, cy, r * 1.3, color, { opacity: 0.18 })}<g><animateTransform attributeName="transform" type="rotate" values="${v}" dur="${dur}s" ${rep}/>${inner}</g></g>`;
}
/** The flat summoning circle on the floor round the Monolith (dashes march round it). */
function floorCircle(color = '#a6ff4d') {
  const cy = MONO.base + 6;
  let s = `<ellipse cx="450" cy="${cy}" rx="250" ry="34" fill="none" stroke="${color}" stroke-width="2" opacity=".5"/>`;
  s += `<ellipse cx="450" cy="${cy}" rx="226" ry="27" fill="none" stroke="${color}" stroke-width="3" stroke-dasharray="10 8" opacity=".7"><animate attributeName="stroke-dashoffset" values="0;-180" dur="6s" ${rep}/></ellipse>`;
  for (let k = 0; k < 12; k++) { const a = k * 0.5236; s += runeMark(k, Math.round(450 + Math.cos(a) * 238 - 3), Math.round(cy + Math.sin(a) * 30 - 5), 2, color); }
  return s;
}

/** The whole sanctum backdrop: wall, pillars, braziers, rune circles, floor. */
export function hall({ light = false } = {}) {
  let s = backWall();
  // pillars (outer pair nearer → wider), braziers on the inner pair
  s += pillar(18, 50, { seed: 2 }) + pillar(262, 40, { seed: 3 }) + pillar(598, 40, { seed: 4 }) + pillar(832, 50, { seed: 5 });
  s += floor();
  s += brazier(264, HORIZON - 34, 0) + brazier(600, HORIZON - 34, 0.4);
  s += runeCircle(196, 132, 46, { dur: 20 }) + runeCircle(704, 132, 46, { dur: 24, reverse: true });
  s += floorCircle(light ? '#ffe680' : '#a6ff4d');
  // motes of grave-dust drifting up through the green light
  s += particles({ seed: 41, n: 24, x: 40, y: TOP + 40, w: W - 80, h: HORIZON - TOP, colors: ['#a6ff4d', '#5f9f3a', '#d8ff9a'], size: [2, 3], dy: -50, dx: 10, dur: 7, opacity: 0.55 });
  return s;
}

// ── THE UNTESTED MONOLITH ────────────────────────────────────────────────
const CRACKS = [ // in the face's local coords (0..w, 0..h)
  [[96, 0], [104, 18], [92, 34], [110, 56], [100, 74], [118, 100], [108, 126], [122, 164]],
  [[104, 18], [130, 30], [150, 26], [168, 44]],
  [[92, 34], [62, 46], [44, 40], [22, 58]],
  [[110, 56], [146, 70], [160, 92], [196, 98]],
  [[100, 74], [70, 88], [58, 112], [30, 120]],
  [[180, 0], [174, 14], [190, 24]],
  [[14, 0], [26, 16], [18, 28]],
];
const crackPath = (sx = 1) => CRACKS.map((c) => 'M' + c.map(([x, y]) => `${(x * sx).toFixed(0)} ${y}`).join('L')).join('');
/** Code-line etching (40,000 of them, or near enough) across a face of width w, height h. */
function etching(w, h, seed) {
  const r = rng(seed);
  let d = '';
  for (let y = 10; y < h - 6; y += 6) {
    let x = 10 + Math.round(r() * 3) * 8;
    while (x < w - 18) { const n = 6 + Math.round(r() * 26); if (x + n > w - 10) break; d += `M${x} ${y}h${n}v2h-${n}z`; x += n + 4 + Math.round(r() * 8); }
  }
  return d;
}
const PLAQUE = ['40,000 LINES', 'NO TESTS', 'LAST TOUCHED 2014'];
/**
 * The Monolith, drawn in local coords then placed: base centre at (MONO.x + w/2, MONO.base).
 * opts: scale (lich3 makes it dominant), glow (crack intensity 0..1.5), plaque (draw the plaque).
 */
export function monolith({ scale = 1, glowAmt = 1, plaque = true, slices = null } = {}) {
  const { w, h } = MONO;
  let s = '';
  // back glow
  s += pulse(`<ellipse cx="${w / 2}" cy="${h * 0.45}" rx="${w * 0.95}" ry="${h * 0.85}" fill="${radial('#a6ff4d', 0.3 * glowAmt)}"/>`, { dur: 2.2, to: 0.55 });
  s += slices ?? monolithArt({ glowAmt, plaque });
  const cx = MONO.x + w / 2, top = MONO.base - h;
  const tr = scale === 1 ? `translate(${MONO.x} ${top})` : `translate(${cx} ${MONO.base}) scale(${scale}) translate(${-w / 2} ${-h})`;
  return `<g transform="${tr}">${s}</g>`;
}
/** The slab itself in local coords (0..w+depth, -depth/2..h): faces, etching, cracks, plaque. */
export function monolithArt({ glowAmt = 1, plaque = true } = {}) {
  const { w, h, depth } = MONO;
  let s = '';
  // side + top faces (pseudo-3D)
  s += `<path d="M${w} 0l${depth} -${depth / 2}V${h - depth / 2}l-${depth} ${depth / 2}z" fill="#121d16"/>`;
  s += `<path d="M0 0l${depth} -${depth / 2}H${w + depth}l-${depth} ${depth / 2}z" fill="#54705a"/>`;
  s += `<rect width="${w}" height="${h}" fill="#26362c"/>`;
  s += `<rect width="${w}" height="4" fill="#6a8a70"/><rect width="4" height="${h}" fill="#4a6352"/><rect x="${w - 4}" width="4" height="${h}" fill="#a6ff4d" opacity=".35"/>`;
  s += `<path d="${etching(w, h, 9)}" fill="#34493b"/>`;
  // chipped corners
  s += `<path d="M0 0h18v6h-8v8H0zM${w - 26} 0h26v12h-8v-6h-18z" fill="#0b120d"/>`;
  // the cracks: dark gouge, blurred glow, bright core (pulsing)
  const cp = crackPath();
  s += `<path d="${cp}" fill="none" stroke="#050806" stroke-width="7" stroke-linejoin="bevel"/>`;
  s += pulse(`<path d="${cp}" fill="none" stroke="#a6ff4d" stroke-width="${(5 * glowAmt).toFixed(1)}" filter="url(#sanctum-blur)" opacity=".9"/>`, { dur: 1.8, to: 0.4 });
  s += pulse(`<path d="${cp}" fill="none" stroke="#d8ff9a" stroke-width="2" stroke-linejoin="bevel"/>`, { dur: 1.8, to: 0.7 });
  if (plaque) s += plaqueArt(w, h);
  return s;
}
export function plaqueArt(w, h) {
  const pw = 222 - 12, ph = 72, px0 = (w - pw) / 2, py0 = h - ph - 10;
  let s = `<rect x="${px0 - 3}" y="${py0 - 3}" width="${pw + 6}" height="${ph + 6}" fill="#050806"/>`;
  s += `<rect x="${px0}" y="${py0}" width="${pw}" height="${ph}" fill="#6a4a1e"/><rect x="${px0}" y="${py0}" width="${pw}" height="3" fill="#a07a36"/><rect x="${px0}" y="${py0 + ph - 3}" width="${pw}" height="3" fill="#3a2810"/>`;
  for (const [rx, ry] of [[4, 4], [pw - 8, 4], [4, ph - 8], [pw - 8, ph - 8]]) s += `<rect x="${px0 + rx}" y="${py0 + ry}" width="4" height="4" fill="#d6b060"/>`;
  PLAQUE.forEach((t, i) => { s += ptext(t, w / 2, py0 + 9 + i * 20, 2, i === 1 ? '#ff6b5e' : '#f3e3b5', { anchor: 'middle', shadow: '#2a1a08' }); });
  return s;
}

// ── trapped village souls ────────────────────────────────────────────────
const SOUL = ['..KKKK..', '.KWWWWK.', 'KWKWWKWK', 'KWWWWWWK', 'KWWKKWWK', 'KWWWWWWK', 'KWKWWKWK', '.K.KK.K.'];
const SOUL_PAL = { K: '#2a5a6a', W: '#d8fbff' };
/** Souls orbiting the Monolith on an ellipse (drawn behind it: they pass behind the slab). */
export function souls({ n = 7, cy = 230, rx = 210, ry = 40, dur = 14, opacity = 0.6 } = {}) {
  const id = sprite('sanctumSoul', SOUL, 3, SOUL_PAL);
  const path = `M${-rx} 0a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
  let s = '';
  for (let i = 0; i < n; i++) {
    const b = (-(i / n) * dur).toFixed(2);
    s += `<g opacity="${opacity}"><animateMotion path="${path}" dur="${dur}s" begin="${b}s" ${rep}/>${bob(use(id, 438, cy - 12 + (i % 3) * 14), { dy: -4, dur: 0.6 + (i % 3) * 0.2 })}</g>`;
  }
  // a wail of wisps trailing round
  s += particles({ seed: 51, n: 16, x: 450 - rx, y: cy - ry, w: 2 * rx, h: 2 * ry, colors: ['#d8fbff', '#8fd8e8'], size: [2, 3], dx: 30, dy: -20, dur: 3, opacity: 0.5 });
  return s;
}
/** Souls set free: rising straight up toward the light. */
export function freedSouls({ xs = [180, 260, 340, 560, 640, 720], y0 = 300 } = {}) {
  const id = sprite('sanctumSoulFree', SOUL, 3, { K: '#6a8a5a', W: '#fffbe0' });
  return xs.map((x, i) => {
    const d = 5 + (i % 3), b = (-(i * 1.7) % d).toFixed(1), y = y0 - (i % 3) * 60 - 20;
    return `<g opacity=".8"><animateTransform attributeName="transform" type="translate" values="0 0;${i % 2 ? 10 : -10} -110;0 -220" dur="${d}s" begin="${b}s" ${rep}/><animate attributeName="opacity" values=".85;.75;0" dur="${d}s" begin="${b}s" ${rep}/>${use(id, x, y)}</g>`;
  }).join('') + particles({ seed: 61, n: 18, x: 150, y: 140, w: 600, h: 200, colors: ['#fffbe0', '#ffe680'], size: [2, 3], dy: -90, dur: 4, opacity: 0.7 });
}

// ── XAL'ZOR, mini (the beholder ally, hovering) ──────────────────────────
function xalGrid() {
  const w = 22, h = 22, g = Array.from({ length: h }, () => Array(w).fill('.'));
  const cx = 10.5, cy = 13.5, R = 7.6;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = Math.hypot(x + 0.5 - cx - 0.5, y + 0.5 - cy);
    if (d <= R) g[y][x] = d > R - 1 ? 'K' : (x < cx - 3 && y < cy) ? 'v' : 'V';
  }
  // the big eye
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = Math.hypot((x + 0.5 - cx - 1) / 1.25, y + 0.5 - cy);
    if (d <= 3.6) g[y][x] = d > 3 ? 'K' : 'W';
    if (Math.hypot(x + 0.5 - cx - 1.6, y + 0.5 - cy) <= 1.6) g[y][x] = 'I';
  }
  g[13][12] = 'K'; g[12][11] = 'W';
  // mouth
  for (let x = 7; x <= 15; x++) g[19][x] = x % 2 ? 'W' : 'K';
  // eyestalks ending in little green gauges
  const stalk = (pts, gx, gy) => { for (const [x, y] of pts) g[y][x] = 'S'; [[0, 0, 'K'], [1, 0, 'K'], [2, 0, 'K'], [0, 1, 'K'], [1, 1, 'G'], [2, 1, 'K'], [0, 2, 'K'], [1, 2, 'K'], [2, 2, 'K']].forEach(([dx, dy, c]) => { if (g[gy + dy]) g[gy + dy][gx + dx] = c; }); };
  stalk([[6, 7], [5, 6], [4, 5]], 2, 2);
  stalk([[10, 5], [10, 4]], 9, 1);
  stalk([[15, 6], [16, 5], [17, 4]], 17, 1);
  stalk([[3, 9], [2, 8]], 0, 5);
  stalk([[19, 9], [20, 8]], 19, 5);
  return g.map((r) => r.join(''));
}
const XAL = xalGrid();
export function xalzor(x, y, { px = 3 } = {}) {
  const id = sprite('sanctumXal', XAL, px, { K: '#12061a', V: '#9b3fd1', v: '#c070f0', W: '#f4ecff', I: '#3fdc8a', S: '#6a2196', G: '#7dff8a' });
  return float(glow(x + 33, y + 40, 46, '#d36bff', { opacity: 0.3 }) + use(id, x, y), { dy: -6, dur: 2.2 });
}

// ── the party ────────────────────────────────────────────────────────────
const feet = (name, px) => FEET - actorSize(name, px).h;
/**
 * The party at the bottom of the stage. Default: ape + Brakka on the left, the Choir and Gus on the
 * right, Xal'Zor hovering over the left flank. opts tweak the Choir (cursed / frozen) and poses.
 */
export function party({ ape = 'ape', apeX = 150, choirPal = null, choirX = [664, 724, 784], choirShake = false, gusX = 584, xal = [64, 118], extra = '' } = {}) {
  let s = '';
  s += xalzor(xal[0], xal[1]);
  s += squash(actor('gus', gusX, feet('gus', 3), { px: 3, begin: 0.3 }), { cx: gusX + 39, base: FEET, amt: 0.05, dur: 1.8 });
  const choir = ['choir1', 'choir2', 'choir3'].map((n, i) => {
    const a = actor(n, choirX[i], feet(n) - [0, 4, 2][i], { flip: true, begin: i * 0.2, pal: choirPal ?? {} });
    return choirShake ? `<g><animateTransform attributeName="transform" type="translate" values="0 0;2 0;-1 1;1 -1;-2 0" dur="0.3s" begin="${i * 0.07}s" ${rep} calcMode="discrete"/>${a}</g>` : a;
  }).join('');
  s += choir;
  s += actor('brakka', 34, feet('brakka'), { begin: 0.2 });
  s += actor(ape, apeX, feet(ape));
  return s + extra;
}
export { twidth };
