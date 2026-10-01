// THE CATACOMBS OF LEGACY — the cast, as string-grid pixel art (pure data: no imports).
// Render with engine.mjs: actor(name, x, y, opts) · portrait(speaker, x, y) · relicIcon(i, x, y).
//
//  CAST[name]       = { frames: [grid…], pal, px, dur }   frames loop as a flipbook (idle)
//  PORTRAITS[SPKR]  = { grid (32×32), pal, bg, blink?: [[x, y, colour]…] }   drawn at 3px = 96×96
//  RELIC_ICONS[k]   = { grid (14×14), pal }
//
// Grid conventions: one char per pixel, '.' = transparent, palette maps char → '#rrggbb' or
// '#rrggbb@opacity'. 'K' is always the dark outline. Most sprites face right or the viewer;
// pass { flip: true } to actor() to mirror. Helpers below keep the grids short and symmetric.

// ── grid helpers ─────────────────────────────────────────────────────────
const fit = (g, w) => g.map((r) => (r.length >= w ? r.slice(0, w) : r.padEnd(w, '.')));
/** left halves → full rows (mirrored). odd: share the middle column. */
const mirror = (rows, odd = false) => rows.map((r) => r + [...(odd ? r.slice(0, -1) : r)].reverse().join(''));
/** overlay rows at (x, y); '.' in the overlay keeps what's under it, '_' erases. */
function paint(grid, x, y, rows) {
  const g = grid.map((r) => [...r]);
  rows.forEach((row, j) => {
    [...row].forEach((c, i) => {
      const yy = y + j, xx = x + i;
      if (c === '.' || yy < 0 || yy >= g.length) return;
      while (g[yy].length <= xx) g[yy].push('.');
      g[yy][xx] = c === '_' ? '.' : c;
    });
  });
  const w = Math.max(...g.map((r) => r.length));
  return g.map((r) => r.join('').padEnd(w, '.'));
}
const pad = (g, l = 0, r = 0, t = 0, b = 0) => {
  const w = g[0].length + l + r;
  return [...Array(t).fill('.'.repeat(w)), ...g.map((row) => '.'.repeat(l) + row + '.'.repeat(r)), ...Array(b).fill('.'.repeat(w))];
};
/** breathing frame: rows [0, split) move down 1px, row `split` is swallowed (a slight crouch). */
const breathe = (g, split) => ['.'.repeat(g[0].length), ...g.slice(0, split), ...g.slice(split + 1)];
const swap = (g, from, to) => g.map((r) => r.split(from).join(to));
function check(name, g) {
  const w = g[0].length;
  g.forEach((r, i) => { if (r.length !== w) throw new Error(`sprite ${name}: row ${i} is ${r.length} wide, want ${w}`); });
  return g;
}

// ── APEHEAD, the ape paladin (the ghouls knight, standing) ───────────────
const KNIGHT_TOP = [
  '........rRRr........',
  '......rRRRRRr.......',
  '.....KKKKKKKKK......',
  '...KKSSSSSMMMMKK....',
  '..KSSSSSMMMMMMMNK...',
  '..KSMMGGGGGGGGGGgK..',
  '..KSMKFFFFFFFFFFK...',
  '.KKSMKFDDDDDDDDDDDK.',
  'KEeSMKFAWKAAWKAAFK..',
  'KEeSMKFAAAAAAAAAAFK.',
  'KEESMKFFALLLLLLnLnLK',
  '.KKNMKFFLLLLLLLLLLLK',
  '..KNNKKFLDDDDDDDDLK.',
  '...KKKGKFLLLLLLLLK..',
  '..KSSSGSMMMMMSgK....',
  '.KSSMMSGMMMMMGSSKKK.',
  '.KSMMMMSGGGGGMMSKfgK',
  '.KSMMKMMMMMMMMMKKfLK',
  '.KNMKfKMMMMMMMNKKKK.',
  '..KKffKNMMMMMNNK....',
  '...KKKKGGGGGGGgK....',
];
const KNIGHT_LEGS = [
  '....KSMMNKKSMMNK....',
  '....KSMMNK.KSMNK....',
  '....KSMNK..KSMNK....',
  '....KSMNK..KSMNK....',
  '...KSSMNK..KSSMNK...',
  '...KKKKKK..KKKKKKK..',
];
const KPAL = {
  K: '#0c0a14', S: '#f4f8ff', M: '#a9b6c8', N: '#5d6a82', R: '#e8342c', r: '#8e1a1a',
  F: '#4a2a1c', f: '#7c4b2c', L: '#d4a070', l: '#b07246', C: '#4ff3ff', D: '#24140d', E: '#a06a44', G: '#f6c84e', g: '#a06c18',
  A: '#8a5a3e', e: '#4a2618', n: '#1e0e06', i: '#ecc08e', // ape face: A bare skin, L muzzle (+i shine), n nostrils, E/e ears
  W: '#f7f3ea', P: '#e8342c', B: '#d8dee8', H: '#8a5a32', u: '#f2d2ae',
};
// sword held upright in the right fist (fist at cols 17-18, rows 16-17)
const SWORD = [
  '..K..',
  '.KBK.',
  '.KBK.',
  '.KBK.',
  '.KBK.',
  '.KBK.',
  '.KBK.',
  '.KBK.',
  '.KBK.',
  '.KBK.',
  '.KBK.',
  'KGGGK',
  '.KHK.',
];
const knight = paint(pad([...KNIGHT_TOP, ...KNIGHT_LEGS], 0, 2), 16, 3, SWORD);
const knightFist = paint(knight, 17, 16, ['fg', 'fL']); // fist in front of the hilt
const APE_A = check('ape', knightFist);
const APE_B = check('apeB', paint(breathe(APE_A, 21), 0, 1, ['.......rRRr.........']));

// cheering: fist + sword thrust up high (relic banner, victory)
const APE_UP = check('apeUp', paint(paint(pad([...KNIGHT_TOP.slice(0, 15).map((r, i) => (i > 13 ? r : r)), '.KSMMMMSGGGGGMMSK...', '.KSMMKMMMMMMMMMK....', '.KNMKfKMMMMMMMNK....', '..KKffKNMMMMMNNK....', '...KKKKGGGGGGGgK....', ...KNIGHT_LEGS], 0, 2, 0, 0), 16, 0, ['..K..', '.KBK.', '.KBK.', '.KBK.', '.KBK.', '.KBK.', '.KBK.', 'KGGGK', '.KHK.']), 15, 9, ['.KKKK', 'KfgfK', 'KfLfK', '.KfK.', '.KfK.', 'KSMK.']));

