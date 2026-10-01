// Ch II · The Hall of Tombs. A long crypt: a far wall of burial niches running off into the dark,
// a colonnade of torch-lit pillars, a row of rattling sarcophagi. Two ghouls claw out of theirs:
// FLAKY TEST (it flickers in and out of existence) and REGRESSION (it sinks back, then rises again).
// Gus the gelatinous cube slides along the back wall with a skeleton key and an old TODO inside him.
// The party on the left: the Choir, Brakka (who wants to build a lever) and the ape paladin.
// Parallax: the camera sways around the tomb row, so the far wall and colonnade drift one way and
// the hanging chains in the foreground drift the other (the labelled tombs stay put and readable).
import {
  scene, W, ptext, actor, actorSize, torch, particles, glow, pathArt, squash, drift, def, rng, brickWall,
} from '../engine.mjs';

const GROUND = 338;   // where the party and the sarcophagi stand
const BACK = 262;     // foot of the far wall / colonnade

// parallax sway: one shared period, amplitudes by depth (mid plane = 0)
const SWAY = 14;
const layer = (inner, dx) => drift(inner, { dx, dur: SWAY });

// ── far wall: brick, vaulted, with rows of burial niches ──────────────────────────────────────
function farWall(top) {
  const r = rng(12);
  let s = brickWall(-60, top, W + 120, BACK - top, { dark: '#120e1c', mid: '#1b1528', light: '#241c36' });
  // niches: 3 rows between the pillars, each a dark slot with a skull, bones or a cracked slab
  let slots = '', bones = '', slabs = '', rims = '';
  for (let row = 0; row < 3; row++) {
    const y = top + 70 + row * 46;
    for (let x = -40; x < W + 60; x += 56) {
      const xx = x + (row % 2) * 28;
      rims += `M${xx - 2} ${y - 2}h44v28h-44z`;
      slots += `M${xx} ${y}h40v24h-40z`;
      const k = r();
      if (k < 0.35) bones += `M${xx + 14} ${y + 10}h12v8h-12zM${xx + 16} ${y + 8}h8v2h-8z`; // skull
      else if (k < 0.6) bones += `M${xx + 6} ${y + 18}h28v3h-28zM${xx + 4} ${y + 16}h4v7h-4zM${xx + 32} ${y + 16}h4v7h-4z`; // bone
      else slabs += `M${xx + 2} ${y + 2}h36v20h-36z`; // sealed
    }
  }
  s += `<path d="${rims}" fill="#2c2440"/><path d="${slots}" fill="#07050c"/><path d="${slabs}" fill="#2a2338"/><path d="${bones}" fill="#6e6754"/>`;
  // a few skull eye-sockets in the sealed slabs = carved crosses
  // vault ribs across the top
  let vault = '';
  for (let x = -40; x < W + 60; x += 225) for (let i = 0; i < 14; i++) { const t = i / 13, yy = top + 8 + Math.round(Math.sin(t * Math.PI) * -0 + (1 - Math.sin(t * Math.PI)) * 36); vault += `M${x + 22 + i * 14} ${yy}h14v8h-14z`; }
  s += `<path d="${vault}" fill="#2e2742"/>`;
  // darkness falling off toward the top
  s += `<rect x="-60" y="${top}" width="${W + 120}" height="${BACK - top}" fill="#07050c" opacity=".3"/><rect x="-60" y="${top}" width="${W + 120}" height="30" fill="#05030a" opacity=".55"/>`;
  return s;
}

// ── colonnade: pillars with torches ───────────────────────────────────────────────────────────
function colonnade(top) {
  let s = '';
  [-30, 195, 420, 645, 870].forEach((x, i) => {
    s += `<rect x="${x}" y="${top}" width="48" height="${BACK - top + 6}" fill="#3a3352"/><rect x="${x}" y="${top}" width="8" height="${BACK - top + 6}" fill="#57507a"/><rect x="${x + 40}" y="${top}" width="8" height="${BACK - top + 6}" fill="#241d36"/>`;
    s += `<rect x="${x - 6}" y="${top + 40}" width="60" height="10" fill="#4a4266"/><rect x="${x - 6}" y="${BACK - 6}" width="60" height="12" fill="#4a4266"/><rect x="${x - 6}" y="${BACK - 6}" width="60" height="3" fill="#6a6090"/>`;
    // crack + moss
    s += `<path d="M${x + 20} ${top + 70}h4v14h-4zM${x + 24} ${top + 84}h4v10h-4zM${x + 18} ${top + 94}h4v12h-4z" fill="#1b1630"/><path d="M${x + 6} ${BACK - 20}h10v4h-10zM${x + 30} ${BACK - 14}h8v4h-8z" fill="#2f5a2a"/>`;
    if (i === 1 || i === 3) s += torch(x + 10, top + 120, { px: 4, delay: i * 0.3, glowR: 110 });
  });
  return s;
}

