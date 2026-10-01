// Ch VI · The Sealed Door. The memory puzzle: a massive arched door, iron-banded, a skull keystone,
// and in the middle a round stone seal with three EMPTY gem sockets in a row, a carved "?" under each.
// The answer was carved above the gate in Ch I, so nothing here may hint at it: the sockets are all the
// same hungry violet-black, and the loose gems ride around inside Gus in a jumble, never in a row.
// Xal'Zor (an ally now) shines his eye on the seal; the ape paladin, the Choir and Brakka look on.
import {
  scene, W, ptext, actor, actorSize, torch, particles, glow, pathArt, def, pulse, float, bob, flicker,
  brickWall, floorTiles, arch, bubble, rng,
} from '../engine.mjs';
import { xalzor } from './beholder.mjs';

const FLOOR = 352;
const SEAL = { x: 450, y: 222, r: 74 };
const SOCKETS = [396, 450, 504];

def('doorLeaf', `<clipPath id="doorLeaf"><path d="M312 ${FLOOR}V226A138 138 0 0 1 588 226V${FLOOR}z"/></clipPath>`);
def('doorWood', '<pattern id="doorWood" patternUnits="userSpaceOnUse" width="24" height="64"><rect width="24" height="64" fill="#2a1d24"/><rect x="0" width="2" height="64" fill="#160e14"/><rect x="2" width="2" height="64" fill="#3a2a30"/><rect x="12" y="20" width="4" height="10" fill="#22161c"/><rect x="6" y="46" width="3" height="8" fill="#22161c"/></pattern>');

function socketGrid() {
  // octagonal stone socket, bevelled, EMPTY: a dark hollow
  const g = [];
  for (let y = 0; y < 12; y++) {
    let row = '';
    for (let x = 0; x < 12; x++) {
      const dx = x - 5.5, dy = y - 5.5, o = Math.max(Math.abs(dx), Math.abs(dy), (Math.abs(dx) + Math.abs(dy)) * 0.72);
      row += o > 6 ? '.' : o > 5.2 ? 'K' : o > 3.8 ? (dx + dy < 0 ? 'L' : 'D') : o > 3.1 ? 'K' : dy > 1.5 ? 'h' : 'H';
    }
    g.push(row);
  }
  return g;
}

