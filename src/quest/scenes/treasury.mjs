// Ch III · The Treasury (mini-game: spot the honest chest). A vault of glittering coin, three arched
// alcoves numbered I II III, and on the dais in front of them three chests. Two are mimics. The clues
// are drawn in the art (and spelled out in the label, which is the README alt text):
//   I   glittering gold, a tag "WORKS ON MY MACHINE" hanging from its lock, a pink tongue tip peeking
//       out under the lid, and the lid slowly breathing (mimic)
//   II  plain, dusty, cobwebbed, a carved ⟳ rerun rune and a small green check (the honest one)
//   III shiny red lacquer and silver, a "TRUST ME" sign on a stick, teeth marks bitten into the lid (mimic)
// I and II get all the bling, III (drawn by chestII) is the dull honest one.
import {
  scene, W, ptext, twidth, actor, actorSize, torch, particles, glow, pathArt, blink, pulse,
  sway, squash, def, rng, brickWall,
} from '../engine.mjs';

const GROUND = 372; // party's feet
const DAIS = 296;   // top of the dais (chests stand here)
const CHESTS = [378, 572, 766]; // chest centres
const PX = 5, CW = 28, CH = 20, LID = 9; // chest grid: rows [0, LID) are the lid

// ── chest pixel grid (generated): rounded lid, two metal bands, optional lock ─────────────────
function chestGrid({ lock = true } = {}) {
  const g = [];
  for (let y = 0; y < CH; y++) {
    let row = '';
    const inset = y === 0 ? 4 : y === 1 ? 2 : y === 2 ? 1 : 0;
    for (let x = 0; x < CW; x++) {
      if (x < inset || x >= CW - inset) { row += '.'; continue; }
      let c;
      const edge = x === inset || x === CW - 1 - inset || y === 0 || y === CH - 1 || y === LID - 1;
      const band = x === 5 || x === 6 || x === 21 || x === 22;
      if (edge) c = 'K';
      else if (y < LID - 1) c = band ? (x % 2 ? 'M' : 'm') : y <= 2 ? 'H' : x >= CW - 4 ? 'l' : 'L';
      else c = band ? (x % 2 ? 'M' : 'm') : y === CH - 2 || x >= CW - 4 ? 'b' : y === LID ? 'd' : 'B';
      if (lock && x >= 12 && x <= 15 && y >= 6 && y <= 11) c = x === 12 || x === 15 || y === 6 || y === 11 ? 'K' : (y === 9 && (x === 13 || x === 14)) ? 'K' : 'Y';
      row += c;
    }
    g.push(row);
  }
  return g;
}
const LOCKED = chestGrid(), PLAIN = chestGrid({ lock: false });

// the rerun rune: an open ring (clockwise) with an arrowhead at the top-right, 13×13
function runeGrid() {
  const n = 13, c = 6, g = [];
  const A = -60 * Math.PI / 180, P = [c + Math.cos(A) * 5, c + Math.sin(A) * 5];
  const dir = [-Math.sin(A), Math.cos(A)], nrm = [Math.cos(A), Math.sin(A)];
  const T = [[P[0] + dir[0] * 3.6, P[1] + dir[1] * 3.6], [P[0] + nrm[0] * 3.2, P[1] + nrm[1] * 3.2], [P[0] - nrm[0] * 3.2, P[1] - nrm[1] * 3.2]];
  const side = (p, a, b) => (p[0] - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (p[1] - b[1]);
  const inTri = (p) => { const d1 = side(p, T[0], T[1]), d2 = side(p, T[1], T[2]), d3 = side(p, T[2], T[0]); return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)); };
  for (let y = 0; y < n; y++) {
    let row = '';
    for (let x = 0; x < n; x++) {
      const dx = x - c, dy = y - c, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx) * 180 / Math.PI;
      row += (d > 3.6 && d < 6.2 && !(a > -60 && a < 5)) || inTri([x, y]) ? '#' : '.';
    }
    g.push(row);
  }
  return g;
}
const RUNE = runeGrid();
const PALS = {
  gold: { K: '#2a1604', H: '#fff3b0', L: '#f6c84e', l: '#c08a28', B: '#e8b040', b: '#a06c18', d: '#c08a28', M: '#fffbe0', m: '#e0b850', Y: '#ff3b5c' },
  plain: { K: '#1a0f08', H: '#7a5a3e', L: '#6b4a2e', l: '#4e3420', B: '#5e4028', b: '#3e2a18', d: '#4e3420', M: '#5e5a66', m: '#45424e', Y: '#6a6a74' },
  shiny: { K: '#1a0408', H: '#ffb0ba', L: '#d8283e', l: '#8e1426', B: '#c02034', b: '#7a1022', d: '#8e1426', M: '#f4f8ff', m: '#aab2c4', Y: '#f4f8ff' },
};