// ── floor ─────────────────────────────────────────────────────────────────────────────────────
function floor(bottom) {
  def('tombsFloor', '<pattern id="tombsFloor" patternUnits="userSpaceOnUse" width="64" height="24"><rect width="64" height="24" fill="#1a1522"/><path fill="#272033" d="M1 1h62v10H1zM-31 13h62v10h-62zM33 13h62v10H33z"/><path fill="#332a42" d="M1 1h62v2H1zM-31 13h62v2h-62zM33 13h62v2H33z"/></pattern>');
  let s = `<rect x="0" y="${BACK + 4}" width="${W}" height="${bottom - BACK - 4}" fill="url(#tombsFloor)"/>`;
  s += `<rect x="0" y="${BACK + 4}" width="${W}" height="4" fill="#3b3247"/>`;
  // scattered bones and a skull
  s += `<path d="M560 ${GROUND + 6}h20v3h-20zM558 ${GROUND + 4}h4v7h-4zM578 ${GROUND + 4}h4v7h-4zM760 ${GROUND + 10}h16v3h-16zM758 ${GROUND + 8}h4v7h-4zM774 ${GROUND + 8}h4v7h-4z" fill="#cfc7ae"/>`;
  s += actor('skull', 300, GROUND + 4, { px: 3 });
  return s;
}