// ── the ape in heart-print boxers (deaths) ───────────────────────────────
const APE_TOP = [
  '....................',
  '....................',
  '.....KKKKKKK........',
  '...KKFFFFFFFKK......',
  '..KFFFFFfFFFFFK.....',
  '..KFFFFFFFFFFFFK....',
  '.KFFFDDDDDDDDDDDDK..',
  'KEeFFAWKAAWKAAAFK...',
  'KEeFFAAAAAAAAAAAFK..',
  'KEEFFALLLLLLnLnLLLK.',
  '.KKFFLLLLLLLLLLLLLLK',
  '..KFFLDDDDDDDDDDDLK.',
  '..KFFLLLLLLLLLLLLK..',
  '...KFFLLLLLLLLLLK...',
  '..KFFFFFFFFFFFK.....',
  '.KFFFFFFllllFFKKKK..',
  '.KFFfFFFllllFKKffFK.',
  '.KFFfFFFFllFFKKfDDK.',
  '.KFKfFFFFFFFFKKKKK..',
  '..KKFFFFFFFFFK......',
  '...KWWPWWWPWWWK.....',
];
const APE_LEGS = [
  '....KWPWWKKWPWWK....',
  '....KWWPWK.KWWPK....',
  '....KFFfK..KFfFK....',
  '....KFfFK..KFFfK....',
  '...KLLLLK..KLLLLK...',
  '...KKKKKK..KKKKKK...',
];
const BOXERS_A = check('boxers', [...APE_TOP, ...APE_LEGS]);
const BOXERS_B = check('boxersB', breathe(BOXERS_A, 20));

// ── tombstone with RIP ───────────────────────────────────────────────────
const TOMB_RIP = check('tomb', [
  '....KKKKKK....',
  '..KKSSSSSSKK..',
  '.KSSSSSSSSMNK.',
  'KSSMMMMMMMMMNK',
  'KSMDDMMDMDDMNK',
  'KSMDMDMDMDMDNK',
  'KSMDDMMDMDDMNK',
  'KSMDMDMDMDMMNK',
  'KSMDMDMDMDMMNK',
  'KSMMMMMMMMMMNK',
  'KSMMMNMMMMMMNK',
  'KSMMMMNMMMMMNK',
  'KSMMMMMNMMMMNK',
  'KgMMMMMMMMMMNK',
  'KggMMMMMMMMNNK',
  'KgggMMMMMMNNgK',
  'KKKKKKKKKKKKKK',
  '.dddddddddddd.',
]);
const TOMB_PAL = { K: '#16121f', S: '#b9b2c9', M: '#837d99', N: '#544e6b', D: '#2e2940', g: '#4d7a39', d: '#3e2619' };

// ── BRAKKA IRONLEVER, dwarf artificer (front, wrench in his right hand) ──
const BRAKKA_BODY = [
  '.......KKKKKKKK.......',
  '.....KKHHHHHHHHKK.....',
  '....KHHHHHHWWHHHHK....',
  '...KHHHHHHHWWHHHHHK...',
  '...KhHHHHHHWWHHHHhK...',
  '..KKhhhhhhhhhhhhhhKK..',
  '..KGGGGKKKKKKKKGGGGK..',
  '..KGCCGKFFFFFFKGCCGK..',
  '..KGCWGKFFFFFFKGWCGK..',
  '..KKGGKFFFFFFFFKGGKK..',
  '...KFFFFKFFFFKFFFFK...',
  '...KfFFFFFFFFFFFFfK...',
  '..KBBOFFFFffFFFFOBBK..',
  '.KBBBBBBFKKKKFBBBBBBK.',
  '.KBOBBBBBBBBBBBBBBOBK.',
  '.KBBBBBBBBBBBBBBBBBBK.',
  'KTKBBbBBBBBBBBBBbBBKTK',
  'KTKKBBbBBBBBBBBbBBKKTK',
  'KTTKABBbBBBBBBbBBAKTTK',
  'KFFKAAKBbBKKBbBKAAKFFK',
  'KFFKAAKYBKAAKBYKAAKFFK',
  '.KKKAAAKKAAAAKKAAAKKK.',
  '...KAAAAAAYYAAAAAAK...',
  '...KAAAAAAAAAAAAAAK...',
  '...KPPPPK....KPPPPK...',
  '..KPPPPPK....KPPPPPK..',
  '..KKKKKKK....KKKKKKK..',
];
const WRENCH = [
  'KK.KK',
  'KWKWK',
  'KWWWK',
  '.KWK.',
  '.KWK.',
  '.KwK.',
  '.KWK.',
  '.KWK.',
  '.KwK.',
  '.KWK.',
  '.KWK.',
  '.KwK.',
  '.KWK.',
  '.KWK.',
  '.KwK.',
  '.KWK.',
  '.KWK.',
  '.KKK.',
];
const brakka = paint(paint(pad(BRAKKA_BODY, 0, 3), 20, 3, WRENCH), 19, 19, ['KFFFK', 'KFFFK', '.KKK.']);
const BRAKKA_A = check('brakka', brakka);
const BRAKKA_B = check('brakkaB', breathe(BRAKKA_A, 21));
const BRAKKA_PAL = {
  K: '#0c0a14', H: '#8d97a6', h: '#4b5363', W: '#d5dbe3', G: '#f6c84e', C: '#5ce1ff', F: '#e2a77a', f: '#b07246',
  B: '#e0662a', b: '#9c3d14', O: '#ff9a4d', T: '#3f6e4a', A: '#7a4a2a', Y: '#f6c84e', P: '#3b2418', w: '#7d8592',
};