// draws a chest centred on cx, standing on DAIS; lidFx wraps the lid (breathing), extra = overlays
function chest(cx, grid, pal, { lidFx = (s) => s, lidOver = '', bodyOver = '' } = {}) {
  const x = cx - (CW * PX) / 2, y = DAIS - CH * PX;
  const lid = pathArt(grid.slice(0, LID), PX, x, y, pal);
  const bodyArt = pathArt(grid.slice(LID), PX, x, y + LID * PX, pal);
  let s = `<rect x="${x + 4}" y="${DAIS - 4}" width="${CW * PX - 8}" height="8" fill="#000" opacity=".4"/>`;
  s += bodyArt + bodyOver;
  s += `<rect x="${x + 4}" y="${y + (LID - 2) * PX}" width="${CW * PX - 8}" height="${2 * PX}" fill="#0a0408"/>`; // mouth gap behind the lid
  s += lidFx(lid + lidOver);
  return s;
}

// ── the three chests ──────────────────────────────────────────────────────────────────────────
const sparkle = (x, y, d, c = '#fffbe0', dur = 1.6) => blink(`<path fill="${c}" d="M${x} ${y - 6}h2v14h-2zM${x - 6} ${y}h14v2h-14z"/>`, { dur, begin: d, on: 0.3 });

function chestI(cx) {
  const x = cx - (CW * PX) / 2, y = DAIS - CH * PX;
  // the lid breathes: rises a few px, holds, settles (closed at t=0)
  const breathe = (s) => `<g><animateTransform attributeName="transform" type="translate" values="0 0;0 -5;0 -5;0 0;0 0" keyTimes="0;.3;.45;.7;1" dur="3.4s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;0 0 1 1;.45 0 .55 1;0 0 1 1"/>${s}</g>`;
  // teeth glimpsed in the gap when the lid lifts (drawn in the mouth, behind the lid)
  const u = PX, my = y + (LID - 2) * u;
  const teeth = `<path fill="#f4efe6" d="${[3, 7, 19, 23].map((c) => `M${x + c * u} ${my}h${u}v${u + 2}h-${u}z`).join('')}"/>`;
  // tongue tip peeking out under the lid, right of the lock
  const ty0 = y + LID * u - 2;
  const tongue = `<path fill="#ff6b8b" d="M${x + 17 * u} ${ty0}h${4 * u}v${2 * u}h-${4 * u}zM${x + 17 * u + 3} ${ty0 + 2 * u}h${4 * u - 6}v${u + 1}h-${4 * u - 6}z"/><path fill="#c23a5a" d="M${x + 19 * u - 1} ${ty0 + 2}h3v${2 * u + 2}h-3z"/><path fill="#ffc4d2" d="M${x + 17 * u + 2} ${ty0 + 2}h4v3h-4z"/>`;
  let s = glow(cx, DAIS - 40, 110, '#ffd34d', { opacity: 0.35, pulse: true, dur: 2 });
  s += chest(cx, LOCKED, PALS.gold, { lidFx: breathe, bodyOver: teeth + tongue });
  // glitter
  s += sparkle(x + 12, y + 8, 0) + sparkle(x + 124, y + 18, 0.5) + sparkle(x + 48, y + 66, 0.9) + sparkle(x + 128, y + 78, 1.2) + sparkle(x - 8, y + 50, 0.3);
  // luggage tag dangling from the lock: WORKS ON MY MACHINE
  const tw = twidth('MY MACHINE', 2) + 16, tx = cx - tw / 2, ty = DAIS + 6;
  const ly = y + 10 * PX;
  const tag = `<path d="M${cx - 1} ${ly}h2v${ty - ly}h-2z" fill="#e9dcc0"/>`
    + `<rect x="${tx - 2}" y="${ty - 2}" width="${tw + 4}" height="44" fill="#2a1604"/><rect x="${tx}" y="${ty}" width="${tw}" height="40" fill="#f3e3b5"/><rect x="${tx}" y="${ty + 36}" width="${tw}" height="4" fill="#d8c08a"/><rect x="${cx - 3}" y="${ty + 3}" width="6" height="4" fill="#2a1604"/>`
    + ptext('WORKS ON', cx, ty + 9, 2, '#7a1a10', { anchor: 'middle', shadow: null }) + ptext('MY MACHINE', cx, ty + 23, 2, '#7a1a10', { anchor: 'middle', shadow: null });
  s += sway(tag, { deg: 2.5, cx, cy: ly, dur: 3.4 });
  return s;
}

