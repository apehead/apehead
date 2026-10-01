// Ch VII · The Lich, round 2/3. Vel'Krann turns his curse on the Clockwork Choir: crackling curse
// bolts from his claws, the constructs' visors burn red and they shake, while paper talismans
// reading PLEASE DON'T flutter round them, uselessly.
import { scene, ptext, twidth, flicker, drift, sway, glow, particles } from '../engine.mjs';
import { STAGE_H, TOP, FEET, hall, monolith, lich, souls, party, LICH_W, LICH_PX } from './_sanctum.mjs';

const CHOIR_X = [624, 708, 792];

/** A jagged curse bolt from (x0, y0) to (x1, y1). */
function bolt(x0, y0, x1, y1, seed, begin) {
  let pts = `M${x0} ${y0}`, s = seed;
  const n = 7;
  for (let i = 1; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    const t = i / n, j = ((s / 233280) - 0.5) * 34;
    pts += `L${Math.round(x0 + (x1 - x0) * t + j)} ${Math.round(y0 + (y1 - y0) * t - j * 0.4)}`;
  }
  pts += `L${x1} ${y1}`;
  const g = `<path d="${pts}" fill="none" stroke="#ff2a5a" stroke-width="7" filter="url(#sanctum-blur)" opacity=".8"/>`
    + `<path d="${pts}" fill="none" stroke="#ff9ab8" stroke-width="2.5" stroke-linejoin="bevel"/>`;
  return flicker(g, { dur: 0.45, min: 0.45, begin });
}

/** A paper talisman (ofuda) reading PLEASE / DON'T, fluttering. */
function talisman(x, y, deg, k, sc = 2) {
  const w = twidth('PLEASE', sc) + 14, h = 14 * sc + 22;
  const paper = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f3e3b5"/><rect x="${x}" y="${y + h - 3}" width="${w}" height="3" fill="#c8b07a"/>`
    + `<rect x="${x + 3}" y="${y + 3}" width="${w - 6}" height="${h - 6}" fill="none" stroke="#c0392b" stroke-width="1.5"/>`
    + ptext('PLEASE', x + w / 2, y + 7, sc, '#b01e1e', { anchor: 'middle', shadow: null })
    + ptext("DON'T", x + w / 2, y + 11 + 7 * sc, sc, '#b01e1e', { anchor: 'middle', shadow: null });
  return drift(sway(`<g transform="rotate(${deg} ${x + w / 2} ${y + h / 2})">${paper}</g>`, { deg: 6, cx: x + w / 2, cy: y, dur: 1.4 + k * 0.3, begin: k * 0.2 }), { dx: k % 2 ? 10 : -10, dy: -8, dur: 3 + k * 0.7 });
}

export default function render() {
  const body = () => {
    let s = hall();
    s += souls();
    s += monolith();
    const lx = 450 - (LICH_W * LICH_PX) / 2, ly = TOP + 2;
    // the curse: bolts from his right claw to each construct (drawn under the Lich)
    const hx = lx + LICH_W * LICH_PX - 14, hy = ly + 22;
    const bolts = CHOIR_X.map((x, i) => bolt(hx, hy, x + 32, FEET - 84, 11 + i * 7, i * 0.13)).join('');
    s += lich(lx, ly);
    s += bolts;
    s += glow(hx, hy, 40, '#ff2a5a', { opacity: 0.7, pulse: true, dur: 0.6 });
    // red curse glow pooled under the Choir
    s += glow(712, FEET - 40, 150, '#ff2a5a', { opacity: 0.35, pulse: true, dur: 0.9 });
    s += party({
      gusX: 252, choirX: CHOIR_X, choirShake: true,
      choirPal: { C: '#ff2a3a', W: '#ffd0d0' },
    });
    // their eyes leak red sparks
    s += particles({ seed: 81, n: 18, x: 610, y: FEET - 96, w: 250, h: 30, colors: ['#ff2a3a', '#ff9ab8'], size: [2, 4], dy: -60, dur: 1.6, opacity: 0.9 });
    // PLEASE DON'T, PLEASE DON'T, PLEASE DON'T…
    s += talisman(566, 236, -12, 0) + talisman(664, 206, 7, 1) + talisman(760, 226, -6, 2) + talisman(806, 150, 14, 4);
    return s;
  };
  return scene({
    id: 'lich2',
    stageH: STAGE_H,
    label: "Chapter VII, The Lich, round 2 of 3. In the green-lit sanctum, Vel'Krann the crowned Legacy Lich floats above the cracked Untested Monolith (40,000 lines, no tests, last touched 2014) and hurls crackling red curse bolts from his claw at the three clockwork constructs of the Choir. Their visors burn red and they shake, while paper talismans reading PLEASE DON'T flutter around them, doing nothing. On the left the ape paladin, Brakka the dwarf, Gus the gelatinous cube and Xal'Zor the beholder look on.",
    body,
    dialogues: [
      { speaker: 'VELKRANN', lines: ['THEN I CURSE YOUR CONSTRUCTS!'] },
      { speaker: 'CHOIR', lines: ["PLEASE DON'T… PLEASE DON'T…", 'WE DID.'] },
    ],
  });
}