// ── THE CLOCKWORK CHOIR: three warforged constructs (front) ──────────────
const CONSTRUCT = mirror([
  '........',
  '........',
  '.....KKK',
  '....KMMM',
  '...KMMMM',
  '...KMmmm',
  '...KKKKK',
  '...KnCCn',
  '...KKKKK',
  '...KMmmm',
  '....KmKn',
  '..KKKnnK',
  '.KMMMKKM',
  'KMMmMMMM',
  'KMmKmMMC',
  'KMmKmmMC',
  'KmmKKmmm',
  'KMKKnnnn',
  'KMK.KnnY',
  'KnK.KmmK',
  'KCK.KMMm',
  '.KK.KMmK',
  '....KnnK',
  '....KMmK',
  '....KMmK',
  '...KMMmK',
  '...KKKKK',
]);
const CREST = [mirror(['.....KK.', '....KMM.', '.....KK.'].map((r) => r)), mirror(['.......K', '......KC', '.......K']), mirror(['...K....', '...KK...', '....KK..'])];
const constructs = CREST.map((c, i) => paint(CONSTRUCT, 0, 0, c));
const visorScan = (g) => g.map((r, y) => (y === 7 ? r.replace('KnCCnnCCnK', 'KnWCnnCWnK') : r));
const CHOIR_TINTS = [
  { M: '#d9a35a', m: '#9c6a2c', n: '#5c3a18' },
  { M: '#b8c4d6', m: '#7d8aa0', n: '#4a5468' },
  { M: '#7fd1b0', m: '#3f8f74', n: '#245446' },
];
const CHOIR_PAL = { K: '#0c0a14', C: '#5ce1ff', W: '#ffffff', Y: '#f6c84e' };

// ── GUS, the gelatinous cube (translucent; dead code inside) ─────────────
function cubeGrid(w, h, depth, face = true) {
  const g = [];
  const fw = w - depth; // front face width
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) {
      const front = x < fw && y >= depth;
      const top = y < depth && x >= depth - y && x < w - y;
      const side = x >= fw && y >= depth - (x - fw) - 1 && y < h - (x - fw) - 1 && !top;
      let c = '.';
      if (front) {
        const edge = x === 0 || x === fw - 1 || y === depth || y === h - 1;
        c = edge ? 'E' : (x + y) % 9 === 0 ? 'j' : 'J';
        if (!edge && x < 3 && y < depth + 7) c = 'H';
      } else if (top) {
        c = y === 0 || x === depth - y || x === w - y - 1 ? 'E' : 'T';
      } else if (side) {
        c = x === w - 1 || y === h - (x - fw) - 2 || y === depth - (x - fw) - 1 ? 'E' : 'S';
      }
      row += c;
    }
    g.push(row);
  }
  return g;
}
let gus = cubeGrid(26, 24, 4);
gus = paint(gus, 6, 9, ['KK....KK', 'KW....KW', '........', '.K....K.', '..KKKK..']); // face
gus = paint(gus, 3, 17, ['.YY.....', 'Y..YYYYY', '.YY...Y.', '......YY']); // skeleton key
gus = paint(gus, 13, 15, ['PPPPPP', 'PrrPrP', 'PPPPPP', 'PrPrrP', 'PPPPPP']); // TODO scroll
gus = paint(gus, 16, 7, ['.YY.', 'YyyY', 'YyyY', '.YY.']); // a swallowed coin
const GUS_A = check('gus', gus);
const GUS_B = check('gusB', paint(GUS_A, 6, 9, ['KK....KK', 'KK....KK']));
const GUS_PAL = {
  E: '#3fdc5a@0.9', J: '#7dff8a@0.38', j: '#a8ffb0@0.5', H: '#e6ffe6@0.7', T: '#b4ffbc@0.55', S: '#2fae4a@0.5',
  K: '#0c2a12', W: '#ffffff', Y: '#e8c04a@0.9', y: '#a8842a@0.9', P: '#e9dcc0@0.85', r: '#c0392b@0.85', V: '#f0f0e0@0.85',
};

// ── ELDER MIRRA, halfling elder with a lantern (front) ───────────────────
const MIRRA_BODY = mirror([
  '.....KKK',
  '....KHHH',
  '....KHhH',
  '...KKKKH',
  '..KHHHHH',
  '.KHHhHHH',
  '.KHHKFFF',
  '.KHKFFFF',
  'KEKFKKFF',
  'KEKFFFFF',
  '.KKFppFF',
  '..KFFFFK',
  '...KFFFK',
  '..KSSKKS',
  '.KSSSSSS',
  'KSSsSSYS',
  'KSSSsSSS',
  'KFKSSSsS',
  'KKKDDDDD',
  '..KDDdDD',
  '..KDDDDd',
  '..KDDDDD',
  '..KKKKKK',
  '.KFFFK.K',
  'KFFFFK..',
  'KKKKKK..',
]);
const LANTERN = ['..KK..', '.K..K.', 'KKKKKK', 'KOooOK', 'KOoWoK', 'KOooOK', 'KKKKKK'];
const LANTERN_B = ['..KK..', '.K..K.', 'KKKKKK', 'KOOoOK', 'KOoooK', 'KOOoOK', 'KKKKKK'];
const MIRRA_A = check('mirra', paint(pad(MIRRA_BODY, 0, 4, 0, 0), 15, 16, LANTERN));
const MIRRA_B = check('mirraB', paint(breathe(pad(MIRRA_BODY, 0, 4, 0, 0), 17), 15, 16, LANTERN_B));
const MIRRA_PAL = {
  K: '#0c0a14', H: '#d8d4e0', h: '#9a94a8', F: '#e8b48c', E: '#d89a74', p: '#ff8f8f', S: '#7a3b6e', s: '#52244a', Y: '#f6c84e',
  D: '#6b4a2e', d: '#4a301c', O: '#ffb454', o: '#ffd34d', W: '#fff6c8',
};

