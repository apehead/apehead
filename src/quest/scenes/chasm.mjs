// Ch V · The Chasm. A bottomless rift: far rock walls recede into layered mist, pebbles fall, bats
// cross. Three prototype bridges span it, one per construct of the Choir, each waiting on its own
// ledge across the gap:  A gold and ornate, but its middle is only painted on air (it shimmers, you
// can see through it, gold paint drips into the void) · B rope, fast and frayed, swaying, planks
// missing, a snapped handrail · C stone pillars, solid, but unfinished: a gap and a half-built pillar.
// The ape paladin and Brakka stand on the near edge, judging.
import {
  scene, W, ptext, actor, actorSize, particles, glow, pathArt, sprite, flipbook, fog, skyline,
  pulse, flicker, blink, bob, drift, bubble, def, rng, SPRITES,
} from '../engine.mjs';

const BOTTOM = 356;
const A = { y: 128, x0: 150, x1: 820 };
const B = { y: 208, x0: 205, x1: 760, sag: 26 };
const C = { y: 288, x0: 260, x1: 720, gap: [478, 566] };

def('chasmRock', '<pattern id="chasmRock" patternUnits="userSpaceOnUse" width="48" height="36"><rect width="48" height="36" fill="#231c33"/><path fill="#2e2542" d="M2 2h20v10H2zM26 4h18v12H26zM8 18h22v12H8zM34 20h12v10H34z"/><path fill="#3a3052" d="M2 2h20v2H2zM26 4h18v2H26zM8 18h22v2H8zM34 20h12v2H34z"/><path fill="#17121f" d="M0 14h48v2H0zM22 0h2v14h-2zM30 16h2v20h-2z"/></pattern>');
def('chasmDeep', '<linearGradient id="chasmDeep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05040c" stop-opacity="0"/><stop offset="1" stop-color="#05040c" stop-opacity=".95"/></linearGradient>');

// ── backdrop: the rift receding into mist ────────────────────────────────
function rift(top) {
  let s = `<rect x="0" y="${top}" width="${W}" height="${BOTTOM - top}" fill="#0b0c1f"/>`;
  // cold light from far above
  s += glow(470, top + 40, 300, '#5c7cff', { opacity: 0.18 });
  // three receding rock walls, each a V narrower, lighter and bluer (aerial perspective)
  const layers = [['#262a52', 0.5, 7, '#3a4076'], ['#1c1f40', 0.36, 11, '#2c3060'], ['#14162f', 0.22, 17, '#20244a']];
  layers.forEach(([fill, inset, seed, lit]) => {
    const r = rng(seed);
    // left wall: a jagged slope from the top-left edge toward the centre-bottom
    let d = `M0 ${top}`, e = `M${W} ${top}`, hi = '';
    for (let y = top; y <= BOTTOM; y += 8) {
      const f = (y - top) / (BOTTOM - top), xl = Math.round((W / 2) * inset * f * 1.3 + 40 + r() * 14), xr = Math.round(W - ((W / 2) * inset * f * 1.3 + 40 + r() * 14));
      d += `H${xl}v8`; e += `H${xr}v8`;
      hi += `M${xl - 4} ${y}h4v8h-4z`;
      if (r() < 0.25) hi += `M${xl - 30 - Math.round(r() * 40)} ${y}h${16 + Math.round(r() * 20)}v2h-${16}z`;
    }
    d += `H0z`; e += `H${W}z`;
    s += `<path fill="${fill}" d="${d}${e}"/><path fill="${lit}" d="${hi}"/>`;
  });
  // mist at three depths, drifting at different speeds = parallax
  s += fog(180, { opacity: 0.1, dur: 70, color: '#7a88c8', h: 14 });
  s += drift(fog(240, { opacity: 0.14, dur: 48, color: '#8a94d0', h: 18 }), { dx: 0, dy: -4, dur: 7 });
  s += `<rect x="0" y="200" width="${W}" height="${BOTTOM - 200}" fill="url(#chasmDeep)"/>`;
  s += fog(280, { opacity: 0.16, dur: 38, color: '#9aa4e0', h: 20 });
  return s;
}
/** In front of the bridges: the abyss swallows the pillars, fast near mist = parallax. */
function abyssFront() {
  let s = `<rect x="0" y="${C.y + 14}" width="${W}" height="${BOTTOM - C.y - 14}" fill="url(#chasmDeep)"/>`;
  s += fog(316, { opacity: 0.28, dur: 24, color: '#aab2ec', h: 22 });
  s += fog(340, { opacity: 0.38, dur: 15, color: '#c0c8f4', h: 18 });
  return s;
}

