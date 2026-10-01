// Shared helpers for all variants.
// SVGs are shown through <img> on GitHub: no scripts, no external fonts or
// images, so everything is inline and animated with CSS keyframes or SMIL.
import { writeFileSync, mkdirSync } from 'node:fs';

export const MONO = `ui-monospace,SFMono-Regular,Menlo,Consolas,'DejaVu Sans Mono','Liberation Mono',monospace`;
export const SANS = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,'Liberation Sans',sans-serif`;
// Times-metric stack: Liberation Serif is metric-compatible, so line widths hold across OSes
export const SERIF = `'Times New Roman',Times,'Liberation Serif','Nimbus Roman',serif`;
export const HAND = `'Bradley Hand','Segoe Print','Chalkboard SE','Comic Sans MS',cursive`;

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function writer(variant) {
  const dir = new URL(`../variants/${variant}/assets/`, import.meta.url);
  mkdirSync(dir, { recursive: true });
  return (name, svg) => writeFileSync(new URL(name, dir), svg.trim() + '\n');
}

export function rng(seed) {
  return () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
}

// greedy word wrap by character count (good enough with metric-stable fonts)
export function wrap(text, max) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if (line && (line + ' ' + word).length > max) { lines.push(line); line = word; }
    else line = line ? line + ' ' + word : word;
  }
  if (line) lines.push(line);
  return lines;
}

// ── pixel ape ─────────────────────────────────────────────────────────────
export const APE = [
  '......DDDDDDDD......',
  '....DDBBBBBBBBDD....',
  '...DBBBBBBBBBBBBD...',
  '..DBBBBBBBBBBBBBBD..',
  '..DBBFFFFBBFFFFBBD..',
  'DDDBFFFFFFFFFFFFBDDD',
  'DFFDVVVVVVVVVVVVDFFD',
  'DFFDVVVVVVVVVVVVDFFD',
  'DDDBFFFFFFFFFFFFBDDD',
  '..DBFFFFFFFFFFFFBD..',
  '..DBFFFLLLLLLFFFBD..',
  '..DBFFLLKLLKLLFFBD..',
  '..DBFLLLLLLLLLLFBD..',
  '..DBFLKKKKKKKKLFBD..',
  '...DBLLLLLLLLLLBD...',
  '....DBBLLLLLLBBD....',
  '.....DDBBBBBBDD.....',
  '.......DDDDDD.......',
];
export const APE_FILL = { D: '#1b0f14', B: '#5a3424', F: '#b9794f', L: '#e2b48a', K: '#140a08', V: 'url(#visor)' };

export function pixelArt(grid, px, x0, y0, fills) {
  let rects = '';
  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let run = 1;
      while (row[x + run] === c) run++;
      if (c !== '.') {
        rects += `<rect x="${x0 + x * px}" y="${y0 + y * px}" width="${run * px + 0.4}" height="${px + 0.4}" fill="${fills[c]}"/>`;
      }
      x += run;
    }
  });
  return rects;
}

// visor gradient with a scanning highlight (SMIL so Safari animates it too)
export const visorDefs = (id = 'visor') => `
  <linearGradient id="${id}" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#00f0ff"/>
    <stop offset="0.45" stop-color="#ff2bd6"/>
    <stop offset="0.5" stop-color="#ffffff"/>
    <stop offset="0.55" stop-color="#ff2bd6"/>
    <stop offset="1" stop-color="#00f0ff"/>
    <animate attributeName="x1" values="-1;1;-1" dur="3.2s" repeatCount="indefinite"/>
    <animate attributeName="x2" values="0;2;0" dur="3.2s" repeatCount="indefinite"/>
  </linearGradient>`;
