// THE CATACOMBS OF LEGACY — the story as data (pure: no imports).
// QUEST.md is the design source of truth; this file is what the build reads.
//
//  SCENES  scene id → { chapter, relics }   the HUD of every scene comes from here,
//                                          so a scene can never drift from its story slot
//  RELICS  the 6 relics, in collection order (index 0 = relic 1)
//  DEATHS  the 18 deaths, numbered by hand (banners are referenced by number)
//  NODES   the playable nodes; README.md is generated from them (src/adventure.mjs)
//
// Node shape:
//   { id, scene, narration: [≤3 short markdown lines], prompt?, choices: [Choice] }
// Choice shape (exactly one of next / death):
//   { key, label, next: nodeId, relic?: 1..6, outcome?: [markdown lines] }
//   { key, label, death: 1..18 }
// Markdown lines may use the speaker dots: 🟡 APEHEAD · 🟤 Mirra · 🟠 Brakka · 🔵 Choir ·
// 🟢 Gus · ⚪ Gatekeeper · 🟣 Xal'Zor (Mimics and Vel'Krann get no dot). Use sparingly.

export const RESTART = 'https://github.com/apehead?quest=restart';

export const SCENES = {
  title:    { chapter: 'PRESS START', relics: 0 },
  village:  { chapter: 'PROLOGUE · SHIPWELL', relics: 0 },
  gate:     { chapter: 'CH I · THE GATE', relics: 1 },
  tombs:    { chapter: 'CH II · HALL OF TOMBS', relics: 2 },
  treasury: { chapter: 'CH III · THE TREASURY', relics: 3 },
  beholder: { chapter: 'CH IV · THE EYE', relics: 4 },
  chasm:    { chapter: 'CH V · THE CHASM', relics: 5 },
  door:     { chapter: 'CH VI · THE SEALED DOOR', relics: 6 },
  lich1:    { chapter: 'CH VII · THE LICH 1/3', relics: 6 },
  lich2:    { chapter: 'CH VII · THE LICH 2/3', relics: 6 },
  lich3:    { chapter: 'CH VII · THE LICH 3/3', relics: 6 },
  victory:  { chapter: 'CH VII · VICTORY', relics: 6 },
  epilogue: { chapter: 'EPILOGUE · SHIPWELL', relics: 6 },
  secret:   { chapter: 'SECRET · ???', relics: 6 },
  credits:  { chapter: 'THE END', relics: 6 },
};

export const RELICS = [
  { name: 'Scroll of Grilling', motto: 'Grill before you build', icon: 'scroll' },
  { name: 'Red Lantern', motto: 'Red before green', icon: 'lantern' },
  { name: "Brakka's Lever", motto: 'Build the lever, not by hand', icon: 'lever' },
  { name: 'Ring of Rerunnable Checks', motto: "If it isn't rerunnable, it's a rumor", icon: 'ring' },
  { name: 'Lens of the Predicate', motto: 'Done is a predicate, not a feeling', icon: 'lens' },
  { name: 'Graft Hammer', motto: 'Compete, judge, graft', icon: 'hammer' },
];

