// Secret · ???. REST AT THE BONFIRE: night on the now-peaceful catacomb grounds, the sealed barrow
// quiet on the horizon. A crackling campfire (flipbook flames, rising sparks, flickering warm light
// on everyone) and the party resting around it: the ape paladin sits back against a tombstone,
// helmet off beside him, banana in hand; Brakka snores with his tankard; Xal'Zor dozes, eyestalks
// drooping; Gus roasts a marshmallow on a stick stuck in his jelly; the three Choir constructs sit
// in sleep mode behind a fallen log, Z's drifting up. Stars, a moon, fireflies.
import {
  scene, W, ptext, actor, stars, skyBands, moon, skyline, particles, glow, pathArt, sprite,
  flipbook, float, bob, sway, squash, pulse, def, rng, SPRITES,
} from '../engine.mjs';

const GROUND = 342;            // feet / seat line
const rep = 'repeatCount="indefinite"';
const FIRE_X = 452;            // fire centre

// ── the ape paladin, seated against a tombstone, helmet off, banana in hand ──
// head rows come from the boxers ape (no helmet) so it reads as the same chimp hero
const APE_HEAD = SPRITES.CAST.apeBoxers.frames[0].slice(2, 14).map((r) => r.slice(0, 20));
function apeHead(blink) {
  const h = APE_HEAD.map((r) => r);
  // a contented smile: mouth corners up
  h[8] = '.KKFFLDLLLLLLLLLLDLK';
  h[9] = '..KFFLLDDDDDDDDDLLK.';
  if (blink) h[5] = 'KEeFFADDAADDAAAFK...';
  return h;
}
const SEATED_APE = [
  '.....KKKKKKK....................',
  '...KKFFFFFFFKK..................',
  '..KFFFFFfFFFFFK.................',
  '..KFFFFFFFFFFFFK................',
  '.KFFFDDDDDDDDDDDDK..............',
  'KEeFFAWKAAWKAAAFK...KK..........',
  'KEeFFAAAAAAAAAAAFK.KiiK.........',
  'KEEFFALLLLLLnLnLLLKKiiK.........',
  '.KKFFLDLLLLLLLLLLDLKYiyK........',
  '..KFFLLDDDDDDDDDLLKYKiKyK.......',
  '..KFFLLLLLLLLLLLLK.KYYyK.K......',
  '..KKFFLLLLLLLLLLK..KYYyK........',
  '.KKSSKKKKKKKKKKK..KfYyKK........',
  'KSSSSSSKMMMMMMMK.KfFFFK.........',
  'KSSSSSSSKMMMMMMMKKFFFFK.........',
  'KNSSSSSSKMMMMMKSSKFFFK..........',
  'KNMMMMMMKMMMKSSMMKKKK...........',
  'KNMMMMMMKMMKSMMMNK.........KKK..',
  'KNNMMMMMMKSSMMMNK....KKK..KMNNK.',
  'KNNMMMMMKSSMMMNK....KSSMK.KMNNK.',
  'KNNNMMMKSMMMNNK.....KSMMNKKMNNK.',
  'KGGGGGGKKKKKKKKKKKKKKSMMNKKMNNK.',
  'KgGGGGGKSSSSSSSKGGKSSSMMNKKMNNK.',
  '.KgggggKMMMMMMMKgGgKMMMMMNKKNNK.',
  '..KKKKKKMMMMMMMMKgKMMMMMNNKKKK..',
  '.......KNNNNNNNNNKNNNNNNNNK.....',
  '........KKKKKKKKKKKKKKKKKK......',
];
function seatedApe(blink = false) {
  const g = [...SEATED_APE];
  const head = apeHead(blink);
  for (let y = 0; y < head.length; y++) g[y] = head[y] + g[y].slice(head[y].length);
  return g;
}
const APE_PAL = { ...SPRITES.CAST.ape.pal, Y: '#ffe14a', y: '#c8a020', i: '#fff3a0' };

// the helmet, set down on the grass (red plume, steel, gold band, dark visor slit)
const HELMET = [
  '....rRRr....',
  '...rRRRRr...',
  '...KKKKKKK..',
  '..KSSSSMMNK.',
  '.KSSSMMMMMNK',
  '.KSGGGGGGGgK',
  '.KSMKDDDDDKK',
  '.KSMKDDDDDK.',
  '.KSMMKKKKKNK',
  '.KNMMMMMMMNK',
  '..KKKKKKKKK.',
];

