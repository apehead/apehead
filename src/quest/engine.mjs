// THE CATACOMBS OF LEGACY — shared scene engine.
// Every scene module (src/quest/scenes/<id>.mjs) imports from here and does:
//
//   import { scene, actor, ptext, torch, ... } from '../engine.mjs';
//   export default function render() {
//     return scene({ id: 'gate', label: 'alt text…', body: ({ top, bottom }) => '…', dialogues: [ … ] });
//   }
//
// COORDINATES. Every SVG is 900 wide (W). The HUD is the strip y∈[0,44). The stage (your body) is
// y∈[top, bottom): top = 44, bottom = H − dialogue panel height. Body coords are absolute SVG coords.
// The dialogue panel is drawn after the body (it covers anything you draw below `bottom`), the HUD
// and frame after that. Default stage height: 340 with ≤1 dialogue row (H = 512), 312 with two rows
// (H = 600). Override with stageH / height, or overlay: true to float the boxes over the stage.
//
// DEFS. `sprite()`, `radial()`, `ptext()`, `actor()` register reusable defs in ONE global registry
// (all scenes render in the same process); `scene()` emits only the defs its markup references
// (scanning for href="#id" and url(#id)), so unused art costs nothing. Their ids are content-hashed.
// If you call `def(id, markup)` yourself (gradients, clipPaths, filters), PREFIX THE ID WITH YOUR
// SCENE ID (e.g. 'gateSky'): the same id with different markup throws.
//
// SIZE. Keep each SVG < 150 KB (adventure.mjs warns). Big sprites go through actor()/sprite() so
// repeated use costs one <use>; particles() clusters its animations; pathArt merges pixel runs.
//
// RULES (enforced by throwing): unknown speaker, dialogue > 2 lines, a dialogue line (or the name)
// wider than its box (estimated per font), a pixel-font glyph that doesn't exist, a missing label. Everything must be visible at
// t=0: animations decorate or loop from a visible default (frame 0 shown statically, no opacity-0
// starts for essential content). SMIL only (works through <img> everywhere, incl. Safari).
//
// API (one line each; details in the JSDoc-ish comments below):
//   ptext(str, x, y, sc, fill, {anchor, shadow, outline, spacing}) pixel-font text (5×7 glyphs, top-left y)
//   twidth(str, sc, spacing?)                     pixel-font text width
//   pathArt(grid, px, x, y, pal, {flip})          inline pixel art (one <path> per colour)
//   sprite(name, grid, px, pal, {flip}) → id      register pixel art as a reusable def
//   use(id, x, y, extra?)                         <use> of a def
//   actor(name, x, y, {px, flip, frame, dur, begin, pal, silhouette, keep}) cast member (sprites.mjs CAST), idle loop
//   actorSize(name, px?) → {w, h}               sprite size in SVG px
//   portrait(speaker, x, y)                       96×96 portrait art (dialogue() frames it for you)
//   relicIcon(i, x, y, px?)                       relic sprite (i = 1..6), 14×14 grid
//   flipbook(ids, frameDur, x, y, begin?)         SMIL frame flipping (frame 0 visible statically)
//   bob(inner, {dy, dur, begin, smooth})          up/down idle (stepped by default)
//   float(inner, {dy, dur, begin})                smooth hover
//   sway(inner, {deg, cx, cy, dur, begin})        rotate back and forth around a point
//   squash(inner, {cx, base, amt, dur, begin})    jelly squash/stretch anchored at the base line
//   flicker(inner, {dur, min, begin})             opacity flicker (min ≥ .4 keeps it visible)
//   blink(inner, {dur, begin, on})                on/off, visible `on` share of the loop (decoration only)
//   pulse(inner, {dur, from, to, begin})          smooth opacity pulse
//   drift(inner, {dx, dy, dur, begin})            eased there-and-back translate (clouds, hovering things)
//   motion(inner, {path, dur, begin, rotate})     animateMotion along a path
//   scroll(tile, {w, dur, y, reverse})            endless parallax layer (tile drawn in [0,w), scrolls left)
//   particles({seed, n, x, y, w, h, colors, size, dx, dy, dur, opacity, group}) embers/dust/spores/fireflies
//   glow(cx, cy, r, color, {opacity, pulse, dur}) soft radial light
//   radial(color, opacity?) → 'url(#…)'           radial gradient fill
//   torch(x, y, {px, delay, glowR})               wall torch with flickering flame & light
//   stars({seed, n, x, y, w, h})                  twinkling starfield
//   skyBands(y0, y1, colors)                      16-bit style banded sky
//   moon(cx, cy, {R, px})                         pixel moon with halo (from ghouls)
//   deadTree(x, groundY, {w, h, seed, px, pal})   procedural dead tree (from ghouls)
//   skyline(heights, px, base, fill)              silhouette from column heights
//   fog(y, {opacity, dur, color})                 drifting ground fog
//   brickWall(x, y, w, h, {dark, light}) / floorTiles(x, y, w, h)  crypt textures
//   arch(x, y, w, h, {px, ring, pal})            stone arch with a dark void (crypt doors, gates)
//   cottage(x, groundY, {w, wallH, roofH, seed, lit, smoke, day}) Shipwell cottage (village, epilogue)
//   caption(text, x, y, {color, sc})              narrator caption bar (pixel font, centred on x)
//   bubble(lines, x, y, {sc, fill, ink, tail})    pixel speech bubble for in-stage quips ("BZZT.")
//   dialogue({speaker, lines, x, y, w, h})        dialogue box: portrait, name, ≤2 lines, blinking ▼
//   hud({chapter, relics})                        the top strip
//   scene({id, chapter, relics, stageH, height, body, dialogues, label, bg, overlay}) full SVG
//   placeholder({id, title, dialogues, label, notes}) "under construction" scene (for unbuilt scenes)
//   relicBanner(i)                                900×116 RELIC ACQUIRED banner
//   deathBanner(n, title?)                        900×130 ☠ DEATH n/18 banner
//   def(id, markup) → id / svgDoc(H, label, markup)  raw def registration / standalone SVG (banners)
//   SPEAKERS, PAL, W, FONTS {MONO SANS SERIF ROUND BLACK}, SPRITES (all of sprites.mjs), attr(), rng(), wrap()
//
// SPEAKERS (dialogue typography): NARRATOR (pixel caption, no portrait) · APEHEAD gold SANS ·
// MIRRA amber SERIF italic · BRAKKA orange heavy BLACK · CHOIR cyan MONO CAPS · GUS slime ROUND lowercase,
// wobbles · GATEKEEPER stone SERIF CAPS wide-spaced · XALZOR violet MONO, jitters · MIMIC pink SERIF italic,
// whispers · VELKRANN lich-green SERIF italic, glows + trembles, black box · VILLAGERS pixel font.
// Usable line length at full width ≈ 41 (GATEKEEPER) … 60 (VELKRANN) chars; the check tells you exactly.
import { MONO, SANS, SERIF, rng, wrap } from '../lib.mjs';
import { CAST, PORTRAITS, RELIC_ICONS } from './sprites.mjs';
import { SCENES, RELICS, DEATHS, DEATH_COUNT } from './story.mjs';

export { rng, wrap, MONO, SANS, SERIF };
export * as SPRITES from './sprites.mjs';
export const W = 900;
export const ROUND = `'Arial Rounded MT Bold','Varela Round','Nunito','Trebuchet MS',${SANS}`;
export const BLACK = `'Arial Black','Segoe UI Black','Helvetica Neue',${SANS}`;
export const FONTS = { MONO, SANS, SERIF, ROUND, BLACK };

