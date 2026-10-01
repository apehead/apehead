// Builds the game and copies it to the repo root, where GitHub's profile page reads it.
// Run: node publish.mjs   (then commit README.md + assets/)
import { cpSync, rmSync, copyFileSync } from 'node:fs';

await import('./src/adventure.mjs');
rmSync(new URL('./assets/', import.meta.url), { recursive: true, force: true });
cpSync(new URL('./variants/adventure/assets/', import.meta.url), new URL('./assets/', import.meta.url), { recursive: true });
copyFileSync(new URL('./variants/adventure/README.md', import.meta.url), new URL('./README.md', import.meta.url));
console.log('published README.md + assets/');