function chestII(cx) {
  const x = cx - (CW * PX) / 2, y = DAIS - CH * PX;
  // carved rerun rune (incised: dark fill with a light lower edge) and a small green check
  const rx = cx - 26, ry = y + LID * PX + 2;
  const rune = pathArt(RUNE, 4, rx + 2, ry + 2, { '#': '#9a7a52' }) + pathArt(RUNE, 4, rx, ry, { '#': '#24160a' });
  const check = ptext('✓', x + 24.5 * PX, y + (LID + 3) * PX, 3, '#5cff6a', { anchor: 'middle', shadow: '#123a0e' });
  // dust on the lid and a cobweb in the corner
  const dust = `<path fill="#b8b0a0" opacity=".55" d="M${x + 15} ${y + 10}h10v5h-10zM${x + 45} ${y + 15}h15v5h-15zM${x + 75} ${y + 5}h10v5h-10zM${x + 110} ${y + 20}h10v5h-10zM${x + 35} ${y + 28}h5v5h-5zM${x + 90} ${y + 25}h10v5h-10zM${x + 60} ${y + 30}h5v5h-5z"/><path fill="#b8b0a0" opacity=".35" d="M${x + 20} ${y + 60}h10v5h-10zM${x + 100} ${y + 80}h15v5h-15zM${x + 50} ${y + 85}h5v5h-5z"/>`;
  const web = `<path fill="#d8d4e0" opacity=".5" d="M${x + 4} ${y + 4}h20v2h-20zM${x + 4} ${y + 4}h2v20h-2zM${x + 6} ${y + 6}h2v2h-2zM${x + 8} ${y + 8}h2v2h-2zM${x + 10} ${y + 10}h2v2h-2zM${x + 4} ${y + 14}h10v2h-10zM${x + 14} ${y + 4}h2v10h-2z"/>`;
  let s = chest(cx, PLAIN, PALS.plain, { lidOver: dust + web, bodyOver: rune + check });
  // dust motes drifting down through a thin beam of light
  s += `<path d="M${cx - 30} 60h44l40 ${DAIS - 60}h-60z" fill="#fff3c4" opacity=".05"/>`;
  s += particles({ seed: 22, n: 8, x: cx - 40, y: y - 90, w: 80, h: 80, colors: ['#c8c0b0', '#a8a090'], size: 2, dy: 70, dx: 8, dur: 6, opacity: 0.6, group: 2 });
  return s;
}

