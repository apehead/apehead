// Ch I · The Gate. Night, the mouth of the Catacombs: a stone gatehouse dug into a dark barrow,
// torches on its pillars, a portcullis with green crypt-light leaking through. The GATEKEEPER, a stone
// gargoyle, crouches on the lintel; under him THREE CARVED GEMS in a row, RED · GREEN · GOLD, labelled
// "red · green · prove". They are the answer to the memory puzzle in Ch VI, so they are big, lit and
// labelled. The party waits on the left; graves and a dead tree on the right.
import {
  scene, W, ptext, actor, actorSize, torch, stars, skyBands, moon, skyline, fog, particles, glow,
  arch, deadTree, pathArt, sprite, flipbook, blink, pulse, bob, def, rng, SPRITES,
} from '../engine.mjs';

const GROUND = 360;
const CX = 500; // gate centre

// ── the GATEKEEPER (stone gargoyle, 28×22, front-facing, wings half spread) ─────────────────────
const mirror = (rows) => rows.map((r) => r + [...r].reverse().join(''));
const GARG_A = mirror([
  '.K............',
  '.KK...........',
  '.KSK..........',
  '.KSSK.....M...',
  '.KSMSK....SM..',
  '.KSMMSK...KSMK',
  '.KSMNMSK..KKKK',
  '.KSMNNMSKKSSSS',
  '.KSMNNNMKSMMMM',
  '.KSMNNNMKMKKKK',
  '.KSMNKNMKMKEEK',
  '.KSMK.KNKMMMNM',
  '.KSK..KNKNMKKK',
  '.KK...KMKNWKWK',
  '.K....KMKKKKKK',
  '......KSKSMMMM',
  '.....KSMKSMNKK',
  '.....KSMKSMKSM',
  '....KSMNKSMKSM',
  '....KSMKKSMKSM',
  '...KWKWKKWKWKW',
  '...KKKKKKKKKKK',
]);
// wing twitch: the outer wing columns lift by one row
const GARG_B = GARG_A.map((row, y) => {
  const src = GARG_A[y + 1] ?? '.'.repeat(row.length);
  const L = 6, n = row.length;
  return src.slice(0, L) + row.slice(L, n - L) + src.slice(n - L);
});
const GARG_PAL = { K: '#16121f', S: '#d6d0e4', M: '#9790ad', N: '#5f5876', E: '#ffe14a', W: '#e9e3cf' };

// ── a carved gem (9×9 diamond) ────────────────────────────────────────────────────────────────
const GEM = [
  '....K....',
  '...KHK...',
  '..KHLLK..',
  '.KHLLLDK.',
  'KHLLLLDDK',
  '.KLLLDDK.',
  '..KLDDK..',
  '...KDK...',
  '....K....',
];
const GEMS = [
  { name: 'RED', label: 'RED', pal: { K: '#2a0608', H: '#ffd0c8', L: '#ff3b30', D: '#9c1414' }, glow: '#ff3b30' },
  { name: 'GREEN', label: 'GREEN', pal: { K: '#062a0c', H: '#e0ffd8', L: '#3fe05a', D: '#1a7a2a' }, glow: '#5cff6a' },
  { name: 'GOLD', label: 'PROVE', pal: { K: '#2a1a04', H: '#fff6c8', L: '#f6c84e', D: '#a06c18' }, glow: '#ffd34d' },
];

const sparkle = (x, y, d, c = '#ffffff') => blink(`<path fill="${c}" d="M${x} ${y - 6}h2v14h-2zM${x - 6} ${y}h14v2h-14z"/>`, { dur: 2.4, begin: d, on: 0.2 });