// ── Brakka, seated and snoring (his standing sprite, re-legged, wrench set aside) ──
function brakkaSeated(nod) {
  const src = SPRITES.CAST.brakka.frames[0].map((r) => [...r]);
  // drop the wrench (columns 20+) except his fist
  for (let y = 0; y < 19; y++) for (let x = 20; x < 25; x++) src[y][x] = '.';
  src[19] = [...'KFFKAAKBbBKKBbBKAAKFFK...'];
  src[20] = [...'KFFKAAKYBKAAKBYKAAKFFK...'];
  src[21] = [...'.KKKAAAKKAAAAKKAAAKKK....'];
  let g = src.map((r) => r.join(''));
  // goggles off, eyes shut
  g[6] = '..KFFFFFKKKKKKFFFFFK.....';
  g[7] = '..KFFFFFKFFFFKFFFFFK.....';
  g[8] = '..KFAAAFFFFFFFFAAAFK.....';
  g[9] = '..KKFFFFFFFFFFFFFFKK.....';
  if (nod) g[8] = '..KFFFFFFFFFFFFFFFFK.....';
  // sitting: trousers shortened, boots towards us
  g = [...g.slice(0, 23), '..KPPPPPPK..KPPPPPPK.....', '..KKKKKKKK..KKKKKKKK.....'];
  return g;
}
const TANKARD = ['.WWWW...', 'WWWWWW..', 'KWWWWKKK', 'KBBBBK.K', 'KByBBK.K', 'KByBBKKK', 'KBBBBK..', 'KKKKKK..'];
const TANKARD_PAL = { K: '#2a1a10', W: '#fffbe8', B: '#e8a030', y: '#ffd870' };

// ── the Choir in sleep mode: seated, visors dark, standby lights ──
function constructSeated(i) {
  const f = SPRITES.CAST[`choir${i + 1}`].frames[0];
  const g = f.slice(0, 22).map((r, y) => (y === 7 ? r.replace('KnCCnnCCnK', 'KnnnnnnnnK') : r).replace(/C/g, 'b'));
  return g; // legs hidden behind the log they sit on
}
// a fallen log to sit behind: bark with knots, the cut end facing the fire
function logGrid(w) {
  const r = rng(3), rows = [];
  for (let y = 0; y < 6; y++) {
    let row = '';
    for (let x = 0; x < w; x++) {
      if (x < 5) { // cut end (rings)
        const dx = x - 2.5, dy = y - 2.5, d = Math.hypot(dx * 1.1, dy);
        row += d > 3.1 ? '.' : d > 2.3 ? 'K' : d > 1.5 ? 'O' : d > 0.7 ? 'o' : 'O';
        continue;
      }
      if (y === 0 || y === 5 || x === w - 1) { row += x === w - 1 && (y === 0 || y === 5) ? '.' : 'K'; continue; }
      row += y === 1 ? 'h' : y === 4 ? 'b' : r() < 0.12 ? 'b' : 'B';
    }
    rows.push(row);
  }
  return rows;
}
const LOG_SEAT_PAL = { K: '#120a06', B: '#5a3a22', b: '#3a2416', h: '#8a5a32', O: '#d89a5a', o: '#a86a34' };

// ── Gus: a marshmallow floating inside him, a happy face ──
function gusCosy() {
  const g = SPRITES.CAST.gus.frames[0].map((r) => [...r]);
  const put = (x, y, rows) => rows.forEach((row, j) => [...row].forEach((c, i) => { if (c !== '.') g[y + j][x + i] = c; }));
  put(6, 9, ['KK....KK', 'KK....KK', '........', 'K......K', '.KKKKKK.']); // eyes closed in bliss, big smile
  put(15, 6, ['......', '.WWWW.', 'WWWWwW', 'WWWWwW', '.WWww.']); // a marshmallow (the coin's gone)
  return g.map((r) => r.join(''));
}
const GUS_PAL = { ...SPRITES.CAST.gus.pal, W: '#fffbf0@0.9', w: '#e8d8c0@0.9' };