function stalactites(top) {
  const r = rng(9);
  let d = `M0 ${top}h${W}v10H0z`, h = '';
  for (let x = 0; x < W; x += 12 + Math.round(r() * 26)) {
    const len = 8 + Math.round(r() * r() * 46), w = 4 + Math.round(r() * 3) * 2;
    for (let k = 0; k < len; k += 4) { const ww = Math.max(2, Math.round(w * (1 - k / len) / 2) * 2); d += `M${x + (w - ww) / 2} ${top + 10 + k}h${ww}v4h-${ww}z`; }
    h += `M${x} ${top + 10}h2v${Math.round(len * 0.6)}h-2z`;
  }
  return `<path fill="#17121f" d="${d}"/><path fill="#2e2542" d="${h}"/>` + particles({ seed: 5, n: 6, x: 60, y: top + 30, w: 780, h: 10, colors: ['#9ab0ff'], size: 2, dy: 140, dur: 3, opacity: 0.6, group: 1 });
}

// ── cliffs (near edge on the left, far edge on the right, stepped ledges) ─
function cliff(steps, flip, seed) {
  // steps: [[xFrom, xTo, topY]...] in screen x
  const r = rng(seed);
  let d = '', rim = '', dark = '';
  for (const [xa, xb, ty] of steps) {
    for (let x = xa; x < xb; x += 6) {
      const j = Math.round(r() * 2) * 2, t = ty + j;
      d += `M${x} ${t}h6V${BOTTOM}h-6z`;
      rim += `M${x} ${t}h6v4h-6z`;
    }
    // the chasm-facing edge: dark crevice line + jagged lip
    const ex = flip ? xa : xb - 6;
    dark += `M${ex} ${ty + 8}h6V${BOTTOM}h-6z`;
  }
  return `<path fill="url(#chasmRock)" d="${d}"/><path fill="#0e0a16" opacity=".75" d="${dark}"/><path fill="#5a4e78" d="${rim}"/>`;
}

function plaque(letter, x, y, color) {
  // wooden post + plank with the big letter
  let s = `<rect x="${x + 20}" y="${y + 38}" width="6" height="16" fill="#3a2618"/>`;
  s += `<rect x="${x}" y="${y}" width="46" height="42" fill="#0c0a14"/><rect x="${x + 3}" y="${y + 3}" width="40" height="36" fill="#5a3e26"/><rect x="${x + 3}" y="${y + 3}" width="40" height="3" fill="#7a5636"/>`;
  return s + ptext(letter, x + 23, y + 8, 4, color, { anchor: 'middle', shadow: '#1a0f08' });
}

