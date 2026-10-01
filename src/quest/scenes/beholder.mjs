// Ch IV · The Eye. Xal'Zor, "Eye of a Thousand Dashboards", floats in his lair: a bloated violet orb
// with one huge bloodshot eye, a toothy maw and nine swaying eyestalks, each ending in a little green
// gauge. The lair wall is plastered with tiny green dashboards; a sign reads INCIDENTS: 0 above a pile
// of bones. His cone of light pins the party (Gus, the Choir, Brakka, the ape paladin) to the floor.
import {
  scene, W, ptext, actor, actorSize, torch, particles, glow, pathArt, sprite, use, flipbook,
  float, sway, flicker, pulse, bubble, bob, brickWall, floorTiles, def, rng,
} from '../engine.mjs';

const FLOOR = 352;
const PX = 4;

// ── Xal'Zor ──────────────────────────────────────────────────────────────
const XPAL = {
  K: '#12061a', L: '#c98cff', V: '#9b3fd1', v: '#6a2196', u: '#3e0f58', s: '#7e2bb0',
  P: '#7d2ab0', p: '#5a1a82', W: '#f4ecff', w: '#c9b8e0', r: '#e0507a',
  M: '#24030d', m: '#8a1a3a', T: '#e0507a', t: '#a8304f', Y: '#fff1d6',
};
const R = 19, C = 20; // body radius / centre in grid units (grid 41×41)
const EYE = { x: 20, y: 17, rx: 10.5, ry: 8 };
const MAW = { x: 20, y: 31, rx: 11, ry: 5 };

function bodyGrid() {
  const r = rng(77);
  const spots = Array.from({ length: 9 }, () => [r() * 40, r() * 40, 0.9 + r() * 1.6]);
  const g = [];
  for (let y = 0; y < 41; y++) {
    let row = '';
    for (let x = 0; x < 41; x++) {
      const dx = x + 0.5 - (C + 0.5), dy = y + 0.5 - (C + 0.5), d = Math.hypot(dx, dy);
      if (d > R + 0.5) { row += '.'; continue; }
      if (d > R - 0.6) { row += 'K'; continue; }
      const l = (-dx * 0.55 - dy * 0.75) / R + (d < R - 2.5 ? 0 : -0.25);
      let c = l > 0.55 ? 'L' : l > -0.05 ? 'V' : l > -0.55 ? 'v' : 'u';
      for (const [sx, sy, sr] of spots) if (Math.hypot(x - sx, y - sy) < sr && c !== 'L') c = c === 'u' ? 'u' : 's';
      // eye socket
      const ex = (x + 0.5 - (EYE.x + 0.5)) / EYE.rx, ey = (y + 0.5 - (EYE.y + 0.5)) / EYE.ry, e = Math.hypot(ex, ey);
      if (e < 1.18) c = e < 1 ? 'W' : 'K';
      if (e < 1 && ey > 0.55) c = 'w';
      // heavy, half-shut upper lid with an angry brow line
      if (e < 1.18 && ey < -0.25 + Math.abs(ex) * 0.35) c = e < 1 && ey > -0.45 + Math.abs(ex) * 0.35 ? 'K' : (ey < -0.75 ? 'p' : 'P');
      // the maw
      const mx = (x + 0.5 - (MAW.x + 0.5)) / MAW.rx, my = (y + 0.5 - (MAW.y + 0.5)) / MAW.ry, m = Math.hypot(mx, my);
      const inMaw = m < 1 && my > -0.35 - mx * mx * 0.5;
      const rimMaw = m < 1.2 && my > -0.65 - mx * mx * 0.5 && !inMaw;
      if (rimMaw) c = 'K';
      if (inMaw) c = my > 0.45 && Math.abs(mx) < 0.45 ? 'T' : 'M';
      row += c;
    }
    g.push(row.split(''));
  }
  // specular shine on the hide
  for (const [x, y] of [[9, 7], [10, 7], [8, 8], [9, 8], [7, 10], [12, 6]]) g[y][x] = 'W';
  // veins in the eye
  for (const [x, y] of [[11, 18], [12, 18], [12, 19], [13, 20], [28, 18], [29, 19], [27, 20], [28, 20], [14, 21], [26, 22]]) if (g[y][x] === 'W' || g[y][x] === 'w') g[y][x] = 'r';
  // teeth: jagged top row and a few bottom fangs
  for (let x = 10; x <= 30; x++) {
    let top = -1; for (let y = 25; y < 37; y++) if (g[y][x] === 'M' || g[y][x] === 'T') { top = y; break; }
    if (top < 0) continue;
    const k = (x - 10) % 3;
    if (k !== 2) g[top][x] = 'Y';
    if (k === 1) g[top + 1][x] = 'Y';
    let bot = -1; for (let y = 37; y > 25; y--) if (g[y][x] === 'M' || g[y][x] === 'T') { bot = y; break; }
    if (bot > top + 2 && (x % 4 === 1)) { g[bot][x] = 'Y'; }
  }
  // gums
  for (let x = 9; x <= 31; x++) for (let y = 25; y < 38; y++) if (g[y][x] === 'K' && g[y + 1]?.[x] === 'Y') { g[y][x] = 'm'; break; }
  return g.map((r) => r.join(''));
}