// ── palette ──────────────────────────────────────────────────────────────
export const PAL = {
  ink: '#0c0a14', night: '#07061a', void: '#06040b',
  gold: '#f6c84e', goldDk: '#a06c18', red: '#e8342c', redDk: '#8e1a1a', blood: '#ff3b3b',
  parchment: '#f3e3b5', bone: '#e9e3cf', white: '#ffffff',
  stone: '#837d99', stoneLt: '#b9b2c9', stoneDk: '#544e6b', brick: '#2b2440', brickDk: '#1b1630',
  torch: '#ff9a1f', flame: '#ffd34d',
  lich: '#a6ff4d', slime: '#7dff8a', cyan: '#5ce1ff', violet: '#d36bff', pink: '#ff6b8b', amber: '#ffb454', orange: '#ff7a3d',
  sky: ['#07061a', '#0b0922', '#100c2b', '#160f35', '#1d1340', '#26174a', '#311b52', '#3e2058', '#4c255c'],
};

// ── escaping & ids ───────────────────────────────────────────────────────
export const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };

// ── def registry ─────────────────────────────────────────────────────────
const DEFS = new Map();
/** Register a reusable def (gradient, filter, <g id> sprite…). Same id + different markup throws. */
export function def(id, markup) {
  const prev = DEFS.get(id);
  if (prev !== undefined && prev !== markup) throw new Error(`def "${id}" redefined with different markup`);
  DEFS.set(id, markup);
  return id;
}
const REF = /(?:href="#|url\(#)([\w.-]+)/g;
function collectDefs(markup) {
  const seen = new Set(), order = [];
  const visit = (s) => {
    for (const m of s.matchAll(REF)) {
      const id = m[1];
      if (seen.has(id) || !DEFS.has(id)) continue;
      seen.add(id); visit(DEFS.get(id)); order.push(id);
    }
  };
  visit(markup);
  return order.map((id) => DEFS.get(id)).join('');
}

// ── 5×7 pixel font (from ghouls, extended) ───────────────────────────────
const FONT = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  3: ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
  7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  9: ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
  '_': ['.....', '.....', '.....', '.....', '.....', '.....', '#####'],
  ':': ['.....', '..#..', '..#..', '.....', '..#..', '..#..', '.....'],
  ';': ['.....', '..#..', '..#..', '.....', '..#..', '..#..', '.#...'],
  '.': ['.....', '.....', '.....', '.....', '.....', '.##..', '.##..'],
  ',': ['.....', '.....', '.....', '.....', '.##..', '..#..', '.#...'],
  '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  "'": ['..#..', '..#..', '.#...', '.....', '.....', '.....', '.....'],
  '"': ['.#.#.', '.#.#.', '#.#..', '.....', '.....', '.....', '.....'],
  '@': ['.###.', '#...#', '#.###', '#.#.#', '#.###', '#....', '.###.'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
  '=': ['.....', '.....', '#####', '.....', '#####', '.....', '.....'],
  '/': ['....#', '....#', '...#.', '..#..', '.#...', '#....', '#....'],
  '>': ['.#...', '..#..', '...#.', '....#', '...#.', '..#..', '.#...'],
  '<': ['...#.', '..#..', '.#...', '#....', '.#...', '..#..', '...#.'],
  '(': ['...#.', '..#..', '.#...', '.#...', '.#...', '..#..', '...#.'],
  ')': ['.#...', '..#..', '...#.', '...#.', '...#.', '..#..', '.#...'],
  '[': ['.###.', '.#...', '.#...', '.#...', '.#...', '.#...', '.###.'],
  ']': ['.###.', '...#.', '...#.', '...#.', '...#.', '...#.', '.###.'],
  '*': ['.....', '#.#.#', '.###.', '#####', '.###.', '#.#.#', '.....'],
  '#': ['.#.#.', '.#.#.', '#####', '.#.#.', '#####', '.#.#.', '.#.#.'],
  '%': ['##..#', '##..#', '...#.', '..#..', '.#...', '#..##', '#..##'],
  '&': ['.##..', '#..#.', '#.#..', '.#...', '#.#.#', '#..#.', '.##.#'],
  '^': ['..#..', '.#.#.', '#...#', '.....', '.....', '.....', '.....'],
  '·': ['.....', '.....', '.....', '.##..', '.##..', '.....', '.....'],
  '☠': ['.###.', '#####', '#.#.#', '#####', '.#.#.', '#...#', '.#.#.'],
  '▼': ['.....', '#####', '#####', '.###.', '.###.', '..#..', '.....'],
  '▲': ['.....', '..#..', '.###.', '.###.', '#####', '#####', '.....'],
  '▶': ['#....', '##...', '###..', '####.', '###..', '##...', '#....'],
  '⟳': ['.##.#', '#..##', '#.###', '#....', '#...#', '#...#', '.###.'],
  '✓': ['.....', '....#', '...##', '#.##.', '###..', '.#...', '.....'],
  '★': ['..#..', '..#..', '#####', '.###.', '.###.', '##.##', '#...#'],
  '♥': ['.....', '##.##', '#####', '#####', '.###.', '..#..', '.....'],
};
const NORMALIZE = { '…': '...', '’': "'", '‘': "'", '“': '"', '”': '"', '—': '-', '–': '-', 'Ö': 'O', 'É': 'E' };
const normText = (s) => [...String(s).toUpperCase()].map((c) => NORMALIZE[c] ?? c).join('');
const glyphId = (c) => `g${c.codePointAt(0).toString(36)}`;
function glyph(c) {
  const rows = FONT[c];
  if (!rows) throw new Error(`ptext: no glyph for "${c}" (add it to FONT in engine.mjs)`);
  const id = glyphId(c);
  if (!DEFS.has(id)) {
    let d = '';
    rows.forEach((r, y) => {
      for (let x = 0; x < r.length;) {
        if (r[x] !== '#') { x++; continue; }
        let n = 1; while (r[x + n] === '#') n++;
        d += `M${x} ${y}h${n}v1h-${n}z`; x += n;
      }
    });
    def(id, `<path id="${id}" d="${d}"/>`);
  }
  return id;
}
/** Width of pixel text at scale sc (glyph = 5 units + 1 gap, plus optional extra spacing units). */
export const twidth = (s, sc, spacing = 0) => { const n = [...normText(s)].length; return (n * (6 + spacing) - 1 - spacing) * sc; };
/**
 * Pixel-font text. y is the TOP of the glyphs (height = 7·sc). Text is upper-cased; … ’ “ ” — normalized.
 * opts: anchor 'start'|'middle'|'end'; shadow colour (1-unit drop shadow, default '#000', null = none);
 *       outline colour (8-way arcade outline + drop shadow; good for titles); spacing (extra units per char).
 */
export function ptext(s, x, y, sc, fill, { anchor = 'start', shadow = '#000', outline = null, spacing = 0 } = {}) {
  const str = normText(s);
  const w = twidth(str, sc, spacing);
  const x0 = Math.round(anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x);
  let uses = '';
  [...str].forEach((c, i) => { if (c !== ' ') uses += `<use href="#${glyph(c)}" x="${i * (6 + spacing)}"/>`; });
  const id = def(`t${hash(uses)}`, `<g id="t${hash(uses)}">${uses}</g>`);
  const at = (dx, dy, f) => `<use href="#${id}" transform="translate(${x0 + dx * sc} ${y + dy * sc}) scale(${sc})" fill="${f}"/>`;
  let s2 = '';
  if (outline) {
    for (const [dx, dy] of [[2, 2], [1, 2], [2, 1], [-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) s2 += at(dx, dy, outline);
  } else if (shadow) s2 += at(1, 1, shadow);
  return s2 + at(0, 0, fill);
}

// ── pixel art ────────────────────────────────────────────────────────────
// Palette values: '#rrggbb' or '#rrggbb@0.5' (fill-opacity). '.' and ' ' are transparent.
const paint = (v) => { if (v === undefined) return null; if (v === 'inherit') return ''; const [c, o] = String(v).split('@'); return o ? `fill="${c}" fill-opacity="${o}"` : `fill="${c}"`; };
/** Inline pixel art: one <path> per colour in unit space, scaled by px. flip mirrors horizontally. */
export function pathArt(grid, px, x0, y0, pal, { flip = false } = {}) {
  // runs are merged vertically when the same colour run repeats on the next row (smaller paths)
  const w = Math.max(...grid.map((r) => r.length));
  const open = {}; // colour → Map("x,n" → {x, y, n, h})
  const done = {};
  grid.forEach((row0, y) => {
    const row = flip ? [...row0.padEnd(w, '.')].reverse().join('') : row0;
    const seen = new Set();
    for (let x = 0; x < row.length;) {
      const c = row[x]; let n = 1;
      while (row[x + n] === c) n++;
      if (c !== '.' && c !== ' ') {
        if (pal[c] === undefined) throw new Error(`pathArt: colour "${c}" missing from palette`);
        const m = (open[c] ||= new Map()), k = `${x},${n}`;
        const r = m.get(k);
        if (r && r.y + r.h === y) r.h++;
        else { if (r) (done[c] ||= []).push(r); m.set(k, { x, y, n, h: 1 }); }
        seen.add(`${c}|${k}`);
      }
      x += n;
    }
    // close runs that did not continue on this row
    for (const [c, m] of Object.entries(open)) for (const [k, r] of m) if (!seen.has(`${c}|${k}`) && r.y + r.h <= y) { (done[c] ||= []).push(r); m.delete(k); }
  });
  for (const [c, m] of Object.entries(open)) for (const r of m.values()) (done[c] ||= []).push(r);
  const paths = Object.entries(done).map(([c, rs]) => `<path ${paint(pal[c])} d="${rs.map((r) => `M${r.x} ${r.y}h${r.n}v${r.h}h-${r.n}z`).join('')}"/>`);
  return `<g transform="translate(${x0} ${y0}) scale(${px})">${paths.join('')}</g>`;
}
/** Register pixel art as a def; returns its id (content-hashed, so call it freely). */
export function sprite(name, grid, px, pal, { flip = false } = {}) {
  const inner = pathArt(grid, px, 0, 0, pal, { flip });
  const id = `${name.replace(/[^\w-]/g, '')}-${hash(inner)}`;
  return def(id, `<g id="${id}">${inner}</g>`);
}
export const use = (id, x = 0, y = 0, extra = '') => `<use href="#${id}" x="${x}" y="${y}"${extra ? ' ' + extra : ''}/>`;

// ── animation helpers (SMIL; every one is visible at t=0) ────────────────
const rep = 'repeatCount="indefinite"';
const bg = (b) => (b ? ` begin="${b}s"` : '');
/** Frame flipbook: shows ids[i] for frameDur seconds each. Frame 0 is the static default. */
export function flipbook(ids, fd, x = 0, y = 0, begin = 0) {
  if (ids.length === 1) return use(ids[0], x, y);
  const n = ids.length;
  return ids.map((id, i) => `<use href="#${id}" x="${x}" y="${y}"${i ? ' visibility="hidden"' : ''}><animate attributeName="visibility" dur="${(n * fd).toFixed(2)}s"${bg(begin)} ${rep} calcMode="discrete" values="${ids.map((_, j) => (j === i ? 'visible' : 'hidden')).join(';')}"/></use>`).join('');
}
export const bob = (inner, { dy = -4, dur = 0.8, begin = 0, smooth = false } = {}) =>
  `<g>${smooth
    ? `<animateTransform attributeName="transform" type="translate" values="0 0;0 ${dy};0 0" dur="${dur}s"${bg(begin)} ${rep} calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/>`
    : `<animateTransform attributeName="transform" type="translate" values="0 0;0 ${dy}" dur="${dur}s"${bg(begin)} ${rep} calcMode="discrete"/>`}${inner}</g>`;
export const float = (inner, { dy = -8, dur = 3, begin = 0 } = {}) => bob(inner, { dy, dur, begin, smooth: true });
export const sway = (inner, { deg = 4, cx = 0, cy = 0, dur = 2, begin = 0 } = {}) =>
  `<g><animateTransform attributeName="transform" type="rotate" values="${-deg} ${cx} ${cy};${deg} ${cx} ${cy};${-deg} ${cx} ${cy}" dur="${dur}s"${bg(begin)} ${rep} calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/>${inner}</g>`;
/** Jelly squash: scales around (cx, base) — wide+short then narrow+tall. */
export const squash = (inner, { cx = 0, base = 0, amt = 0.06, dur = 1.6, begin = 0 } = {}) =>
  `<g transform="translate(${cx} ${base})"><g><animateTransform attributeName="transform" type="scale" values="1 1;${1 + amt} ${1 - amt};${1 - amt / 2} ${1 + amt / 2};1 1" dur="${dur}s"${bg(begin)} ${rep} calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1"/><g transform="translate(${-cx} ${-base})">${inner}</g></g></g>`;
export const flicker = (inner, { dur = 1.3, min = 0.55, begin = 0 } = {}) =>
  `<g><animate attributeName="opacity" values="1;${min};0.95;${(min + 1) / 2};1;${min + 0.1};1" dur="${dur}s"${bg(begin)} ${rep}/>${inner}</g>`;
export const blink = (inner, { dur = 1.1, begin = 0, on = 0.6 } = {}) =>
  `<g><animate attributeName="visibility" values="visible;hidden" keyTimes="0;${on}" dur="${dur}s"${bg(begin)} ${rep} calcMode="discrete"/>${inner}</g>`;
export const pulse = (inner, { dur = 2, from = 1, to = 0.6, begin = 0 } = {}) =>
  `<g><animate attributeName="opacity" values="${from};${to};${from}" dur="${dur}s"${bg(begin)} ${rep} calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/>${inner}</g>`;
export const drift = (inner, { dx = -60, dy = 0, dur = 20, begin = 0 } = {}) =>
  `<g><animateTransform attributeName="transform" type="translate" values="0 0;${dx} ${dy};0 0" dur="${dur}s"${bg(begin)} ${rep} calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/>${inner}</g>`;
export const motion = (inner, { path, dur = 6, begin = 0, rotate = null } = {}) =>
  `<g><animateMotion path="${path}" dur="${dur}s"${bg(begin)} ${rep}${rotate ? ` rotate="${rotate}"` : ''}/>${inner}</g>`;
/** Endless parallax layer: `tile` drawn in [0, w) is repeated twice and scrolled left by w over dur s. */
export function scroll(tile, { w = W, dur = 40, y = 0, reverse = false } = {}) {
  const id = def(`L${hash(tile)}`, `<g id="L${hash(tile)}">${tile}</g>`);
  const v = reverse ? `${-w} ${y};0 ${y}` : `0 ${y};${-w} ${y}`;
  return `<g><animateTransform attributeName="transform" type="translate" values="${v}" dur="${dur}s" ${rep}/>${use(id)}${use(id, w)}</g>`;
}
/**
 * Particles: n little squares spawned in the box (x, y, w, h), each travelling (dx, dy) over ~dur s
 * while fading out, with staggered negative begins so the field is already populated at t=0.
 * colors: array; size: px (or [min,max]); group: particles per animated cluster (1 = fully independent).
 * Use dy<0 for embers/spores/wisps, dy>0 for dust/rain.
 */
export function particles({ seed = 1, n = 12, x = 0, y = 0, w = W, h = 100, colors = ['#ffd34d'], size = 3, dx = 0, dy = -60, dur = 4, opacity = 0.9, group = 3 } = {}) {
  // particles travel in small clusters (one animation pair per cluster) to keep files small
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < n; i += group) {
    const d = (dur * (0.7 + r() * 0.6)).toFixed(1), b = (-r() * dur).toFixed(1);
    const wob = Math.round((r() - 0.5) * 16);
    let rects = '';
    for (let j = i; j < Math.min(n, i + group); j++) {
      const sz = Array.isArray(size) ? Math.round(size[0] + r() * (size[1] - size[0])) : size;
      rects += `<rect x="${Math.round(x + r() * w)}" y="${Math.round(y + r() * h)}" width="${sz}" height="${sz}" fill="${colors[j % colors.length]}"/>`;
    }
    s += `<g opacity="${opacity}"><animateTransform attributeName="transform" type="translate" values="0 0;${Math.round(dx / 2) + wob} ${Math.round(dy / 2)};${dx} ${dy}" dur="${d}s" begin="${b}s" ${rep}/>`
      + `<animate attributeName="opacity" values="${opacity};${opacity};0" dur="${d}s" begin="${b}s" ${rep}/>${rects}</g>`;
  }
  return `<g>${s}</g>`;
}
/** Radial gradient (colour → transparent). Returns a fill value 'url(#…)'. */
export function radial(color, opacity = 0.5) {
  const id = `rg${hash(color + opacity)}`;
  def(id, `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${opacity}"/><stop offset=".45" stop-color="${color}" stop-opacity="${(opacity * 0.35).toFixed(3)}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`);
  return `url(#${id})`;
}
export function glow(cx, cy, r, color, { opacity = 0.5, pulse: p = false, dur = 2.2, begin = 0 } = {}) {
  const c = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${radial(color, opacity)}"/>`;
  return p ? pulse(c, { dur, to: 0.6, begin }) : c;
}

// ── scenery ──────────────────────────────────────────────────────────────
const TORCH_PAL = { K: '#0c0a14', Y: '#f6c84e', y: '#a06c18', t: '#5a3a22', T: '#8a5a32', O: '#ff8a1e', o: '#ffd34d', R: '#e8342c', W: '#fff6c8' };
const TORCH_BASE = ['KKKKKKK', 'KYYYYYK', '.KyyyK.', '..KTK..', '..KtK..', '..KTK..', '..KtK..', '...K...'];
const FLAMES = [
  ['...R...', '..ROR..', '..OoO..', '.ROooR.', '.OoWoO.', 'ROoWoOR', '.OoooO.'],
  ['..R....', '..OR...', '.ROoR..', '.OoooR.', 'ROoWoO.', '.OoWoOR', '.OoooO.'],
  ['....R..', '...RO..', '..ROoR.', '.ROooO.', '.OoWoOR', 'ROoWoO.', '.OoooO.'],
];
/** Wall torch (7 px-units wide). (x, y) = top-left of the torch head; flame sits above it. */
export function torch(x, y, { px = 4, delay = 0, glowR = null } = {}) {
  const ids = FLAMES.map((f, i) => sprite(`flame${i}`, f, px, TORCH_PAL));
  const r = glowR ?? px * 26;
  return `<circle cx="${x + 3.5 * px}" cy="${y - px * 2}" r="${r}" fill="${radial('#ff9a1f', 0.42)}"><animate attributeName="opacity" values="1;.75;.95;.7;1" dur="1.3s" begin="${delay}s" ${rep}/></circle>`
    + pathArt(TORCH_BASE, px, x, y, TORCH_PAL)
    + flipbook(ids, 0.12, x, y - px * 7, delay);
}
export function stars({ seed = 7, n = 40, x = 0, y = 44, w = W, h = 200, color = '#d8d0ff' } = {}) {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < n; i++) {
    const sx = Math.round(x + r() * w), sy = Math.round(y + r() * h), sz = r() > 0.85 ? 3 : 2;
    const tw = r() > 0.55 ? `<animate attributeName="opacity" values="1;.2;1" dur="${(2 + r() * 3).toFixed(1)}s" ${rep}/>` : '';
    s += `<rect x="${sx}" y="${sy}" width="${sz}" height="${sz}" fill="${color}" opacity="${(0.45 + r() * 0.55).toFixed(2)}">${tw}</rect>`;
  }
  return s;
}
export function skyBands(y0, y1, colors = PAL.sky) {
  const bh = (y1 - y0) / colors.length;
  return colors.map((c, i) => `<rect x="0" y="${(y0 + i * bh).toFixed(1)}" width="${W}" height="${(bh + 1).toFixed(1)}" fill="${c}"/>`).join('');
}
function moonGrid(R) {
  const n = 2 * R + 1, g = [];
  const craters = [[-4, -3, 3], [5, 4, 2.2], [-2, 6, 2], [6, -5, 1.6], [-7, 3, 1.5], [1, -8, 1.3]].map(([a, b, c]) => [a * R / 14, b * R / 14, c * R / 14]);
  for (let y = 0; y < n; y++) {
    let row = '';
    for (let x = 0; x < n; x++) {
      const dx = x - R, dy = y - R, d = Math.hypot(dx, dy);
      if (d > R + 0.3) { row += '.'; continue; }
      const shade = (-dx + dy) / R;
      let c = shade > 0.95 ? 'C' : shade > 0.35 ? 'B' : 'A';
      for (const [cx, cy, cr] of craters) {
        const e = Math.hypot(dx - cx, dy - cy);
        if (e < cr) c = e < cr - 0.9 ? 'D' : (dx - cx + dy - cy > 0 ? 'A' : 'D');
      }
      if (d > R - 0.7) c = c === 'A' ? 'B' : 'C';
      row += c;
    }
    g.push(row);
  }
  return g;
}
export function moon(cx, cy, { R = 12, px = 5, color = null } = {}) {
  const pal = color ? { A: color, B: color, C: color, D: color } : { A: '#fbf4d4', B: '#e4d9a8', C: '#c1b285', D: '#a99b70' };
  return `<circle cx="${cx}" cy="${cy}" r="${R * px * 6}" fill="${radial('#fff3c4', 0.3)}"/>` + pathArt(moonGrid(R), px, cx - (R + 0.5) * px, cy - (R + 0.5) * px, pal);
}
function treeGrid(w, h, seed) {
  const g = Array.from({ length: h }, () => Array(w).fill('.'));
  const r = rng(seed);
  const plot = (x, y, t) => { for (let i = -t; i <= t; i++) { const xx = Math.round(x + i), yy = Math.round(y); if (xx >= 0 && xx < w && yy >= 0 && yy < h) g[yy][xx] = 'T'; } };
  const branch = (x, y, ang, len, th, depth) => {
    const steps = Math.ceil(len);
    for (let i = 0; i < steps; i++) { x += Math.cos(ang); y -= Math.sin(ang); ang += (r() - 0.5) * 0.35; plot(x, y, Math.max(0, Math.round(th * (1 - i / steps * 0.5)))); }
    if (depth <= 0) return;
    const kids = 2 + (r() > 0.6 ? 1 : 0);
    for (let k = 0; k < kids; k++) branch(x, y, ang + (k - (kids - 1) / 2) * (0.6 + r() * 0.5), len * (0.55 + r() * 0.2), Math.max(0, th - 1), depth - 1);
  };
  for (let i = -5; i <= 5; i++) for (let j = 0; j < 3 - Math.abs(i) / 3; j++) { const xx = Math.round(w / 2 + i), yy = h - 1 - j; if (g[yy]) g[yy][xx] = 'T'; }
  branch(w / 2, h - 1, Math.PI / 2 + (r() - 0.5) * 0.2, h * 0.38, 3, 4);
  return g.map((row) => row.map((c, x) => (c === 'T' && (row[x + 1] === '.' || x === w - 1) ? 't' : c)).join(''));
}
/** Procedural dead tree standing on groundY, centred-ish at x (left edge). pal: { T: trunk, t: rim light }. */
export const deadTree = (x, groundY, { w = 50, h = 60, seed = 3, px = 3, pal = { T: '#2a1f3c', t: '#4a3a66' } } = {}) =>
  pathArt(treeGrid(w, h, seed), px, x, groundY - h * px, pal);
export function skyline(heights, px, base, fill) {
  let d = '';
  for (let i = 0; i < heights.length;) {
    let n = 1; while (heights[i + n] === heights[i]) n++;
    d += `M${i * px} ${heights[i]}h${n * px}V${base}h-${n * px}z`; i += n;
  }
  return `<path d="${d}" fill="${fill}"/>`;
}
export function fog(y, { opacity = 0.22, dur = 26, color = '#8d7fb8', h = 16 } = {}) {
  let d = '';
  for (let x = 0; x < W * 2; x += 12) { const fh = h + Math.round(Math.sin(x / 23) * 6); d += `M${x} ${y + Math.round(Math.sin(x / 40) * 4)}h12v${fh}h-12z`; }
  return `<g opacity="${opacity}"><animateTransform attributeName="transform" type="translate" values="0 0;-${W} 0" dur="${dur}s" ${rep}/><path fill="${color}" d="${d}"/></g>`;
}
export function brickWall(x, y, w, h, { dark = '#1b1630', mid = '#2b2440', light = '#3a3157' } = {}) {
  const id = `brick${hash(dark + mid + light)}`;
  def(id, `<pattern id="${id}" patternUnits="userSpaceOnUse" width="40" height="20"><rect width="40" height="20" fill="${dark}"/><path fill="${mid}" d="M1 1h38v8H1zM-19 11h38v8h-38zM21 11h38v8H21z"/><path fill="${light}" d="M1 1h38v2H1zM-19 11h38v2h-38zM21 11h38v2H21z"/></pattern>`);
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id})"/>`;
}
export function floorTiles(x, y, w, h) {
  def('floorT', `<pattern id="floorT" patternUnits="userSpaceOnUse" width="60" height="30"><rect width="60" height="30" fill="#1d1724"/><path fill="#2e2638" d="M1 1h58v13H1zM-29 16h58v13h-58zM31 16h58v13H31z"/><path fill="#3b3247" d="M1 1h58v2H1zM-29 16h58v2h-58zM31 16h58v2H31z"/></pattern>`);
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#floorT)"/><rect x="${x}" y="${y}" width="${w}" height="4" fill="#4a3f5a"/>`;
}