// ── bridge A: gold, ornate, painted on air ───────────────────────────────
function bridgeA() {
  const { y, x0, x1 } = A;
  const part = (xa, xb) => {
    let rail = '', bal = '', post = '', gem = '', scal = '';
    for (let x = xa; x < xb; x += 14) bal += `M${x} ${y - 20}h4v20h-4z`;
    for (let x = xa; x < xb; x += 84) { post += `M${x - 2} ${y - 30}h8v30h-8z`; gem += `M${x} ${y - 36}h4v6h-4z`; }
    for (let x = xa; x < xb; x += 28) scal += `M${x + 4} ${y + 12}h20v4h-20zM${x + 8} ${y + 16}h12v4h-12z`;
    rail = `M${xa} ${y - 24}h${xb - xa}v5h-${xb - xa}z`;
    return `<path fill="#a06c18" d="${scal}"/><path fill="#c8902a" d="${bal}"/><path fill="#f6c84e" d="${rail}${post}"/><path fill="#ff6b8b" d="${gem}"/>`
      + `<rect x="${xa}" y="${y}" width="${xb - xa}" height="8" fill="#f6c84e"/><rect x="${xa}" y="${y}" width="${xb - xa}" height="2" fill="#fff3b0"/><rect x="${xa}" y="${y + 8}" width="${xb - xa}" height="4" fill="#a06c18"/>`;
  };
  const ga = 400, gb = 610; // the painted-on-air stretch
  let s = part(x0, ga) + part(gb, x1);
  // painted on air: a ghostly see-through copy that shimmers, outlined in dashed "brush strokes"
  s += pulse(`<g opacity=".5">${part(ga, gb)}</g>`, { dur: 1.8, from: 0.95, to: 0.4 });
  s += `<rect x="${ga}" y="${y - 24}" width="${gb - ga}" height="36" fill="none" stroke="#fff3b0" stroke-width="2" stroke-dasharray="6 6" opacity=".85"/>`;
  // sparkles of wet paint
  for (const [x, yy, d] of [[430, y - 10, 0], [520, y + 4, 0.6], [580, y - 30, 1.1], [470, y - 34, 1.5]]) s += blink(`<path fill="#fffbe0" d="M${x} ${yy - 5}h2v12h-2zM${x - 5} ${yy}h12v2h-12z"/>`, { dur: 1.4, begin: d, on: 0.35 });
  // gold paint dripping into the void
  s += particles({ seed: 61, n: 9, x: ga, y: y + 12, w: gb - ga, h: 4, colors: ['#f6c84e', '#ffd34d'], size: [2, 4], dy: 150, dur: 2.6, opacity: 0.85, group: 1 });
  // the end lanterns
  s += flicker(`<rect x="${x0 + 2}" y="${y - 44}" width="8" height="8" fill="#ffd34d"/>`, { dur: 1.1 }) + glow(x0 + 6, y - 40, 26, '#ffd34d', { opacity: 0.4 });
  return s;
}

// ── bridge B: rope, frayed, swaying ──────────────────────────────────────
function bridgeB() {
  const { y, x0, x1, sag } = B;
  const N = 24, L = x1 - x0;
  const sagAt = (t, k) => Math.round(4 * t * (1 - t) * sag * k);
  const rope = (dy, k, broken) => {
    // rope as a polyline of 2px steps, animated by swapping the whole path (same command count)
    const pts = (kk) => { let d = ''; for (let i = 0; i <= N; i++) { const t = i / N, x = Math.round(x0 + t * L), yy = y + dy + sagAt(t, kk); if (broken && t > 0.52 && t < 0.62) { d += `M${x} ${yy}`; continue; } d += `${i ? 'L' : 'M'}${x} ${yy}`; } return d; };
    return `<path fill="none" stroke="#c8a060" stroke-width="3" d="${pts(k)}"><animate attributeName="d" values="${pts(k)};${pts(k * 1.35)};${pts(k)}" dur="2.6s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/></path>`;
  };
  const r = rng(23);
  let planks = '';
  for (let i = 1; i < N; i++) {
    const t = i / N, x = Math.round(x0 + t * L);
    const amp = sagAt(t, 0.35);
    if ([6, 13, 14, 19].includes(i)) continue; // missing planks
    const tilt = i === 15 ? ` transform="rotate(28 ${x} ${y + sagAt(t, 1)})"` : '';
    const p = `<rect x="${x - 9}" y="${y + sagAt(t, 1) - 2}" width="18" height="6" fill="${r() > 0.5 ? '#7a5030' : '#6b4428'}"${tilt}/><rect x="${x - 1}" y="${y - 26 + sagAt(t, 1)}" width="2" height="24" fill="#8a6a40"/>`;
    planks += `<g><animateTransform attributeName="transform" type="translate" values="0 0;0 ${amp};0 0" dur="2.6s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/>${p}</g>`;
  }
  let s = rope(0, 1, false) + planks + rope(-28, 1, true);
  // frayed snapped ends of the handrail, dangling
  const bx = Math.round(x0 + 0.53 * L), by = y - 28 + sagAt(0.53, 1);
  const fray = `<path fill="#c8a060" d="M${bx} ${by}h3v14h-3zM${bx + 3} ${by + 10}h2v8h-2zM${bx - 3} ${by + 12}h2v6h-2z"/>`;
  s += `<g><animateTransform attributeName="transform" type="rotate" values="-12 ${bx} ${by};12 ${bx} ${by};-12 ${bx} ${by}" dur="1.7s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/>${fray}</g>`;
  // posts at both ends
  for (const x of [x0 - 4, x1 - 4]) s += `<rect x="${x}" y="${y - 34}" width="8" height="40" fill="#4a2e1a"/><rect x="${x}" y="${y - 34}" width="8" height="3" fill="#7a5030"/>`;
  // splinters and pebbles shaken loose
  s += particles({ seed: 19, n: 6, x: x0 + 120, y: y + 16, w: 300, h: 6, colors: ['#7a5030', '#8d7fb0'], size: [2, 3], dy: 130, dur: 2.2, opacity: 0.8, group: 1 });
  return s;
}