// ── the fire ─────────────────────────────────────────────────────────────
function flameFrame(seed) {
  const r = rng(seed), w = 18, h = 22, g = [];
  const phase = r() * 6, lean = (r() - 0.5) * 2;
  for (let y = 0; y < h; y++) {
    const t = (y + 1) / h; // 0 top → 1 bottom
    const hw = 8.2 * Math.pow(t, 0.75) * (t > 0.9 ? 1 - (t - 0.9) * 1.2 : 1);
    const off = Math.sin(y * 0.55 + phase) * (1 - t) * 2.2 + lean * (1 - t);
    let row = '';
    for (let x = 0; x < w; x++) {
      const d = Math.abs(x + 0.5 - (w / 2 + off)) / Math.max(hw, 0.01);
      // tongues: the outline breaks up near the top
      const jag = (Math.sin(x * 1.7 + phase + y * 0.3) + 1) * 0.5 * (1 - t) * 0.6;
      const k = d + jag;
      row += k > 1 ? '.' : k > 0.78 ? 'R' : k > 0.52 ? 'O' : k > 0.26 || t < 0.35 ? 'Y' : 'W';
    }
    g.push(row);
  }
  // a couple of detached licks above
  for (let i = 0; i < 2; i++) { const x = 5 + Math.floor(r() * 8), y = Math.floor(r() * 4); g[y] = g[y].slice(0, x) + 'O' + g[y].slice(x + 1); if (g[y + 1]) g[y + 1] = g[y + 1].slice(0, x) + 'R' + g[y + 1].slice(x + 1); }
  return g;
}
const FLAME_PAL = { R: '#e8402a', O: '#ff8a1e', Y: '#ffd34d', W: '#fff6c8' };
const LOGS = [
  '..KK..............KK..',
  '.KbbKK..........KKbbK.',
  '.KbBBbKK......KKbBBbK.',
  '..KbBBBbKK..KKbBBBbK..',
  '...KKbBBBbKKbBBBbKK...',
  '..KoOKKbBBBBBBbKKOoK..',
  '.KOooOKKKbBBbKKKOooOK.',
  '.KOooOKbBBBBBBbKOooOK.',
  '..KOOKbBBbKKbBBbKOOK..',
  '...KKKKKK....KKKKKK...',
];
const LOG_PAL = { K: '#1a0e08', B: '#7a4a2a', b: '#4a2a16', O: '#c88a4a', o: '#ffb060' };
const STONE = ['.KKKK.', 'KSSMMK', 'KSMMNK', '.KKKK.'];
const STONE_PAL = { K: '#120e1a', S: '#b48a7a', M: '#7a6070', N: '#4a3a4a' };

function campfire(cx) {
  let s = '';
  // warm light pooled on the ground
  s += `<ellipse cx="${cx}" cy="${GROUND + 6}" rx="300" ry="34" fill="url(#secretPool)"><animate attributeName="opacity" values="1;.8;.95;.75;1" dur="1.4s" ${rep}/></ellipse>`;
  // stones ring (back row), logs, flames, stones (front row)
  const px = 4;
  for (const dx of [-44, -22, 0, 22]) s += pathArt(STONE, px, cx + dx - 2, GROUND - 6, STONE_PAL);
  s += pathArt(LOGS, px, cx - 44, GROUND - 30, LOG_PAL);
  s += glow(cx, GROUND - 30, 60, '#ffd34d', { opacity: 0.6, pulse: true, dur: 0.9 });
  const ids = [11, 23, 37, 52].map((sd, i) => sprite(`secretFlame${i}`, flameFrame(sd), px, FLAME_PAL));
  s += flipbook(ids, 0.11, cx - 36, GROUND - 106);
  // embers glowing in the logs
  s += `<g><animate attributeName="opacity" values="1;.4;1;.7;1" dur="0.8s" ${rep}/><path d="M${cx - 18} ${GROUND - 10}h4v4h-4zM${cx + 10} ${GROUND - 12}h4v4h-4zM${cx - 4} ${GROUND - 8}h4v4h-4z" fill="#ffd34d"/></g>`;
  for (const dx of [-56, -32, 12, 36]) s += pathArt(STONE, px, cx + dx, GROUND + 2, STONE_PAL);
  // sparks rising and drifting
  s += particles({ seed: 4, n: 26, x: cx - 30, y: GROUND - 110, w: 60, h: 50, colors: ['#ffd34d', '#ff8a1e', '#fff6c8'], size: [2, 4], dx: 14, dy: -170, dur: 2.8, opacity: 1, group: 2 });
  s += particles({ seed: 41, n: 10, x: cx - 20, y: GROUND - 80, w: 40, h: 30, colors: ['#ffb454', '#ffe98a'], size: [2, 3], dx: -26, dy: -120, dur: 2.2, opacity: 0.9, group: 1 });
  return s;
}