function door() {
  let s = '';
  // the arch frame
  s += arch(288, 64, 54, 48, { px: 6, ring: 3, pal: { K: '#0c0a14', T: '#6b6488', Z: '#05030a' } });
  // carved rune notches around the frame
  let runes = '';
  for (let i = 0; i <= 16; i++) {
    const a = Math.PI + (i / 16) * Math.PI, x = Math.round(450 + Math.cos(a) * 150), y = Math.round(226 + Math.sin(a) * 150);
    runes += i % 2 ? `M${x - 2} ${y - 4}h4v8h-4z` : `M${x - 4} ${y - 2}h8v4h-8z`;
  }
  for (let y = 240; y < FLOOR - 10; y += 22) runes += `M298 ${y}h6v4h-6zM300 ${y + 8}h2v6h-2zM596 ${y}h6v4h-6zM598 ${y + 8}h2v6h-2z`;
  s += `<path fill="#2e2942" d="${runes}"/>`;
  // the leaves: banded wood, rivets, a seam
  let iron = '', rivets = '';
  for (const by of [132, 300]) { iron += `M300 ${by}h300v10h-300z`; for (let x = 318; x < 590; x += 22) rivets += `M${x} ${by + 3}h4v4h-4z`; }
  s += `<g clip-path="url(#doorLeaf)"><rect x="300" y="64" width="300" height="${FLOOR - 64}" fill="url(#doorWood)"/>`
    + `<path fill="#3a3448" d="${iron}"/><path fill="#8f88a6" d="${rivets}"/><rect x="448" y="64" width="4" height="${FLOOR - 64}" fill="#0c0810"/>`
    + `<rect x="312" y="${FLOOR - 8}" width="276" height="8" fill="#140c12"/></g>`;
  // carved skulls on the leaf panels
  s += actor('skull', 340, 262, { px: 4, pal: { W: '#8f88a6', K: '#2e2942' } }) + actor('skull', 536, 262, { px: 4, pal: { W: '#8f88a6', K: '#2e2942' } });
  // the inscription
  s += `<rect x="378" y="100" width="144" height="26" fill="#0c0a14"/><rect x="381" y="103" width="138" height="20" fill="#544e6b"/><rect x="381" y="103" width="138" height="2" fill="#837d99"/>`;
  s += ptext('ONE ORDER', 450, 107, 2, '#e8e3f2', { anchor: 'middle', shadow: '#1b1630' });
  // the seal
  const { x, y, r } = SEAL;
  s += `<circle cx="${x}" cy="${y + 4}" r="${r + 4}" fill="#05030a"/><circle cx="${x}" cy="${y}" r="${r}" fill="#0c0a14"/><circle cx="${x}" cy="${y}" r="${r - 4}" fill="#6b6488"/><circle cx="${x}" cy="${y}" r="${r - 12}" fill="#544e6b"/>`;
  let ring = '';
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, rx = Math.round(x + Math.cos(a) * (r - 8)), ry = Math.round(y + Math.sin(a) * (r - 8)); ring += `M${rx - 2} ${ry - 2}h4v4h-4z`; }
  s += `<path fill="#2e2942" d="${ring}"/>`;
  s += `<path fill="#837d99" d="M${x - r + 14} ${y - 22}h${2 * r - 28}v3h-${2 * r - 28}z"/><path fill="#2e2942" d="M${x - r + 14} ${y + 26}h${2 * r - 28}v3h-${2 * r - 28}z"/>`;
  // three empty sockets, all the same, each with a carved question mark
  const sg = socketGrid();
  for (const sx of SOCKETS) {
    s += pathArt(sg, 4, sx - 24, y - 24, { K: '#0c0a14', L: '#b9b2c9', D: '#2e2942', H: '#05030a', h: '#140c22' });
    s += ptext('?', sx, y + 30, 2, '#e8e3f2', { anchor: 'middle', shadow: '#0c0a14' });
  }
  // a faint hungry glimmer inside the empty sockets (identical, neutral violet)
  s += pulse(SOCKETS.map((sx) => `<rect x="${sx - 6}" y="${y - 6}" width="8" height="4" fill="#8d7fb8" opacity=".5"/>`).join(''), { dur: 2.4, to: 0.3 });
  // skull keystone
  s += `<rect x="426" y="58" width="48" height="34" fill="#0c0a14"/><rect x="430" y="62" width="40" height="26" fill="#837d99"/>`;
  s += actor('skull', 438, 64, { px: 4 });
  return s;
}

function column(x) {
  let s = `<rect x="${x}" y="44" width="48" height="${FLOOR - 44}" fill="#3a3350"/><rect x="${x}" y="44" width="8" height="${FLOOR - 44}" fill="#5a5078"/><rect x="${x + 40}" y="44" width="8" height="${FLOOR - 44}" fill="#241e36"/>`;
  for (let y = 64; y < FLOOR; y += 36) s += `<rect x="${x}" y="${y}" width="48" height="3" fill="#241e36"/>`;
  return s + `<rect x="${x - 6}" y="${FLOOR - 20}" width="60" height="20" fill="#4a4266"/><rect x="${x - 6}" y="${FLOOR - 20}" width="60" height="3" fill="#6a6090"/>`;
}

// the three loose gems, tumbling inside Gus in a jumble. Neither their x order (red, gold, green) nor
// their y order (gold, red, green) matches any answer choice, so they hint at nothing.
const GEM = ['.KKKK.', 'KWccCK', 'KcCCCK', 'KCCCdK', '.KCdK.', '..KK..'];
function gems(gx, gy) {
  const g = (dx, dy, c, b) => bob(pathArt(GEM, 3, gx + dx, gy + dy, { K: '#0c0a14', W: '#ffffff', c: c[0], C: c[1], d: c[2] }), { dy: -3, dur: 1.6, begin: b, smooth: true });
  return g(38, 6, ['#fff3b0', '#f6c84e', '#a06c18'], 0) + g(14, 26, ['#ff9a90', '#e8342c', '#8e1a1a'], -0.6) + g(62, 38, ['#c6ffb0', '#3fdc5a', '#1f7a30'], -1.1);
}

