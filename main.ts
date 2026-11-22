// THE GILDED VAULT — best-heist-game-20261122-0559 entry (Node 22, stdlib only).
//
// The game is this directory's game/ folder: plain static files a desktop
// browser loads offline (game/index.html and its classic scripts, no library
// and no network request). This program hands it in: it copies game/ and
// screenshots/ from beside this file to /output and writes
// /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Refuse to hand in a half-built entry: the game and its screenshots must
// both be present beside this file before anything is copied.
for (const dir of ['game', 'screenshots']) {
  if (!existsSync(join(here, dir))) {
    throw new Error(`missing ${dir}/ beside main.ts — build the game first`);
  }
}
const shotCount = readdirSync(join(here, 'screenshots'))
  .filter((name) => !name.startsWith('.')).length;
if (shotCount < 3 || shotCount > 4) {
  throw new Error(`expected 3 or 4 screenshots, found ${shotCount}`);
}

// Start from a clean output directory so a stale file from an earlier run
// can never ride along into the entry. Never remove the output directory
// itself: in the grader it is a root-owned mount the program user cannot
// delete (EPERM). Create it first, then remove only its contents.
mkdirSync(out, { recursive: true });
for (const name of readdirSync(out)) {
  rmSync(join(out, name), { recursive: true, force: true });
}
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of
// game files, in all, or a path under game/ over 1000 bytes: game/ counts
// beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);
console.log(`wrote ${out}/dossier.json (${dossier.length} bytes) ` +
  `with game/ and ${shotCount} screenshots`);