/** Stone arch: ring of stone around a dark void, semicircular top. (x, y) top-left, w×h in px units. */
export function arch(x, y, w, h, { px = 6, ring = 2, pal = { K: '#0c0a14', T: '#6b5a4a', Z: '#06040b' } } = {}) {
  const r = w / 2, rows = [];
  for (let yy = 0; yy < h; yy++) {
    let row = '';
    for (let xx = 0; xx < w; xx++) {
      const dx = xx + 0.5 - r;
      let inside, d;
      if (yy < r) { const dy = r - (yy + 0.5); d = Math.hypot(dx, dy); inside = d <= r; d = r - d; }
      else { inside = true; d = Math.min(xx + 0.5, w - xx - 0.5); }
      row += !inside ? '.' : d < 1 ? 'K' : d < ring + 1 ? 'T' : d < ring + 2 ? 'K' : 'Z';
    }
    rows.push(row);
  }
  return pathArt(rows, px, x, y, pal);
}
/**
 * Night cottage (timber frame, thatched roof, warm flickering windows, chimney smoke).
 * (x, groundY) = bottom-left. w, wallH, roofH in px units (px = 4). lit: windows glow. day: daylight palette.
 */
export function cottage(x, groundY, { w = 30, wallH = 13, roofH = 11, px = 4, seed = 1, lit = true, smoke = true, day = false } = {}) {
  const r = rng(seed);
  const H = roofH + wallH, g = Array.from({ length: H }, () => Array(w + 2).fill('.'));
  const set = (cx, cy, c) => { if (cy >= 0 && cy < H && cx >= 0 && cx < w + 2) g[cy][cx] = c; };
  // walls
  for (let yy = roofH; yy < H; yy++) for (let xx = 1; xx <= w; xx++) set(xx, yy, xx === 1 || xx === w || yy === H - 1 || yy === roofH || xx === Math.floor(w / 2) ? 'B' : 'P');
  for (let xx = 1; xx <= w; xx++) set(xx, roofH + Math.floor(wallH / 2) - 1, 'B');
  // door
  const dx0 = Math.floor(w / 2) + 3;
  for (let yy = H - 7; yy < H - 1; yy++) for (let xx = dx0; xx < dx0 + 4; xx++) set(xx, yy, xx === dx0 || yy === H - 7 ? 'K' : 'D');
  set(dx0 + 3, H - 4, 'Y');
  // windows
  const wins = [[4, roofH + 3], [w - 8, roofH + 3]].filter(([wx]) => wx + 4 < dx0 || wx > dx0 + 4);
  for (const [wx, wy] of wins) for (let yy = wy; yy < wy + 4; yy++) for (let xx = wx; xx < wx + 4; xx++) set(xx, yy, xx === wx || xx === wx + 3 || yy === wy || yy === wy + 3 ? 'K' : (xx === wx + 1 || yy === wy + 1 ? 'Y' : 'y'));
  // roof (thatch with stripes) + chimney
  const cx0 = Math.floor(w * 0.22);
  for (let yy = 0; yy < roofH + 1; yy++) {
    const half = Math.round(((yy + 1) / (roofH + 1)) * ((w + 2) / 2));
    for (let xx = Math.floor((w + 2) / 2) - half; xx < Math.ceil((w + 2) / 2) + half; xx++) {
      const edge = xx === Math.floor((w + 2) / 2) - half || xx === Math.ceil((w + 2) / 2) + half - 1 || yy === roofH;
      set(xx, yy, edge ? 'K' : (yy + Math.floor(xx / 3)) % 4 === 0 ? 'r' : 'R');
    }
  }
  for (let yy = 1; yy < Math.round(roofH * 0.6); yy++) for (let xx = cx0; xx < cx0 + 3; xx++) set(xx, yy, xx === cx0 || yy === 1 ? 'K' : 'S');
  const pal = day
    ? { K: '#2a1e1a', B: '#5a3a22', P: '#e8d8b0', R: '#c8a050', r: '#9a7630', D: '#6b4a2e', Y: '#9ac8e8', y: '#6a98b8', S: '#7a7088' }
    : { K: '#0c0a14', B: '#2a1e1a', P: '#4a4258', R: '#5a4a2a', r: '#3e321c', D: '#3a2618', Y: '#ffcf5a', y: '#e0962a', S: '#3a3346' };
  if (!lit && !day) { pal.Y = '#2a2438'; pal.y = '#1d1828'; }
  const top = groundY - H * px;
  let s = pathArt(g.map((row) => row.join('')), px, x - px, top, pal);
  if (lit && !day) for (const [wx, wy] of wins) s += flicker(`<rect x="${x + (wx - 1) * px}" y="${top + wy * px}" width="${4 * px}" height="${4 * px}" fill="${radial('#ffcf5a', 0.9)}"/>`, { dur: 2 + r() * 2, min: 0.4 }) + glow(x + (wx + 1) * px, top + (wy + 2) * px, 9 * px, '#ffb454', { opacity: 0.25 });
  if (smoke) s += particles({ seed: seed + 9, n: 7, x: x + (cx0 - 0.5) * px, y: top - 2, w: 2 * px, h: 4, colors: day ? ['#d8d4e0'] : ['#5e5480', '#4a4268'], size: [5, 9], dx: -30, dy: -70, dur: 5, opacity: 0.55 });
  return s;
}

