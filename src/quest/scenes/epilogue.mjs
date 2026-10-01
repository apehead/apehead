// Epilogue · Shipwell rejoices. Dawn festival: the sun rises behind the hero, the catacomb mound is
// calm and sealed, fireworks burst, bunting and a SHIPPING IS BORING NOW banner sway over the square.
// The ape is lifted high on a shield by two villagers; the Choir dances, Brakka raises a tankard, Gus
// wears a party hat, Xal'Zor spins as a disco-ball eye scattering light specks, the bard plays, the kids
// jump, Elder Mirra smiles. Everyone bounces out of sync (staggered begins).
import {
  scene, W, ptext, actor, actorSize, skyBands, skyline, particles, glow, cottage, pathArt, sprite,
  flipbook, bubble, bob, float, sway, squash, blink, def, rng,
} from '../engine.mjs';

const GROUND = 332;
const FEET = GROUND + 8;
const feet = (name, px) => FEET - actorSize(name, px).h;
const rep = 'repeatCount="indefinite"';

// ── local pixel art (no CAST sprite for these) ───────────────────────────
const TANKARD = [
  '.WWWW...',
  'WWWWWW..',
  'KWWWWKKK',
  'KBBBBK.K',
  'KByBBK.K',
  'KByBBKKK',
  'KBBBBK..',
  'KKKKKK..',
];
const TANKARD_PAL = { K: '#2a1a10', W: '#fffbe8', B: '#e8a030', y: '#ffd870' };

const PARTY_HAT = [
  '...YY...',
  '...KK...',
  '..KPPK..',
  '..KYYK..',
  '.KPPPPK.',
  '.KYYYYK.',
  'KPPPPPPK',
  'KKKKKKKK',
];
const HAT_PAL = { K: '#3a0c1a', P: '#ff6b8b', Y: '#ffe14a' };

const NOTE = ['..KK', '..KW', '..K.', '..K.', 'KKK.', 'KKK.'];

// round shield, seen from below at an angle (an ellipse): gold rim, red field, gold boss
function shieldGrid(w = 30, h = 6) {
  const rows = [];
  for (let y = 0; y < h; y++) {
    let r = '';
    for (let x = 0; x < w; x++) {
      const dx = (x + 0.5 - w / 2) / (w / 2), dy = (y + 0.5 - h / 2) / (h / 2), d = dx * dx + dy * dy;
      r += d > 1 ? '.' : d > 0.62 ? (y >= h / 2 ? 'g' : 'G') : Math.abs(dx) < 0.14 ? 'G' : y < h / 2 ? 'R' : 'r';
    }
    rows.push(r);
  }
  return rows;
}
const SHIELD_PAL = { G: '#f6c84e', g: '#a06c18', R: '#e8342c', r: '#8e1a1a' };

// pixel disc (sun / disco ball). fn(dx, dy, d) → palette char
function disc(R, fn) {
  const rows = [];
  for (let y = 0; y < 2 * R; y++) {
    let r = '';
    for (let x = 0; x < 2 * R; x++) {
      const dx = (x + 0.5 - R) / R, dy = (y + 0.5 - R) / R, d = Math.sqrt(dx * dx + dy * dy);
      r += d > 1 ? '.' : fn(dx, dy, d, x, y);
    }
    rows.push(r);
  }
  return rows;
}