const IRIS = [
  '...KKKKK...',
  '.KKiiiiiKK.',
  '.KiIIIIIiK.',
  'KiIIIKIIIiK',
  'KiIIKKKIIiK',
  'KiIWKKKIIiK',
  'KiIIKKKIIiK',
  'KiIIIKIIIiK',
  '.KiIIIIIiK.',
  '.KKiiiiiKK.',
  '...KKKKK...',
];

// gauge at each stalk tip: a little half-moon speedometer, green arc, needle (2 frames so needles twitch)
function gaugeGrid(needleDeg) {
  const g = [];
  for (let y = 0; y < 11; y++) {
    let row = '';
    for (let x = 0; x < 15; x++) {
      const dx = x - 7, dy = y - 8.5, d = Math.hypot(dx, dy), a = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (y >= 9) { row += y === 10 || x === 0 || x === 14 ? 'K' : 'V'; continue; }
      if (d > 7.6) { row += '.'; continue; }
      if (d > 6.7) { row += 'K'; continue; }
      if (d > 5.8) { row += dx < -2 && dy < -3 ? 'L' : 'V'; continue; }
      if (d > 4.3) { row += Math.round(a / 30) % 2 === 0 ? 'g' : 'G'; continue; }
      row += 'F';
    }
    g.push(row.split(''));
  }
  const t = (needleDeg * Math.PI) / 180;
  for (let i = 1; i <= 5; i++) { const x = Math.round(7 + Math.cos(t) * i), y = Math.round(8 + Math.sin(t) * i); g[y][x] = 'W'; }
  g[8][6] = 'K'; g[8][7] = 'K'; g[8][8] = 'K';
  return g.map((r) => r.join(''));
}
const GPAL = { K: '#12061a', L: '#d9a8ff', V: '#9b3fd1', G: '#7dff8a', g: '#c6ffb0', F: '#0b1f14', W: '#ffffff' };