function gemBand() {
  // recessed stone lintel band across the gatehouse
  const y0 = 152, h = 76, x0 = CX - 150, w = 300;
  let s = `<rect x="${x0 - 6}" y="${y0 - 6}" width="${w + 12}" height="${h + 12}" fill="#0c0a14"/>`;
  s += `<rect x="${x0 - 4}" y="${y0 - 4}" width="${w + 8}" height="${h + 8}" fill="#6b6488"/><rect x="${x0 - 4}" y="${y0 - 4}" width="${w + 8}" height="4" fill="#8f88b0"/>`;
  s += `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#221c33"/><rect x="${x0}" y="${y0}" width="${w}" height="4" fill="#120e1e"/>`;
  GEMS.forEach((g, i) => {
    const gx = CX + (i - 1) * 96, gy = y0 + 26;
    // socket
    s += `<rect x="${gx - 25}" y="${gy - 23}" width="50" height="46" fill="#0c0a14"/><rect x="${gx - 23}" y="${gy - 21}" width="46" height="42" fill="#3a3352"/><rect x="${gx - 23}" y="${gy + 17}" width="46" height="4" fill="#5c5478"/>`;
    s += glow(gx, gy, 46, g.glow, { opacity: 0.55, pulse: true, dur: 2.4, begin: i * 0.8 });
    s += pathArt(GEM, 4, gx - 18, gy - 18, g.pal);
    s += sparkle(gx - 8, gy - 10, i * 0.8);
    // label under each gem, in its colour
    s += ptext(g.label, gx, y0 + 56, 2, g.pal.L, { anchor: 'middle', shadow: '#000' });
    if (i < 2) s += ptext('·', gx + 48, y0 + 56, 2, '#b9b2c9', { anchor: 'middle', shadow: '#000' });
  });
  return s;
}