// ── sky, sun, hills, calm mound ──────────────────────────────────────────
function sky(top) {
  let s = skyBands(top, GROUND, ['#2c2a6e', '#3e3080', '#5a3888', '#7e4088', '#a84c84', '#d0607a', '#ec7c6c', '#ff9f5e', '#ffc463']);
  // a few last stars fading in the deep blue
  const r = rng(31);
  const st = ['', ''];
  for (let i = 0; i < 16; i++) st[i % 2] += `M${Math.round(r() * W)} ${Math.round(top + 4 + r() * 50)}h3v3h-3z`;
  s += blink(`<path d="${st[0]}" fill="#e8e0ff" opacity=".7"/>`, { dur: 2.6, on: 0.7 }) + blink(`<path d="${st[1]}" fill="#e8e0ff" opacity=".6"/>`, { dur: 3.4, begin: -1.2, on: 0.7 });
  // pink dawn clouds
  const cloud = (cx, cy, w, fill, hi) => { let c = ''; for (let i = 0; i < w; i += 8) { const hh = 5 + Math.round(Math.sin((i / w) * Math.PI) * 10); c += `<rect x="${cx + i}" y="${cy - hh}" width="8" height="${hh}" fill="${fill}"/><rect x="${cx + i}" y="${cy - hh}" width="8" height="3" fill="${hi}"/>`; } return c + `<rect x="${cx - 8}" y="${cy}" width="${w + 16}" height="4" fill="${fill}"/>`; };
  s += `<g opacity=".85"><animateTransform attributeName="transform" type="translate" values="0 0;-90 0;0 0" dur="48s" ${rep}/>${cloud(120, 200, 110, '#c45a86', '#ff9aa8')}${cloud(560, 176, 90, '#b4507e', '#ff9aa8')}${cloud(840, 214, 100, '#c45a86', '#ff9aa8')}</g>`;
  return s;
}

function sun() {
  const cx = 458, cy = 232, R = 17, px = 4;
  let s = glow(cx, cy, 230, '#ffd34d', { opacity: 0.5, pulse: true, dur: 4 });
  // slow turning god-rays
  let rays = '';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, b = a + 0.12, L = 420;
    rays += `M${cx} ${cy}L${Math.round(cx + Math.cos(a) * L)} ${Math.round(cy + Math.sin(a) * L)}L${Math.round(cx + Math.cos(b) * L)} ${Math.round(cy + Math.sin(b) * L)}z`;
  }
  s += `<g opacity=".13"><animateTransform attributeName="transform" type="rotate" values="0 ${cx} ${cy};30 ${cx} ${cy}" dur="40s" ${rep}/><path d="${rays}" fill="#fff6c8"/></g>`;
  s += pathArt(disc(R, (dx, dy, d) => (d > 0.86 ? 'O' : d > 0.6 ? 'Y' : dx < -0.2 && dy < -0.2 ? 'W' : 'y')), px, cx - R * px, cy - R * px, { O: '#ffb43c', Y: '#ffd34d', y: '#ffe98a', W: '#fffbe0' });
  return s;
}

function hills() {
  const far = [], near = [];
  for (let i = 0; i < 150; i++) { const t = (i / 150) * Math.PI * 2; far.push(Math.round((270 + Math.sin(t * 2 + 1) * 12 + Math.sin(t * 6) * 6) / 6) * 6); }
  for (let i = 0; i < 150; i++) { const t = (i / 150) * Math.PI * 2; near.push(Math.round((292 + Math.sin(t * 3 + 2) * 8 + Math.sin(t * 7) * 4) / 6) * 6); }
  let s = skyline(far, 6, GROUND, '#9a4a78');
  s += mound();
  s += skyline(near, 6, GROUND, '#6e3466');
  return s;
}

function mound() {
  // the Catacombs, now just a quiet barrow on the horizon: sealed door, a flower, the morning on it
  const cols = [];
  for (let i = 0; i < 50; i++) { const t = (i - 25) / 25; cols.push(Math.round((262 - Math.max(0, 1 - t * t) * 76 + Math.abs(Math.sin(i * 1.7)) * 3) / 4) * 4); }
  let s = `<g transform="translate(640 0)">${skyline(cols, 4, 300, '#5a2c5a')}${skyline(cols.map((h) => h), 4, 0, 'none')}</g>`;
  // warm rim light along the top of the barrow
  let rim = '';
  cols.forEach((h, i) => { rim += `M${640 + i * 4} ${h}h4v4h-4z`; });
  s += `<path d="${rim}" fill="#ff9a7a"/>`;
  for (const [x, y, h] of [[694, 206, 10], [716, 196, 12], [788, 196, 10], [810, 206, 12]]) s += `<rect x="${x}" y="${y - h}" width="6" height="${h + 4}" fill="#4a2248"/><rect x="${x - 2}" y="${y - h + 3}" width="10" height="3" fill="#4a2248"/>`;
  // sealed crypt door (calm: no glow) with a little white flower growing beside it
  s += pathArt(['..KKKK..', '.KDDDDK.', 'KDDDDDDK', 'KDDBBDDK', 'KDDDDDDK', 'KDDDDDDK'], 4, 734, 208, { K: '#3a1a3a', D: '#7a4a6a', B: '#f6c84e' });
  s += pathArt(['.W.', 'WYW', '.W.', '.G.', 'GG.'], 3, 772, 217, { W: '#fffbe8', Y: '#ffd34d', G: '#3f8f4a' });
  s += pathArt(['.W.', 'WYW', '.W.', '.G.', '.GG'], 3, 710, 222, { W: '#ffd0e0', Y: '#ffd34d', G: '#3f8f4a' });
  return s;
}