// n → { title, text }. Text: 1–2 short sentences, the joke lands at the end.
export const DEATHS = {
  1: { title: 'Shipped on Vibes', text: 'You charge in with no idea what "done" looks like. Neither do the dead, but there are more of them. Vibes are not a metric.' },
  2: { title: 'Just Make It Work', text: 'The Choir builds 9,000 lines of catapult. It works! It launches you into the river. Zero context in, zero context out.' },
  3: { title: 'Green Without Red', text: '"A TEST THAT NEVER FAILED PROVES NOTHING," sighs the gargoyle, and sits on you. Nothing is proven. You are flat.' },
  4: { title: 'It Depends… Forever', text: '"ON WHAT?" You begin to explain. Three hundred years later you are on caveat four, and made of stone.' },
  5: { title: 'Hand-Rolled', text: 'Tomb 1, tomb 2, tomb 3… By tomb 214 your skin is grey and you groan in stand-ups. You are the ghoul now.' },
  6: { title: 'assert(true)', text: '214 tests by morning. All green. All `assert(true)`. The ghouls give you a standing ovation, then eat you.' },
  7: { title: 'Works On My Machine', text: 'The golden chest sticks out its tongue. "Works on my machine," it says. The machine is its stomach.' },
  8: { title: 'Trust Me, Bro', text: '"Trust me," whispers chest II, and you do, for about one bite. If it isn\'t rerunnable, it\'s a rumor.' },
  9: { title: 'Watermelon Dashboard', text: 'All green! You relax. Inside, everything is red, like a watermelon. Xal\'Zor adds you to a dashboard as a small grey tile.' },
  10: { title: 'Poked the Beholder', text: 'You poke the big eye. The big eye pokes back. Your tombstone reads, in full: "Bold. Brief."' },
  11: { title: 'Demo-Driven Development', text: 'It is gorgeous. It is also painted on air. It looked perfect in the demo; the demo had no gravity.' },
  12: { title: 'Move Fast, Break Yourself', text: 'Fastest bridge in the realm, for four whole steps. You moved fast. The rope broke things. Mostly you.' },
  13: { title: 'Green First? Bold.', text: 'The green gem glows, the door shrugs, the floor opens. Green first is just a guess in a nice colour.' },
  14: { title: 'Proved Nothing', text: 'The gold gem glows first. Proof of what? Nothing exists yet. The door files your proof under "vibes", then files you.' },
  15: { title: 'It Looked Done', text: 'You ship them. They were hallucinations wearing progress bars. Vel\'Krann adds your release notes to the Monolith.' },
  16: { title: 'The Instruction Is the Symptom', text: 'PLEASE DON\'T, ten feet tall. The Choir reads it carefully, agrees with every word, and does it again. The lint is the cure.' },
  17: { title: 'The Second System', text: 'One heroic weekend later: a shiny new codebase, a crown, a phylactery. All hail Vel\'Krann II. It\'s you.' },
  18: { title: 'Production Was Inside', text: 'You smash the Monolith. Shipwell vanishes with it: it was running on it all along. The Choir did ask.' },
};
export const DEATH_COUNT = Object.keys(DEATHS).length;

