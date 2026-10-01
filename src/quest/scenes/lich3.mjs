// Ch VII · The Lich, round 3/3: the phylactery. The Untested Monolith looms, huge, its cracks blazing
// and leaking light; red targeting brackets blink round it. Vel'Krann hovers behind, daring you. The
// Choir has frozen mid-swing, hammers raised, and turned to the human with a "?".
import { scene, ptext, pathArt, blink, bubble, bob, glow, pulse } from '../engine.mjs';
import { STAGE_H, TOP, FEET, MONO, hall, monolith, lich, souls, party, LICH_W } from './_sanctum.mjs';

const CHOIR_X = [654, 724, 794];
const HAMMER = ['KKKKKK', 'KSSSSK', 'KSMMSK', 'KKKKKK', '..KH..', '..KH..', '..KH..', '..KH..', '..KH..', '..KK..'];

/** Red corner brackets round a rect, blinking: the irreversible target. */
function brackets(x, y, w, h) {
  const L = 22, t = 5, c = '#ff3b3b';
  const d = [
    `M${x} ${y}h${L}v${t}h-${L - t}v${L - t}h-${t}z`,
    `M${x + w} ${y}h-${L}v${t}h${L - t}v${L - t}h${t}z`,
    `M${x} ${y + h}h${L}v-${t}h-${L - t}v-${L - t}h-${t}z`,
    `M${x + w} ${y + h}h-${L}v-${t}h${L - t}v-${L - t}h${t}z`,
  ].join('');
  return blink(`<path d="${d}" fill="${c}"/>` + ptext('IRREVERSIBLE', x + w / 2, y + h + 8, 2, c, { anchor: 'middle' }), { dur: 0.8, on: 0.7 });
}

export default function render() {
  const SC = 1.32;
  const body = () => {
    let s = hall();
    // the Lich, smaller and further back, hovering behind his phylactery
    const px = 3, lw = LICH_W * px;
    s += lich(450 - lw / 2, TOP + 2, { px, aura: 0.8 });
    s += souls({ n: 8, cy: 250, rx: 250, ry: 46, dur: 10 });
    // light bursting out of the cracks
    const rays = [[-70, -60], [-110, 10], [100, -50], [130, 20], [-40, 70], [60, 80]].map(([dx, dy]) => `<path d="M450 250L${450 + dx * 2.6 - 14} ${250 + dy * 2.6}L${450 + dx * 2.6 + 14} ${250 + dy * 2.6 + 10}z" fill="#a6ff4d" opacity=".14"/>`).join('');
    s += pulse(rays, { dur: 1.4, to: 0.4 });
    s += monolith({ scale: SC, glowAmt: 1.5 });
    const mw = MONO.w * SC, mh = MONO.h * SC;
    s += brackets(450 - mw / 2 - 16, MONO.base - mh - 26, mw + 48, mh + 34);
    // the Choir, frozen mid-swing: hammers up, heads turned to the human
    s += party({ choirX: CHOIR_X, gusX: 256, apeX: 156 });
    CHOIR_X.forEach((x, i) => {
      const hy = FEET - 118 - [0, 4, 2][i];
      s += `<g transform="rotate(-35 ${x + 6} ${hy + 40})">${pathArt(HAMMER, 4, x - 6, hy, { K: '#0c0a14', S: '#b8c4d6', M: '#7d8aa0', H: '#8a5a32' })}</g>`;
      s += bob(bubble('?', x + 22, FEET - 186 - [0, 4, 2][i], { sc: 3, tail: 'left' }), { dy: -3, dur: 0.5 + i * 0.12 });
    });
    return s;
  };
  return scene({
    id: 'lich3',
    stageH: STAGE_H,
    label: "Chapter VII, The Lich, round 3 of 3: the phylactery. The Untested Monolith looms huge in the middle of the sanctum, its cracks blazing green and spilling light, its plaque reading 40,000 lines, no tests, last touched 2014. Blinking red brackets frame it with the word IRREVERSIBLE. Vel'Krann the Legacy Lich hovers behind it, souls swirling round. The three clockwork constructs have frozen mid-swing with their hammers raised, each with a question mark, turning to the ape paladin, who stands with Brakka, Gus and Xal'Zor.",
    body,
    dialogues: [
      { speaker: 'VELKRANN', lines: ['STRIKE MY PHYLACTERY, THEN.', 'FORTY THOUSAND LINES. NO TESTS.'] },
      { speaker: 'CHOIR', lines: ['IRREVERSIBLE ACTION DETECTED.', 'ASKING THE HUMAN.'] },
    ],
  });
}