// ── festival decorations ─────────────────────────────────────────────────
const ropeY = (x) => 58 + 30 * (1 - ((x - 450) / 450) ** 2);

function bunting() {
  const COLS = ['#e8342c', '#f6c84e', '#5ce1ff', '#7dff8a', '#ff6b8b', '#fffbe8', '#d36bff'];
  let rope = '', flags = '';
  for (let x = 0; x < W; x += 6) rope += `M${x} ${Math.round(ropeY(x))}h6v2h-6z`;
  let k = 0;
  for (let x = 14; x < W - 10; x += 30, k++) {
    if (x > 236 && x < 664) continue; // the banner hangs here
    const y = Math.round(ropeY(x + 8)) + 1, c = COLS[k % COLS.length];
    flags += `<path d="M${x} ${y}h18v5h-18zM${x + 3} ${y + 5}h12v5h-12zM${x + 6} ${y + 10}h6v5h-6z" fill="${c}"/>`;
  }
  return `<path d="${rope}" fill="#3a2030"/>` + sway(`<g>${flags}</g>`, { deg: 0.6, cx: 450, cy: 60, dur: 3 });
}

function banner() {
  const x0 = 236, x1 = 664, y0 = 100, h = 42, text = 'SHIPPING IS BORING NOW';
  let s = '';
  // strings up to the rope
  for (const x of [x0 + 12, x1 - 18]) s += `<rect x="${x}" y="${Math.round(ropeY(x))}" width="4" height="${y0 - Math.round(ropeY(x))}" fill="#3a2030"/>`;
  let cloth = `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${h}" fill="#0c0a14"/><rect x="${x0 + 3}" y="${y0 + 3}" width="${x1 - x0 - 6}" height="${h - 6}" fill="#c4281e"/>`;
  cloth += `<rect x="${x0 + 3}" y="${y0 + 3}" width="${x1 - x0 - 6}" height="3" fill="#ff6b5e"/><rect x="${x0 + 3}" y="${y0 + h - 7}" width="${x1 - x0 - 6}" height="4" fill="#8e1a1a"/>`;
  // swallow-tail ends
  cloth += `<path d="M${x0 - 18} ${y0 + 4}h22v${h - 8}h-22l8 -${(h - 8) / 2}z" fill="#8e1a1a"/><path d="M${x1 - 4} ${y0 + 4}h22l-8 ${(h - 8) / 2}l8 ${(h - 8) / 2}h-22z" fill="#8e1a1a"/>`;
  cloth += ptext(text, 450, y0 + 14, 3, '#fff3b0', { anchor: 'middle', shadow: '#5a0c0c' });
  s += sway(cloth, { deg: 0.8, cx: 450, cy: y0, dur: 2.6 });
  return s;
}