// ── villagers (front, 14 wide): farmer, elf, tiefling bard, kid ──────────
const VILLAGER = mirror([
  '....KKK',
  '...KHHH',
  '..KHHHH',
  '..KHFFF',
  '..KFKFF',
  '..KFFFF',
  '...KFFF',
  '....KFF',
  '..KKTTT',
  '.KTTTTT',
  'KTTtTTT',
  'KTKTTTT',
  'KTKTTTt',
  'KFKTTTT',
  '.KKBBBB',
  '..KPPPP',
  '..KPPPK',
  '..KPPPK',
  '..KPPPK',
  '..KKKKK',
], true);
const FARMER = paint(VILLAGER, 0, 0, ['.KKKKKKKKKKKK', 'KYYYYYYYYYYYYK', '.KyyyyyyyyyyK.']);
const ELF = paint(VILLAGER, 0, 3, ['EK.........KE', '.E.........E.']);
const BARD = paint(paint(VILLAGER, 0, 0, ['...KR.....RK.', '..KRR.....RRK']), 6, 10, ['..KKK', '.KLLLK', 'KLLKLLK', 'KLLLLLK', '.KLLLK.', '..KKK..']);
const KID = mirror([
  '..KKK',
  '.KHHH',
  'KHHFF',
  'KFKFF',
  'KFFFF',
  '.KFFF',
  '..KTT',
  '.KTTT',
  'KFKTT',
  '.KKTT',
  '..KPP',
  '..KPK',
  '..KKK',
], true);
const VILLAGE_PAL = (o) => ({ K: '#0c0a14', H: '#5a3424', F: '#e2b48a', T: '#4f6fa8', t: '#2e4373', B: '#a06c18', P: '#5a4a3a', Y: '#e8c96a', y: '#a8842a', E: '#e2b48a', R: '#e8342c', L: '#c98a3a', ...o });

// ── monsters & graveyard props (from ghouls) ─────────────────────────────
const ZOMBIE_TOP = [
  '................',
  '................',
  '................',
  '.......HHH......',
  '.....KKHHHKK....',
  '....KzZZZZzHK...',
  '...KzZZZZZZzHK..',
  '..KZYKZZZZZZzK..',
  '..KZZZZZZzZZZK..',
  '.KZWKWKZZZZzK...',
  '..KKKWKZZZzK....',
  '.....KKTTTTK....',
  'KKKKKTTTtTTTK...',
  'KZZZZZTttTTtTK..',
  'KzZzZKTTttTTTK..',
  '.KKKKTTTTttTTK..',
  'KZZZZZTtTTTTtK..',
  'KzKZzKTTTTTtTK..',
  '.KKKKTtTTTTTTK..',
  '.....KTtTKtTtK..',
  '.....KTKtKKTK...',
];
const ZOMBIE_LEGS_A = [
  '.....KZzK.KzZK..',
  '....KZzK...KzZK.',
  '...KZzK....KzZK.',
  '..KZzK......KzZK',
  '.KWWWK......KWWK',
  '.KKKKK......KKKK',
];
const ZOMBIE_LEGS_B = [
  '......KZzZK.....',
  '......KZzZK.....',
  '......KZKzZK....',
  '......KZKKzZK...',
  '.....KWWKKWWK...',
  '.....KKKKKKKK...',
];
const GHOUL_PAL = { K: '#0c0a14', Z: '#8fb873', z: '#4e7442', Y: '#ffe14a', W: '#ece4c6', H: '#3a3346', T: '#4f6fa8', t: '#2e4373' };
const BAT = [
  ['K.......K', 'KK.....KK', 'KKK.K.KKK', '.KKKKKKK.', '..K.R.K..'],
  ['.........', '...K.K...', '.KKKKKKK.', 'KK.KRK.KK', 'K.......K'],
];
const SKULL = ['.KKKK.', 'KWWWWK', 'KWKWKK', 'KWWWWK', '.KWKK.'];
const GRAVE = [
  '...KKKKKK...',
  '..KSSSSSMK..',
  '.KSSMMMMMNK.',
  '.KSMMMKMMNK.',
  '.KSMMKKKMNK.',
  '.KSMMMKMMNK.',
  '.KSMMMKMMNK.',
  '.KSMMMMMMNK.',
  '.KSMMNMMMNK.',
  '.KSMMMNMMNK.',
  '.KSMMMMMNNK.',
  '.KgMMMMMMNK.',
  '.KggMMMMNNK.',
  'KgggMMMNNNNK',
  'KKKKKKKKKKKK',
];
const CROSS = [
  '...KKKK...',
  '...KSMK...',
  '...KSMK...',
  'KKKKSMKKKK',
  'KSSSSMMMMK',
  'KNNNSMNNNK',
  'KKKKSMKKKK',
  '...KSMK...',
  '...KSMK...',
  '...KSMK...',
  '...KSNK...',
  '..KgSNNK..',
  '.KggKKKKK.',
];
const STONE_PAL = { K: '#16121f', S: '#b9b2c9', M: '#837d99', N: '#544e6b', g: '#4d7a39', d: '#3e2619', D: '#2e2940' };
const CHEST = [
  '..KKKKKKKKKKKK..',
  '.KbbbbbbbbbbbbK.',
  'KbBBGBBBBBBGBBbK',
  'KGGGGGGKKGGGGGGK',
  'KbBBGBBKYKBGBBbK',
  'KbBBGBBBKBBGBBbK',
  'KbBBGBBBBBBGBBbK',
  'KbbbGbbbbbbGbbbK',
  'KKKKKKKKKKKKKKKK',
];
const CHEST_PAL = { K: '#0c0a14', b: '#5a2f17', B: '#8c4a22', G: '#f6c84e', Y: '#fff6b0' };

