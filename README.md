# THE GILDED VAULT

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/rezimx-btc/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/rezimx-btc/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

A top-down heist game. You are **Vesper**, slipping into the **Aurelia
Gallery** on its one quiet night to steal the **Sunheart Diamond** — and
vanish before the alarm hits 100%.

## The job

- **Find the keycard** on the west pedestal, then touch the vault door to
  slide it open. The Sunheart Diamond waits inside the vault, top centre.
- **Grab the loot** — 3 gold bars around the gallery (+100 each) and the
  diamond (+500). The service door in the south-east only counts once the
  diamond is carried.
- **Three guards patrol with vision cones** — Marlowe across the middle
  hall, Iris up and down the east hall, Bram circling the vault. Calm tan,
  `?` when suspicious, `!` and red when they see you. A guard that reaches
  100% suspicion chases; if it catches you, the job is blown.
- **Two security cameras** sweep the halls with a second kind of cone.
- **The alarm meter** rises while any guard or camera sees you and falls
  while you stay hidden. At 100% the gallery locks down — busted.
- **Shadow rugs hide you** — standing on one halves how fast you are
  spotted. **Shift** sneaks: slow and silent. Running close to a guard
  makes noise that draws suspicion.
- **Tools at a cost** — click anywhere to toss a coin (5 per night): the
  nearest guard walks over to check the clink. **Q** throws a smoke bomb
  (2 per night): cones cannot see through it for a few seconds.
- **Rating per run** — GHOST (never seen), SHADOW (seen but escaped),
  SPOTTED (caught on camera or by a cone). Gold is +100, the diamond +500,
  and a clean getaway adds a time bonus.

## Controls

WASD / arrows move · Shift sneak · E grab / unlock · click toss coin ·
Q smoke · P pause · R restart · M mute

## Run it

Serve this folder with any static server and open `game/index.html` in
desktop Chrome. No network requests, no build step — all files are local.

```
python3 -m http.server
```

## Screenshots

`01-cover.png` the full job in one frame — room, guards, cones, cameras,
diamond and the alarm meter · `02-alarm.png` spotted, Marlowe alert, alarm
at 77% · `03-vault.png` vault open, Vesper inside for the diamond ·
`04-win.png` clean getaway, score 1250.

Entry for the [best heist game bounty](https://make.fun/bounty/best-heist-game-20261122-0559) on make.fun.