// firework: a pixel star burst around (cx, cy); default (no animation) shows it fully open
function firework(cx, cy, r, colors, begin, dur = 2.2) {
  let d0 = '', d1 = '', d2 = '';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + (i % 2 ? 0.1 : 0);
    const rr = i % 2 ? r * 0.8 : r;
    for (const [f, k] of [[0.35, 0], [0.62, 1], [0.88, 2], [1, 2]]) {
      const x = Math.round(Math.cos(a) * rr * f / 3) * 3, y = Math.round(Math.sin(a) * rr * f / 3) * 3;
      const sz = k === 2 ? 3 : 4, rect = `M${x - 1} ${y - 1}h${sz}v${sz}h-${sz}z`;
      if (k === 0) d0 += rect; else if (k === 1) d1 += rect; else d2 += rect;
    }
  }
  const inner = `<path d="${d0}" fill="${colors[0]}"/><path d="${d1}" fill="${colors[1]}"/><path d="${d2}" fill="${colors[2]}"/><rect x="-3" y="-3" width="6" height="6" fill="#fffbe8"/>`;
  const b = ` begin="${begin}s"`;
  return `<g transform="translate(${cx} ${cy})"><g><animateTransform attributeName="transform" type="scale" values="0.15;0.85;1;1.08" keyTimes="0;.25;.6;1" dur="${dur}s"${b} ${rep}/><animate attributeName="opacity" values="1;1;.9;0" keyTimes="0;.4;.75;1" dur="${dur}s"${b} ${rep}/>${inner}</g></g>`
    + glow(cx, cy, r * 1.6, colors[0], { opacity: 0.18, pulse: true, dur, begin });
}

// Xal'Zor, the Eye of a Thousand Dashboards, retired into a disco ball
function xalzor(cx, cy) {
  const R = 8, px = 4;
  const tiles = (shift) => disc(R, (dx, dy, d, x, y) => {
    if (d > 0.9) return 'K';
    // the eye in the middle
    const ex = dx / 0.62, ey = (dy - 0.05) / 0.42, e = ex * ex + ey * ey;
    if (e < 1) {
      const ix = dx / 0.3, iy = (dy - 0.05) / 0.3, ii = ix * ix + iy * iy;
      if (ii < 0.35) return x === R - 1 && y === R - 1 ? 'W' : 'K';
      if (ii < 1) return 'V';
      return 'W';
    }
    if (e < 1.35) return 'K';
    const t = (x + y + shift) % 4;
    return t === 0 ? 'w' : t === 1 ? 'a' : t === 2 ? 'b' : (dx < 0 && dy < 0 ? 'w' : 'c');
  });
  const pal = { K: '#2a0c3a', W: '#fffbff', V: '#3fdc8a', w: '#ffffff', a: '#e4d4ff', b: '#b49ae0', c: '#8060b8' };
  const ids = [0, 2].map((sh) => sprite(`epiXal${sh}`, tiles(sh), px, pal));
  const x0 = cx - R * px, y0 = cy - R * px;
  // stalks with little gauges on top (now all happily maxed out)
  let stalks = '';
  for (const [sx, tx, ty] of [[-18, -30, -44], [-6, -10, -52], [6, 12, -52], [18, 32, -42]]) {
    stalks += `<path d="M${cx + sx} ${cy - 26}L${cx + tx} ${cy + ty}" stroke="#7a3fa8" stroke-width="4"/>`;
    stalks += `<rect x="${cx + tx - 6}" y="${cy + ty - 6}" width="12" height="12" fill="#2a0c3a"/><rect x="${cx + tx - 4}" y="${cy + ty - 4}" width="8" height="8" fill="#f4ecff"/><rect x="${cx + tx}" y="${cy + ty - 4}" width="3" height="5" fill="#ff6b8b"/>`;
  }
  let s = `<rect x="${cx - 1}" y="${44}" width="3" height="${cy - 44 - 50}" fill="#3a2030"/>`;
  s += float(`<g>${stalks}${flipbook(ids, 0.25, x0, y0)}</g>`, { dy: -6, dur: 2.4 });
  return s;
}

function discoSpecks(seed) {
  const r = rng(seed);
  const COLS = ['#ffffff', '#ff9ad8', '#9af0ff', '#fff3a0', '#d8b0ff'];
  const g = COLS.map(() => '');
  for (let i = 0; i < 30; i++) {
    const x = Math.round(r() * 880 + 10), y = Math.round(150 + r() * 190);
    g[i % COLS.length] += `M${x} ${y}h4v4h-4zM${x - 3} ${y + 1}h2v2h-2zM${x + 5} ${y + 1}h2v2h-2z`;
  }
  return g.map((d, i) => blink(`<path d="${d}" fill="${COLS[i]}" opacity=".85"/>`, { dur: 0.8 + i * 0.17, begin: -i * 0.3, on: 0.55 })).join('');
}