// ── portraits (32×32, drawn at 3px) ──────────────────────────────────────
const P32 = (rows) => check('portrait', fit(rows, 32));
const APE_PORTRAIT = P32(paint(mirror([
  '.............rRR',
  '............rRRR',
  '...........rRRRR',
  '.......KKKKKrRRR',
  '.....KKSSSSSKRRR',
  '....KSSSSSSSSKRR',
  '...KSSSMMMMMMSKR',
  '...KSSMMMMMMMMSK',
  '..KSSMMMMMMMMMMM',
  '..KSMMMMMMMMMMMM',
  '..KSMMGGGGGGGGGG',
  '..KSMGgggggggggg',
  '..KSMKKKKKKKKKKK',
  '..KSMKFFFFFFFFFF',
  '..KSMKFFFFFFFFFF',
  '..KSMKFFDDDDDDDD',
  '.KKKMKFDDDDDDDDD',
  'KEeKMKFAAKKAAAAA',
  'KEeKMKFAAKKAAAAA',
  'KEeKMKFFAAAAAAAA',
  'KEEKMKFFAAALiiii',
  '.KKKMKFFALLLLLnL',
  '..KNMKFFLLLLLLLL',
  '..KNMKFFLDDDDDDD',
  '..KNMKFFLLLLLLLL',
  '..KNMKFFFLLLLLLL',
  '..KKMKKFFFFLLLLL',
  '.KSSKKGKKFFFFFFF',
  'KSSSSSKGKKKKKKKK',
  'KSMMMMSKGGGGGGGG',
  'KSMMMMMSKMMMMMMM',
  'KNNNNNNNKNNNNNNN',
]), 9, 17, ['W'.padEnd(12, '.') + 'W']));
// smirk: lift the right corner of the mouth
const APE_P = P32(paint(APE_PORTRAIT, 22, 22, ['D', 'L']));

const MIRRA_P = P32(paint(mirror([
  '................',
  '..........KKKKKK',
  '.........KHHHHHH',
  '.........KHhHHHH',
  '..........KKHHHH',
  '........KKHHHHHH',
  '......KKHHHHHHHH',
  '.....KHHHHhHHHHH',
  '....KHHHhHHHHHHH',
  '....KHHhHHKKKKKK',
  '...KHHhHKFFFFFFF',
  '...KHHHKFFFFFFFF',
  '...KHHKFFFFFFFFF',
  '...KHHKFFhhhhFFF',
  '...KHHKFFFFFFFFF',
  '...KHKFFFKKFFFFF',
  '...KHKFFKFFKFFFF',
  '..KEKFFFFFFFFFFF',
  '.KEEKFppFFFFFFFf',
  '..KKKFppFFFFFFff',
  '....KFFFFFFFFFFF',
  '....KFFFFFKKFFFF',
  '.....KFFFFFKKKKK',
  '......KFFFFFFFFF',
  '.......KKFFFFFFF',
  '.....KKSSKKKKKKK',
  '...KKSSSSSSSsSSS',
  '..KSSSsSSSSSSSSS',
  '.KSSSSSSsSSSSSSS',
  'KSSsSSSSSSSsSSSS',
  'KSSSSSsSSSSSSSSs',
  'KSSSSSSSSSSSSSSS',
]), 18, 27, ['.KK', 'KYYK', 'KYYK', '.KK']));

const BRAKKA_P = P32(mirror([
  '................',
  '..........KKKKKK',
  '.......KKKHHHHHH',
  '.....KKHHHHHHHHH',
  '....KHHKKKKKHHHH',
  '...KHHKGCCWGKHHH',
  '...KHHKGCCCGKHHH',
  '..KhhhhKKKKKhhhh',
  '..KKKKKKKKKKKKKK',
  '...KFFFFFFFFFFFF',
  '...KFBBBBBFFFFFF',
  '...KFFFKKFFFFFFF',
  '...KFFFKKFFFFFff',
  '..KFFFFFFFFFFfff',
  '..KBFFFFFFFFFFFf',
  '.KBBBFFFFFFFFFFF',
  '.KBOBBBFFFFFFFFF',
  '.KBBBBBBBBBBBBBB',
  'KBBBOBBBBBBBBBBB',
  'KBBBBBBBBBBKKKKK',
  'KBOBBBBBBBBBBBBB',
  'KBBBBBOBBBBBBBBB',
  '.KBBBBBBBBBBBBBB',
  '.KBBBBBBOBBBBBBB',
  '..KBBBBBBBBBBBBB',
  'KTTKKBBBBBBBBBBB',
  'KTTTTKBBBBBBBBBB',
  'KTTTTTKBBBBBBKBB',
  'KTTTTTTKBBBBBKBB',
  'KTTTTTAKYYYYYKAA',
  'KTTTTTAAKBBBKAAA',
  'KTTTTTAAKBBBKAAA',
]));

const CHOIR_P = P32(mirror([
  '................',
  '..........KKKKKK',
  '........KKMMMMMM',
  '.......KMMMMMMMM',
  '......KMMMMMMMMM',
  '.....KMMmMMMMMKK',
  '....KMMmMMMMMMKC',
  '....KMmMMMMMMMMK',
  '....KMmMMMMMMMMM',
  '...KMmMMMMMMMMMM',
  '...KmmmmmmmmmmmK',
  '...KKKKKKKKKKKKK',
  '...KnnCCCCnnnnnn',
  '...KnnCWCCnnnnnn',
  '...KKKKKKKKKKKKK',
  '...KMMmMMMMMMMMM',
  '...KMmMMMMMMMMMM',
  '....KmMMMKMKMKMK',
  '....KmMMMKMKMKMK',
  '.....KmmmmmmmmmK',
  '......KKKKKnnnnn',
  '........KnKCnCnC',
  '.....KKKKnKnnnnn',
  '...KKMMMMKKKKKKK',
  '..KMMMMMmMKMMMMM',
  '.KMMmmMMMmKMMMMM',
  'KMMmMMMMMmKMMCCC',
  'KMmMMMMMMmKMMCWC',
  'KMmMMMMMMmKMMCCC',
  'KmmMMMMMMmKMMMMM',
  'KMmMMMMMMmKMMMMM',
  'KMmMMMMMMmKMMMMM',
]));

let gusP = cubeGrid(32, 32, 5);
gusP = paint(gusP, 6, 12, ['KKK.......KKK', 'KWK.......KWK', 'KKK.......KKK', '.............', '..K.......K..', '...KKKKKKK...', '....KrrrK....']);
gusP = paint(gusP, 3, 25, ['.YY......', 'Y..YYYYYY', '.YY...Y.Y']);
gusP = paint(gusP, 19, 21, ['PPPPPP', 'PrrPrP', 'PPPPPP']);
const GUS_P = P32(gusP);

