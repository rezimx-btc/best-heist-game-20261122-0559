// Guard patrol, suspicion, chase and search for THE GILDED VAULT.
// A guard walks its waypoints, watches a cone ahead of it, grows suspicious
// when the thief is inside the cone with a clear line of sight, chases when
// suspicion maxes out, and searches the last seen spot before giving up.
(function (global) {
  'use strict';

  const CONE_RANGE = 175;
  const CONE_HALF_ANGLE = 0.56; // ~32 degrees each side
  const CHASE_SPEED = 128;
  const SEARCH_TIME = 3.0;
  const SUSPICION_GAIN = 95;   // per second while the thief is clearly seen
  const SUSPICION_DECAY = 26;  // per second while unseen

  function dist(ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function angleTo(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); }

  function normAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  // True when the straight line from (ax,ay) to (bx,by) crosses no solid.
  function hasLineOfSight(ax, ay, bx, by, solids) {
    const d = dist(ax, ay, bx, by);
    const steps = Math.max(1, Math.ceil(d / 7));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const px = ax + (bx - ax) * t, py = ay + (by - ay) * t;
      for (let s = 0; s < solids.length; s++) {
        const r = solids[s];
        if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return false;
      }
    }
    return true;
  }

  function makeGuard(def) {
    return {
      name: def.name,
      x: def.x, y: def.y,
      waypoints: def.waypoints.map(function (p) { return { x: p.x, y: p.y }; }),
      waypointIndex: 1,
      speed: def.speed,
      angle: 0,
      state: 'patrol',          // patrol | suspicious | chase | search | investigate
      suspicion: 0,
      searchTimer: 0,
      investigateTarget: null,
      lastSeen: null,
      seenNow: false,
      pauseTimer: 0,
    };
  }

  function moveToward(g, tx, ty, speed, dt) {
    const dx = tx - g.x, dy = ty - g.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < 1) return true;
    const step = Math.min(d, speed * dt);
    g.x += (dx / d) * step;
    g.y += (dy / d) * step;
    g.angle = Math.atan2(dy, dx);
    return d - step < 2;
  }

  // Can this guard see the thief right now? Smoke and shadow rugs block or
  // slow the sighting; sneaking shrinks the effective range.
  function guardSees(g, player, solids, smokes) {
    const d = dist(g.x, g.y, player.x, player.y);
    let range = CONE_RANGE;
    if (player.sneaking) range *= 0.72;
    if (d > range) return false;
    const diff = Math.abs(normAngle(angleTo(g.x, g.y, player.x, player.y) - g.angle));
    if (diff > CONE_HALF_ANGLE) return false;
    if (!hasLineOfSight(g.x, g.y, player.x, player.y, solids)) return false;
    for (let i = 0; i < smokes.length; i++) {
      const s = smokes[i];
      if (dist(s.x, s.y, (g.x + player.x) / 2, (g.y + player.y) / 2) < s.radius) return false;
    }
    return true;
  }

  function updateGuard(g, dt, player, solids, smokes, onSpotted) {
    g.seenNow = guardSees(g, player, solids, smokes);

    if (g.seenNow) {
      let gain = SUSPICION_GAIN * dt;
      if (player.inShadow) gain *= 0.45;
      g.suspicion = Math.min(100, g.suspicion + gain);
      g.lastSeen = { x: player.x, y: player.y };
      if (onSpotted) onSpotted(g, player);
    } else {
      g.suspicion = Math.max(0, g.suspicion - SUSPICION_DECAY * dt);
    }

    if (g.state !== 'chase' && g.suspicion >= 100) {
      g.state = 'chase';
      g.searchTimer = 0;
    }

    if (g.state === 'chase') {
      if (g.lastSeen) {
        const arrived = moveToward(g, g.lastSeen.x, g.lastSeen.y, CHASE_SPEED, dt);
        if (!g.seenNow && (arrived || g.suspicion <= 0)) {
          g.state = 'search';
          g.searchTimer = SEARCH_TIME;
        }
      }
      return;
    }

    if (g.state === 'search') {
      g.searchTimer -= dt;
      g.angle += dt * 1.6; // look around the last seen spot
      if (g.searchTimer <= 0) g.state = 'patrol';
      return;
    }

    if (g.state === 'investigate' && g.investigateTarget) {
      const arrived = moveToward(
        g, g.investigateTarget.x, g.investigateTarget.y, g.speed * 1.35, dt);
      if (arrived) {
        g.investigateTarget = null;
        g.state = 'search';
        g.searchTimer = 2.0;
      }
      return;
    }

    // Patrol: walk the waypoints, pausing briefly at each one.
    if (g.pauseTimer > 0) {
      g.pauseTimer -= dt;
      return;
    }
    const target = g.waypoints[g.waypointIndex];
    const arrived = moveToward(g, target.x, target.y, g.speed, dt);
    if (arrived) {
      g.waypointIndex = (g.waypointIndex + 1) % g.waypoints.length;
      g.pauseTimer = 0.7;
    }
  }

  function guardStateWord(g) {
    if (g.state === 'chase') return 'ALERT';
    if (g.state === 'search' || g.state === 'investigate') return 'SUSPICIOUS';
    if (g.suspicion > 35) return 'SUSPICIOUS';
    return 'CALM';
  }

  global.HeistGuard = {
    makeGuard: makeGuard,
    updateGuard: updateGuard,
    guardSees: guardSees,
    guardStateWord: guardStateWord,
    hasLineOfSight: hasLineOfSight,
    CONE_RANGE: CONE_RANGE,
    CONE_HALF_ANGLE: CONE_HALF_ANGLE,
  };
})(typeof window !== 'undefined' ? window : globalThis);
