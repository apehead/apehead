// Variant: adventure — "The Catacombs of Legacy", a choose-your-own-adventure played with nested
// <details> on a GitHub profile. Design: QUEST.md. Engine, cast, story and scenes live in src/quest/.
// This entry point renders every scene module → variants/adventure/assets/<id>.svg, the relic and
// death banners, and generates variants/adventure/README.md from src/quest/story.mjs.
import { writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import { writer } from './lib.mjs';
import { relicBanner, deathBanner, svgDoc, ptext, W } from './quest/engine.mjs';
import { SCENES, NODES, DEATHS, DEATH_COUNT, RELICS, SECRET, INTRO, RESTART } from './quest/story.mjs';

const SLUG = 'adventure';
const out = writer(SLUG);
const ASSETS = new URL(`../variants/${SLUG}/assets/`, import.meta.url);
const MAX_KB = 150;

// ── render all assets ────────────────────────────────────────────────────
const files = new Map(); // name → svg
for (const id of Object.keys(SCENES)) {
  const mod = await import(`./quest/scenes/${id}.mjs`);
  files.set(`${id}.svg`, mod.default());
}
RELICS.forEach((_, i) => files.set(`relic-${i + 1}.svg`, relicBanner(i + 1)));
for (const n of Object.keys(DEATHS)) files.set(`death-${n}.svg`, deathBanner(Number(n)));

// restart button for the bottom of the page (the one image that is meant to be clicked)
function restartButton() {
  const H = 116, bw = 420, bx = (W - bw) / 2;
  let m = `<rect width="${W}" height="${H}" fill="#0d0b16" rx="0"/>`;
  m += `<rect x="${bx + 4}" y="20" width="${bw}" height="60" fill="#000"/>`;
  m += `<rect x="${bx}" y="16" width="${bw}" height="60" fill="#3b1d10" stroke="#f6c84e" stroke-width="4"/>`;
  m += `<rect x="${bx + 4}" y="20" width="${bw - 8}" height="6" fill="#7a3a16"/>`;
  m += ptext('⟳ RESTART QUEST', W / 2, 30, 4, '#f6c84e', { anchor: 'middle', outline: '#000' });
  m += ptext('BACK TO SHIPWELL, FROM ZERO', W / 2, 90, 2, '#9a8fbf', { anchor: 'middle', outline: '#000' });
  // crop the 900-wide canvas to just the button + caption, so it can be shown small
  const cx0 = bx - 12, cw = bw + 24;
  return svgDoc(H, 'Restart the quest from the beginning', m)
    .replace(`viewBox="0 0 ${W} ${H}" width="${W}"`, `viewBox="${cx0} 0 ${cw} ${H}" width="${cw}"`);
}
files.set('restart.svg', restartButton());

const sizes = [];
for (const [name, svg] of files) {
  out(name, svg);
  const kb = Buffer.byteLength(svg) / 1024;
  sizes.push([name, kb]);
  if (kb > MAX_KB) console.warn(`⚠ ${name} is ${kb.toFixed(0)} KB (> ${MAX_KB} KB)`);
}
// delete stale assets (anything we didn't just write)
for (const f of readdirSync(ASSETS)) if (!files.has(f)) unlinkSync(new URL(f, ASSETS));

// alt text = the SVG's own aria-label (already attribute-escaped), one source of truth
const alt = (name) => {
  const m = files.get(name).match(/aria-label="([^"]*)"/);
  if (!m) throw new Error(`${name}: no aria-label`);
  return m[1];
};
// <picture> stops GitHub from wrapping each image in a link to the raw file (nothing to click)
const img = (name) => `<p align="center"><picture><img src="assets/${name}" width="100%" alt="${alt(name)}"></picture></p>`;

// ── README ───────────────────────────────────────────────────────────────
const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));
const para = (lines) => lines.join('<br>');
const summary = (key, label) => `<summary><kbd>${key}</kbd> ${label}</summary>`;
// what happened after a choice: a bordered card (a one-cell table is the only box GitHub keeps),
// with a little air above it so it doesn't read as part of the summary line
const card = (paras) => `<br>\n\n<table><tr><td>\n\n${paras.join('\n\n')}\n\n</td></tr></table>`;
let deathRefs = 0;

function deathBody(n) {
  const d = DEATHS[n];
  if (!d) throw new Error(`unknown death ${n}`);
  deathRefs++;
  return `${card([d.text, `<sub>☠ ${n}/${DEATH_COUNT} · Pick another path above, or <a href="${RESTART}">restart</a>.</sub>`])}\n\n${img(`death-${n}.svg`)}`;
}

