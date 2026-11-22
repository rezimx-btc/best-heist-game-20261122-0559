// The Aurelia Gallery — the single room of THE GILDED VAULT.
// All coordinates are in canvas pixels (960 x 600). Walls, crates and
// pedestals are solid rectangles; shadow rugs halve detection; the vault
// door stays solid until the thief carries the keycard.
(function (global) {
  'use strict';

  const WALL = 16;

  function rect(x, y, w, h) { return { x: x, y: y, w: w, h: h }; }

  const GALLERY = {
    name: 'The Aurelia Gallery',
    subtitle: 'One Night Only',
    width: 960,
    height: 600,

    // Solid rectangles the thief and the guards cannot cross.
    solids: [
      // Outer walls (with a gap at the south-east exit door).
      rect(0, 0, 960, WALL),                 // north wall
      rect(0, 0, WALL, 600),                 // west wall
      rect(944, 0, WALL, 600),               // east wall
      rect(0, 584, 836, WALL),               // south wall, west of the exit
      rect(924, 584, 36, WALL),              // south wall, east of the exit
      // Vault room: top centre, entered through its south door.
      rect(352, WALL, WALL, 150),            // vault west wall
      rect(592, WALL, WALL, 150),            // vault east wall
      rect(352, WALL, 256, WALL),            // vault north wall
      rect(352, 150, 96, WALL),             // vault south wall, west of door
      rect(512, 150, 96, WALL),             // vault south wall, east of door
      // Display pedestals and crates — cover from the cones.
      rect(120, 210, 64, 40),                // crate stack, west hall
      rect(120, 420, 64, 40),                // crate stack, south-west
      rect(700, 380, 72, 44),                // crate stack, south-east hall
      rect(760, 210, 56, 56),                // marble pedestal, east hall
      rect(250, 470, 120, 28),               // long bench, south hall
      rect(560, 470, 120, 28),               // long bench, south hall
      rect(300, 330, 44, 44),                // statue plinth, centre-west
      rect(620, 300, 44, 44),                // statue plinth, centre-east
    ],

    // The vault door: solid until the keycard is carried, then it slides open.
    vaultDoor: rect(448, 150, 64, WALL),

    // Dark rugs: standing on one halves how fast guards and cameras spot you.
    shadows: [
      rect(180, 110, 120, 74),
      rect(300, 380, 150, 96),
      rect(660, 280, 130, 84),
    ],

    // The exit: the service door in the south-east wall.
    exit: rect(836, 584, 88, WALL),
    exitLabel: { x: 880, y: 560 },

    playerStart: { x: 70, y: 520 },

    // Loot. The diamond sits inside the vault; the keycard opens it.
    keycard: { x: 176, y: 300, taken: false, label: 'KEYCARD' },
    loot: [
      { id: 'gold-1', kind: 'gold', x: 830, y: 120, taken: false, value: 100 },
      { id: 'gold-2', kind: 'gold', x: 110, y: 500, taken: false, value: 100 },
      { id: 'gold-3', kind: 'gold', x: 700, y: 520, taken: false, value: 100 },
      { id: 'diamond', kind: 'diamond', x: 480, y: 92, taken: false, value: 500 },
    ],

    // Three guards, three different routes.
    guards: [
      {
        name: 'Marlowe',
        x: 200, y: 250,
        waypoints: [{ x: 200, y: 250 }, { x: 780, y: 250 }],
        speed: 62,
      },
      {
        name: 'Iris',
        x: 830, y: 200,
        waypoints: [{ x: 830, y: 200 }, { x: 830, y: 500 }],
        speed: 70,
      },
      {
        name: 'Bram',
        x: 330, y: 212,
        waypoints: [
          { x: 330, y: 212 }, { x: 630, y: 212 },
          { x: 630, y: 300 }, { x: 330, y: 300 },
        ],
        speed: 56,
      },
    ],

    // Two wall cameras with sweeping cones.
    cameras: [
      {
        name: 'Cam A', x: 52, y: 44,
        baseAngle: Math.PI * 0.28, sweep: 0.62, period: 5.2, phase: 0,
      },
      {
        name: 'Cam B', x: 908, y: 44,
        baseAngle: Math.PI * 0.72, sweep: 0.62, period: 6.4, phase: 2.1,
      },
    ],
  };

  global.GALLERY_LEVEL = GALLERY;
})(typeof window !== 'undefined' ? window : globalThis);
