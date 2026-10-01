// Title card: THE CATACOMBS OF LEGACY. Moonlit graveyard, a crypt facade whose dark arch hides the
// lich's glowing eyes, the party in silhouette behind the ape paladin, a ghoul rising on the right.
import {
  scene, W, PAL, ptext, actor, actorSize, torch, stars, skyBands, moon, skyline, fog, particles, glow,
  arch, deadTree, pathArt, flipbook, sprite, motion, flicker, blink, float, def, rng, SPRITES,
} from '../engine.mjs';

const GROUND = 408;

// gold / blood banded fills for the logo (hard stops = 16-bit gradient)
def('tGold', '<linearGradient id="tGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3b0"/><stop offset=".3" stop-color="#fff3b0"/><stop offset=".3" stop-color="#f6c84e"/><stop offset=".68" stop-color="#f6c84e"/><stop offset=".68" stop-color="#d4801f"/><stop offset="1" stop-color="#d4801f"/></linearGradient>');
def('tBlood', '<linearGradient id="tBlood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6b5e"/><stop offset=".4" stop-color="#ff6b5e"/><stop offset=".4" stop-color="#e0281e"/><stop offset=".72" stop-color="#e0281e"/><stop offset=".72" stop-color="#9c1414"/><stop offset="1" stop-color="#9c1414"/></linearGradient>');

const LICH_SIL = [
  '.....KKKK.....',
  '...KKHHHHKK...',
  '..KHHHHHHHHK..',
  '.KHHHHHHHHHHK.',
  '.KHHKKKKKKHHK.',
  'KHHKKKKKKKKHHK',
  'KHHKKKKKKKKHHK',
  'KHHKKKKKKKKHHK',
  'KHHHKKKKKKHHHK',
  'KHHHHKKKKHHHHK',
  'KHHHHHHHHHHHHK',
  'KHHHHHHHHHHHHK',
  'KHHHHHHHHHHHHK',
];

function facade() {
  const x0 = 300, x1 = 600, top = 236;
  let s = '';
  // pediment: stepped pixel triangle
  for (let i = 0; i < 9; i++) {
    const w = 340 - i * 36, y = top - 4 - i * 5;
    s += `<rect x="${450 - w / 2}" y="${y}" width="${w}" height="6" fill="${i % 2 ? '#3a3350' : '#433b5c'}"/>`;
  }
  s += `<rect x="276" y="${top - 4}" width="348" height="8" fill="#5a5078"/><rect x="276" y="${top + 4}" width="348" height="4" fill="#1b1630"/>`;
  // stone block body
  s += `<rect x="${x0}" y="${top + 8}" width="${x1 - x0}" height="${GROUND - top - 8}" fill="#2b2440"/>`;
  for (let y = top + 12, k = 0; y < GROUND; y += 16, k++) {
    for (let x = x0 + (k % 2 ? -20 : 0); x < x1; x += 40) {
      const a = Math.max(x, x0), b = Math.min(x + 38, x1);
      if (b > a) s += `<rect x="${a}" y="${y}" width="${b - a}" height="14" fill="#352d4e"/><rect x="${a}" y="${y}" width="${b - a}" height="2" fill="#463d63"/>`;
    }
  }
  // pillars
  for (const px of [306, 560]) {
    s += `<rect x="${px}" y="${top + 8}" width="34" height="${GROUND - top - 8}" fill="#4a4266"/><rect x="${px}" y="${top + 8}" width="6" height="${GROUND - top - 8}" fill="#6a6090"/><rect x="${px + 28}" y="${top + 8}" width="6" height="${GROUND - top - 8}" fill="#2b2440"/>`;
    s += `<rect x="${px - 4}" y="${top + 8}" width="42" height="10" fill="#5a5078"/><rect x="${px - 4}" y="${GROUND - 12}" width="42" height="12" fill="#5a5078"/>`;
  }
  // skull keystone
  s += actor('skull', 441, top + 16, { px: 3 });
  // the arch and what waits inside it
  s += arch(390, GROUND - 22 * 6, 20, 22, { px: 6, pal: { K: '#0c0a14', T: '#6b5f86', Z: '#05030a' } });
  s += glow(450, 330, 70, '#a6ff4d', { opacity: 0.22, pulse: true, dur: 3 });
  s += pathArt(LICH_SIL, 5, 415, 300, { K: '#05030a', H: '#141b12' });
  const eyes = `<rect x="435" y="325" width="10" height="7" fill="#a6ff4d"/><rect x="455" y="325" width="10" height="7" fill="#a6ff4d"/><rect x="437" y="326" width="4" height="3" fill="#eaffd0"/><rect x="457" y="326" width="4" height="3" fill="#eaffd0"/>`;
  s += glow(450, 329, 30, '#a6ff4d', { opacity: 0.55 });
  s += flicker(`<g><animate attributeName="visibility" values="visible;hidden;visible" keyTimes="0;.93;.97" dur="5s" repeatCount="indefinite" calcMode="discrete"/>${eyes}</g>`, { dur: 2.4, min: 0.6 });
  s += particles({ seed: 5, n: 12, x: 400, y: 360, w: 100, h: 40, colors: ['#a6ff4d', '#6bd12a'], size: [2, 4], dy: -90, dx: 0, dur: 5, opacity: 0.5 });
  // torches on the pillars
  s += torch(309, 300, { px: 4 }) + torch(563, 300, { px: 4, delay: 0.5 });
  return s;
}

