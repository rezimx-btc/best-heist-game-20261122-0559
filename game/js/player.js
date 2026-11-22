// The thief — Vesper — movement, collision and noise for THE GILDED VAULT.
// WASD or arrows move; Shift sneaks (slower, harder to spot, silent).
// Running close to a guard makes noise that draws suspicion.
(function (global) {
  'use strict';

  const RUN_SPEED = 168;
  const SNEAK_SPEED = 88;
  const RADIUS = 13;
  const NOISE_RADIUS = 130;

  function makePlayer(start) {
    return {
      x: start.x, y: start.y,
      radius: RADIUS,
      facing: -Math.PI / 2,
      moving: false,
      sneaking: false,
      inShadow: false,
      hasKeycard: false,
      loot: 0,
      diamond: false,
    };
  }

  function circleHitsRect(cx, cy, r, rect) {
    const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
    const dx = cx - nx, dy = cy - ny;
    return dx * dx + dy * dy < r * r;
  }

  function movePlayer(player, input, dt, solids, bounds) {
    let dx = 0, dy = 0;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    player.sneaking = !!input.sneak;
    player.moving = dx !== 0 || dy !== 0;
    if (!player.moving) return;

    const len = Math.sqrt(dx * dx + dy * dy);
    dx /= len; dy /= len;
    const speed = player.sneaking ? SNEAK_SPEED : RUN_SPEED;
    player.facing = Math.atan2(dy, dx);

    // Move axis by axis so the thief slides along walls instead of sticking.
    const nx = player.x + dx * speed * dt;
    if (!hitsAny(nx, player.y, player.radius, solids) &&
        nx > bounds.x + player.radius && nx < bounds.x + bounds.w - player.radius) {
      player.x = nx;
    }
    const ny = player.y + dy * speed * dt;
    if (!hitsAny(player.x, ny, player.radius, solids) &&
        ny > bounds.y + player.radius && ny < bounds.y + bounds.h - player.radius) {
      player.y = ny;
    }
  }

  function hitsAny(x, y, r, solids) {
    for (let i = 0; i < solids.length; i++) {
      if (circleHitsRect(x, y, r, solids[i])) return true;
    }
    return false;
  }

  function pointInRect(px, py, rect) {
    return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
  }

  // Running makes noise: a nearby guard grows suspicious of the sound.
  function playerNoise(player, guards) {
    if (!player.moving || player.sneaking) return null;
    for (let i = 0; i < guards.length; i++) {
      const g = guards[i];
      const d = Math.sqrt(
        (g.x - player.x) * (g.x - player.x) + (g.y - player.y) * (g.y - player.y));
      if (d < NOISE_RADIUS && g.state !== 'chase') {
        g.suspicion = Math.min(100, g.suspicion + 14);
        if (g.state === 'patrol' && g.suspicion > 40) g.state = 'suspicious';
      }
    }
    return { x: player.x, y: player.y, radius: NOISE_RADIUS };
  }

  global.HeistPlayer = {
    makePlayer: makePlayer,
    movePlayer: movePlayer,
    circleHitsRect: circleHitsRect,
    pointInRect: pointInRect,
    playerNoise: playerNoise,
    RUN_SPEED: RUN_SPEED,
    SNEAK_SPEED: SNEAK_SPEED,
  };
})(typeof window !== 'undefined' ? window : globalThis);
