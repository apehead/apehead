// Builds every variant: each src/<name>.mjs writes variants/<name>/assets/*.svg.
// Run all: node build.mjs   ·   run some: node build.mjs paper status
import { readdirSync } from 'node:fs';

const all = readdirSync(new URL('./src/', import.meta.url))
  .filter((f) => f.endsWith('.mjs') && f !== 'lib.mjs')
  .map((f) => f.replace(/\.mjs$/, ''));
const pick = process.argv.slice(2);
let failed = 0;
for (const v of pick.length ? pick : all) {
  try { await import(`./src/${v}.mjs`); console.log(`✓ ${v}`); }
  catch (e) { failed++; console.log(`✗ ${v}: ${e.message}`); }
}
process.exit(failed ? 1 : 0);