const GATE_P = P32(mirror([
  '..KK............',
  '..KSK...........',
  '...KSK..........',
  '...KSMK.........',
  '....KMMK..KKKKKK',
  '....KMMMKKSSSSSS',
  '.....KMKSSSSSSSS',
  '.....KKSSMMMMMMM',
  'K...KSSMMMMMMMMM',
  'KK.KSMMMMMNNMMMM',
  'KSKKSMMMMMMNNMMM',
  'KSSKMMMMMMMMMMMM',
  '.KSKMMNNNNNNMMMM',
  '.KSKMNNNNNNNNNMM',
  '..KKMKKKKKKKKKNM',
  '...KMKEEEEKKKNMM',
  '...KMNKKKKKMMNMM',
  '...KMMNNMMMMMMNN',
  '...KMMMMMMMMMNNM',
  '...KMMMMMMMMNMMM',
  '....KMMMMMMMKNKN',
  '....KMMKKKKKKKKK',
  '....KMKWKKKKKKKK',
  '....KMKWWKKKKKKK',
  '.....KMKKKKKKWKK',
  '.....KMMMMMMMMMM',
  '......KKMMMMMMMM',
  '..KKKKNKKKKMMMMM',
  '.KSSSMNNNNKKKKKK',
  'KSSMMMMMNNNNNNNN',
  'KSMMMMMMMMMNNNNN',
  'KSMMMMMMMMMMMMMM',
]));

// Xal'Zor: violet orb, one huge eye, eyestalks ending in little gauges
let xal = mirror([
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '..........KKKKKK',
  '.......KKKVVVVVV',
  '.....KKVVVVVVVVV',
  '....KVVVVVVVVVVV',
  '...KVVVVvVVVVVVV',
  '...KVVVvVVKKKKKK',
  '..KVVVvVKKWWWWWW',
  '..KVVvVKWWWWWWWW',
  '..KVVvKWWWWWIIII',
  '.KVVvVKWWWWIIIII',
  '.KVVvKWWWWIIIKKK',
  '.KVVvKWWWWIIIKKK',
  '.KVVvKWWWWIIIKKK',
  '.KVVVKWWWWWIIIII',
  '.KVVVVKWWWWWIIII',
  '..KVVVKWWWWWWWWW',
  '..KVVVVKKWWWWWWW',
  '..KVVVVVVKKKKKKK',
  '...KVVVVVVVVVVVV',
  '...KVVVVKKKKKKKK',
  '....KVVKWKWKWKWK',
  '....KVVKKKKKKKKK',
  '.....KVVVVVVVVVV',
  '......KKVVVVVVVV',
  '........KKKVVVVV',
  '...........KKKKK',
]);
xal = paint(xal, 0, 0, ['..KKK.................KKK..', '.KGgGK...............KgGGK.', '.KGKGK.......KKK.....KGKGK.', '..KKK.......KGgGK.....KKK..', '...KV.......KGKGK....VK....', '....KV.......KKK....VK.....', '.....KV.......KV...VK......']);
xal = paint(xal, 21, 15, ['W']);
const XAL_P = P32(xal);

const MIMIC_P = P32(mirror([
  '................',
  '................',
  '................',
  '................',
  '....KKKKKKKKKKKK',
  '...KBBBBBBBBGBBB',
  '..KBbbbbbbbbGbbb',
  '..KBBBBBBBBBGBBB',
  '..KGGGGGGGGGGGGG',
  '..KBBBBBBBBBGBBB',
  '..KBbbbbbbbbGbbb',
  '..KKKKKKKKKKKKKK',
  '..KWKWKWKWKWKWKW',
  '..KKWKKWKKWKKWKK',
  '..K.KKEEKK.....R',
  '..K..KEKEK....RR',
  '..K...KKK....RRR',
  '..KK.KWKKWKKWRRR',
  '..KWKWKWKWKWKWKR',
  '..KKKKKKKKKKKKKK',
  '..KBBBBBBBBBGBBB',
  '..KBbbbbbbbbGbbb',
  '..KBBBBBBBBBGBBB',
  '..KGGGGGGGGGGGKK',
  '..KBBBBBBBBBGKYY',
  '..KBbbbbbbbbGKYK',
  '..KBBBBBBBBBGBKK',
  '..KBbbbbbbbbGbbb',
  '..KKKKKKKKKKKKKK',
  '................',
  '................',
  '................',
]));

const LICH_P = P32(paint(mirror([
  '..........GG..GG',
  '..........GYG.GY',
  '.........KGYYGYY',
  '.........KGGGGGG',
  '......KKKKKKKKKK',
  '.....KHHHKBBBBBB',
  '....KHHHKBBBBBBB',
  '...KHHHKBBBBBBBB',
  '...KHHKBBBBBBBBB',
  '..KHHHKBBKKKKBBB',
  '..KHHKBBKggggKBB',
  '..KHHKBBKgEEgKBB',
  '..KHHKBBKgEgKKBB',
  '..KHHKBBBKKKKBBB',
  '..KHHKBBBBBBBBKB',
  '..KHHKBBBBBBBKKK',
  '..KHHHKBBBBBBBBB',
  '..KHHHKBBKWKWKWK',
  '..KHHHKBBKKKKKKK',
  '..KHHHHKBBWKWKWK',
  '..KHHHHKKBBBBBBB',
  '..KHHHHHKKBBBBBB',
  '..KHHHHHHKKKKKKK',
  '.KHHHHHHHHHKHHHH',
  '.KHHHhHHHHHHKHHH',
  'KHHHHhHHHHHHHKHH',
  'KHHHhHHHHHHHHHKH',
  'KHHHhHHHHHHHHHKG',
  'KHHHhHHHHHHHHKGL',
  'KHHHhHHHHHHHHKGG',
  'KHHHhHHHHHHHHHKG',
  'KHHHhHHHHHHHHHHK',
]), 0, 0, []));

