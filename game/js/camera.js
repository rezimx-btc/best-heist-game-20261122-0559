// Wall-mounted security cameras for THE GILDED VAULT.
// A camera sits fixed on a wall and sweeps its cone back and forth; its cone
// is a second kind of danger, independent of the patrolling guards.
(function (global) {
  'use strict';

  const CAM_RANGE = 225;
  const CAM_HALF_ANGLE = 0.5; // ~29 degrees each side

  function dist(ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function makeCamera(def) {
    return {
      name: def.name,
      x: def.x, y: def.y,
      baseAngle: def.baseAngle,
      sweep: def.sweep,
      period: def.period,
      phase: def.phase,
      angle: def.baseAngle,
      time: def.phase,
      seesPlayer: false,
    };
  }

  function updateCamera(cam, dt, player, solids, smokes) {
    cam.time += dt;
    cam.angle = cam.baseAngle +
      Math.sin((cam.time / cam.period) * Math.PI * 2) * cam.sweep;
    cam.seesPlayer = cameraSees(cam, player, solids, smokes);
  }

  function cameraSees(cam, player, solids, smokes) {
    const d = dist(cam.x, cam.y, player.x, player.y);
    let range = CAM_RANGE;
    if (player.sneaking) range *= 0.72;
    if (d > range) return false;
    let diff = Math.atan2(player.y - cam.y, player.x - cam.x) - cam.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) > CAM_HALF_ANGLE) return false;
    if (!global.HeistGuard.hasLineOfSight(cam.x, cam.y, player.x, player.y, solids)) return false;
    for (let i = 0; i < smokes.length; i++) {
      const s = smokes[i];
      if (dist(s.x, s.y, (cam.x + player.x) / 2, (cam.y + player.y) / 2) < s.radius) return false;
    }
    return true;
  }

  global.HeistCamera = {
    makeCamera: makeCamera,
    updateCamera: updateCamera,
    cameraSees: cameraSees,
    CAM_RANGE: CAM_RANGE,
    CAM_HALF_ANGLE: CAM_HALF_ANGLE,
  };
})(typeof window !== 'undefined' ? window : globalThis);