// ── backdrop ─────────────────────────────────────────────────────────────
function backdrop(top) {
  let s = skyBands(top, GROUND, ['#04031a', '#060520', '#090726', '#0c0a2c', '#100c33', '#140f3a', '#191240', '#1f1646', '#26194a']);
  s += stars({ seed: 33, n: 80, y: top + 4, h: 210 });
  // a few big four-point stars
  const big = (x, y, d) => `<g><animate attributeName="opacity" values="1;.35;1" dur="${d}s" ${rep}/><path d="M${x} ${y - 6}h2v14h-2zM${x - 6} ${y}h14v2h-14z" fill="#e8e0ff" opacity=".8"/><rect x="${x - 1}" y="${y - 1}" width="4" height="4" fill="#fff"/></g>`;
  s += big(250, 86, 3.1) + big(612, 70, 2.4) + big(838, 150, 3.7);
  // shooting star now and then
  s += `<g opacity="0"><animate attributeName="opacity" values="0;1;0;0" keyTimes="0;.04;.1;1" dur="9s" begin="2s" ${rep}/><animateTransform attributeName="transform" type="translate" values="0 0;-180 70;-180 70" keyTimes="0;.1;1" dur="9s" begin="2s" ${rep}/><path d="M560 80h6v3h-6zM566 77h10v3h-10zM576 74h14v3h-14z" fill="#fffbe8"/></g>`;
  s += moon(108, 104, { R: 9, px: 4 });
  // far hills
  const far = [], near = [];
  for (let i = 0; i < 150; i++) { const t = (i / 150) * Math.PI * 2; far.push(Math.round((262 + Math.sin(t * 2 + 0.6) * 12 + Math.sin(t * 5) * 6) / 6) * 6); }
  s += skyline(far, 6, GROUND, '#120e2a');
  // the Catacombs: a quiet barrow, door sealed, no more green glow
  const cols = [];
  for (let i = 0; i < 56; i++) { const t = (i - 28) / 28; cols.push(Math.round((288 - Math.max(0, 1 - t * t) * 64 + Math.abs(Math.sin(i * 1.7)) * 3) / 4) * 4); }
  s += `<g transform="translate(560 0)">${skyline(cols, 4, GROUND, '#0e0b22')}</g>`;
  for (const [x, y, h] of [[620, 244, 10], [642, 236, 12], [726, 232, 10], [748, 240, 12]]) s += `<rect x="${x}" y="${y - h}" width="6" height="${h + 4}" fill="#0e0b22"/><rect x="${x - 2}" y="${y - h + 3}" width="10" height="3" fill="#0e0b22"/>`;
  s += pathArt(['..KKKK..', '.KDDDDK.', 'KDDDDDDK', 'KDDBBDDK', 'KDDDDDDK', 'KDDDDDDK'], 4, 672, 240, { K: '#06050f', D: '#1c1736', B: '#5a4a2a' });
  for (let i = 0; i < 150; i++) { const t = (i / 150) * Math.PI * 2; near.push(Math.round((300 + Math.sin(t * 3 + 2) * 8 + Math.sin(t * 7) * 4) / 6) * 6); }
  s += skyline(near, 6, GROUND, '#0b0920');
  // distant graves and a dead tree on the left
  for (const [x, h] of [[24, 18], [60, 22], [520, 16], [856, 20]]) s += `<rect x="${x}" y="${GROUND - 26 - h + 18}" width="14" height="${h}" fill="#0b0920"/><rect x="${x + 2}" y="${GROUND - 30 - h + 18}" width="10" height="4" fill="#0b0920"/>`;
  return s;
}