function chestIII(cx) {
  const x = cx - (CW * PX) / 2, y = DAIS - CH * PX;
  // a bite taken out of the lid's top edge: a scalloped notch with tooth points
  const bx = x + 98, by = y - 1, pts = [];
  for (let i = 0; i <= 14; i++) { const t = Math.PI * (i / 14), r = i % 2 ? 14 : 21; pts.push(`${(bx + Math.cos(t) * r).toFixed(1)},${(by + Math.sin(t) * r).toFixed(1)}`); }
  const marks = `<polygon points="${pts.join(' ')}" fill="#0e0812" stroke="#ffb0ba" stroke-width="2"/>`
    + `<path fill="#5a0a18" d="M${x + 30} ${y + 16}h4v4h-4zM${x + 38} ${y + 19}h4v4h-4zM${x + 46} ${y + 20}h4v4h-4zM${x + 54} ${y + 19}h4v4h-4zM${x + 62} ${y + 16}h4v4h-4z"/>`;
  // polished shine: a white streak sweeping across the lid
  def('treasuryShineClip', `<clipPath id="treasuryShineClip"><rect x="${x + 4}" y="${y + 4}" width="${CW * PX - 8}" height="${CH * PX - 8}"/></clipPath>`);
  const shine = `<g clip-path="url(#treasuryShineClip)"><g><animateTransform attributeName="transform" type="translate" values="-60 0;-60 0;150 0" keyTimes="0;.6;1" dur="3s" repeatCount="indefinite"/><path d="M${x + 20} ${y}h12l-40 ${CH * PX}h-12zM${x + 38} ${y}h5l-40 ${CH * PX}h-5z" fill="#fff" opacity=".55"/></g></g>`;
  let s = glow(cx, DAIS - 40, 100, '#ff6b8b', { opacity: 0.22, pulse: true, dur: 2.6 });
  s += chest(cx, LOCKED, PALS.shiny, { lidOver: marks }) + shine;
  s += sparkle(x + 16, y + 10, 0.2, '#ffffff', 2.2) + sparkle(x + 100, y + 48, 1.1, '#ffffff', 2.2);
  // hand-painted TRUST ME sign hanging crooked above it on two cords
  const sw = twidth('TRUST ME', 2) + 20, sx = cx - sw / 2, sy = y - 50;
  const sign = `<path d="M${sx + 12} ${sy - 40}h2v40h-2zM${sx + sw - 14} ${sy - 40}h2v40h-2z" fill="#8a6440"/>`
    + `<rect x="${sx - 2}" y="${sy - 2}" width="${sw + 4}" height="30" fill="#1a0f08"/><rect x="${sx}" y="${sy}" width="${sw}" height="26" fill="#8a6440"/><rect x="${sx}" y="${sy}" width="${sw}" height="3" fill="#a88058"/>`
    + ptext('TRUST ME', cx, sy + 7, 2, '#ffffff', { anchor: 'middle', shadow: '#3a1a10' });
  s += sway(`<g transform="rotate(-5 ${cx} ${sy})">${sign}</g>`, { deg: 1.5, cx, cy: sy - 40, dur: 2.8 });
  return s;
}

// ── the vault ─────────────────────────────────────────────────────────────────────────────────
function coinPile(cx, base, w, h, seed) {
  const r = rng(seed);
  let d1 = '', d2 = '', d3 = '';
  for (let x = -w / 2; x < w / 2; x += 4) {
    const t = x / (w / 2), hh = Math.max(4, Math.round((1 - t * t) * h / 4) * 4 + Math.round(r() * 2) * 4);
    d1 += `M${cx + x} ${base - hh}h4v${hh}h-4z`;
    if (r() > 0.5) d2 += `M${cx + x} ${base - hh}h4v4h-4z`;
    if (r() > 0.75) d3 += `M${cx + x} ${base - hh + 8 + Math.round(r() * 3) * 4}h4v4h-4z`;
  }
  return `<path d="${d1}" fill="#c08a28"/><path d="${d2}" fill="#fff3b0"/><path d="${d3}" fill="#8a5a18"/>`;
}

