// Ch VII · Victory. The Untested Monolith comes apart slice by slice: every remaining slice is pinned
// by a green check, the carved-off slices tumble away and fall; Vel'Krann dissolves into green dust;
// daylight breaks through a crack in the vault and the freed souls of Shipwell rise into it. The party
// cheers: the ape paladin raises his sword.
import { scene, ptext, def, glow, pulse, flicker, particles, bubble, bob } from '../engine.mjs';
import { STAGE_H, TOP, HORIZON, MONO, hall, monolith, monolithArt, plaqueArt, lich, freedSouls, party, LICH_W, LICH_PX } from './_sanctum.mjs';

const rep = 'repeatCount="indefinite"';
const N = 6; // slices
const KEEP = 2; // bottom slices still standing (pinned by checks)

function slicedMonolith() {
  const { w, h, depth } = MONO, sh = h / N;
  def('victory-slab', `<g id="victory-slab">${monolithArt({ glowAmt: 1.3, plaque: false })}</g>`);
  let s = '';
  // per-slice clip windows (local coords); the top one also keeps the top face
  for (let i = 0; i < N; i++) {
    const y0 = i === 0 ? -depth : i * sh, y1 = (i + 1) * sh + (i === N - 1 ? depth : 0);
    def(`victory-clip${i}`, `<clipPath id="victory-clip${i}"><rect x="-4" y="${y0.toFixed(1)}" width="${w + depth + 8}" height="${(y1 - y0).toFixed(1)}"/></clipPath>`);
  }
  const slice = (i) => `<g clip-path="url(#victory-clip${i})"><use href="#victory-slab"/></g>`;
  // standing slices + their checks
  for (let i = N - KEEP; i < N; i++) {
    s += slice(i);
    s += ptext('✓', -30, Math.round(i * sh + sh / 2 - 10), 3, '#7dff8a', { shadow: '#06200e' });
  }
  // the carved slices: displaced (static pose = mid-tumble), then each falls away on a loop
  const poses = [ // [dx, dy, rot, fall dx, fall dy, fall rot]: pulled out like blocks from a tower
    [74, -26, 9, 190, 230, 60],
    [-50, -18, -5, -180, 240, -50],
    [30, -11, 3, 160, 220, 35],
    [-12, -5, -1, -120, 200, -25],
  ];
  for (let i = 0; i < N - KEEP; i++) {
    const [dx, dy, r, fx, fy, fr] = poses[i];
    const cx = w / 2, cy = i * sh + sh / 2, d = 4.8, b = (-i * 0.6).toFixed(1);
    const pose = `translate(${dx} ${dy}) rotate(${r} ${cx} ${cy})`;
    const fall = `<animateTransform attributeName="transform" type="translate" values="0 0;0 0;${fx} ${fy}" keyTimes="0;.55;1" dur="${d}s" begin="${b}s" ${rep} calcMode="spline" keySplines="0 0 1 1;.5 0 1 1"/>`
      + `<animate attributeName="opacity" values="1;1;0" keyTimes="0;.7;1" dur="${d}s" begin="${b}s" ${rep}/>`;
    const spin = `<animateTransform attributeName="transform" type="rotate" values="0 ${cx} ${cy};0 ${cx} ${cy};${fr - r} ${cx} ${cy}" keyTimes="0;.55;1" dur="${d}s" begin="${b}s" ${rep}/>`;
    s += `<g>${fall}<g transform="${pose}"><g>${spin}${slice(i)}${ptext('✓', w + depth + 6, Math.round(cy - 10), 3, '#7dff8a', { shadow: '#06200e' })}</g></g></g>`;
  }
  // the fresh cut on top of the stub, glowing
  s += pulse(`<rect x="0" y="${((N - KEEP) * sh - 2).toFixed(1)}" width="${w + depth}" height="4" fill="#fff6c8"/>`, { dur: 1.2, to: 0.5 });
  // the plaque, knocked off and lying on the floor
  s += `<g transform="translate(31 ${h + 64}) rotate(-4 80 -30) scale(.72)">${plaqueArt(w, 0)}</g>`;
  // rubble on the floor
  let rb = '';
  for (const [x, y, rw] of [[-60, h + 2, 22], [-30, h + 8, 14], [236, h + 4, 26], [270, h + 10, 12], [190, h + 12, 16], [10, h + 14, 10]]) rb += `M${x} ${y}h${rw}v${Math.round(rw / 2)}h-${rw}z`;
  s += `<path d="${rb}" fill="#34493b"/>`;
  // stone grit trickling down from the cut
  s += particles({ seed: 91, n: 16, x: 0, y: (N - KEEP) * sh - 6, w, h: 6, colors: ['#54705a', '#a6ff4d', '#26362c'], size: [3, 5], dy: 60, dx: 0, dur: 1.4, opacity: 0.9 });
  return s;
}