// a rising musical note from the bard's lute (visible at its start point by default)
const note = (x, y, begin) => `<g><animateTransform attributeName="transform" type="translate" values="0 0;-8 -22;4 -44" dur="2.4s" begin="${begin}s" ${rep}/><animate attributeName="opacity" values="1;1;0" dur="2.4s" begin="${begin}s" ${rep}/>${pathArt(NOTE, 3, x, y, { K: '#2a1030', W: '#fff3b0' })}</g>`;

function ground() {
  const r = rng(12);
  let s = `<rect x="0" y="${GROUND}" width="${W}" height="40" fill="#7a5a44"/>`;
  let d = '';
  for (let y = GROUND + 6; y < GROUND + 34; y += 9) for (let x = (y % 2) * 14; x < W; x += 28 + Math.round(r() * 8)) d += `M${x} ${y}h${16 + Math.round(r() * 6)}v5h-16z`;
  s += `<path d="${d}" fill="#9a785a"/><rect x="0" y="${GROUND}" width="${W}" height="4" fill="#3f7a34"/>`;
  let gd = '';
  for (let x = 0; x < W; x += 4) { const hh = 2 + Math.round(r() * r() * 9); if (r() > 0.3) gd += `M${x} ${GROUND - hh + 2}h4v${hh}h-4z`; }
  s += `<path d="${gd}" fill="#5aa040"/>`;
  return s;
}

// ── the crowd ────────────────────────────────────────────────────────────
const hop = (inner, dy, dur, begin) => bob(inner, { dy, dur, begin });
const dance = (inner, cx, cy, deg, dur, begin) => sway(inner, { deg, cx, cy, dur, begin });

function choir() {
  let s = '';
  [['choir1', 66, 0, 7], ['choir2', 114, 0.25, -7], ['choir3', 162, 0.12, 7]].forEach(([n, x, b, deg]) => {
    s += hop(dance(actor(n, x, feet(n), { frame: 0 }), x + 32, FEET, deg, 0.9, b), -10, 0.45, b);
  });
  return s;
}

function brakka() {
  const x = 214, y = feet('brakka');
  let s = actor('brakka', x, y, { begin: 0.3 });
  // the tankard, raised and clinking in his free hand
  const t = pathArt(TANKARD, 4, x - 22, y + 46, TANKARD_PAL) + `<rect x="${x - 2}" y="${y + 66}" width="10" height="10" fill="#e2a77a"/>`;
  s += `<g><animateTransform attributeName="transform" type="translate" values="0 0;0 -10;0 0" dur="0.9s" begin="0.2s" ${rep} calcMode="spline" keySplines=".4 0 .6 1;.4 0 .6 1"/>${t}</g>`;
  s += particles({ seed: 22, n: 6, x: x - 18, y: y + 40, w: 20, h: 6, colors: ['#fffbe8'], size: [3, 4], dx: -6, dy: -26, dur: 1.4, opacity: 0.9, group: 2 });
  return hop(s, -5, 0.6, 0.3);
}

function gus() {
  const px = 3, x = 300, y = feet('gus', px);
  const hat = `<g transform="rotate(-12 ${x + 40} ${y})">${pathArt(PARTY_HAT, 4, x + 24, y - 28, HAT_PAL)}</g>`;
  return squash(actor('gus', x, y, { px, begin: 0.2 }) + hat, { cx: x + 39, base: FEET, amt: 0.08, dur: 0.8 });
}

function heroOnShield() {
  // two villagers hold the shield up over their heads, the ape cheering on top of it
  const fx = 392, ex = 470, vy = feet('farmer');
  const shY = vy - 16; // top of the shield ellipse
  let s = actor('farmer', fx, vy, { begin: 0.1 }) + actor('elf', ex, vy, { begin: 0.35 });
  s += actor('apeCheer', 414, shY - actorSize('apeCheer').h + 8);
  s += pathArt(shieldGrid(), 4, 400, shY, SHIELD_PAL);
  // raised arms (sleeves) from the shoulders, hands gripping the shield rim
  const arm = (x, sleeve) => `<rect x="${x}" y="${shY + 16}" width="8" height="${vy + 44 - shY - 16}" fill="#0c0a14"/><rect x="${x + 2}" y="${shY + 24}" width="4" height="${vy + 42 - shY - 24}" fill="${sleeve}"/><rect x="${x + 2}" y="${shY + 18}" width="4" height="6" fill="#e2b48a"/>`;
  s += arm(fx - 2, '#6b8a3a') + arm(fx + 50, '#6b8a3a') + arm(ex - 2, '#2f7a5a') + arm(ex + 46, '#2f7a5a');
  return hop(s, -8, 0.7, 0);
}