// ── cast ─────────────────────────────────────────────────────────────────
/**
 * Draw a cast member from sprites.mjs CAST at (x, y) = top-left. Frames animate as a flipbook.
 * opts: px (override scale), flip (face the other way), frame (static frame index, disables the
 *       flipbook), dur (frame duration s), begin (s offset so a crowd doesn't move in sync), pal (palette overrides),
 *       silhouette (flat colour for every pixel except the chars in `keep`, default 'CW' = glowing eyes/visors).
 * Returns markup. actorSize(name, px?) → {w, h} in SVG px.
 */
export function actor(name, x, y, { px, flip = false, frame = null, dur, begin = 0, pal = {}, silhouette = null, keep = 'CW' } = {}) {
  const c = CAST[name];
  if (!c) throw new Error(`actor: unknown cast member "${name}" (see CAST in sprites.mjs)`);
  const p = px ?? c.px;
  const palette = { ...c.pal, ...pal };
  let ids;
  if (silhouette) {
    // one merged path per frame (colour comes from the <use>), plus the glowing `keep` pixels on top
    ids = c.frames.map((g) => {
      const mask = g.map((r) => [...r].map((ch) => (ch === '.' || ch === ' ' ? '.' : 'X')).join(''));
      const glowG = g.map((r) => [...r].map((ch) => (keep.includes(ch) ? ch : '.')).join(''));
      const m = sprite(`${name}M`, mask, p, { X: 'inherit' }, { flip }).replace(/fill="inherit" /g, '');
      const id = `${name}S-${hash(m + silhouette + glowG.join(''))}`;
      const hasGlow = glowG.some((r) => /[^.]/.test(r));
      return def(id, `<g id="${id}">${use(m, 0, 0, `fill="${silhouette.split('@')[0]}"${silhouette.includes('@') ? ` fill-opacity="${silhouette.split('@')[1]}"` : ''}`)}${hasGlow ? pathArt(glowG, p, 0, 0, palette, { flip }) : ''}</g>`);
    });
  } else ids = c.frames.map((g) => sprite(name, g, p, palette, { flip })); // identical frames share one def
  if (frame !== null) return use(ids[frame], x, y);
  return flipbook(ids, dur ?? c.dur ?? 0.5, x, y, begin);
}
export function actorSize(name, px) {
  const c = CAST[name]; const p = px ?? c.px;
  return { w: c.frames[0][0].length * p, h: c.frames[0].length * p };
}
/** 96×96 portrait (32×32 grid at 3px) with an occasional blink if the portrait defines one. */
export function portrait(speaker, x, y) {
  const p = PORTRAITS[speaker];
  if (!p) return '';
  let s = pathArt(p.grid, 3, x, y, p.pal);
  if (p.blink) {
    const patch = p.blink.map(([bx, by, c]) => `<rect x="${x + bx * 3}" y="${y + by * 3}" width="3" height="3" fill="${p.pal[c] ?? c}"/>`).join('');
    s += `<g visibility="hidden"><animate attributeName="visibility" values="hidden;visible;hidden" keyTimes="0;.94;.97" dur="${p.blinkDur ?? 4.2}s" ${rep} calcMode="discrete"/>${patch}</g>`;
  }
  return s;
}
export function relicIcon(i, x, y, px = 2) {
  const r = RELIC_ICONS[RELICS[i - 1].icon];
  return use(sprite(`relic${i}`, r.grid, px, r.pal), x, y);
}