function ground() {
  const r = rng(14);
  let s = `<rect x="0" y="${GROUND}" width="${W}" height="60" fill="#15121a"/>`;
  // packed earth around the fire, grass at the edges
  let dirt = '';
  for (let y = GROUND + 8; y < GROUND + 44; y += 9) for (let x = (y % 2) * 14; x < W; x += 30 + Math.round(r() * 10)) dirt += `M${x} ${y}h${12 + Math.round(r() * 8)}v4h-12z`;
  s += `<path d="${dirt}" fill="#221c26"/>`;
  s += `<rect x="0" y="${GROUND}" width="${W}" height="4" fill="#1d3a1e"/>`;
  let gd = '', gl = '';
  for (let x = 0; x < W; x += 4) { const hh = 2 + Math.round(r() * r() * 10); if (Math.abs(x - FIRE_X) < 70) continue; (r() > 0.5 ? (gd += `M${x} ${GROUND - hh + 3}h4v${hh}h-4z`) : (gl += `M${x} ${GROUND - hh + 3}h4v${hh}h-4z`)); }
  s += `<path d="${gd}" fill="#1a3a1c"/><path d="${gl}" fill="#2a5226"/>`;
  return s;
}

// a Z that drifts up and fades, starting visible at its origin
const zee = (x, y, sc, begin, dur = 3.2, color = '#e8e0ff') => `<g><animateTransform attributeName="transform" type="translate" values="0 0;10 -20;4 -42" dur="${dur}s" begin="${begin}s" ${rep}/><animate attributeName="opacity" values="1;1;0" dur="${dur}s" begin="${begin}s" ${rep}/>${ptext('Z', x, y, sc, color, { shadow: '#1a1430' })}</g>`;
const zzz = (x, y, b = 0) => zee(x, y, 2, b) + zee(x + 10, y - 6, 3, b - 1.1) + zee(x + 22, y - 14, 2, b - 2.2);

// Xal'Zor dozing: eye shut, eyestalks drooping with their gauges hanging down
function xalzorDozing(cx, cy) {
  const R = 10, px = 4, rows = [];
  for (let y = 0; y < 2 * R; y++) {
    let row = '';
    for (let x = 0; x < 2 * R; x++) {
      const dx = (x + 0.5 - R) / R, dy = (y + 0.5 - R) / R, d = Math.hypot(dx, dy);
      if (d > 1) { row += '.'; continue; }
      if (d > 0.86) { row += 'K'; continue; }
      // the big eye, shut: a sleepy downward arc of lid with a lighter eyelid above it
      const arc = dy - (0.16 - dx * dx * 0.7);
      const lid = Math.abs(dx) < 0.56 && Math.abs(arc) < 0.075;
      const lidTop = Math.abs(dx) < 0.56 && arc < 0 && Math.hypot(dx / 0.56, (dy + 0.02) / 0.4) < 1;
      row += lid ? 'K' : lidTop ? 'l' : dx < -0.3 && dy < -0.3 ? 'L' : dx + dy > 0.7 ? 'v' : 'V';
    }
    rows.push(row);
  }
  // lashes under the lid and a sleepy little mouth
  const put = (x, y, c) => { rows[y] = rows[y].slice(0, x) + c + rows[y].slice(x + 1); };
  put(9, 14, 'v'); put(10, 14, 'v'); put(8, 15, 'K'); put(9, 15, 'K'); put(10, 15, 'K'); put(11, 15, 'K'); // a sleepy little mouth
  const pal = { K: '#12061a', V: '#9b3fd1', v: '#6a2196', L: '#c88af0', l: '#b466e6' };
  const x0 = cx - R * px, y0 = cy - R * px;
  let stalks = '';
  for (const [sx, mx, my, tx, ty] of [[-22, -30, -66, -46, -34], [-8, -8, -74, -22, -46], [8, 12, -74, 26, -46], [22, 34, -66, 48, -34]]) {
    let d = '', dk = '';
    for (let k = 0; k <= 12; k++) {
      const t = k / 12, q = 1 - t;
      const x = Math.round((q * q * (cx + sx) + 2 * q * t * (cx + mx) + t * t * (cx + tx)) / 2) * 2;
      const y = Math.round((q * q * (cy - 28) + 2 * q * t * (cy + my) + t * t * (cy + ty)) / 2) * 2;
      d += `M${x - 2} ${y - 2}h4v4h-4z`; dk += `M${x - 4} ${y - 4}h8v8h-8z`;
    }
    stalks += `<path d="${dk}" fill="#12061a"/><path d="${d}" fill="#7a3fa8"/>`;
    stalks += `<rect x="${cx + tx - 6}" y="${cy + ty}" width="12" height="12" fill="#12061a"/><rect x="${cx + tx - 4}" y="${cy + ty + 2}" width="8" height="8" fill="#3a2a4a"/><rect x="${cx + tx - 1}" y="${cy + ty + 5}" width="2" height="4" fill="#8a7a9a"/>`;
  }
  return float(`<g>${stalks}${pathArt(rows, px, x0, y0, pal)}</g>`, { dy: -6, dur: 4 }) + zee(cx + 30, cy - 36, 2, -0.5, 3.6, '#e8c8ff');
}