// ── bridge C: stone pillars, solid, unfinished ───────────────────────────
function bridgeC() {
  const { y, x0, x1, gap: [ga, gb] } = C;
  let s = '';
  const pillar = (x, ty, w = 30) => `<rect x="${x}" y="${ty}" width="${w}" height="${BOTTOM - ty}" fill="#6a6280"/><rect x="${x}" y="${ty}" width="6" height="${BOTTOM - ty}" fill="#8f88a6"/><rect x="${x + w - 6}" y="${ty}" width="6" height="${BOTTOM - ty}" fill="#433d58"/>`
    + Array.from({ length: Math.ceil((BOTTOM - ty) / 16) }, (_, k) => `<rect x="${x}" y="${ty + k * 16 + 14}" width="${w}" height="2" fill="#2e2942"/>`).join('');
  for (const x of [300, 400, 620]) s += pillar(x, y + 10);
  // the unfinished pillar in the gap, still waiting for its top courses
  s += pillar(506, y + 36);
  s += `<path fill="#8f88a6" d="M510 ${y + 28}h10v8h-10zM524 ${y + 30}h8v6h-8z"/>`;
  // deck slabs, left and right of the gap
  const slabs = (xa, xb) => {
    let d = '', h = '', k = '';
    for (let x = xa; x < xb; x += 32) { const w = Math.min(30, xb - x); d += `M${x} ${y}h${w}v12h-${w}z`; h += `M${x} ${y}h${w}v3h-${w}z`; k += `M${x + w} ${y}h2v12h-2z`; }
    return `<path fill="#7a7290" d="${d}"/><path fill="#a9a2c0" d="${h}"/><path fill="#2e2942" d="${k}"/>`;
  };
  s += slabs(x0, ga) + slabs(gb, x1);
  // a ragged broken edge each side of the gap
  s += `<path fill="#7a7290" d="M${ga} ${y + 2}h8v6h-8zM${gb - 10} ${y + 4}h10v8h-10z"/>`;
  // rubble trickling off the unfinished edge
  s += particles({ seed: 77, n: 6, x: ga - 4, y: y + 12, w: gb - ga + 8, h: 4, colors: ['#a9a2c0', '#6a6280'], size: [2, 4], dy: 110, dur: 2, opacity: 0.85, group: 1 });
  // the builder's crane arm, abandoned mid-lift
  s += `<rect x="${gb + 6}" y="${y - 46}" width="4" height="46" fill="#5a3e26"/><rect x="${gb - 30}" y="${y - 46}" width="40" height="4" fill="#5a3e26"/><rect x="${gb - 28}" y="${y - 42}" width="2" height="22" fill="#c8a060"/>`;
  s += `<g><animateTransform attributeName="transform" type="rotate" values="-6 ${gb - 27} ${y - 42};6 ${gb - 27} ${y - 42};-6 ${gb - 27} ${y - 42}" dur="2.2s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/><rect x="${gb - 35}" y="${y - 22}" width="16" height="12" fill="#8f88a6"/><rect x="${gb - 35}" y="${y - 22}" width="16" height="3" fill="#a9a2c0"/></g>`;
  return s;
}

