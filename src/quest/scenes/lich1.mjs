// Ch VII · The Lich, round 1/3. Vel'Krann floats over the Untested Monolith and summons a horde of
// hallucinations: half-transparent "finished features" (glitching UI panels with ticks and 100%
// bars, ghost knights in chromatic double-image) march between him and the party.
import { scene, ptext, twidth, pathArt, sprite, use, blink, flicker, drift, float, particles } from '../engine.mjs';
import { STAGE_H, TOP, FEET, hall, monolith, lich, souls, party, LICH_W, LICH_PX } from './_sanctum.mjs';

const rep = 'repeatCount="indefinite"';

// a ghost knight: plumed helm, shield, sword raised (16×26)
const KNIGHT = [
  '.....RR.........',
  '....RRR.........',
  '...RR...........',
  '...KKKKK......K.',
  '..KWWWWWK....KWK',
  '..KWKKKWK....KWK',
  '..KWWWWWK....KWK',
  '...KWWWK.....KWK',
  '.KKKWWWKKK...KWK',
  'KSSSKWWWWWK..KWK',
  'KSWSSKWWWWWKKKKK',
  'KSWWSKWWWWWWKWK.',
  'KSWSSKWWWWWK.K..',
  'KSSSKWWWWWWK....',
  '.KSKWWWWWWWK....',
  '..KKWWWWWWWK....',
  '...KWWKKWWWK....',
  '...KWWK.KWWK....',
  '...KWWK.KWWK....',
  '...KWWK.KWWK....',
  '..KWWWK.KWWWK...',
  '..KKKKK.KKKKK...',
];

/** Chromatic, jittering, half-transparent copy of some art: the look of a hallucination. */
function ghostly(inner, { begin = 0, dx = 3 } = {}) {
  const jit = (vals, d) => `<animateTransform attributeName="transform" type="translate" values="${vals}" dur="${d}s" begin="${begin}s" ${rep} calcMode="discrete"/>`;
  return `<g opacity=".55">${flicker(
    `<g fill-opacity=".9"><g opacity=".55">${jit(`${-dx} 0;${-dx - 2} 0;${-dx} 1;${-dx + 1} 0`, 0.4)}${inner("#ff4fd8")}</g>`
    + `<g opacity=".55">${jit(`${dx} 0;${dx + 1} -1;${dx + 2} 0;${dx} 0`, 0.5)}${inner('#4ff3ff')}</g>`
    + `<g>${jit('0 0;0 0;1 0;0 0;0 0;-6 0;0 0', 1.7)}${inner(null)}</g></g>`,
    { dur: 1.1, min: 0.6, begin })}</g>`;
}

function knight(x, y, k) {
  const pal = (c) => (c ? { K: c, W: c, S: c, R: c } : { K: '#1b4a5a', W: '#c8f6ff', S: '#8fe8ff', R: '#ff9ad8' });
  return ghostly((c) => use(sprite(`lich1Knight${c ?? ''}`, KNIGHT, 4, pal(c)), x, y), { begin: k * 0.37 });
}