/** Xal'Zor centred at (cx, cy). Body 164px across; eyestalks reach ~70px above. */
export function xalzor(cx, cy, { scale = 1 } = {}) {
  const r = rng(5);
  const ox = cx - (C + 0.5) * PX, oy = cy - (C + 0.5) * PX;
  const gIds = [gaugeGrid(-55), gaugeGrid(-38)].map((gg, i) => sprite(`beholderGauge${i}`, gg, 3, GPAL));
  // eyestalks: roots around the upper rim, curling up and out
  const stalks = [
    [-172, 66, 24], [-150, 72, 46], [-130, 62, 62], [-110, 54, 70], [-90, 50, 58],
    [-70, 54, 70], [-50, 62, 62], [-30, 72, 46], [-8, 66, 24],
  ];
  let back = '', front = '';
  stalks.forEach(([deg, out, up], i) => {
    const a = (deg * Math.PI) / 180;
    const x0 = cx + Math.cos(a) * (R - 2) * PX, y0 = cy + Math.sin(a) * (R - 2) * PX;
    const x2 = x0 + Math.cos(a) * out + (i % 2 ? 8 : -8), y2 = y0 + Math.sin(a) * out * 0.5 - up * 0.5;
    const x1 = x0 + Math.cos(a) * out * 0.9, y1 = y0 + Math.sin(a) * out * 0.9;
    let dk = '', dv = '', dl = '';
    const N = 18;
    for (let k = 0; k <= N; k++) {
      const t = k / N, q = 1 - t;
      const x = Math.round((q * q * x0 + 2 * q * t * x1 + t * t * x2) / 2) * 2, y = Math.round((q * q * y0 + 2 * q * t * y1 + t * t * y2) / 2) * 2;
      const th = Math.round(5 - t * 1.5);
      dk += `M${x - th - 2} ${y - th - 2}h${2 * th + 4}v${2 * th + 4}h-${2 * th + 4}z`;
      const sq = `M${x - th} ${y - th}h${2 * th}v${2 * th}h-${2 * th}z`;
      if (k % 5 === 2) dl += sq; else dv += sq;
    }
    const tip = flipbook(gIds, 0.35 + r() * 0.5, Math.round(x2 - 22), Math.round(y2 - 30), -r() * 2);
    const stalk = `<path fill="${XPAL.K}" d="${dk}"/><path fill="${XPAL.V}" d="${dv}"/><path fill="${XPAL.v}" d="${dl}"/>${tip}`;
    const sw = sway(stalk, { deg: 5 + (i % 3) * 2, cx: Math.round(x0), cy: Math.round(y0), dur: 2.2 + (i % 4) * 0.45, begin: -i * 0.37 });
    if (Math.abs(deg + 90) < 30) back += sw; else front += sw;
  });
  let s = back + front; // all stalks sit behind the body (drawn first)
  s += pathArt(bodyGrid(), PX, ox, oy, XPAL);
  // the iris: looks down-left at the party, glances around, clipped to the sclera
  def('beholderEyeClip', `<clipPath id="beholderEyeClip"><ellipse cx="${(EYE.x + 0.5) * PX}" cy="${(EYE.y + 1.2) * PX}" rx="${EYE.rx * PX - 2}" ry="${EYE.ry * PX - 6}"/></clipPath>`);
  const iris = pathArt(IRIS, PX, (EYE.x + 0.5 - 5.5) * PX - 18, (EYE.y + 0.5 - 5.5) * PX + 10, { K: '#0c0410', i: '#1f8a50', I: '#3fdc8a', W: '#ffffff' });
  s += `<g transform="translate(${ox} ${oy})"><g clip-path="url(#beholderEyeClip)"><g><animateTransform attributeName="transform" type="translate" values="0 0;0 0;10 -5;10 -5;24 -4;24 -4;0 0" keyTimes="0;.5;.56;.66;.7;.8;1" dur="6s" repeatCount="indefinite" calcMode="discrete"/>${iris}</g></g>`;
  // blink: the lid slams shut for a beat (hidden by default)
  const lid = pathArt(Array.from({ length: 17 }, (_, y) => Array.from({ length: 23 }, (_, x) => {
    const e = Math.hypot((x + 0.5 - 11.5) / 10.5, (y + 0.5 - 8.5) / 8); return e < 1.12 ? (y > 12 ? 'K' : y > 9 ? 'p' : 'P') : '.';
  }).join('')), PX, (EYE.x - 11) * PX, (EYE.y - 8) * PX, XPAL);
  s += `<g visibility="hidden"><animate attributeName="visibility" values="hidden;visible;hidden" keyTimes="0;.9;.94" dur="6s" repeatCount="indefinite" calcMode="discrete"/>${lid}</g></g>`;
  return scale === 1 ? s : `<g transform="translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})">${s}</g>`;
}

// ── the lair ─────────────────────────────────────────────────────────────
function dashboards(top) {
  // a wall of tiny dashboards, every one of them green
  const r = rng(31);
  let frames = '', faces = '', bars = '', hi = '';
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 15; col++) {
      if (r() < 0.22) continue;
      const x = 14 + col * 60 + (row % 2) * 30 + Math.round(r() * 8), y = top + 16 + row * 50 + Math.round(r() * 6);
      if (x > W - 40) continue;
      frames += `M${x} ${y}h34v24h-34z`;
      faces += `M${x + 3} ${y + 3}h28v18h-28z`;
      if (r() < 0.5) for (let b = 0; b < 5; b++) { const h = 3 + Math.round(r() * 12); bars += `M${x + 5 + b * 5} ${y + 19 - h}h3v${h}h-3z`; }
      else { let px0 = x + 5, py = y + 14; for (let b = 0; b < 6; b++) { const ny = y + 6 + Math.round(r() * 11); bars += `M${px0} ${Math.min(py, ny)}h4v${Math.abs(py - ny) + 2}h-4z`; px0 += 4; py = ny; } }
      hi += `M${x + 3} ${y + 3}h28v2h-28z`;
    }
  }
  return `<g opacity=".55"><path fill="#0c0814" d="${frames}"/><path fill="#0b1f14" d="${faces}"/><path fill="#173d24" d="${hi}"/>`
    + `${flicker(`<path fill="#5fe07a" d="${bars}"/>`, { dur: 3.1, min: 0.6 })}</g>`;
}

function incidentsSign() {
  // a hanging sign over the bones of the last adventurer who looked inside
  let s = `<rect x="770" y="236" width="2" height="30" fill="#3a2a1a"/><rect x="852" y="236" width="2" height="30" fill="#3a2a1a"/>`;
  s += `<rect x="742" y="262" width="146" height="34" fill="#0c0a14"/><rect x="745" y="265" width="140" height="28" fill="#5a3e26"/><rect x="745" y="265" width="140" height="3" fill="#7a5636"/>`;
  s += ptext('INCIDENTS:', 748, 273, 2, '#f3e3b5', { shadow: '#2a1a10' });
  s += ptext('0', 882, 273, 2, '#7dff8a', { anchor: 'end', shadow: '#2a1a10' });
  s += actor('skull', 790, FLOOR - 22, { px: 3 });
  s += `<path fill="#d8d0b8" d="M818 ${FLOOR - 8}h26v5h-26zM814 ${FLOOR - 11}h6v10h-6zM842 ${FLOOR - 11}h6v10h-6zM760 ${FLOOR - 6}h22v4h-22zM830 ${FLOOR - 18}h4v12h-4z"/>`;
  return s;
}