function node(id) {
  const n = byId[id];
  if (!n) throw new Error(`unknown node ${id}`);
  let o = `${img(`${n.scene}.svg`)}\n\n${para(n.narration)}\n\n`;
  if (id === 'epilogue') return o + epilogueExtras();
  if (n.prompt !== '') o += `**${n.prompt ?? 'What do you do?'}**\n\n`;
  // The surviving choice contains the rest of the game (no way to skip ahead), so it always
  // goes last: any option listed after it would render below the whole nested story.
  const alive = n.choices.filter((c) => !c.death);
  if (alive.length !== 1) throw new Error(`node ${id} needs exactly one surviving choice`);
  const ordered = [...n.choices.filter((c) => c.death), alive[0]];
  o += ordered.map((c, i) => {
    let b = `<details name="ch-${id}">\n${summary('ABCDEFG'[i], c.label)}\n\n`;
    if (c.death) b += deathBody(c.death);
    else {
      if (c.outcome) b += card(c.outcome);
      if (c.relic) b += `\n\n${img(`relic-${c.relic}.svg`)}`;
      b += `\n\n${node(c.next)}`;
    }
    return b + '\n\n</details>';
  }).join('\n');
  return o;
}

function epilogueExtras() {
  const grimoire = [
    '| # | Relic | Where | The principle |',
    '|---|---|---|---|',
    ...RELICS.map((r, i) => `| ${i + 1} | **${r.name}** | ${['Shipwell', 'the Gate', 'the Hall of Tombs', 'the Treasury', 'the Eye', 'the Chasm'][i]} | *${r.motto}* |`),
  ].join('\n');
  const deaths = Object.entries(DEATHS).map(([n, d]) => `${n}. ${d.title.replace(/`/g, '')}`).join(' · ');
  return `<br>

${SCENES.credits ? img('credits.svg') + '\n\n' : ''}<h3 align="center">Thanks for playing!</h3>

<p align="center">Did you find all <b>${DEATH_COUNT} deaths</b>?<br><a href="${RESTART}"><b>⟲ Restart the quest</b></a> and hunt them down.</p>

<br>

<p align="center"><b>Alexander Curiel</b> · Principal Engineer at <a href="https://github.com/spotahome">Spotahome</a><br>
<sub>I like hard problems, quiet release nights and teaching robots good manners.</sub></p>

<p align="center"><a href="https://es.linkedin.com/in/alexandercuriel/en">LinkedIn</a> · <a href="https://github.com/spotahome">@spotahome</a></p>

<br>

<details name="ch-epilogue">
${summary(SECRET.key, SECRET.label)}

${img(`${SECRET.scene}.svg`)}

${para(SECRET.narration)}

</details>

<details>
<summary>📜 <b>The Grimoire</b> <i>(spoilers)</i></summary>

${grimoire}

**The ${DEATH_COUNT} deaths:** ${deaths}

</details>`;
}

const README = `${img('title.svg')}

${INTRO.join('<br>')}

<details name="ch-start">
${summary('▶', '<b>PRESS START</b>')}

${node('village')}

</details>

<br>

<p align="center"><a href="${RESTART}"><img src="assets/restart.svg" width="300" alt="Restart the quest from the beginning"></a></p>

<p align="center"><sub><a href="https://es.linkedin.com/in/alexandercuriel/en">LinkedIn</a> · <a href="https://github.com/spotahome">Spotahome</a> · continue? it depends™ (and I'll tell you on what)</sub></p>
`;

// ── checks: tag balance, no 4-space indents, every death reachable once ──
function checkTags(md) {
  const VOID = new Set(['img', 'br', 'hr', 'source', 'input', 'meta', 'link']);
  const stack = [];
  for (const m of md.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/?)>/g)) {
    const [, close, tag0, self] = m, tag = tag0.toLowerCase();
    if (VOID.has(tag) || self) continue;
    if (!close) stack.push(tag);
    else {
      const top = stack.pop();
      if (top !== tag) throw new Error(`README: </${tag}> closes <${top}> (offset ${m.index})`);
    }
  }
  if (stack.length) throw new Error(`README: unclosed tags: ${stack.join(', ')}`);
}
checkTags(README);
README.split('\n').forEach((l, i) => { if (/^ {4}/.test(l)) throw new Error(`README line ${i + 1} is indented 4 spaces (would become a code block)`); });
if (deathRefs !== DEATH_COUNT) throw new Error(`README references ${deathRefs} deaths, story has ${DEATH_COUNT}`);
writeFileSync(new URL(`../variants/${SLUG}/README.md`, import.meta.url), README);

if (process.env.STATS) {
  const details = README.split('<details').length - 1;
  console.log({ nodes: NODES.length, details, deaths: deathRefs, assets: files.size });
  for (const [n, kb] of sizes) console.log(`${n.padEnd(16)} ${kb.toFixed(1)} KB`);
}