// ── speakers ─────────────────────────────────────────────────────────────
// font: family stack; size px; weight; style; caps (force upper/lower); ls letter-spacing;
// em = average glyph width in em (for the width check); text = line colour; fx = effect.
export const SPEAKERS = {
  NARRATOR: { name: 'NARRATOR', color: '#f3e3b5', pixel: true, text: '#f3e3b5', portrait: false },
  APEHEAD: { name: 'APEHEAD', color: '#f6c84e', dot: '🟡', font: SANS, size: 22, weight: 600, em: 0.56, text: '#fff6dc' },
  MIRRA: { name: 'ELDER MIRRA', color: '#ffb454', dot: '🟤', font: SERIF, size: 25, style: 'italic', em: 0.47, text: '#ffe9c7' },
  BRAKKA: { name: 'BRAKKA IRONLEVER', color: '#ff7a3d', dot: '🟠', font: BLACK, size: 21, weight: 900, em: 0.66, text: '#ffe0cc' },
  CHOIR: { name: 'THE CLOCKWORK CHOIR', color: '#5ce1ff', dot: '🔵', font: MONO, size: 21, weight: 700, caps: 'upper', ls: 1, em: 0.6, text: '#c8f6ff', fx: 'scan' },
  GUS: { name: 'GUS', color: '#7dff8a', dot: '🟢', font: ROUND, size: 23, weight: 700, caps: 'lower', em: 0.56, text: '#d6ffd9', fx: 'wobble' },
  GATEKEEPER: { name: 'THE GATEKEEPER', color: '#c9c2d9', dot: '⚪', font: SERIF, size: 21, weight: 700, caps: 'upper', ls: 3, em: 0.68, text: '#e8e3f2' },
  XALZOR: { name: "XAL'ZOR", color: '#d36bff', dot: '🟣', font: MONO, size: 21, weight: 700, em: 0.6, text: '#f0d6ff', fx: 'jitter' },
  MIMIC: { name: 'MIMIC', color: '#ff6b8b', font: SERIF, size: 22, style: 'italic', ls: 1, em: 0.5, text: '#ffc4d0', fx: 'whisper' },
  VELKRANN: { name: "VEL'KRANN", color: '#a6ff4d', font: SERIF, size: 26, style: 'italic', weight: 700, em: 0.5, text: '#c8ff8a', fx: 'lich', bg: '#020402' },
  VILLAGERS: { name: 'VILLAGERS', color: '#ffd9a0', pixel: true, text: '#ffffff' },
};
const BOX_H = 108, PANEL_PAD = 10, ROW_GAP = 8, HUD_H = 44;
const estWidth = (sp, line) => (sp.pixel ? twidth(line, 3) : line.length * (sp.size * sp.em + (sp.ls || 0)));
function fxDefs(sp) {
  if (sp.fx !== 'lich') return '';
  def('fxLich', `<filter id="fxLich" x="-10%" y="-60%" width="120%" height="220%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
  return ' filter="url(#fxLich)"';
}
function fxWrap(sp, inner, ax = 0, ay = 0) {
  switch (sp.fx) {
    case 'lich': // slight tremble
      return `<g><animateTransform attributeName="transform" type="translate" values="0 0;1 -1;-1 0;0 1;1 0;0 0" dur="0.35s" ${rep} calcMode="discrete"/>${inner}</g>`;
    case 'jitter': // twitchy eye: rare sharp jumps
      return `<g><animateTransform attributeName="transform" type="translate" values="0 0;2 0;0 0;-2 1;0 0;0 0;1 -1;0 0" keyTimes="0;.08;.12;.4;.44;.7;.74;1" dur="2.2s" ${rep} calcMode="discrete"/>${inner}</g>`;
    case 'wobble': // jelly, skewed around the text block's own anchor
      return `<g transform="translate(${ax} ${ay})"><g><animateTransform attributeName="transform" type="skewX" values="0;-4;0;4;0" dur="1.8s" ${rep} calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1;.45 0 .55 1"/><g transform="translate(${-ax} ${-ay})">${inner}</g></g></g>`;
    case 'whisper':
      return pulse(inner, { dur: 2.6, to: 0.7 });
    default: return inner;
  }
}
/**
 * Dialogue box. speaker: key of SPEAKERS. lines: string (auto-wrapped) or array of ≤2 strings.
 * (x, y, w, h) box rect; defaults: full panel width, 108 tall. Throws if a line won't fit.
 */