function party() {
  const feet = (n, px = 4) => FLOOR + 6 - actorSize(n, px).h;
  let s = '';
  s += actor('gus', 6, feet('gus', 3), { px: 3, begin: 0.3 });
  s += actor('choir2', 82, feet('choir2', 3) - 2, { px: 3, begin: 0.2 }) + actor('choir3', 122, feet('choir3', 3), { px: 3, begin: 0.5 }) + actor('choir1', 160, feet('choir1', 3) - 1, { px: 3 });
  s += actor('brakka', 206, feet('brakka'), { begin: 0.3 });
  s += actor('ape', 306, feet('ape'));
  s += bob(bubble('ALL GREEN?', 92, 234, { sc: 2, tail: 'left' }), { dy: -2, dur: 0.7 });
  return s;
}

export default function render() {
  const body = ({ top, bottom }) => {
    const BX = 612, BY = 204;
    let s = brickWall(0, top, W, FLOOR - top, { dark: '#120c1e', mid: '#1c1430', light: '#261c3e' });
    // vaulted ribs of the lair
    for (const x of [0, 430, 860]) s += `<rect x="${x}" y="${top}" width="40" height="${FLOOR - top}" fill="#0e0918"/><rect x="${x + 4}" y="${top}" width="6" height="${FLOOR - top}" fill="#2b2140"/>`;
    s += dashboards(top);
    s += torch(56, top + 120, { px: 4 }) + torch(870 - 28, top + 120, { px: 4, delay: 0.5 });
    // violet aura of the eye-tyrant
    s += glow(BX, BY, 260, '#d36bff', { opacity: 0.28, pulse: true, dur: 3 });
    s += floorTiles(0, FLOOR, W, bottom - FLOOR);
    s += incidentsSign();
    // his shadow on the floor breathes with the float
    s += pulse(`<ellipse cx="${BX}" cy="${FLOOR + 10}" rx="96" ry="10" fill="#05030a" opacity=".7"/>`, { dur: 3.2, to: 0.5 });
    s += party();
    // the cone of light from the eye onto the party
    def('beholderCone', '<linearGradient id="beholderCone" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8ffd0" stop-opacity=".55"/><stop offset=".5" stop-color="#9dff9a" stop-opacity=".2"/><stop offset="1" stop-color="#7dff8a" stop-opacity=".08"/></linearGradient>');
    const ex = BX - 22, ey = BY - 6;
    s += pulse(`<path d="M${ex - 6} ${ey - 10}L${ex + 4} ${ey + 14}L404 ${FLOOR + 12}L40 ${FLOOR + 12}z" fill="url(#beholderCone)"/>`, { dur: 2.4, to: 0.65 });
    s += `<ellipse cx="222" cy="${FLOOR + 6}" rx="190" ry="12" fill="#c8ffb0" opacity=".12"/>`;
    s += particles({ seed: 13, n: 18, x: 120, y: 200, w: 300, h: 140, colors: ['#e8ffd0', '#9dff9a'], size: 2, dx: 8, dy: -40, dur: 5, opacity: 0.7, group: 3 });
    s += float(xalzor(BX, BY), { dy: -10, dur: 3.2 });
    // dust motes in the lair
    s += particles({ seed: 2, n: 15, x: 0, y: top + 30, w: W, h: 260, colors: ['#8d7fb0', '#b48cff'], size: [2, 3], dx: 12, dy: -30, dur: 7, opacity: 0.5 });
    return s;
  };
  return scene({
    id: 'beholder',
    label: "Chapter IV, The Eye. Xal'Zor, a huge violet beholder with one bloodshot eye and a toothy grin, floats in his lair. Nine eyestalks sway above him, and each one ends in a little dashboard gauge, every needle in the green. The wall behind him is covered in tiny green dashboards; on the right a sign reads INCIDENTS: 0 above a pile of bones. A cone of pale light from his eye falls on the party below: Gus the gelatinous cube, the three clockwork constructs (one asks ALL GREEN?), Brakka the dwarf and the ape paladin.",
    body,
    dialogues: [{ speaker: 'XALZOR', lines: ['BEHOLD! A THOUSAND DASHBOARDS. ALL GREEN.', 'ALWAYS GREEN. NEVER LOOK INSIDE.'] }],
  });
}