export default function render() {
  const body = ({ top, bottom }) => {
    let s = brickWall(0, top, W, FLOOR - top, { dark: '#120c1e', mid: '#1c1430', light: '#261c3e' });
    s += glow(450, 210, 260, '#8d7fb8', { opacity: 0.16 });
    s += column(236) + column(616);
    s += torch(246, 176, { px: 4 }) + torch(626, 176, { px: 4, delay: 0.5 });
    s += door();
    s += floorTiles(0, FLOOR, W, bottom - FLOOR);
    // cobwebs in the top corners
    s += `<path fill="none" stroke="#8d7fb0" stroke-width="2" opacity=".35" d="M0 60l70 0M0 60l0 70M0 60l60 50M20 60q6 14 -20 16M44 60q8 26 -44 40M2 100q30 -4 44 -26"/>`;
    s += `<path fill="none" stroke="#8d7fb0" stroke-width="2" opacity=".35" d="M900 60l-70 0M900 60l0 70M900 60l-60 50M880 60q-6 14 20 16M856 60q-8 26 44 40M898 100q-30 -4 -44 -26"/>`;
    // the party: Choir and the ape on the left, Brakka and Gus (carrying the gems) on the right
    const feet = (n, px = 4) => FLOOR + 6 - actorSize(n, px).h;
    s += actor('choir2', 18, feet('choir2', 3) - 2, { px: 3, begin: 0.2 }) + actor('choir3', 64, feet('choir3', 3), { px: 3, begin: 0.5 }) + actor('choir1', 110, feet('choir1', 3) - 1, { px: 3 });
    s += actor('ape', 172, feet('ape'));
    s += actor('brakka', 640, feet('brakka'), { flip: true, begin: 0.3 });
    s += actor('gus', 770, feet('gus', 4), { begin: 0.2 });
    s += gems(770, feet('gus', 4) + 18);
    s += bob(bubble('hmm.', 812, 210, { sc: 2, tail: 'left' }), { dy: -2, dur: 0.8 });
    // Xal'Zor, an ally now, lights the seal with his eye
    def('doorCone', '<linearGradient id="doorCone" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#e8ffd0" stop-opacity=".45"/><stop offset="1" stop-color="#9dff9a" stop-opacity=".1"/></linearGradient>');
    s += pulse(`<path d="M786 128L792 140L${SEAL.x + 40} ${SEAL.y + 64}L${SEAL.x - 70} ${SEAL.y + 40}L${SEAL.x - 60} ${SEAL.y - 50}z" fill="url(#doorCone)"/>`, { dur: 2.6, to: 0.6 });
    s += float(xalzor(800, 128, { scale: 0.42 }), { dy: -6, dur: 3 });
    // dust in the torchlight
    s += particles({ seed: 6, n: 15, x: 0, y: top + 30, w: W, h: 260, colors: ['#8d7fb0', '#ffcf8a'], size: [2, 3], dx: 10, dy: -30, dur: 7, opacity: 0.5 });
    return s;
  };
  return scene({
    id: 'door',
    label: "Chapter VI, The Sealed Door. A massive arched door between two torch-lit columns, iron-banded, a skull keystone, carved skulls and the words ONE ORDER. In its centre a round stone seal holds three empty gem sockets in a row, a carved question mark under each. Xal'Zor, now an ally, shines his eye on the seal. The ape paladin and the three constructs stand on the left; Brakka and Gus the gelatinous cube, with three loose gems tumbling inside him, stand on the right.",
    body,
    dialogues: [{ speaker: 'NARRATOR', lines: ['DID YOU LOOK UP AT THE GATE?'] }],
  });
}