export function dialogue({ speaker, lines, x = 16, y = 0, w = W - 32, h = BOX_H }) {
  const sp = SPEAKERS[speaker];
  if (!sp) throw new Error(`dialogue: unknown speaker "${speaker}" (one of ${Object.keys(SPEAKERS).join(', ')})`);
  const hasPortrait = sp.portrait !== false && PORTRAITS[speaker];
  const tx = x + (hasPortrait ? 120 : 22), avail = x + w - 34 - tx;
  const fix = (l) => { const t = String(l).replace(/\.\.\./g, '…'); return sp.caps === 'upper' ? t.toUpperCase() : sp.caps === 'lower' ? t.toLowerCase() : t; };
  let ls = Array.isArray(lines) ? lines.map(fix) : null;
  if (!ls) {
    const perChar = sp.pixel ? 18 : sp.size * sp.em + (sp.ls || 0);
    ls = wrap(fix(lines), Math.floor(avail / perChar));
  }
  if (ls.length > 2) throw new Error(`dialogue(${speaker}): ${ls.length} lines, max 2: ${JSON.stringify(ls)}`);
  for (const l of ls) {
    const e = estWidth(sp, l);
    if (e > avail) throw new Error(`dialogue(${speaker}): line "${l}" ≈${Math.round(e)}px, box text area is ${Math.round(avail)}px (shorten it, or widen the box)`);
  }
  const c = sp.color, boxBg = sp.bg ?? '#0a0816';
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${boxBg}" fill-opacity=".94"/>`;
  s += `<rect x="${x + 1.5}" y="${y + 1.5}" width="${w - 3}" height="${h - 3}" fill="none" stroke="${c}" stroke-width="3"/>`;
  s += `<rect x="${x + 5}" y="${y + 5}" width="${w - 10}" height="${h - 10}" fill="none" stroke="#000" stroke-width="2" opacity=".7"/>`;
  for (const [cx, cy] of [[x, y], [x + w - 8, y], [x, y + h - 8], [x + w - 8, y + h - 8]]) s += `<rect x="${cx}" y="${cy}" width="8" height="8" fill="${c}"/><rect x="${cx + 2}" y="${cy + 2}" width="4" height="4" fill="#fff" opacity=".55"/>`;
  if (hasPortrait) {
    const px0 = x + 10, py0 = y + Math.round((h - 96) / 2);
    s += `<rect x="${px0 - 2}" y="${py0 - 2}" width="100" height="100" fill="${c}"/><rect x="${px0}" y="${py0}" width="96" height="96" fill="${PORTRAITS[speaker].bg ?? '#1a1426'}"/>`;
    s += portrait(speaker, px0, py0);
  }
  const nameSc = twidth(sp.name, 3) <= x + w - 16 - tx ? 3 : 2;
  if (twidth(sp.name, nameSc) > x + w - 16 - tx) throw new Error(`dialogue(${speaker}): box too narrow for the name "${sp.name}" (w=${w})`);
  s += ptext(sp.name, tx, y + (nameSc === 3 ? 13 : 16), nameSc, c);
  const filter = fxDefs(sp);
  let body = '';
  if (sp.pixel) {
    ls.forEach((l, i) => { body += ptext(l, tx, y + 46 + i * 28, 3, sp.text); });
  } else {
    const font = `font-family="${sp.font}" font-size="${sp.size}"${sp.weight ? ` font-weight="${sp.weight}"` : ''}${sp.style ? ` font-style="${sp.style}"` : ''}${sp.ls ? ` letter-spacing="${sp.ls}"` : ''}`;
    const base = ls.length === 1 ? [y + 72] : [y + 64, y + 93];
    ls.forEach((l, i) => { body += `<text x="${tx}" y="${base[i]}" ${font} fill="${sp.text}"${filter}>${attr(l)}</text>`; });
    if (sp.fx === 'scan') { // terminal cursor after the last line
      const cx = Math.round(tx + estWidth(sp, ls[ls.length - 1]) + 4);
      body += blink(`<rect x="${cx}" y="${base[ls.length - 1] - sp.size + 4}" width="${Math.round(sp.size * 0.55)}" height="${sp.size - 2}" fill="${sp.color}"/>`, { dur: 0.8, on: 0.5 });
    }
  }
  s += fxWrap(sp, body, tx, y + h / 2);
  s += blink(`<path d="M${x + w - 30} ${y + h - 24}h14l-7 8z" fill="${c}"/>`, { dur: 0.9 });
  return s;
}
/**
 * Pixel speech bubble (for one-word quips in the stage: "BZZT.", "hi."). (x, y) = top-left of the box;
 * tail points down from the left/right end (tail: 'left' | 'right' | 'none'). Lines are pixel-font.
 */
