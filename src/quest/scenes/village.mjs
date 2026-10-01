// Prologue · Shipwell. Night village before release: cottages with flickering windows and chimney
// smoke, standing torches, villagers huddled and shivering, Elder Mirra with her lantern, the ape,
// Brakka and the Choir. Far off, the catacomb mound glows green and the dead drift up out of it.
import {
  scene, W, ptext, actor, actorSize, torch, stars, skyBands, moon, skyline, fog, particles, glow,
  cottage, pathArt, bubble, bob, float, def, rng, flicker,
} from '../engine.mjs';

const GROUND = 334;

const GHOST = [
  '..KKKK..',
  '.KWWWWK.',
  'KWKWWKWK',
  'KWKWWKWK',
  'KWWWWWWK',
  'KWWKKWWK',
  'KWWWWWWK',
  'KWKWWKWK',
  '.K.KK.K.',
];

function mound() {
  // the Catacombs: a dark barrow on the horizon, its crypt mouth glowing green
  const cols = [];
  for (let i = 0; i < 60; i++) { const t = (i - 30) / 30; cols.push(Math.round((262 - Math.max(0, 1 - t * t) * 62 + Math.abs(Math.sin(i * 1.7)) * 3) / 4) * 4); }
  let s = glow(650, 230, 170, '#a6ff4d', { opacity: 0.2, pulse: true, dur: 3.2 });
  s += `<g transform="translate(530 0)">${skyline(cols, 4, 300, '#120f22')}</g>`;
  // little tombstones and a dead tree on the ridge
  for (const [x, y, h] of [[598, 214, 10], [622, 206, 12], [676, 205, 10], [700, 212, 12], [722, 224, 8]]) s += `<rect x="${x}" y="${y - h}" width="6" height="${h + 4}" fill="#120f22"/><rect x="${x - 2}" y="${y - h + 3}" width="10" height="3" fill="#120f22"/>`;
  s += `<path d="M640 212h4v-22h4v10h4v-14h-4v-6h-4v12h-4z" fill="#120f22"/>`;
  // crypt mouth
  s += pathArt(['..KKKK..', '.KGGGGK.', 'KGGWWGGK', 'KGWWWWGK', 'KGWWWWGK', 'KGWWWWGK'], 4, 634, 226, { K: '#2a2440', G: '#a6ff4d', W: '#eaffd0' });
  s += glow(650, 240, 40, '#a6ff4d', { opacity: 0.5 });
  // wisps and the risen dead drifting up into the sky
  s += particles({ seed: 11, n: 14, x: 600, y: 200, w: 100, h: 40, colors: ['#a6ff4d', '#d8ffb0'], size: [2, 4], dy: -120, dx: 10, dur: 6, opacity: 0.6 });
  const g = (x, b, d) => `<g opacity=".55"><animateTransform attributeName="transform" type="translate" values="0 0;${d} -90" dur="7s" begin="${b}s" repeatCount="indefinite"/><animate attributeName="opacity" values=".7;.5;0" dur="7s" begin="${b}s" repeatCount="indefinite"/>${pathArt(GHOST, 3, x, 196, { K: '#2a5a1a', W: '#c8ff8a' })}</g>`;
  s += g(610, -1, -20) + g(680, -4.5, 18) + g(645, -2.8, 4);
  return s;
}

function signpost(x) {
  const by = GROUND - 124;
  let s = `<rect x="${x + 50}" y="${by}" width="8" height="${GROUND - by + 4}" fill="#3a2618"/><rect x="${x + 52}" y="${by}" width="2" height="${GROUND - by + 4}" fill="#5a3a22"/>`;
  s += `<rect x="${x}" y="${by - 14}" width="108" height="30" fill="#0c0a14"/><rect x="${x + 3}" y="${by - 11}" width="102" height="24" fill="#6b4a2e"/><rect x="${x + 3}" y="${by - 11}" width="102" height="3" fill="#8a6440"/>`;
  s += ptext('SHIPWELL', x + 54, by - 5, 2, '#f3e3b5', { anchor: 'middle', shadow: '#2a1a10' });
  return s;
}

function standingTorch(x, delay) {
  return `<rect x="${x + 10}" y="${GROUND - 66}" width="8" height="70" fill="#2a1e1a"/><rect x="${x + 10}" y="${GROUND - 66}" width="2" height="70" fill="#4a3424"/>` + torch(x, GROUND - 98, { px: 4, delay, glowR: 120 });
}

function ground() {
  const r = rng(8);
  let s = `<rect x="0" y="${GROUND}" width="${W}" height="40" fill="#2a2030"/>`;
  // packed-earth road with cobbles
  let d = '';
  for (let y = GROUND + 6; y < GROUND + 34; y += 9) for (let x = (y % 2) * 14; x < W; x += 28 + Math.round(r() * 8)) d += `M${x} ${y}h${16 + Math.round(r() * 6)}v5h-${16}z`;
  s += `<path d="${d}" fill="#3a2e42"/>`;
  s += `<rect x="0" y="${GROUND}" width="${W}" height="4" fill="#25401f"/>`;
  let gd = '';
  for (let x = 0; x < W; x += 4) { const hh = 2 + Math.round(r() * r() * 9); if (r() > 0.3) gd += `M${x} ${GROUND - hh + 2}h4v${hh}h-4z`; }
  s += `<path d="${gd}" fill="#2f5a2a"/>`;
  return s;
}