function gatehouse() {
  const x0 = CX - 170, x1 = CX + 170, top = 140;
  let s = '';
  // crenellated parapet
  for (let x = x0 - 10; x < x1 + 10; x += 34) s += `<rect x="${x}" y="${top - 18}" width="22" height="20" fill="#3d3656"/><rect x="${x}" y="${top - 18}" width="22" height="4" fill="#5a5078"/>`;
  s += `<rect x="${x0 - 14}" y="${top}" width="${x1 - x0 + 28}" height="10" fill="#5a5078"/><rect x="${x0 - 14}" y="${top + 10}" width="${x1 - x0 + 28}" height="4" fill="#1b1630"/>`;
  // stone block body
  s += `<rect x="${x0}" y="${top + 14}" width="${x1 - x0}" height="${GROUND - top - 14}" fill="#2b2440"/>`;
  const r = rng(5), bd = ['', '', ''];
  for (let y = top + 16, k = 0; y < GROUND; y += 16, k++) {
    for (let x = x0 + (k % 2 ? -20 : 0); x < x1; x += 40) {
      const a = Math.max(x, x0), b = Math.min(x + 38, x1);
      if (b > a) { bd[r() > 0.85 ? 1 : 0] += `M${a} ${y}h${b - a}v14h${a - b}z`; bd[2] += `M${a} ${y}h${b - a}v2h${a - b}z`; }
    }
  }
  s += `<path fill="#352d4e" d="${bd[0]}"/><path fill="#2f2846" d="${bd[1]}"/><path fill="#463d63" d="${bd[2]}"/>`;
  // pillars with torches
  for (const px of [x0, x1 - 36]) {
    s += `<rect x="${px}" y="${top + 14}" width="36" height="${GROUND - top - 14}" fill="#4a4266"/><rect x="${px}" y="${top + 14}" width="6" height="${GROUND - top - 14}" fill="#6a6090"/><rect x="${px + 30}" y="${top + 14}" width="6" height="${GROUND - top - 14}" fill="#2b2440"/>`;
    s += `<rect x="${px - 4}" y="${GROUND - 14}" width="44" height="14" fill="#5a5078"/><rect x="${px - 4}" y="${GROUND - 14}" width="44" height="3" fill="#7a70a0"/>`;
  }
  // arch + portcullis with crypt-light leaking through
  const aw = 20, ah = 22, apx = 6, ax = CX - (aw * apx) / 2, ay = GROUND - ah * apx;
  s += arch(ax, ay, aw, ah, { px: apx, pal: { K: '#0c0a14', T: '#6b5f86', Z: '#05030a' } });
  const vx = ax + 3 * apx, vw = (aw - 6) * apx, cy = ay + (aw / 2) * apx;
  def('gateVoid', `<clipPath id="gateVoid"><circle cx="${CX}" cy="${cy}" r="${vw / 2}"/><rect x="${vx}" y="${cy}" width="${vw}" height="${GROUND - cy}"/></clipPath>`);
  let inner = `<rect x="${vx}" y="${ay}" width="${vw}" height="${GROUND - ay}" fill="#05030a"/>`;
  inner += glow(CX, GROUND - 20, 70, '#a6ff4d', { opacity: 0.35, pulse: true, dur: 3 });
  // two pairs of glowing eyes far inside
  inner += blink(`<rect x="${CX - 26}" y="${GROUND - 70}" width="4" height="3" fill="#a6ff4d"/><rect x="${CX - 18}" y="${GROUND - 70}" width="4" height="3" fill="#a6ff4d"/>`, { dur: 4.4, on: 0.85 });
  inner += blink(`<rect x="${CX + 16}" y="${GROUND - 54}" width="4" height="3" fill="#ffe14a"/><rect x="${CX + 24}" y="${GROUND - 54}" width="4" height="3" fill="#ffe14a"/>`, { dur: 3.1, on: 0.8, begin: 1.2 });
  inner += particles({ seed: 8, n: 8, x: vx + 8, y: GROUND - 40, w: vw - 16, h: 30, colors: ['#a6ff4d', '#d8ffb0'], size: [2, 3], dy: -70, dur: 4, opacity: 0.6 });
  // iron portcullis
  let bars = '';
  for (let x = vx + 6; x < vx + vw - 2; x += 14) bars += `<rect x="${x}" y="${ay}" width="5" height="${GROUND - ay}" fill="#2e2a3a"/><rect x="${x}" y="${ay}" width="2" height="${GROUND - ay}" fill="#5a546e"/>`;
  for (let y = ay + 30; y < GROUND; y += 26) bars += `<rect x="${vx}" y="${y}" width="${vw}" height="5" fill="#2e2a3a"/><rect x="${vx}" y="${y}" width="${vw}" height="2" fill="#5a546e"/>`;
  for (let x = vx + 6; x < vx + vw - 2; x += 14) bars += `<path d="M${x} ${GROUND - 4}h5l-2.5 4z" fill="#5a546e"/>`;
  inner += bars;
  s += `<g clip-path="url(#gateVoid)">${inner}</g>`;
  // keystone skull
  s += actor('skull', CX - 9, ay + 2, { px: 3 });
  // steps
  s += `<rect x="${CX - 76}" y="${GROUND - 6}" width="152" height="6" fill="#4a4266"/><rect x="${CX - 76}" y="${GROUND - 6}" width="152" height="2" fill="#6a6090"/>`;
  // ivy creeping down the stones
  const ivy = (x, y, n, seed) => { const q = rng(seed); let d = '', dd = ''; for (let i = 0; i < n; i++) { const xx = x + Math.round(Math.sin(i / 2 + seed) * 6); d += `M${xx} ${y + i * 6}h4v6h-4z`; if (q() > 0.45) (q() > 0.5 ? (d += `M${xx - 6} ${y + i * 6 + 2}h6v4h-6z`) : (dd += `M${xx + 4} ${y + i * 6 + 2}h6v4h-6z`)); } return `<path d="${d}" fill="#2f6a2a"/><path d="${dd}" fill="#4d9a3a"/>`; };
  s += ivy(x0 + 44, top + 14, 14, 3) + ivy(x1 - 54, top + 14, 9, 7) + ivy(x0 + 8, top + 10, 6, 11);
  s += torch(x0 + 4, 262, { px: 4 }) + torch(x1 - 32, 262, { px: 4, delay: 0.5 });
  return s;
}