const VILLAGERS_P = P32([
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '.......KKKKK..........KKKKK.....',
  '......KYYYYYK........KRKKKRK....',
  '.....KYYYYYYYK......KRRKKKRRK...',
  '....KKKKKKKKKKK....KKHHHHHHHKK..',
  '.....KHHFFFHHK......KDDDDDDDK...',
  '.....KFKFFKFFK..KK..KDKDDDKDK...',
  '.....KFFFFFFFK.KHHK.KDDDDDDDK...',
  '......KFFKKFK.KHHHHKKDDKKKDDK...',
  '.......KFFFK.KEHFFHEKKDDDDDK....',
  '.....KKKTTTKKKEFKFKEKKKDDDKKK...',
  '....KTTTTTTTKKKFFFFKKLLLLLLLLK..',
  '...KTTTTTTTTTKKFKKFKKLLLLLLLLLK.',
  '...KTTTTTTTTKGGKFFKGGKLLLLLLLLK.',
  '...KTTTTTTTKGGGGKKGGGGKLLLLLLLK.',
  '...KTTTTTTTKGGGGGGGGGGKLLLLLLLK.',
  '...KTTTTTTTKGGGGGGGGGGKLLLLLLLK.',
  '...KTTTTTTTKGGGGGGGGGGKLLLLLLLK.',
  '...KTTTTTTTKGGGGGGGGGGKLLLLLLLK.',
  '...KTTTTTTTKGGGGGGGGGGKLLLLLLLK.',
  '...KTTTTTTTKGGGGGGGGGGKLLLLLLLK.',
  '...KTTTTTTTKGGGGGGGGGGKLLLLLLLK.',
  '...KTTTTTTTKGGGGGGGGGGKLLLLLLLK.',
  '...KTTTTTTTKGGGGGGGGGGKLLLLLLLK.',
  '...KTTTTTTTKGGGGGGGGGGKLLLLLLLK.',
  '...KTTTTTTTKGGGGGGGGGGKLLLLLLLK.',
  '...KTTTTTTTKGGGGGGGGGGKLLLLLLLK.',
]);

export const PORTRAITS = {
  APEHEAD: { grid: APE_P, pal: KPAL, bg: '#1b1530', blink: [[9, 17, 'A'], [10, 17, 'A'], [21, 17, 'A'], [22, 17, 'A'], [9, 18, 'D'], [10, 18, 'D'], [21, 18, 'D'], [22, 18, 'D']] },
  MIRRA: { grid: MIRRA_P, pal: { ...MIRRA_PAL, h: '#b0aabb', f: '#c98a6a' }, bg: '#2a1a10' },
  BRAKKA: { grid: BRAKKA_P, pal: BRAKKA_PAL, bg: '#24140c', blink: [[7, 11, 'F'], [8, 11, 'F'], [23, 11, 'F'], [24, 11, 'F']] },
  CHOIR: { grid: CHOIR_P, pal: { ...CHOIR_PAL, ...CHOIR_TINTS[1] }, bg: '#0a1a22', blink: [[6, 12, 'W'], [7, 12, 'W'], [24, 12, 'W'], [25, 12, 'W']], blinkDur: 2.4 },
  GUS: { grid: GUS_P, pal: GUS_PAL, bg: '#0c2010', blink: [[7, 13, 'K'], [17, 13, 'K']] },
  GATEKEEPER: { grid: GATE_P, pal: { ...TOMB_PAL, E: '#ffe14a', W: '#e9e3cf', S: '#c9c2d9', M: '#8f88a6', N: '#5a5470' }, bg: '#15121f' },
  XALZOR: { grid: XAL_P, pal: { K: '#12061a', V: '#9b3fd1', v: '#6a2196', W: '#f4ecff', I: '#3fdc8a', G: '#7dff8a', g: '#e8342c' }, bg: '#1a0c26' },
  MIMIC: { grid: MIMIC_P, pal: { K: '#14080c', B: '#8c4a22', b: '#5a2f17', G: '#f6c84e', W: '#f4efe6', E: '#ffe14a', R: '#ff6b8b', Y: '#fff6b0' }, bg: '#1e0c14' },
  VELKRANN: { grid: LICH_P, pal: { K: '#000000', H: '#1d2a14', h: '#2e4420', B: '#d9e6c8', g: '#2a4a12', E: '#a6ff4d', W: '#d9e6c8', G: '#f6c84e', Y: '#a6ff4d', L: '#a6ff4d' }, bg: '#020402' },
  VILLAGERS: { grid: VILLAGERS_P, pal: { K: '#0c0a14', Y: '#e8c96a', H: '#5a3424', F: '#e2b48a', T: '#4f6fa8', E: '#e2b48a', G: '#3f8f4a', R: '#c8b8ff', D: '#c0453a', L: '#7a3b6e' }, bg: '#14101e' },
};

