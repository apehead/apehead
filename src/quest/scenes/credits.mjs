// The End · credits card. A slow starfield in a gold double frame, a big outlined THE END with
// sparkles and two soft fireworks, THANKS FOR PLAYING, the CAST (each portrait framed in the
// speaker's colour, name in that colour, a short role), the six relics won, the ape cheering, and
// the signature: A GAME BY ALEXANDER CURIEL · Principal Engineer @ Spotahome. No dialogue box.
import {
  scene, W, PAL, ptext, twidth, actor, portrait, relicIcon, stars, skyBands, glow, blink, float, scroll,
  particles, rng, SPEAKERS, SPRITES,
} from '../engine.mjs';

const rep = 'repeatCount="indefinite"';
const STAGE_H = 776;

const CAST = [
  ['APEHEAD', 'AS HIMSELF'],
  ['BRAKKA', 'THE LEVER'],
  ['CHOIR', 'CODING AGENTS'],
  ['GUS', 'DELETIONS'],
  ['XALZOR', 'THE DASHBOARDS'],
  ['VELKRANN', 'LEGACY (DEFEATED)'],
];

// four-point sparkle (visible by default, blinks)
const sparkle = (x, y, size, color, begin, dur = 1.4) =>
  blink(`<path fill="${color}" d="M${x - 1} ${y - size}h3v${2 * size + 1}h-3zM${x - size} ${y - 1}h${2 * size + 1}v3h-${2 * size + 1}z"/><rect x="${x - 2}" y="${y - 2}" width="5" height="5" fill="#fff"/>`, { dur, begin, on: 0.7 });

// a soft firework: a ring of pixel sparks that opens, holds and fades (fully open by default)
function firework(cx, cy, r, colors, begin, dur = 2.8) {
  const d = ['', '', ''];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    [[0.45, 0], [0.75, 1], [1, 2]].forEach(([f, k]) => {
      const x = Math.round((Math.cos(a) * r * f) / 3) * 3, y = Math.round((Math.sin(a) * r * f) / 3) * 3, sz = k === 2 ? 3 : 4;
      d[k] += `M${x - 1} ${y - 1}h${sz}v${sz}h-${sz}z`;
    });
  }
  const inner = d.map((p, k) => `<path d="${p}" fill="${colors[k]}"/>`).join('');
  return `<g transform="translate(${cx} ${cy})"><g><animateTransform attributeName="transform" type="scale" values="0.2;0.9;1;1.06" keyTimes="0;.25;.6;1" dur="${dur}s" begin="${begin}s" ${rep}/><animate attributeName="opacity" values=".9;.9;.7;0" keyTimes="0;.4;.8;1" dur="${dur}s" begin="${begin}s" ${rep}/>${inner}</g></g>`
    + glow(cx, cy, r * 1.5, colors[0], { opacity: 0.14, pulse: true, dur, begin });
}

// starfield tile, scrolled slowly for a gentle drift
function starTile(seed, n, y0, h, color, sz) {
  const r = rng(seed);
  let d = '';
  for (let i = 0; i < n; i++) d += `M${Math.round(r() * W)} ${Math.round(y0 + r() * h)}h${sz}v${sz}h-${sz}z`;
  return `<path d="${d}" fill="${color}"/>`;
}

// one cast cell: framed portrait, name in the speaker colour (wraps to 2 lines if needed), role
function castCell(key, role, x, y, w) {
  const sp = SPEAKERS[key], c = sp.color, bg = SPRITES.PORTRAITS[key].bg ?? '#1a1426';
  let s = `<rect x="${x}" y="${y}" width="104" height="104" fill="#000"/><rect x="${x + 2}" y="${y + 2}" width="100" height="100" fill="${c}"/><rect x="${x + 4}" y="${y + 4}" width="96" height="96" fill="${bg}"/>`;
  s += portrait(key, x + 4, y + 4);
  const tx = x + 118, avail = x + w - tx;
  const fit = (t) => { if (twidth(t, 3) <= avail) return [t]; const k = t.lastIndexOf(' '); return [t.slice(0, k), t.slice(k + 1)]; };
  const names = fit(sp.name), roles = fit(role);
  const h = names.length * 28 + 10 + roles.length * 28 - 7;
  const y0 = y + Math.round((104 - h) / 2);
  names.forEach((n, i) => { s += ptext(n, tx, y0 + i * 28, 3, c, { shadow: '#000' }); });
  const ry = y0 + names.length * 28 + 10;
  s += `<rect x="${tx}" y="${ry - 9}" width="28" height="3" fill="${c}" opacity=".5"/>`;
  roles.forEach((r, i) => { s += ptext(r, tx, ry + i * 28, 3, '#c4bad8', { shadow: '#000' }); });
  return s;
}