export default function render() {
  const body = ({ top, bottom }) => {
    let s = skyBands(top, GROUND, ['#06051a', '#0a0822', '#0f0b2a', '#140e33', '#1a113b', '#211444', '#29174b', '#331a50', '#3d1e54']);
    s += stars({ seed: 9, n: 46, y: top + 4, h: 170 });
    s += moon(96, 104, { R: 9, px: 4 });
    // drifting clouds
    const cloud = (cx, cy, w, fill) => { let c = ''; for (let i = 0; i < w; i += 8) { const hh = 5 + Math.round(Math.sin((i / w) * Math.PI) * 10); c += `<rect x="${cx + i}" y="${cy - hh}" width="8" height="${hh}" fill="${fill}"/>`; } return c + `<rect x="${cx - 8}" y="${cy}" width="${w + 16}" height="4" fill="${fill}"/>`; };
    s += `<g opacity=".75"><animateTransform attributeName="transform" type="translate" values="0 0;-120 0;0 0" dur="50s" repeatCount="indefinite"/>${cloud(150, 120, 120, '#241b44')}${cloud(420, 90, 100, '#1e163c')}${cloud(800, 140, 110, '#241b44')}</g>`;
    // far hills
    const hills = [];
    for (let i = 0; i < 150; i++) { const t = (i / 150) * Math.PI * 2; hills.push(Math.round((258 + Math.sin(t * 2 + 1) * 12 + Math.sin(t * 6) * 6) / 6) * 6); }
    s += skyline(hills, 6, GROUND, '#181332');
    s += mound();
    // village
    s += cottage(160, GROUND - 8, { w: 24, wallH: 12, roofH: 12, px: 3, seed: 2, smoke: true });
    s += cottage(6, GROUND, { w: 30, seed: 1, wallH: 14, roofH: 12 });
    s += cottage(772, GROUND, { w: 30, seed: 3, wallH: 14, roofH: 12 });
    s += signpost(462);
    s += standingTorch(596, 0.6);
    s += ground();
    s += fog(GROUND - 18, { opacity: 0.16, color: '#8d7fb8' });
    // fireflies
    s += particles({ seed: 4, n: 12, x: 0, y: 220, w: W, h: 110, colors: ['#e8ff8a', '#ffe14a'], size: 3, dx: 24, dy: -30, dur: 5, opacity: 0.85, group: 2 });
    // the party: the Choir, the ape paladin, Brakka
    const feet = (name) => GROUND + 8 - actorSize(name).h;
    s += actor('choir2', 140, feet('choir2') - 6, { begin: 0.2 }) + actor('choir3', 184, feet('choir3') - 2, { begin: 0.5 }) + actor('choir1', 226, feet('choir1'), { begin: 0 });
    s += actor('ape', 290, feet('ape'));
    s += actor('brakka', 374, feet('brakka'), { begin: 0.3 });
    s += bob(bubble('BZZT.', 150, 172, { sc: 3, tail: 'left' }), { dy: -3, dur: 0.6 });
    // Elder Mirra and her lantern
    s += glow(536, feet('mirra') + 70, 90, '#ffb454', { opacity: 0.35, pulse: true, dur: 1.4 });
    s += actor('mirra', 506, feet('mirra'), { flip: true });
    // villagers huddled together, shivering
    const shiver = (inner, d) => `<g><animateTransform attributeName="transform" type="translate" values="0 0;1 0;0 0;-1 0" dur="0.25s" begin="${d}s" repeatCount="indefinite" calcMode="discrete"/>${inner}</g>`;
    s += shiver(actor('elf', 650, feet('elf') - 4, { begin: 0.1 }), 0);
    s += shiver(actor('farmer', 606, feet('farmer')), 0.1);
    s += shiver(actor('bard', 700, feet('bard'), { begin: 0.3 }), 0.05);
    s += shiver(actor('kid', 664, feet('kid') + 2, { begin: 0.2 }), 0.15);
    return s;
  };
  return scene({
    id: 'village',
    label: "Prologue, Shipwell at night. Cottages with lit windows and chimney smoke, a signpost reading SHIPWELL, standing torches. On the left the ape paladin stands with Brakka the dwarf artificer and the three clockwork constructs of the Choir, one of them saying BZZT. In the middle Elder Mirra, a halfling with a lantern; villagers huddle and shiver on the right. Far off on the horizon the catacomb mound glows green and ghosts drift up out of it.",
    body,
    dialogues: [
      { speaker: 'MIRRA', lines: ['Every release night the dead rise from the Catacombs.', 'Our last hero shipped on a Friday.'] },
      { speaker: 'BRAKKA', lines: ['Say the word, Principal.', 'Me and the tin choir are ready.'] },
    ],
  });
}