export const NODES = [
  {
    id: 'village', scene: 'village',
    narration: [
      'Shipwell ships. And every time it ships, the dead rise:',
      'flaky tests, regressions, pages at 3 a.m.',
      'Tonight is release night. Everyone is looking at you.',
    ],
    choices: [
      {
        key: 'A', label: 'Ask the elder questions until the quest is clear.', next: 'gate', relic: 1,
        outcome: [
          'Who is it for? What does "done" mean? What happens when it fails? By question ten the quest fits on one scroll.',
          '🟤 **Elder Mirra:** "The Lich cannot die while his phylactery lives: *the Untested Monolith*. The code nobody dares touch."',
        ],
      },
      { key: 'B', label: 'No time. Into the crypt, on vibes alone.', death: 1 },
      { key: 'C', label: 'Tell the Choir to "just make it work".', death: 2 },
    ],
  },
  {
    id: 'gate', scene: 'gate',
    narration: [
      'A stone gargoyle guards the Catacombs. It has been waiting a long time to be clever at someone.',
      'Above the door, three gems are carved in a row.',
    ],
    choices: [
      { key: 'A', label: '"Green."', death: 3 },
      {
        key: 'B', label: '"Red."', next: 'tombs', relic: 2,
        outcome: ['⚪ **The Gatekeeper:** "CORRECT. NO RED, NO FIX." The gate grinds open. Something hands you a lantern that only shines on what is broken.'],
      },
      { key: 'C', label: '"It depends."', death: 4 },
    ],
  },
  {
    id: 'tombs', scene: 'tombs',
    narration: [
      'Two hundred and fourteen tombs. Every one of them rattling.',
      'Something large, green and wobbly slides past in the dark.',
    ],
    choices: [
      { key: 'A', label: 'Rebury them by hand, one by one.', death: 5 },
      {
        key: 'B', label: '"Brakka, build the lever."', next: 'treasury', relic: 3,
        outcome: [
          'One pull seals every tomb. The gears jam on old dead code, so the cube eats it.',
          '🟢 **Gus:** "my best meals are deletions." Gus has joined the party.',
        ],
      },
      { key: 'C', label: 'Have the Choir write a test for every ghoul by morning.', death: 6 },
    ],
  },
  {
    id: 'treasury', scene: 'treasury',
    narration: [
      'Three chests on a dais. Two are mimics.',
      'The honest one bears the mark of a check you can run again.',
    ],
    choices: [
      { key: 'A', label: 'Open chest I.', death: 7 },
      { key: 'B', label: 'Open chest II.', death: 8 },
      {
        key: 'C', label: 'Open chest III.', next: 'beholder', relic: 4,
        outcome: ['Dust, a creak, and a plain iron ring. You run its check. It passes. You run it again. It passes again. Lovely.'],
      },
    ],
  },
  {
    id: 'beholder', scene: 'beholder',
    narration: [
      'A beholder fills the hall. Every eyestalk ends in a little gauge.',
      'Every gauge is green.',
    ],
    choices: [
      { key: 'A', label: "Admire the dashboards. Everything's green!", death: 9 },
      {
        key: 'B', label: 'Ask what "done" means, and write it as a check.', next: 'chasm', relic: 5,
        outcome: [
          'The check runs. The illusions shatter like cheap glass.',
          '🟣 **Xal\'Zor:** "…no one ever asked me that." The Eye of a Thousand Dashboards joins the party.',
        ],
      },
      { key: 'C', label: 'Poke the big eye.', death: 10 },
    ],
  },
  {
    id: 'chasm', scene: 'chasm',
    narration: [
      'A chasm. The Choir has built three prototype bridges while you were blinking.',
      'Gold and ornate. Rope and fast. Stone and unfinished.',
    ],
    choices: [
      { key: 'A', label: "Cross the golden bridge. It's gorgeous.", death: 11 },
      { key: 'B', label: "Cross the rope bridge. It's fastest.", death: 12 },
      {
        key: 'C', label: 'Judge all three, graft the best parts, throw the rest away.', next: 'door', relic: 6,
        outcome: ["Stone pillars, rope speed, gold handrails. The rest goes in the chasm. 🟠 **Brakka:** \"Now *that's* a bridge, lad.\""],
      },
    ],
  },
  {
    id: 'door', scene: 'door',
    narration: [
      'A sealed door with three empty gem sockets.',
      'Set the gems in the order carved on the gate.',
    ],
    choices: [
      { key: 'A', label: 'GREEN · RED · GOLD', death: 13 },
      {
        key: 'B', label: 'RED · GREEN · GOLD', next: 'lich1',
        outcome: ['Red, then green, then proof. The door sighs open onto the sanctum, and the air turns cold and green.'],
      },
      { key: 'C', label: 'GOLD · GREEN · RED', death: 14 },
    ],
  },
  {
    id: 'lich1', scene: 'lich1',
    narration: [
      'Vel\'Krann, the Legacy Lich, floats above the Untested Monolith.',
      'He summons a horde of features that look finished.',
    ],
    choices: [
      { key: 'A', label: 'They look finished. Ship them.', death: 15 },
      {
        key: 'B', label: 'Raise the Lens. Prove it on the real artifact.', next: 'lich2',
        outcome: ['Under the Lens, every "finished" feature is a hallucination. The horde dissolves.'],
      },
    ],
  },
  {
    id: 'lich2', scene: 'lich2',
    narration: [
      'The Lich turns his curse on your Choir.',
      'They twitch toward the one thing you told them never to do.',
    ],
    choices: [
      { key: 'A', label: 'Write PLEASE DON\'T in bigger letters.', death: 16 },
      {
        key: 'B', label: 'Encode the lesson in structure: Brakka bolts a guard rune onto each construct.', next: 'lich3',
        outcome: ['The runes catch the curse at the boundary. 🔵 **The Choir:** "THE LINT IS THE CURE. BZZT."'],
      },
    ],
  },
  {
    id: 'lich3', scene: 'lich3',
    narration: [
      'Forty thousand lines. No tests. Last touched in 2014.',
      'The Choir freezes, mid-swing, and turns to you.',
    ],
    choices: [
      { key: 'A', label: 'Rewrite it from scratch, in one heroic weekend.', death: 17 },
      { key: 'B', label: 'Smash it. Delete everything.', death: 18 },
      {
        key: 'C', label: 'Pin its behaviour with rerunnable checks, then carve it away slice by small slice.', next: 'victory',
        outcome: ['Check. Slice. Check. Slice. The Monolith gets smaller, and nothing in Shipwell even flickers.'],
      },
    ],
  },
  {
    id: 'victory', scene: 'victory',
    narration: [
      'The last slice falls. Vel\'Krann dissolves into green dust.',
      'Nobody in Shipwell noticed a thing. That was the whole point.',
    ],
    choices: [
      { key: '▶', label: 'Walk home to Shipwell.', next: 'epilogue' },
    ],
  },
  {
    id: 'epilogue', scene: 'epilogue',
    narration: [
      'Release nights end at six now. People go home.',
      'Word spread. Other villages asked for the lever.',
    ],
    choices: [], // the README generator adds credits, grimoire, secret and links
  },
];

// The secret node, reached from the epilogue.
export const SECRET = {
  key: '?', label: "Look under the elder's table",
  scene: 'secret',
  narration: ['The real treasure was the boring releases we made along the way.'],
};

// One-line intro under the title card.
export const INTRO = [
  'You are **APEHEAD**, a principal engineer with a party of coding agents, sent to make shipping boring.',
  'Choose wisely. Or don\'t: dying is half the fun (18 deaths to find).',
];