function ground() {
  const r = rng(21);
  def('tDirt', '<pattern id="tDirt" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#2e1d14"/><rect x="2" y="4" width="4" height="4" fill="#45291a"/><rect x="14" y="2" width="6" height="4" fill="#24150d"/><rect x="10" y="12" width="4" height="4" fill="#4a2e1e"/><rect x="18" y="16" width="4" height="4" fill="#45291a"/><rect x="4" y="18" width="6" height="2" fill="#24150d"/></pattern>');
  let s = `<rect x="0" y="${GROUND}" width="${W}" height="${520 - GROUND}" fill="url(#tDirt)"/>`;
  const gd = ['', ''];
  for (let x = 0; x < W; x += 4) { const hh = 4 + Math.round(r() * r() * 12); gd[r() > 0.5 ? 0 : 1] += `M${x} ${GROUND - hh + 4}h4v${hh}h-4z`; }
  s += `<rect x="0" y="${GROUND}" width="${W}" height="6" fill="#2a4a24"/><path fill="#2f5a2a" d="${gd[0]}"/><path fill="#3f7a34" d="${gd[1]}"/>`;
  for (const x of [40, 330, 610, 840]) s += actor('skull', x, GROUND + 14 + Math.round(r() * 6), { px: 3 }) + `<rect x="${x + 24}" y="${GROUND + 26}" width="18" height="4" fill="#cfc7ae"/><rect x="${x + 22}" y="${GROUND + 24}" width="4" height="8" fill="#cfc7ae"/><rect x="${x + 40}" y="${GROUND + 24}" width="4" height="8" fill="#cfc7ae"/>`;
  return s;
}

function graveyardRight() {
  let s = deadTree(760, GROUND + 4, { w: 46, h: 62, seed: 42, px: 3, pal: { T: '#140f1d', t: '#3c2c52' } });
  s += actor('grave', 640, GROUND - 56) + actor('cross', 830, GROUND - 48);
  // a ghoul clawing up out of a grave (clipped at ground level)
  def('tClip', `<clipPath id="tClip"><rect x="600" y="0" width="300" height="${GROUND + 6}"/></clipPath>`);
  const g = actor('ghoulTop', 700, GROUND - 60, { flip: false });
  s += `<g clip-path="url(#tClip)"><g><animateTransform attributeName="transform" type="translate" values="0 12;0 0;0 0;0 12" keyTimes="0;.35;.7;1" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines=".4 0 .6 1;0 0 1 1;.4 0 .6 1"/>${g}</g></g>`;
  s += `<rect x="690" y="${GROUND}" width="80" height="8" fill="#3e2619"/><rect x="694" y="${GROUND - 4}" width="72" height="6" fill="#4a2e1e"/>`;
  return s;
}

function party() {
  const base = GROUND + 2;
  // silhouettes with a warm torch rim light on their right edge
  const sil = (name, x, keep, begin, px = 3) => {
    const y = base - actorSize(name, px).h;
    return actor(name, x + 3, y, { px, silhouette: '#b0603a', keep: '', begin }) + actor(name, x, y, { px, silhouette: '#1d1530', keep, begin });
  };
  let s = glow(230, 340, 150, '#ff9a1f', { opacity: 0.16 });
  s += sil('choir2', 14, 'CW', 0.1, 4) + sil('choir3', 56, 'CW', 0.3, 4) + sil('choir1', 98, 'CW', 0, 4);
  s += sil('brakka', 128, 'CW', 0.2, 4);
  s += actor('gus', 2, base - actorSize('gus', 3).h, { px: 3, silhouette: '#0e2414@0.85', keep: 'EKW', begin: 0.4 });
  // the ape paladin, front and centre of his party
  s += actor('ape', 192, base - actorSize('ape', 5).h + 5, { px: 5 });
  return s;
}