export default function render() {
  def('secretPool', `<radialGradient id="secretPool"><stop offset="0" stop-color="#ff9a3c" stop-opacity=".55"/><stop offset=".5" stop-color="#ff8a1e" stop-opacity=".2"/><stop offset="1" stop-color="#ff8a1e" stop-opacity="0"/></radialGradient>`);
  def('secretWarm', `<radialGradient id="secretWarm" cx="${FIRE_X}" cy="${GROUND - 50}" r="420" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffb050" stop-opacity=".3"/><stop offset=".45" stop-color="#ff8a1e" stop-opacity=".12"/><stop offset="1" stop-color="#ff8a1e" stop-opacity="0"/></radialGradient>`);
  def('secretDark', `<radialGradient id="secretDark" cx="${FIRE_X}" cy="${GROUND - 60}" r="560" gradientUnits="userSpaceOnUse"><stop offset=".35" stop-color="#05041a" stop-opacity="0"/><stop offset="1" stop-color="#05041a" stop-opacity=".6"/></radialGradient>`);

  const body = ({ top, bottom }) => {
    let s = backdrop(top);
    s += ground();

    // fireflies in the far grass
    s += particles({ seed: 8, n: 16, x: 20, y: 200, w: W - 40, h: 120, colors: ['#e8ff8a', '#ffe14a'], size: 3, dx: 22, dy: -36, dur: 6, opacity: 0.9, group: 2 });

    // Brakka, far left, snoring with his tankard
    const bx = 40, by = GROUND + 6 - 25 * 4;
    const bIds = [false, true].map((n) => sprite(`secretBrakka${n ? 1 : 0}`, brakkaSeated(n), 4, SPRITES.CAST.brakka.pal));
    let br = flipbook(bIds, 1.6, bx, by);
    br += pathArt(TANKARD, 4, bx + 74, by + 52, TANKARD_PAL);
    s += bob(br, { dy: 2, dur: 3.2, smooth: true });
    // snot bubble swelling from his nose
    s += `<g transform="translate(${bx + 52} ${by + 50})"><circle r="7" fill="#cfe8ff" fill-opacity=".55" stroke="#e8f4ff" stroke-width="2"><animate attributeName="r" values="3;9;3" dur="3.2s" ${rep}/></circle><rect x="-3" y="-4" width="3" height="3" fill="#fff"/></g>`;
    s += zzz(bx + 70, by - 10, 0);

    // Xal'Zor, dozing in mid-air above them
    s += xalzorDozing(318, 128);

    // the tombstone, the ape leaning back against it, his helmet in the grass
    const tx = 180, tPx = 5, tY = GROUND + 6 - 20 * tPx;
    s += actor('tombRip', tx, tY, { px: tPx });
    s += pathArt(HELMET, 4, 130, GROUND + 6 - HELMET.length * 4, SPRITES.CAST.ape.pal);
    const ax = 206, ay = GROUND + 6 - 27 * 4;
    const aIds = [false, true].map((b) => sprite(`secretApe${b ? 1 : 0}`, seatedApe(b), 4, APE_PAL));
    s += flipbook([aIds[0], aIds[0], aIds[0], aIds[0], aIds[0], aIds[0], aIds[1]], 0.6, ax, ay);
    // banana peels from earlier
    const PEEL = ['.Y...Y.', 'KYy.yYK', '.KYYYK.', '..KKK..'];
    s += pathArt(PEEL, 3, 336, GROUND + 14, { K: '#5a4a10', Y: '#ffe14a', y: '#c8a020' }) + pathArt(PEEL, 3, 300, GROUND + 26, { K: '#5a4a10', Y: '#e8c84a', y: '#a88a20' });

    // the fire
    s += campfire(FIRE_X);

    // Gus, roasting a marshmallow on a stick stuck in his jelly
    const gPx = 3, gx = 548, gy = GROUND + 6 - 24 * gPx;
    const stick = `<path d="M${gx + 10} ${gy + 44}L${FIRE_X + 30} ${GROUND - 64}" stroke="#0c0a14" stroke-width="6"/><path d="M${gx + 10} ${gy + 44}L${FIRE_X + 30} ${GROUND - 64}" stroke="#a87a4a" stroke-width="2.5"/>`;
    const mallow = `<rect x="${FIRE_X + 20}" y="${GROUND - 74}" width="16" height="14" fill="#0c0a14"/><rect x="${FIRE_X + 22}" y="${GROUND - 72}" width="12" height="10" fill="#fffbf0"><animate attributeName="fill" values="#fffbf0;#f0c070;#c87a30;#fffbf0" keyTimes="0;.5;.9;1" dur="6s" ${rep}/></rect><rect x="${FIRE_X + 22}" y="${GROUND - 72}" width="12" height="3" fill="#fff" opacity=".7"/>`;
    s += sway(stick + mallow, { deg: 1.2, cx: gx + 10, cy: gy + 44, dur: 2.4 });
    s += squash(pathArt(gusCosy(), gPx, gx, gy, GUS_PAL), { cx: gx + 39, base: GROUND + 6, amt: 0.04, dur: 2.6 });

    // the Clockwork Choir, sleep mode
    [[654, 7], [720, -2], [786, -8]].forEach(([x, deg], i) => {
      const id = sprite(`secretChoir${i}`, constructSeated(i), 4, { ...SPRITES.CAST[`choir${i + 1}`].pal, b: '#1e4a5a' });
      const y = GROUND - 8 - 22 * 4;
      let c = `<g transform="rotate(${deg} ${x + 32} ${GROUND})"><use href="#${id}" x="${x}" y="${y}"/>`;
      // a slow standby light on each visor
      c += pulse(`<rect x="${x + 28}" y="${y + 28}" width="8" height="4" fill="#5ce1ff"/>`, { dur: 3 + i * 0.4, from: 1, to: 0.15, begin: -i });
      c += '</g>';
      s += bob(c, { dy: 2, dur: 3 + i * 0.3, smooth: true, begin: -i * 0.7 });
      s += zee(x + 40, y - 14, 2, -i * 1.1, 3.4, '#9af0ff');
    });
    s += pathArt(logGrid(56), 4, 630, GROUND - 16, LOG_SEAT_PAL);

    // the firelight: warm wash over everything near the fire, cool falloff to the edges
    s += `<rect x="0" y="${top}" width="${W}" height="${bottom - top}" fill="url(#secretWarm)"><animate attributeName="opacity" values="1;.75;.95;.7;1;.85;1" dur="1.7s" ${rep}/></rect>`;
    s += `<rect x="0" y="${top}" width="${W}" height="${bottom - top}" fill="url(#secretDark)"/>`;
    // fireflies drifting close
    s += particles({ seed: 19, n: 10, x: 60, y: 160, w: W - 120, h: 150, colors: ['#e8ff8a'], size: 3, dx: -18, dy: -28, dur: 5, opacity: 0.95, group: 2 });
    return s;
  };
  return scene({
    id: 'secret',
    label: "Secret ending, rest at the bonfire. Night on the now-peaceful catacomb grounds, the sealed barrow quiet on the horizon under stars and a moon. A crackling campfire throws sparks and warm flickering light over the party resting around it: the ape paladin sits back against a tombstone, helmet off in the grass beside him, holding a banana and smiling; Brakka the dwarf snores with his tankard, a bubble swelling from his nose; Xal'Zor the beholder dozes in mid-air, eye shut and eyestalks drooping; Gus the gelatinous cube roasts a marshmallow on a stick, another floating inside him; the three Clockwork Choir constructs sit in sleep mode behind a fallen log, Z's drifting up. Fireflies glow in the grass.",
    body,
    dialogues: [{ speaker: 'APEHEAD', lines: ['The real treasure was the boring releases', 'we made along the way.'] }],
  });
}