export default function render() {
  const body = ({ top, bottom }) => {
    let s = skyBands(top, bottom, ['#05041a', '#070520', '#090626', '#0b072b', '#0d0830', '#100a35', '#130b38', '#160c3a', '#190d3c']);
    // slow starfield: two parallax layers drifting left, plus twinkles
    s += scroll(starTile(3, 70, top + 6, bottom - top - 12, '#8a80c0', 2), { dur: 240 });
    s += scroll(starTile(9, 34, top + 6, bottom - top - 12, '#d8d0ff', 3), { dur: 140 });
    s += stars({ seed: 51, n: 26, y: top + 8, h: bottom - top - 16 });

    // gold double frame with red corner studs (the relic-banner look)
    const fx = 14, fy = top + 12, fw = W - 28, fh = bottom - top - 26;
    s += `<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="none" stroke="${PAL.gold}" stroke-width="4"/><rect x="${fx + 8}" y="${fy + 8}" width="${fw - 16}" height="${fh - 16}" fill="none" stroke="${PAL.goldDk}" stroke-width="2"/>`;
    for (const [cx, cy] of [[fx, fy], [fx + fw - 12, fy], [fx, fy + fh - 12], [fx + fw - 12, fy + fh - 12]]) s += `<rect x="${cx - 2}" y="${cy - 2}" width="16" height="16" fill="${PAL.red}"/><rect x="${cx + 2}" y="${cy + 2}" width="4" height="4" fill="#fff" opacity=".6"/>`;

    // fireworks in the upper corners
    s += firework(130, top + 80, 46, ['#ffd34d', '#ff6b8b', '#fffbe8'], 0);
    s += firework(770, top + 74, 50, ['#5ce1ff', '#d36bff', '#fffbe8'], -1.4, 3.2);

    // THE END
    const ty = top + 36;
    s += glow(450, ty + 40, 300, '#ffb43c', { opacity: 0.22, pulse: true, dur: 4 });
    s += float(ptext('THE END', 450, ty, 10, PAL.gold, { anchor: 'middle', outline: '#3a1a04' }), { dy: -3, dur: 3.6 });
    for (const [x, y, z, b] of [[226, ty - 2, 7, 0], [676, ty + 6, 9, 0.5], [236, ty + 70, 5, 0.9], [662, ty + 74, 6, 0.2], [450, ty - 12, 5, 1.1]]) s += sparkle(x, y, z, '#fff6b0', b);
    s += ptext('THANKS FOR PLAYING', 450, ty + 98, 4, '#ffffff', { anchor: 'middle', shadow: '#5a2a8a' });

    // CAST header with a little rule either side
    const cy0 = ty + 162;
    s += ptext('CAST', 450, cy0, 3, PAL.amber, { anchor: 'middle' });
    s += `<rect x="${450 - 150}" y="${cy0 + 9}" width="100" height="3" fill="${PAL.goldDk}"/><rect x="${450 + 50}" y="${cy0 + 9}" width="100" height="3" fill="${PAL.goldDk}"/>`;

    // the cast, 2 columns × 3 rows
    const gy = cy0 + 40;
    CAST.forEach(([k, role], i) => {
      const col = i % 2, row = Math.floor(i / 2);
      s += castCell(k, role, col ? 460 : 40, gy + row * 122, 408);
    });

    // signature, with the ape cheering on the left and the six relics on the right
    const sy = gy + 3 * 122 + 12;
    s += `<rect x="${450 - 200}" y="${sy - 10}" width="400" height="3" fill="${PAL.goldDk}"/>`;
    s += ptext('A GAME BY', 450, sy + 12, 3, PAL.parchment, { anchor: 'middle' });
    s += ptext('ALEXANDER CURIEL', 450, sy + 44, 5, PAL.gold, { anchor: 'middle', outline: '#2a1404' });
    s += ptext('PRINCIPAL ENGINEER @ SPOTAHOME', 450, sy + 98, 3, '#d8d0ff', { anchor: 'middle', shadow: '#2a1a5a' });
    s += actor('apeCheer', 52, sy - 8, { px: 5 });
    s += sparkle(46, sy - 4, 6, '#fff6b0', 0.3) + sparkle(178, sy + 30, 5, '#fff6b0', 0.8);
    for (let i = 0; i < 6; i++) {
      const x = 738 + (i % 3) * 40, y = sy + 22 + Math.floor(i / 3) * 40;
      s += `<rect x="${x}" y="${y}" width="34" height="34" fill="#1d1630" stroke="${PAL.gold}" stroke-width="2"/>`;
      s += float(relicIcon(i + 1, x + 3, y + 3, 2), { dy: -2, dur: 2 + i * 0.2, begin: -i * 0.3 });
    }
    // gentle confetti of gold dust
    s += particles({ seed: 7, n: 18, x: 40, y: top + 20, w: W - 80, h: 120, colors: ['#ffd34d', '#fff6b0', '#ff6b8b', '#5ce1ff'], size: [2, 3], dx: 10, dy: 140, dur: 7, opacity: 0.7, group: 3 });
    return s;
  };
  return scene({
    id: 'credits',
    label: "The End. A credits card under a slowly drifting starfield in a gold frame, soft fireworks in the corners: big golden pixel letters read THE END, then THANKS FOR PLAYING. The cast, each with a portrait: APEHEAD as himself; Brakka Ironlever, the lever; the Clockwork Choir, coding agents; Gus, deletions; Xal'Zor, the dashboards; Vel'Krann, legacy (defeated). Then: a game by Alexander Curiel, Principal Engineer at Spotahome, with the ape paladin cheering on the left and the six relics on the right.",
    body,
    dialogues: [],
    stageH: STAGE_H,
  });
}