function rightCrowd() {
  let s = '';
  s += hop(actor('bard', 538, feet('bard'), { begin: 0.2 }), -4, 0.5, 0.2);
  s += note(560, 238, 0) + note(580, 236, -0.8) + note(548, 240, -1.6);
  s += actor('mirra', 610, feet('mirra'), { flip: true });
  s += hop(actor('kid', 696, feet('kid'), { begin: 0.1 }), -16, 0.55, 0.15);
  s += hop(actor('elf', 728, feet('elf'), { begin: 0.5, pal: { H: '#c0602a', T: '#c06090', t: '#8a3a66' } }), -6, 0.7, 0.4);
  s += hop(actor('kid', 772, feet('kid'), { begin: 0.3, pal: { H: '#e8d27a', T: '#4f6fa8', t: '#2e4373' } }), -14, 0.5, 0.05);
  return s;
}

export default function render() {
  const body = ({ top }) => {
    let s = sky(top);
    s += firework(96, 116, 44, ['#ff6b8b', '#ffd34d', '#fffbe8'], 0);
    s += firework(800, 112, 48, ['#5ce1ff', '#d36bff', '#fffbe8'], -0.8, 2.4);
    s += firework(560, 196, 26, ['#7dff8a', '#fff3a0', '#ffffff'], -1.5, 1.9);
    s += firework(330, 190, 30, ['#ffd34d', '#ff7a3d', '#fffbe8'], -1.1, 2.1);
    s += firework(452, 66, 18, ['#fffbe8', '#ff9ad8', '#5ce1ff'], -0.4, 1.7);
    s += sun();
    s += hills();
    s += cottage(8, GROUND, { w: 22, wallH: 13, roofH: 11, seed: 4, day: true });
    s += cottage(800, GROUND, { w: 22, wallH: 13, roofH: 11, seed: 6, day: true });
    s += ground();
    s += bunting();
    s += banner();
    s += xalzor(190, 196);
    s += choir();
    s += brakka();
    s += gus();
    s += heroOnShield();
    s += rightCrowd();
    s += discoSpecks(5);
    s += bob(bubble('HAIL!', 770, 232, { sc: 2, tail: 'left' }), { dy: -3, dur: 0.5 });
    s += particles({ seed: 17, n: 36, x: 0, y: 40, w: W, h: 160, colors: ['#ff6b8b', '#ffd34d', '#5ce1ff', '#7dff8a', '#ffffff', '#d36bff'], size: [3, 5], dx: 16, dy: 150, dur: 4.5, opacity: 0.95, group: 3 });
    return s;
  };
  return scene({
    id: 'epilogue',
    label: "Epilogue, Shipwell rejoices at dawn. The sun rises behind the hero over a calm, sealed catacomb mound; fireworks burst in a pink and gold sky, bunting and a red banner read SHIPPING IS BORING NOW. Two villagers hold up a shield with the ape paladin cheering on top, sword raised. Around them the three clockwork constructs of the Choir dance, Brakka the dwarf raises a foaming tankard, Gus the gelatinous cube wears a party hat, Xal'Zor the beholder spins as a disco-ball eye scattering specks of light, a tiefling bard plays the lute, kids jump and shout HAIL!, and Elder Mirra smiles. Confetti falls.",
    body,
    dialogues: [
      { speaker: 'MIRRA', lines: ['Release nights end at six now.', 'People go home.'] },
      [{ speaker: 'VILLAGERS', lines: ['HAIL APEHEAD!'], w: 400 }, { speaker: 'APEHEAD', lines: ["Good. Now let's make it", 'boring everywhere.'] }],
    ],
  });
}