// ── sarcophagi ────────────────────────────────────────────────────────────────────────────────
const SW = 136, SH = 46;
function sarcFront(x, plaque, { carve = true } = {}) {
  const y = GROUND - SH;
  let s = `<rect x="${x - 2}" y="${y - 2}" width="${SW + 4}" height="${SH + 4}" fill="#0c0a14"/>`;
  s += `<rect x="${x}" y="${y}" width="${SW}" height="${SH}" fill="#5f587a"/><rect x="${x}" y="${y}" width="${SW}" height="4" fill="#8a82a8"/><rect x="${x}" y="${y + SH - 6}" width="${SW}" height="6" fill="#3e3756"/>`;
  s += `<rect x="${x + 6}" y="${y + 8}" width="4" height="${SH - 16}" fill="#4a4366"/><rect x="${x + SW - 10}" y="${y + 8}" width="4" height="${SH - 16}" fill="#4a4366"/>`;
  if (plaque) {
    // bronze plaque with the ghoul's name
    s += `<rect x="${x + 4}" y="${y + 11}" width="${SW - 8}" height="24" fill="#0c0a14"/><rect x="${x + 6}" y="${y + 13}" width="${SW - 12}" height="20" fill="#b07a2a"/><rect x="${x + 6}" y="${y + 13}" width="${SW - 12}" height="2" fill="#e0a848"/>`;
    s += ptext(plaque, x + SW / 2, y + 17, 2, '#1a0e04', { anchor: 'middle', shadow: '#e8b860' });
  } else if (carve) {
    s += `<path d="M${x + SW / 2 - 2} ${y + 10}h4v28h-4zM${x + SW / 2 - 12} ${y + 18}h24v4h-24z" fill="#3e3756"/>`;
  }
  return s;
}
function sarcLid(x, { open = false } = {}) {
  const y = GROUND - SH;
  if (open) {
    // the lid lies broken behind the tomb: two slabs propped against it
    return `<g transform="rotate(-8 ${x + 30} ${y})"><rect x="${x - 10}" y="${y - 26}" width="52" height="16" fill="#0c0a14"/><rect x="${x - 8}" y="${y - 24}" width="48" height="12" fill="#77709a"/><rect x="${x - 8}" y="${y - 24}" width="48" height="3" fill="#9a92ba"/></g>`
      + `<g transform="rotate(10 ${x + SW - 30} ${y})"><rect x="${x + SW - 40}" y="${y - 22}" width="48" height="16" fill="#0c0a14"/><rect x="${x + SW - 38}" y="${y - 20}" width="44" height="12" fill="#77709a"/><rect x="${x + SW - 38}" y="${y - 20}" width="44" height="3" fill="#9a92ba"/></g>`;
  }
  return `<rect x="${x - 6}" y="${y - 12}" width="${SW + 12}" height="14" fill="#0c0a14"/><rect x="${x - 4}" y="${y - 10}" width="${SW + 8}" height="10" fill="#77709a"/><rect x="${x - 4}" y="${y - 10}" width="${SW + 8}" height="3" fill="#9a92ba"/>`;
}
// closed tomb whose lid rattles (something wants out)
function rattler(x, num, begin) {
  const rattle = `<g><animateTransform attributeName="transform" type="translate" values="0 0;2 -3;-2 -1;1 -2;0 0;0 0" keyTimes="0;.05;.1;.15;.2;1" dur="2.6s" begin="${begin}s" repeatCount="indefinite" calcMode="discrete"/>${sarcLid(x)}</g>`;
  let s = sarcFront(x, null) + rattle;
  s += ptext(num, x + SW - 16, GROUND - 22, 2, '#3e3756', { anchor: 'end', shadow: '#8a82a8' });
  // dust shaken loose
  s += particles({ seed: begin * 10 + 3, n: 4, x: x + 10, y: GROUND - SH - 6, w: SW - 20, h: 4, colors: ['#8a82a8'], size: 2, dy: 18, dur: 2.6, opacity: 0.7, group: 2 });
  return s;
}
// open tomb with a ghoul clawing out; mode 'flaky' flickers, 'regress' sinks and rises again
function ghoulTomb(x, label, mode, pal) {
  const gx = x + 36, gy = GROUND - SH - 92;
  let g = actor('ghoulTop', gx, gy, { pal, begin: mode === 'flaky' ? 0 : 0.2 });
  // grasping claw over the rim
  g += pathArt(['.K.K.K', 'KZKZKZ', 'KZZZZZ', '.KKKKK'], 4, gx - 16, GROUND - SH - 12, { K: '#0c0a14', Z: '#8fb873' });
  if (mode === 'flaky') {
    // in, out, in, out… (visible most of the time, and at t=0)
    g = `<g><animate attributeName="opacity" values="1;1;.15;1;.3;1;1" keyTimes="0;.55;.6;.66;.7;.76;1" dur="3.2s" repeatCount="indefinite" calcMode="discrete"/>${g}</g>`;
  } else {
    g = `<g><animateTransform attributeName="transform" type="translate" values="0 0;0 0;0 34;0 34;0 0" keyTimes="0;.45;.6;.75;1" dur="5s" repeatCount="indefinite" calcMode="spline" keySplines="0 0 1 1;.5 0 .5 1;0 0 1 1;.3 0 .4 1"/>${g}</g>`;
  }
  let s = glow(x + SW / 2, GROUND - SH, 70, '#a6ff4d', { opacity: 0.3, pulse: true, dur: 2.2 });
  s += `<rect x="${x + 4}" y="${GROUND - SH - 6}" width="${SW - 8}" height="8" fill="#05030a"/>`; // the dark inside
  s += sarcLid(x, { open: true }) + g + sarcFront(x, label);
  s += particles({ seed: x, n: 6, x: x + 20, y: GROUND - SH - 20, w: SW - 40, h: 16, colors: ['#a6ff4d', '#d8ffb0'], size: [2, 3], dy: -60, dur: 3.5, opacity: 0.6 });
  return s;
}

// ── Gus, sliding along the back ───────────────────────────────────────────────────────────────
function gus() {
  const px = 3, { h } = actorSize('gus', px);
  const x = 412, y = BACK + 6 - h;
  const body = squash(actor('gus', x, y, { px }), { cx: x + 39, base: y + h, amt: 0.07, dur: 1.1 });
  const shadow = `<rect x="${x + 4}" y="${y + h - 2}" width="70" height="6" fill="#000" opacity=".35"/>`;
  const trail = `<rect x="${x - 120}" y="${y + h - 2}" width="124" height="3" fill="#7dff8a" opacity=".22"/>`;
  return glow(x + 39, y + h / 2, 70, '#7dff8a', { opacity: 0.18 }) + drift(trail + shadow + body, { dx: 140, dur: 16 })
    ;
}