export function bubble(lines, x, y, { sc = 3, fill = '#f4efe6', ink = '#0c0a14', tail = 'left' } = {}) {
  const ls = Array.isArray(lines) ? lines : [lines];
  const pw = Math.max(...ls.map((l) => twidth(l, sc))) + 8 * sc, ph = ls.length * 10 * sc + 3 * sc;
  const u = sc;
  let s = `<rect x="${x - u}" y="${y}" width="${pw + 2 * u}" height="${ph}" fill="${ink}"/><rect x="${x}" y="${y - u}" width="${pw}" height="${ph + 2 * u}" fill="${ink}"/>`;
  s += `<rect x="${x}" y="${y}" width="${pw}" height="${ph}" fill="${fill}"/>`;
  if (tail !== 'none') {
    const tx = tail === 'left' ? x + 4 * u : x + pw - 8 * u;
    const dir = tail === 'left' ? -1 : 1;
    s += `<rect x="${tx}" y="${y + ph}" width="${4 * u}" height="${u}" fill="${fill}"/>`;
    for (let i = 0; i < 3; i++) s += `<rect x="${tx + (dir < 0 ? -i * u : (i + 1) * u)}" y="${y + ph + (i + 1) * u}" width="${(3 - i) * u}" height="${u}" fill="${fill}"/>`;
    s += `<path d="M${tx - u} ${y + ph}h${u}v${u}h-${u}z M${tx + 4 * u} ${y + ph}h${u}v${u}h-${u}z" fill="${ink}"/>`;
  }
  ls.forEach((l, i) => { s += ptext(l, x + pw / 2, y + 2 * u + i * 10 * u, sc, ink, { anchor: 'middle', shadow: null }); });
  return s;
}
/** Narrator caption bar: parchment pixel text on a dark band, centred on x. */
export function caption(text, x, y, { color = '#f3e3b5', sc = 3, pad = 14 } = {}) {
  const w = twidth(text, sc) + pad * 2;
  return `<rect x="${Math.round(x - w / 2)}" y="${y}" width="${w}" height="${7 * sc + pad}" fill="#0a0816" fill-opacity=".88" stroke="${color}" stroke-width="2"/>` + ptext(text, x, y + pad / 2, sc, color, { anchor: 'middle' });
}

// ── HUD ──────────────────────────────────────────────────────────────────
/** Ghouls-style top strip: blinking 1UP, APEHEAD, chapter label, 6 relic slots (first `relics` filled). */
export function hud({ chapter = '', relics = 0 } = {}) {
  let s = `<rect x="0" y="0" width="${W}" height="${HUD_H}" fill="#000"/><rect x="0" y="${HUD_H - 2}" width="${W}" height="2" fill="#2a2140"/>`;
  s += blink(ptext('1UP', 18, 12, 3, PAL.blood), { dur: 1, on: 0.75 }) + ptext('APEHEAD', 90, 12, 3, '#fff');
  const sc = twidth(chapter, 3) <= 420 ? 3 : 2;
  s += ptext(chapter, 452, sc === 3 ? 12 : 15, sc, PAL.gold, { anchor: 'middle' });
  for (let i = 0; i < 6; i++) {
    const sx = 686 + i * 34, sy = 6;
    const on = i < relics;
    s += `<rect x="${sx}" y="${sy}" width="30" height="30" fill="${on ? '#1d1630' : '#100c1a'}" stroke="${on ? PAL.gold : '#3a3157'}" stroke-width="2"/>`;
    s += on ? relicIcon(i + 1, sx + 1, sy + 1) : `<rect x="${sx + 12}" y="${sy + 12}" width="6" height="6" fill="#2a2140"/>`;
  }
  return s;
}

// ── scene ────────────────────────────────────────────────────────────────
const svgOpen = (H, label) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" shape-rendering="crispEdges" role="img" aria-label="${attr(label)}">`;
function finish(H, label, markup) {
  return `${svgOpen(H, label)}\n<title>${attr(label)}</title>\n<defs>${collectDefs(markup)}</defs>\n${markup}\n</svg>\n`;
}
/**
 * A complete 900-wide scene SVG.
 *  id        scene id → chapter + relic count from story.mjs SCENES (override with chapter/relics)
 *  label     aria-label (also becomes the README alt text): describe the scene + any clues in it
 *  body      string, or ({ top, bottom, W, H }) => string — the stage art, absolute coords
 *  dialogues array of rows; a row is a dialogue spec {speaker, lines, w?} or an array of specs that
 *            sit side by side (give the short one a `w`; the rest share the remaining width)
 *  stageH    stage height (default 340 with ≤1 dialogue row → H 512; 312 with 2 rows → H 600);
 *            height overrides the total height
 *  overlay   true = dialogue boxes float over the bottom of the stage instead of a separate panel
 *  bg        background colour behind everything
 */