function gargoyle() {
  const px = 4, gw = GARG_A[0].length * px, gh = GARG_A.length * px;
  const x = CX - gw / 2, y = 152 - gh - 4;
  // plinth on the lintel
  let s = `<rect x="${CX - 34}" y="${y + gh - 4}" width="68" height="10" fill="#5a5078"/><rect x="${CX - 34}" y="${y + gh - 4}" width="68" height="3" fill="#7a70a0"/>`;
  const ids = [GARG_A, GARG_A, GARG_A, GARG_B].map((g) => sprite('gateGarg', g, px, GARG_PAL));
  s += flipbook(ids, 0.7, x, y);
  // glowing eyes: pulse + glow
  s += glow(CX, y + 42, 34, '#ffe14a', { opacity: 0.4, pulse: true, dur: 1.8 });
  s += pulse(`<rect x="${CX - 12}" y="${y + 40}" width="4" height="4" fill="#fffbe0"/><rect x="${CX + 8}" y="${y + 40}" width="4" height="4" fill="#fffbe0"/>`, { dur: 1.8, to: 0.3 });
  return s;
}

function backdrop(top) {
  let s = skyBands(top, GROUND, ['#06051a', '#0a0822', '#0f0b2a', '#140e33', '#1a113b', '#211444', '#29174b', '#331a50', '#3d1e54']);
  s += stars({ seed: 13, n: 44, y: top + 4, h: 170 });
  s += moon(800, 96, { R: 10, px: 4 });
  const cloud = (cx, cy, w, fill) => { let c = ''; for (let i = 0; i < w; i += 8) { const hh = 5 + Math.round(Math.sin((i / w) * Math.PI) * 10); c += `<rect x="${cx + i}" y="${cy - hh}" width="8" height="${hh}" fill="${fill}"/>`; } return c + `<rect x="${cx - 8}" y="${cy}" width="${w + 16}" height="4" fill="${fill}"/>`; };
  s += `<g opacity=".75"><animateTransform attributeName="transform" type="translate" values="0 0;-110 0;0 0" dur="54s" repeatCount="indefinite"/>${cloud(120, 100, 110, '#241b44')}${cloud(700, 130, 120, '#2a1f4a')}${cloud(430, 76, 90, '#1e163c')}</g>`;
  // far hills, then the barrow the gate is dug into
  const hills = [];
  for (let i = 0; i < 150; i++) { const t = (i / 150) * Math.PI * 2; hills.push(Math.round((250 + Math.sin(t * 2 + 2) * 14 + Math.sin(t * 7) * 5) / 6) * 6); }
  s += skyline(hills, 6, GROUND, '#181332');
  const mound = [];
  for (let i = 0; i < 113; i++) { const t = (i - 62) / 46; mound.push(Math.round((GROUND - Math.max(0, 1 - t * t) * 250 + Math.abs(Math.sin(i * 1.3)) * 8) / 4) * 4); }
  s += skyline(mound, 8, GROUND, '#120e22');
  // bats circling
  const batIds = SPRITES.CAST.bat.frames.map((f, i) => sprite(`bat${i}`, f, 3, SPRITES.CAST.bat.pal));
  s += [[0, 740, 80], [-4, 800, 120], [-7.5, 680, 100]].map(([b, x, y]) => `<g><animateMotion dur="11s" begin="${b}s" repeatCount="indefinite" path="M0 0 q-60 -30 -120 0 t-120 10 t60 -40 t180 30 z"/>${flipbook(batIds, 0.14, x, y)}</g>`).join('');
  return s;
}