/** A fake, finished-looking UI panel. */
function panel(x, y, w, title, rows, k) {
  const h = 30 + rows.length * 20;
  const art = (c) => {
    const ink = c ?? '#c8f6ff', line = c ?? '#5ce1ff';
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c ?? '#0e3a4a'}" fill-opacity="${c ? 0.25 : 0.55}" stroke="${line}" stroke-width="2"/>`;
    s += `<rect x="${x}" y="${y}" width="${w}" height="18" fill="${line}" fill-opacity="${c ? 0.4 : 0.7}"/>`;
    s += [0, 1, 2].map((i) => `<rect x="${x + w - 14 - i * 10}" y="${y + 6}" width="6" height="6" fill="#0a1a22"/>`).join('');
    s += ptext(title, x + 6, y + 4, 2, '#0a1a22', { shadow: null });
    rows.forEach((r, i) => {
      const ry = y + 26 + i * 20;
      if (r.bar !== undefined) {
        s += `<rect x="${x + 8}" y="${ry}" width="${w - 64}" height="10" fill="none" stroke="${ink}" stroke-width="2"/><rect x="${x + 10}" y="${ry + 2}" width="${(w - 68) * r.bar}" height="6" fill="${c ?? '#7dff8a'}"/>`;
        s += ptext(`${Math.round(r.bar * 100)}%`, x + w - 8, ry, 2, ink, { anchor: 'end', shadow: null });
      } else if (r.btn) {
        const bw = twidth(r.btn, 2) + 16;
        s += `<rect x="${x + (w - bw) / 2}" y="${ry - 2}" width="${bw}" height="18" fill="${c ?? '#3fdc5a'}" fill-opacity="${c ? 0.4 : 0.85}"/>` + ptext(r.btn, x + w / 2, ry + 2, 2, '#06200e', { anchor: 'middle', shadow: null });
      } else s += ptext(r, x + 8, ry, 2, ink, { shadow: null });
    });
    return s;
  };
  return drift(ghostly(art, { begin: k * 0.5, dx: 4 }), { dx: k % 2 ? 8 : -8, dy: -6, dur: 4 + k });
}

export default function render() {
  const body = () => {
    let s = hall();
    s += souls();
    s += monolith();
    // the Lich, arms raised, conjuring: streams of summoning sparks fall from his hands
    const lx = 450 - (LICH_W * LICH_PX) / 2, ly = TOP + 2;
    s += lich(lx, ly);
    s += particles({ seed: 71, n: 14, x: lx, y: ly + 40, w: 30, h: 20, colors: ['#4ff3ff', '#ff4fd8', '#a6ff4d'], size: [3, 4], dx: -120, dy: 120, dur: 2.2, opacity: 0.8 });
    s += particles({ seed: 72, n: 14, x: lx + LICH_W * LICH_PX - 30, y: ly + 40, w: 30, h: 20, colors: ['#4ff3ff', '#ff4fd8', '#a6ff4d'], size: [3, 4], dx: 120, dy: 120, dur: 2.2, opacity: 0.8 });
    // the horde: finished-looking features, all hallucinated
    s += panel(230, 128, 132, 'CHECKOUT', ['DONE ✓', { bar: 1 }], 0);
    s += panel(552, 120, 140, 'LOGIN V2', ['ALL GREEN ✓', { btn: 'SHIP IT' }], 1);
    s += panel(214, 214, 112, 'SEARCH', [{ bar: 1 }], 2);
    s += panel(566, 222, 122, 'PAYMENTS', ['100% DONE'], 3);
    s += knight(252, FEET - 88 - 4, 0) + knight(316, FEET - 88 + 4, 1) + knight(520, FEET - 88 + 2, 2) + knight(588, FEET - 88 - 6, 3);
    // the party, steady
    s += party();
    return s;
  };
  return scene({
    id: 'lich1',
    stageH: STAGE_H,
    label: "Chapter VII, The Lich, round 1 of 3. A vast dark sanctum lit green by braziers, with floating rune circles. Vel'Krann the Legacy Lich, a crowned skeleton in tattered robes wreathed in green flame, floats above the Untested Monolith, a giant cracked slab glowing green whose plaque reads: 40,000 lines, no tests, last touched 2014. Trapped village souls swirl around it. Sparks fall from his raised hands and summon a horde of hallucinations: glitching, see-through features that look finished (panels saying DONE, ALL GREEN, 100%, SHIP IT) and ghost knights. Facing them: the ape paladin with Brakka, Xal'Zor the beholder hovering above, Gus the cube and the three clockwork constructs.",
    body,
    dialogues: [{ speaker: 'VELKRANN', lines: ['ANOTHER PRINCIPAL. REWRITE ME, THEN.', 'FROM SCRATCH. IN ONE WEEKEND.'] }],
  });
}