/** Daylight breaking in through a crack in the vault. */
function daylight() {
  let s = '';
  // the crack in the ceiling
  s += `<path d="M300 ${TOP}l20 10l18 -6l26 14l22 -4l30 12l20 -8l28 10l26 -6l24 10l22 -6l18 8l26 -10l20 6V${TOP}z" fill="#fff6c8"/>`;
  s += glow(450, TOP, 260, '#ffe680', { opacity: 0.55, pulse: true, dur: 3 });
  // god-rays fanning down to the floor
  const rays = [[330, 120, 200], [380, 280, 140], [430, 430, 160], [500, 590, 150], [560, 760, 190]];
  s += pulse(rays.map(([x0, x1, w]) => `<path d="M${x0} ${TOP}h46L${x1 + w / 2} ${HORIZON + 80}h-${w}z" fill="url(#sanctum-ray)"/>`).join(''), { dur: 3.4, to: 0.6 });
  // warm wash over the hall
  s += `<rect x="0" y="${TOP}" width="900" height="${STAGE_H}" fill="#ffd34d" opacity=".06"/>`;
  return s;
}

export default function render() {
  const body = () => {
    let s = hall({ light: true });
    s += daylight();
    s += freedSouls();
    s += monolith({ slices: slicedMonolith(), glowAmt: 0.7 });
    // Vel'Krann, coming apart into green dust
    const lx = 450 - (LICH_W * LICH_PX) / 2, ly = TOP + 4;
    s += flicker(lich(lx, ly, { dissolve: true, aura: 0.5 }), { dur: 0.7, min: 0.55 });
    s += particles({ seed: 95, n: 42, x: lx + 20, y: ly + 70, w: LICH_W * LICH_PX - 40, h: 90, colors: ['#a6ff4d', '#d8ff9a', '#5f9a30'], size: [2, 5], dx: 90, dy: -80, dur: 3, opacity: 0.9, group: 2 });
    s += particles({ seed: 96, n: 20, x: lx, y: ly + 110, w: LICH_W * LICH_PX, h: 50, colors: ['#a6ff4d', '#d8ff9a'], size: [2, 4], dx: -60, dy: -100, dur: 3.6, opacity: 0.8, group: 2 });
    // the party cheers
    s += party({ ape: 'apeCheer', apeX: 150 });
    s += bob(bubble('BZZT!', 690, 226, { sc: 3, tail: 'right' }), { dy: -4, dur: 0.5 });
    return s;
  };
  return scene({
    id: 'victory',
    stageH: STAGE_H,
    label: "Chapter VII, victory. Daylight breaks through a crack in the sanctum's vault and golden rays fall across the hall. The Untested Monolith comes apart slice by slice: the bottom slices still stand, each pinned by a green check mark, while the carved-off slices above tumble away and fall. Vel'Krann the Legacy Lich dissolves into green dust, and the freed souls of Shipwell rise up into the light. The ape paladin raises his sword; Brakka, Gus, Xal'Zor and the three constructs (one saying BZZT!) celebrate.",
    body,
    dialogues: [{ speaker: 'VELKRANN', lines: ['IMPOSSIBLE… SMALL…', 'REVERSIBLE… STEPS…'] }],
  });
}