function rightYard() {
  let s = deadTree(712, GROUND + 4, { w: 56, h: 70, seed: 17, px: 3, pal: { T: '#140f1d', t: '#3c2c52' } });
  s += actor('grave', 690, GROUND - 54) + actor('cross', 842, GROUND - 46) + actor('grave', 770, GROUND - 60, { px: 4 });
  return s;
}

function ground() {
  const r = rng(31);
  def('gateDirt', '<pattern id="gateDirt" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#2a1d1a"/><rect x="2" y="4" width="4" height="4" fill="#3d2a22"/><rect x="14" y="2" width="6" height="4" fill="#1f1512"/><rect x="10" y="12" width="4" height="4" fill="#45302a"/><rect x="18" y="16" width="4" height="4" fill="#3d2a22"/><rect x="4" y="18" width="6" height="2" fill="#1f1512"/></pattern>');
  let s = `<rect x="0" y="${GROUND}" width="${W}" height="30" fill="url(#gateDirt)"/>`;
  // flagstone path to the gate
  let d = '';
  for (let x = 120; x < CX + 90; x += 30) d += `M${x} ${GROUND + 4 + ((x / 30) % 2) * 6}h${22}v6h-22z`;
  s += `<path d="${d}" fill="#4a4266"/>`;
  s += `<rect x="0" y="${GROUND}" width="${W}" height="4" fill="#25401f"/>`;
  let gd = '';
  for (let x = 0; x < W; x += 4) { if (x > CX - 180 && x < CX + 180) continue; const hh = 2 + Math.round(r() * r() * 10); if (r() > 0.25) gd += `M${x} ${GROUND - hh + 2}h4v${hh}h-4z`; }
  s += `<path d="${gd}" fill="#2f5a2a"/>`;
  for (const x of [40, 640]) s += actor('skull', x, GROUND + 6, { px: 3 });
  return s;
}

function party() {
  const feet = (name) => GROUND + 6 - actorSize(name).h;
  let s = glow(200, 300, 130, '#ff9a1f', { opacity: 0.12 });
  s += actor('choir2', 0, feet('choir2') - 6, { begin: 0.2 }) + actor('choir3', 40, feet('choir3') - 2, { begin: 0.5 }) + actor('choir1', 80, feet('choir1'), { begin: 0 });
  s += actor('brakka', 146, feet('brakka'), { begin: 0.3 });
  s += actor('ape', 236, feet('ape'));
  // the Choir, staring up at the gargoyle
  s += bob(`<g>${ptext('?', 32, feet('choir2') - 22, 3, '#5ce1ff')}${ptext('?', 112, feet('choir1') - 18, 3, '#5ce1ff')}</g>`, { dy: -3, dur: 0.7 });
  return s;
}

export default function render() {
  const body = ({ top }) => {
    let s = backdrop(top);
    s += gatehouse();
    s += gemBand();
    s += gargoyle();
    s += rightYard();
    s += ground();
    s += fog(GROUND - 16, { opacity: 0.16 });
    s += particles({ seed: 21, n: 10, x: 340, y: 230, w: 330, h: 110, colors: ['#ffd34d', '#ff9a1f'], size: [2, 3], dy: -60, dx: 6, dur: 3.6, opacity: 0.8, group: 2 });
    s += party();
    return s;
  };
  return scene({
    id: 'gate',
    label: 'Chapter I, The Gate. Night at the mouth of the Catacombs: a torch-lit stone gatehouse dug into a dark barrow, its arched doorway barred by an iron portcullis with green light and glowing eyes behind it. The Gatekeeper, a stone gargoyle with glowing yellow eyes, crouches on the lintel. Above the door three gems are carved in a row: RED, GREEN, GOLD, labelled underneath "red · green · prove". On the left the ape paladin, Brakka the dwarf and the three clockwork constructs look up at the gargoyle; graves and a dead tree on the right.',
    body,
    dialogues: [
      { speaker: 'GATEKEEPER', lines: ['I am the first word of every honest fix.', 'I come before green. Name me.'] },
    ],
  });
}