export function scene({ id, chapter, relics, label, body = '', dialogues = [], stageH, height, overlay = false, bg: bgc = PAL.night }) {
  const meta = SCENES[id] ?? {};
  chapter ??= meta.chapter ?? '';
  relics ??= meta.relics ?? 0;
  if (!label) throw new Error(`scene(${id}): label (aria-label / alt text) is required`);
  const rows = dialogues.map((r) => (Array.isArray(r) ? r : [r]));
  stageH ??= rows.length > 1 ? 312 : 340; // → 512 tall with one dialogue row, 600 with two
  const panelH = rows.length ? rows.length * BOX_H + (rows.length - 1) * ROW_GAP + PANEL_PAD * 2 : 0;
  const H = height ?? HUD_H + stageH + (overlay ? 0 : panelH);
  const top = HUD_H, bottom = overlay ? H : H - panelH;
  const art = typeof body === 'function' ? body({ top, bottom, W, H }) : body;
  let panel = '';
  if (rows.length) {
    let y = H - panelH + PANEL_PAD;
    if (!overlay) panel += `<rect x="0" y="${H - panelH}" width="${W}" height="${panelH}" fill="#000"/><rect x="0" y="${H - panelH}" width="${W}" height="2" fill="#2a2140"/>`;
    for (const row of rows) {
      const fixed = row.reduce((a, d) => a + (d.w ?? 0), 0), free = row.filter((d) => !d.w).length;
      const gap = 10, total = W - 32 - gap * (row.length - 1);
      let x = 16;
      for (const d of row) {
        const w = d.w ?? Math.floor((total - fixed) / free);
        panel += dialogue({ ...d, x, y, w });
        x += w + gap;
      }
      y += BOX_H + ROW_GAP;
    }
  }
  const markup = `<rect width="${W}" height="${H}" fill="${bgc}"/>\n<g>${art}</g>\n${panel}\n${hud({ chapter, relics })}\n`
    + `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="none" stroke="#000" stroke-width="2"/>`;
  return finish(H, label, markup);
}

/** Simple standalone SVG (banners, special cards): full control, same defs pipeline. */
export const svgDoc = (H, label, markup) => finish(H, label, markup);

// ── placeholder scene (for scenes not built yet) ─────────────────────────
/** "Under construction" scene: crypt wall, torches, the ape, a sign, optional clue `notes` (pixel lines). */
export function placeholder({ id, title, dialogues = [], label, notes = [] }) {
  const body = ({ top, bottom }) => {
    let s = brickWall(0, top, W, bottom - top - 60) + floorTiles(0, bottom - 60, W, 60);
    s += torch(150, top + 100, { px: 4 }) + torch(722, top + 100, { px: 4, delay: 0.4 });
    s += actor('ape', 60, bottom - 60 - actorSize('ape').h + 10);
    const sh = 120 + notes.length * 26;
    s += `<rect x="230" y="${top + 34}" width="440" height="${sh}" fill="#0a0816" stroke="#f6c84e" stroke-width="4" stroke-dasharray="16 8"/>`;
    s += ptext('SCENE UNDER CONSTRUCTION', 450, top + 54, 2, '#ffb454', { anchor: 'middle' });
    s += ptext(title, 450, top + 82, 4, '#fff', { anchor: 'middle' });
    notes.forEach((n, i) => { s += ptext(n, 450, top + 126 + i * 26, 2, '#f3e3b5', { anchor: 'middle' }); });
    s += ptext(`SCENE ID: ${id}`, 450, top + sh + 6, 2, '#8d7fb0', { anchor: 'middle' });
    s += particles({ seed: 3, n: 14, y: top + 40, h: bottom - top - 80, colors: ['#8d7fb0', '#5e5480'], dy: -40, dur: 6, opacity: 0.6 });
    return s;
  };
  return scene({ id, label: label ?? `${title} (placeholder scene)`, body, dialogues });
}

// ── banners ──────────────────────────────────────────────────────────────
const corners = (x, y, w, h, c, s = 10) => [[x, y], [x + w - s, y], [x, y + h - s], [x + w - s, y + h - s]].map(([a, b]) => `<rect x="${a}" y="${b}" width="${s}" height="${s}" fill="${c}"/>`).join('');
/** 900×116 RELIC ACQUIRED banner for relic i (1..6). */
export function relicBanner(i) {
  const r = RELICS[i - 1], H = 116;
  let s = `<rect width="${W}" height="${H}" fill="#07061a"/>`;
  s += `<rect x="4" y="4" width="${W - 8}" height="${H - 8}" fill="none" stroke="${PAL.gold}" stroke-width="4"/><rect x="12" y="12" width="${W - 24}" height="${H - 24}" fill="none" stroke="${PAL.goldDk}" stroke-width="2"/>` + corners(4, 4, W - 8, H - 8, PAL.red, 12);
  // relic on a glowing pedestal socket
  s += glow(84, 58, 70, '#ffd34d', { opacity: 0.45, pulse: true, dur: 1.6 });
  s += `<rect x="40" y="20" width="88" height="76" fill="#120d22" stroke="${PAL.gold}" stroke-width="3"/>`;
  s += float(relicIcon(i, 49, 24, 5), { dy: -4, dur: 1.6 });
  for (const [x, y, d] of [[36, 26, 0], [126, 32, 0.5], [118, 90, 0.9], [46, 88, 1.3], [84, 16, 0.3]]) {
    s += blink(`<path fill="#fff6b0" d="M${x} ${y - 6}h3v15h-3zM${x - 6} ${y}h15v3h-15z"/>`, { dur: 0.8, begin: d });
  }
  s += ptext(`RELIC ACQUIRED  ${i}/6`, 152, 22, 2, PAL.gold);
  s += ptext(r.name, 152, 42, 4, '#fff', { outline: '#1a0f08' });
  s += ptext(r.motto, 152, 80, 3, PAL.parchment);
  // the ape knight holding it up (tiny, in the corner)
  s += actor('apeCheer', 808, 20, { px: 3 });
  return svgDoc(H, `Relic acquired, ${i} of 6: ${r.name}. ${r.motto}.`, s);
}
/** 900×130 ☠ DEATH n/18 banner (title defaults to story.mjs DEATHS[n].title). */
export function deathBanner(n, title = DEATHS[n].title) {
  const H = 130;
  let s = skyBands(0, H, ['#12030a', '#1a050c', '#22070f', '#2c0a12', '#370d16']);
  s += stars({ seed: n * 7, n: 18, y: 6, h: 70, color: '#7a4a6a' });
  // graveyard silhouette with a fresh grave on the right
  const r = rng(n + 3);
  let hills = [];
  for (let i = 0; i < 150; i++) hills.push(Math.round((104 + Math.sin(i / 9) * 5 + Math.sin(i / 3.3) * 2) / 3) * 3);
  s += skyline(hills, 6, H, '#0e0208');
  for (let k = 0; k < 6; k++) { const gx = 330 + k * 90 + Math.round(r() * 30), gh = 16 + Math.round(r() * 10); s += `<rect x="${gx}" y="${100 - gh}" width="14" height="${gh + 6}" fill="#0e0208"/><rect x="${gx + 2}" y="${96 - gh}" width="10" height="4" fill="#0e0208"/>`; }
  s += actor('tombRip', 790, 28, { px: 4 });
  s += particles({ seed: n, n: 10, x: 760, y: 70, w: 110, h: 30, colors: ['#8d7fb8'], size: [3, 5], dy: -30, dur: 5, opacity: 0.4 });
  s += `<rect x="4" y="4" width="${W - 8}" height="${H - 8}" fill="none" stroke="${PAL.redDk}" stroke-width="4"/>` + corners(4, 4, W - 8, H - 8, PAL.blood, 10);
  s += actor('apeBoxers', 34, 12, { px: 4 });
  s += ptext(`☠ DEATH ${n}/${DEATH_COUNT}`, 160, 18, 5, PAL.blood, { outline: '#000' });
  s += ptext(title, 160, 64, 3, '#fff', { outline: '#000' });
  s += blink(ptext('CONTINUE? PICK ANOTHER PATH', 160, 96, 2, '#ffb3b3'), { dur: 1.2 });
  return svgDoc(H, `Death ${n} of ${DEATH_COUNT}: ${title}. The ape knight, armour gone, stands in heart-print boxers beside a fresh grave.`, s);
}