function vault(top) {
  let s = brickWall(0, top, W, DAIS - top + 20, { dark: '#1a1220', mid: '#2a1d2c', light: '#3a2a3a' });
  // three alcoves, one behind each chest, numbered on their keystones
  ['I', 'II', 'III'].forEach((n, i) => {
    const cx = CHESTS[i], aw = 152, ax = cx - aw / 2, ay = top + 50;
    s += `<rect x="${ax - 10}" y="${ay + 30}" width="${aw + 20}" height="${DAIS - ay - 30}" fill="#4a3a52"/>`;
    s += `<path d="M${ax - 10} ${ay + 30}h${aw + 20}v-6h-8v-8h-12v-8h-16v-6h-24v-4h-${aw + 20 - 120}v4h-24v6h-16v8h-12v8h-8z" fill="#4a3a52"/>`;
    s += `<path d="M${ax} ${ay + 36}h${aw}v-6h-8v-8h-12v-8h-16v-4h-${aw - 72}v4h-16v8h-12v8h-8z" fill="#0e0812"/><rect x="${ax}" y="${ay + 36}" width="${aw}" height="${DAIS - ay - 36}" fill="#0e0812"/>`;
    // velvet drape at the back of the alcove
    s += `<path d="M${ax + 8} ${ay + 34}h${aw - 16}v12h-8v-4h-12v6h-${aw - 56}v-6h-12v4h-8z" fill="#6a1a2a"/>`;
    s += coinPile(cx - 50, DAIS, 70, 56, i * 3 + 1) + coinPile(cx + 52, DAIS, 64, 44, i * 3 + 2);
    // numeral plaque on the keystone
    const pw = twidth(n, 4) + 24;
    s += `<rect x="${cx - pw / 2 - 3}" y="${top + 12}" width="${pw + 6}" height="44" fill="#1a0f08"/><rect x="${cx - pw / 2}" y="${top + 15}" width="${pw}" height="38" fill="#c08a28"/><rect x="${cx - pw / 2}" y="${top + 15}" width="${pw}" height="3" fill="#fff3b0"/>`;
    s += ptext(n, cx, top + 20, 4, '#2a1604', { anchor: 'middle', shadow: '#fff3b0' });
  });
  // big hoard heaps against the walls on the left
  s += coinPile(150, DAIS + 6, 220, 70, 9) + coinPile(40, DAIS + 6, 120, 44, 4);
  // a royal banner on the left wall
  const bn = `<rect x="64" y="${top + 6}" width="84" height="6" fill="#5a3a22"/><path d="M70 ${top + 12}h72v118l-36 -18l-36 18z" fill="#8e1a2a"/><path d="M70 ${top + 12}h72v6h-72zM70 ${top + 12}h6v118h-6z" fill="#b02a3a"/><path d="M76 ${top + 24}h60v4h-60z" fill="#f6c84e"/>`
    + `<circle cx="106" cy="${top + 62}" r="20" fill="#f6c84e"/><circle cx="106" cy="${top + 62}" r="14" fill="#c08a28"/>` + pathArt(['K.K.K.K', 'KYKYKYK', 'KYYYYYK', 'KYRYRYK', 'KKKKKKK'], 3, 96, top + 55, { K: '#5a3a10', Y: '#fff3b0', R: '#e8342c' });
  s += sway(bn, { deg: 1.2, cx: 106, cy: top + 8, dur: 5 });
  s += torch(462, top + 130, { px: 4 }) + torch(652, top + 130, { px: 4, delay: 0.4 }) + torch(232, top + 110, { px: 4, delay: 0.8 });
  return s;
}