export default function render() {
  const body = ({ top }) => {
    let s = rift(top);
    // bats crossing the rift
    const batIds = SPRITES.CAST.bat.frames.map((f, i) => sprite(`bat${i}`, f, 3, SPRITES.CAST.bat.pal));
    s += [[0, 300, 90], [-5, 360, 160]].map(([b, x, y]) => `<g><animateMotion dur="11s" begin="${b}s" repeatCount="indefinite" path="M0 0 q140 -20 280 10 t300 -10 t400 10"/>${flipbook(batIds, 0.14, x, y)}</g>`).join('');
    s += stalactites(top);
    // cliffs: the near edge (left) and the far edge (right), stepped into three ledges
    s += cliff([[0, A.x0, A.y], [A.x0, B.x0, B.y], [B.x0, C.x0, C.y]], false, 3);
    s += cliff([[C.x1, B.x1, C.y], [B.x1, A.x1, B.y], [A.x1, W, A.y]], true, 4);
    // the way on: a glowing crypt arch on the far top ledge
    s += glow(866, A.y - 30, 80, '#ffb454', { opacity: 0.22, pulse: true, dur: 2.6 });
    // the three prototypes
    s += bridgeC() + abyssFront() + bridgeB() + bridgeA();
    // labels on the near ledges
    s += plaque('A', 94, A.y - 54, '#f6c84e') + plaque('B', 152, B.y - 54, '#e0b070') + plaque('C', 210, C.y - 54, '#c9c2d9');
    // each construct proudly waits by its own bridge on the far side
    const feet = (n, px = 3) => actorSize(n, px).h;
    s += actor('choir1', 846, A.y + 2 - feet('choir1'), { px: 3, flip: true });
    s += actor('choir2', 772, B.y + 2 - feet('choir2'), { px: 3, flip: true, begin: 0.3 });
    s += actor('choir3', 714, C.y + 2 - feet('choir3'), { px: 3, flip: true, begin: 0.6 });
    s += bob(bubble('BZZT!', 762, A.y - 26, { sc: 2, tail: 'right' }), { dy: -2, dur: 0.6 });
    // the judges, on the near edge
    s += `<rect x="0" y="${BOTTOM - 6}" width="210" height="6" fill="#17121f"/>`;
    s += actor('brakka', 4, BOTTOM + 4 - actorSize('brakka').h, { begin: 0.2 });
    s += actor('ape', 104, BOTTOM + 4 - actorSize('ape').h);
    // dust and pebbles falling through the whole rift
    s += particles({ seed: 8, n: 14, x: 250, y: top + 20, w: 520, h: 200, colors: ['#8d7fb0', '#5e5480'], size: [2, 3], dy: 160, dur: 4, opacity: 0.7, group: 2 });
    return s;
  };
  return scene({
    id: 'chasm',
    label: 'Chapter V, The Chasm. A bottomless rift lost in mist, pebbles falling into it. Three prototype bridges span it, one above the other, each with its builder construct waiting on the far side. A, top: gold and ornate with gem-topped posts, but its middle stretch is only painted on air: see-through, shimmering, outlined in brush strokes, gold paint dripping into the void. B, middle: a rope bridge, fast and frayed, swaying, planks missing and the handrail snapped. C, bottom: solid stone pillars and slabs, but unfinished, with a gap and a half-built pillar under an abandoned crane. The ape paladin and Brakka the dwarf stand on the near edge, judging.',
    body,
    dialogues: [
      { speaker: 'CHOIR', lines: ['We built three bridges.', 'All are our favourite.'] },
      { speaker: 'BRAKKA', lines: ["Throwaway prototypes, lad. Judge 'em.", "Don't marry 'em."] },
    ],
  });
}