// ── foreground: hanging chains and cobwebs (drift opposite to the background) ─────────────────
function foreground(top) {
  let s = '';
  for (const [x, len] of [[250, 7], [660, 4], [880, 9]]) {
    let d = '';
    for (let i = 0; i < len; i++) d += i % 2 ? `M${x} ${top + i * 12}h6v12h-6z` : `M${x - 3} ${top + i * 12 + 2}h12v8h-12zM${x} ${top + i * 12 + 4}h6v4h-6z`;
    s += sway(`<path d="${d}" fill="#3a3346"/><path d="M${x - 6} ${top + len * 12}h18v6h-18zM${x - 2} ${top + len * 12 + 6}h4v10h-4zM${x + 4} ${top + len * 12 + 6}h4v10h-4z" fill="#544c66"/>`, x + 3, top, 1.5 + len * 0.2);
  }
  // cobweb in the top-left corner
  let web = '';
  for (let i = 0; i < 9; i++) web += `M0 ${top + i * 8}h${72 - i * 8}v2h-${72 - i * 8}z`;
  s += `<path d="${web}" fill="#b9b2c9" opacity=".18"/>`;
  return s;
}
const sway = (inner, cx, cy, dur) => `<g><animateTransform attributeName="transform" type="rotate" values="-3 ${cx} ${cy};3 ${cx} ${cy};-3 ${cx} ${cy}" dur="${dur}s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/>${inner}</g>`;

function party() {
  const feet = (name) => GROUND + 6 - actorSize(name).h;
  let s = glow(170, 270, 140, '#ff9a1f', { opacity: 0.12 });
  s += actor('choir2', -8, feet('choir2') - 12, { begin: 0.2 }) + actor('choir3', 30, feet('choir3') - 8, { begin: 0.5 }) + actor('choir1', 66, feet('choir1') - 4, { begin: 0 });
  s += actor('brakka', 92, feet('brakka'), { begin: 0.3 });
  s += actor('ape', 192, feet('ape'));
  return s;
}

export default function render() {
  const body = ({ top, bottom }) => {
    let s = `<rect x="0" y="${top}" width="${W}" height="${bottom - top}" fill="#07050c"/>`;
    s += layer(farWall(top), -18);
    s += layer(colonnade(top), -10);
    s += floor(bottom);
    s += gus();
    s += particles({ seed: 5, n: 14, x: 0, y: top + 20, w: W, h: 220, colors: ['#8d7fb0', '#5e5480'], size: [2, 3], dy: 50, dx: -10, dur: 7, opacity: 0.5 });
    // the tomb row (mid plane, static)
    s += rattler(444, '213', 0.4);
    s += ghoulTomb(296, 'FLAKY TEST', 'flaky', { T: '#7a5aa8', t: '#4e3a73' });
    s += ghoulTomb(592, 'REGRESSION', 'regress', { T: '#a8483a', t: '#73302a' });
    s += rattler(740, '214', 1.3);
    s += party();
    s += layer(foreground(top), 26);
    return s;
  };
  return scene({
    id: 'tombs',
    label: 'Chapter II, The Hall of Tombs. A long torch-lit crypt: a far wall of burial niches, a colonnade of pillars, and a row of rattling stone sarcophagi numbered up to 214. Two ghouls claw out of open tombs, their bronze plaques reading FLAKY TEST (it flickers in and out) and REGRESSION (it sinks back, then rises again). In the background Gus, a friendly gelatinous cube, slides along the wall with a skeleton key and an old TODO scroll floating inside him. On the left the ape paladin, Brakka the dwarf and the three clockwork constructs.',
    body,
    dialogues: [
      { speaker: 'BRAKKA', lines: ['Two hundred and fourteen tombs, lad.', 'By hand… or I build a lever.'] },
      { speaker: 'GUS', lines: ['hi. i eat dead code.'] },
    ],
  });
}