function dais(bottom) {
  let s = `<rect x="0" y="${DAIS + 10}" width="${W}" height="${bottom - DAIS - 10}" fill="#1d1418"/>`;
  // floor tiles
  def('treasuryFloor', '<pattern id="treasuryFloor" patternUnits="userSpaceOnUse" width="56" height="20"><rect width="56" height="20" fill="#20161c"/><path fill="#2e2028" d="M1 1h54v8H1zM-27 11h54v8h-54zM29 11h54v8H29z"/><path fill="#3a2a32" d="M1 1h54v2H1zM-27 11h54v2h-54zM29 11h54v2H29z"/></pattern>');
  s += `<rect x="0" y="${DAIS + 10}" width="${W}" height="${bottom - DAIS - 10}" fill="url(#treasuryFloor)"/>`;
  // two-step stone dais with a red runner
  const x0 = 290, x1 = 892;
  s += `<rect x="${x0 - 16}" y="${DAIS + 34}" width="${x1 - x0 + 32}" height="${bottom - DAIS - 34}" fill="#3e3450"/><rect x="${x0 - 16}" y="${DAIS + 34}" width="${x1 - x0 + 32}" height="4" fill="#6a6090"/>`;
  s += `<rect x="${x0}" y="${DAIS}" width="${x1 - x0}" height="34" fill="#4a4266"/><rect x="${x0}" y="${DAIS}" width="${x1 - x0}" height="4" fill="#7a70a0"/>`;
  s += `<rect x="${x0}" y="${DAIS + 30}" width="${x1 - x0}" height="4" fill="#2b2440"/>`;
  return s;
}

function party() {
  const feet = (name, px) => GROUND - actorSize(name, px).h;
  let s = glow(150, 300, 140, '#ff9a1f', { opacity: 0.12 });
  const gh = actorSize('gus', 3).h;
  s += squash(actor('gus', 2, GROUND - gh - 6, { px: 3 }), { cx: 41, base: GROUND - 6, amt: 0.05, dur: 1.4 });
  s += actor('brakka', 70, feet('brakka'), { begin: 0.3 });
  s += actor('ape', 176, feet('ape'));
  return s;
}

export default function render() {
  const body = ({ top, bottom }) => {
    let s = vault(top);
    s += dais(bottom);
    // light shafts from above
    s += pulse(`<path d="M300 ${top}h70l90 ${DAIS - top}h-110zM700 ${top}h50l70 ${DAIS - top}h-80z" fill="#fff3c4" opacity=".06"/>`, { dur: 4, to: 0.5 });
    s += chestI(CHESTS[0]) + chestIII(CHESTS[1]) + chestII(CHESTS[2]); // the honest chest stands third (the surviving choice is always listed last)
    // gold glints rising off the hoard
    s += particles({ seed: 31, n: 14, x: 20, y: top + 120, w: 860, h: 160, colors: ['#ffd34d', '#fff3b0'], size: [2, 3], dy: -40, dur: 4, opacity: 0.7, group: 2 });
    s += party();
    return s;
  };
  return scene({
    id: 'treasury',
    label: 'Chapter III, The Treasury. A torch-lit vault heaped with gold coins. On a stone dais stand three chests in alcoves numbered I, II and III. Chest I is glittering gold, with a luggage tag reading WORKS ON MY MACHINE hanging from its lock; the tip of a pink tongue peeks out under its lid, and the lid slowly rises and falls as if breathing. Chest II is shiny red lacquer and silver, with a hand-painted TRUST ME sign beside it and teeth marks bitten into its lid. Chest III is plain, dusty and cobwebbed, with a carved rerun rune (a circular arrow) and a small green check mark. The ape paladin, Brakka the dwarf and Gus the gelatinous cube look on from the left.',
    body,
    dialogues: [
      { speaker: 'MIMIC', lines: ['Open me… I am definitely not a mimic…'] },
    ],
  });
}