// ── relic icons (14×14) ──────────────────────────────────────────────────
export const RELIC_ICONS = {
  scroll: { grid: check('scroll', [
    '..............',
    '.KKKKKKKKKKK..',
    'KPPPPPPPPPPPK.',
    'KpKKKKKKKKKKpK',
    '.KPPPPPPPPPK..',
    '.KPkkkkkkkPK..',
    '.KPPPPPPPPPK..',
    '.KPkkkkkPPPK..',
    '.KPPPPPPPPPK..',
    '.KPkkkkkkRRK..',
    '.KPPPPPPRRRRK.',
    'KKKKKKKKKRRK..',
    'KpPPPPPPPKRK..',
    '.KKKKKKKKKK...',
  ]), pal: { K: '#2a1a10', P: '#f3e3b5', p: '#c8b088', k: '#8a6a4a', R: '#e8342c' } },
  lantern: { grid: check('lantern', [
    '.....KKKK.....',
    '....KK..KK....',
    '....K....K....',
    '...KKKKKKKK...',
    '..KGGGGGGGGK..',
    '..KRrRRRRrRK..',
    '..KRrRWWRrRK..',
    '..KRrRWWRrRK..',
    '..KRrRRRRrRK..',
    '..KRrRRRRrRK..',
    '..KGGGGGGGGK..',
    '...KKKKKKKK...',
    '.....KGGK.....',
    '......KK......',
  ]), pal: { K: '#14080c', G: '#f6c84e', R: '#ff3b3b', r: '#a01818', W: '#fff0c0' } },
  lever: { grid: check('lever', [
    '.........KKK..',
    '........KYYYK.',
    '........KYWYK.',
    '........KYYYK.',
    '.......KKKKK..',
    '......KtK.....',
    '.....KtK......',
    '....KtK.......',
    '...KtK........',
    '..KGGK........',
    '.KKKKKKKKKKKK.',
    'KMMMMMMMMMMMMK',
    'KMNNNNNNNNNNMK',
    'KKKKKKKKKKKKKK',
  ]), pal: { K: '#0c0a14', Y: '#ff7a3d', W: '#ffd0a0', t: '#8a5a32', G: '#f6c84e', M: '#a9b6c8', N: '#5d6a82' } },
  ring: { grid: check('ring', [
    '.....KKKK.....',
    '....KCCWCK....',
    '....KCCCCK....',
    '...KKKCCKKK...',
    '..KGGGKKGGGK..',
    '.KGGKK..KKGGK.',
    'KGGK......KGgK',
    'KGK........KgK',
    'KGK........KgK',
    'KGGK......KggK',
    '.KGGKK..KKggK.',
    '..KGGGKKgggK..',
    '...KKKKKKKK...',
    '..............',
  ]), pal: { K: '#0c0a14', G: '#f6c84e', g: '#a06c18', C: '#5ce1ff', W: '#ffffff' } },
  lens: { grid: check('lens', [
    '...KKKKK......',
    '..KGGGGGK.....',
    '.KGBBBBBGK....',
    'KGBWBBBBBGK...',
    'KGBWBBBBCBGK..',
    'KGBBBBBCBBGK..',
    'KGBCBBCBBBGK..',
    'KGBBCCBBBBGK..',
    '.KGBBBBBBGK...',
    '..KGGGGGGKK...',
    '...KKKKKKtK...',
    '.........KtK..',
    '..........KtK.',
    '...........KK.',
  ]), pal: { K: '#0c0a14', G: '#f6c84e', B: '#2e6a8a', W: '#d8f6ff', C: '#7dff8a', t: '#8a5a32' } },
  hammer: { grid: check('hammer', [
    '..KKKKKKKKK...',
    '.KMMMMMMMMMK..',
    'KSMMGMMMGMMNK.',
    'KSMMGMMMGMMNK.',
    'KSMMGMMMGMMNK.',
    '.KNNNNNNNNNK..',
    '..KKKKtKKKK...',
    '.....KtK......',
    '.....KYK......',
    '.....KtK......',
    '.....KtK......',
    '.....KYK......',
    '.....KtK......',
    '.....KKK......',
  ]), pal: { K: '#0c0a14', S: '#f4f8ff', M: '#a9b6c8', N: '#5d6a82', G: '#f6c84e', t: '#8a5a32', Y: '#f6c84e' } },
};

// ── the cast table ───────────────────────────────────────────────────────
export const CAST = {
  ape: { frames: [APE_A, APE_A, APE_B, APE_B], pal: KPAL, px: 4, dur: 0.45 },       // ape paladin, idle (faces right)
  apeCheer: { frames: [APE_UP, breathe(APE_UP, 21)], pal: KPAL, px: 4, dur: 0.4 },  // sword + fist up
  apeBoxers: { frames: [BOXERS_A, BOXERS_B], pal: KPAL, px: 4, dur: 0.5 },         // armour lost (deaths)
  brakka: { frames: [BRAKKA_A, BRAKKA_A, BRAKKA_B], pal: BRAKKA_PAL, px: 4, dur: 0.5 },
  choir1: { frames: [constructs[0], constructs[0], visorScan(constructs[0]), breathe(constructs[0], 18)], pal: { ...CHOIR_PAL, ...CHOIR_TINTS[0] }, px: 4, dur: 0.35 },
  choir2: { frames: [constructs[1], breathe(constructs[1], 18), constructs[1], visorScan(constructs[1])], pal: { ...CHOIR_PAL, ...CHOIR_TINTS[1] }, px: 4, dur: 0.4 },
  choir3: { frames: [constructs[2], visorScan(constructs[2]), breathe(constructs[2], 18), constructs[2]], pal: { ...CHOIR_PAL, ...CHOIR_TINTS[2] }, px: 4, dur: 0.3 },
  gus: { frames: [GUS_A, GUS_A, GUS_A, GUS_B], pal: GUS_PAL, px: 4, dur: 0.6 },     // wrap in squash() for wobble
  mirra: { frames: [MIRRA_A, MIRRA_B], pal: MIRRA_PAL, px: 4, dur: 0.6 },
  farmer: { frames: [FARMER, breathe(FARMER, 13)], pal: VILLAGE_PAL({ T: '#6b8a3a', t: '#4a6a24' }), px: 4, dur: 0.7 },
  elf: { frames: [ELF, breathe(ELF, 13)], pal: VILLAGE_PAL({ H: '#e8d27a', T: '#2f7a5a', t: '#1f5a40' }), px: 4, dur: 0.8 },
  bard: { frames: [BARD, breathe(BARD, 13)], pal: VILLAGE_PAL({ H: '#2a1a3a', F: '#c0453a', E: '#c0453a', T: '#7a3b6e', t: '#52244a', R: '#e8dcc0' }), px: 4, dur: 0.6 },
  kid: { frames: [KID, breathe(KID, 8)], pal: VILLAGE_PAL({ H: '#a0522d', T: '#c0453a', t: '#8a2a20' }), px: 4, dur: 0.5 },
  tombRip: { frames: [TOMB_RIP], pal: TOMB_PAL, px: 4 },
  ghoul: { frames: [[...ZOMBIE_TOP, ...ZOMBIE_LEGS_A], [...ZOMBIE_TOP, ...ZOMBIE_LEGS_B]], pal: GHOUL_PAL, px: 4, dur: 0.32 }, // faces left; pal: { T, t } recolours the shirt
  ghoulTop: { frames: [ZOMBIE_TOP], pal: GHOUL_PAL, px: 4 },  // waist-up, for rising out of graves
  bat: { frames: BAT, pal: { K: '#0c0a14', R: '#ff3b3b' }, px: 3, dur: 0.14 },
  skull: { frames: [SKULL], pal: { K: '#16121f', W: '#e9e3cf' }, px: 3 },
  grave: { frames: [GRAVE], pal: STONE_PAL, px: 4 },
  cross: { frames: [CROSS], pal: STONE_PAL, px: 4 },
  chest: { frames: [CHEST], pal: CHEST_PAL, px: 4 },
};
for (const [k, c] of Object.entries(CAST)) c.frames.forEach((f, i) => check(`${k}[${i}]`, f));