function logo() {
  let s = ptext('THE', W / 2, 52, 3, '#fff3b0', { anchor: 'middle', outline: '#120a10' });
  s += ptext('CATACOMBS', W / 2, 84, 9, 'url(#tGold)', { anchor: 'middle', outline: '#120a10' });
  s += ptext('OF LEGACY', W / 2, 160, 5, 'url(#tBlood)', { anchor: 'middle', outline: '#120a10' });
  // sparkle glints on the gold
  for (const [x, y, d] of [[236, 100, 0], [640, 134, 0.9]]) s += blink(`<path fill="#fffbe0" d="M${x} ${y - 7}h3v17h-3zM${x - 7} ${y}h17v3h-17z"/>`, { dur: 2.1, begin: d, on: 0.25 });
  return s;
}

export default function render() {
  const body = ({ top }) => {
    let s = skyBands(top, GROUND);
    s += stars({ seed: 4, n: 50, y: top + 4, h: 220 });
    s += moon(790, 112, { R: 12, px: 4 });
    // far hills with a ruined tower
    const hills = [];
    for (let i = 0; i < 150; i++) { const t = (i / 150) * Math.PI * 2; hills.push(Math.round((330 + Math.sin(t * 2) * 22 + Math.sin(t * 5 + 1) * 10) / 6) * 6); }
    for (let i = 118; i < 124; i++) hills[i] = 262 + (i % 2 ? 0 : -6);
    s += skyline(hills, 6, GROUND, '#171230');
    s += `<rect x="712" y="276" width="6" height="10" fill="#ffcf5a"><animate attributeName="opacity" values="1;1;.3;1" dur="3.4s" repeatCount="indefinite"/></rect>`;
    // drifting clouds
    const cloud = (cx, cy, w, fill) => { let c = ''; for (let i = 0; i < w; i += 8) { const hh = 6 + Math.round(Math.sin((i / w) * Math.PI) * 12); c += `<rect x="${cx + i}" y="${cy - hh}" width="8" height="${hh}" fill="${fill}"/>`; } return c + `<rect x="${cx - 8}" y="${cy}" width="${w + 16}" height="5" fill="${fill}"/>`; };
    s += `<g opacity=".8"><animateTransform attributeName="transform" type="translate" values="0 0;-140 0;0 0" dur="60s" repeatCount="indefinite"/>${cloud(700, 150, 140, '#2e2250')}${cloud(60, 110, 120, '#241b44')}${cloud(860, 200, 100, '#2e2250')}</g>`;
    // bats over the moon
    const batIds = SPRITES.CAST.bat.frames.map((f, i) => sprite(`bat${i}`, f, 3, SPRITES.CAST.bat.pal));
    s += [[0, 820, 70], [-3.5, 860, 100], [-6, 780, 130]].map(([b, x, y]) => `<g><animateMotion dur="12s" begin="${b}s" repeatCount="indefinite" path="M0 0 q-120 -30 -240 10 t-240 0 t-300 -20 t-300 10"/>${flipbook(batIds, 0.14, x, y)}</g>`).join('');
    s += facade();
    s += graveyardRight();
    s += ground();
    s += fog(GROUND - 22, { opacity: 0.18 });
    s += party();
    s += logo();
    s += blink(ptext('SCROLL DOWN TO PLAY', W / 2, 452, 3, '#ffffff', { anchor: 'middle', outline: '#120a10' }), { dur: 1.2, on: 0.7 });
    s += ptext('A PRINCIPAL ENGINEERING ADVENTURE · (C) 2014 APEHEAD', W / 2, 488, 2, '#b9a8e8', { anchor: 'middle', shadow: '#120a10' });
    return s;
  };
  return scene({
    id: 'title',
    stageH: 476,
    label: "THE CATACOMBS OF LEGACY, an 8-bit title screen. Under a full moon, an ape paladin in silver armour with a red plume and a sword stands at the front of his party, in silhouette behind him: a dwarf with a wrench, three clockwork constructs with glowing cyan visors and a gelatinous cube. Ahead, a torch-lit crypt; in the dark of its arch, a lich's green eyes glow. A ghoul claws out of a grave on the right. Scroll down to play.",
    body,
  });
}
