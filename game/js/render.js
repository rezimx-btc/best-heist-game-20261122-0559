// Canvas drawing for THE GILDED VAULT — every sprite is drawn in code:
// the gallery floor, the gold-trimmed vault, crates, guards with glowing
// vision cones, sweeping cameras, the thief, the loot and the overlays.
(function (global) {
  'use strict';

  const GOLD = '#e8c15a';
  const GOLD_BRIGHT = '#ffd76a';
  const CREAM = '#f2ead8';

  function drawFloor(ctx, level) {
    ctx.fillStyle = '#12141f';
    ctx.fillRect(0, 0, level.width, level.height);
    // Checkerboard marble tiles.
    const tile = 48;
    for (let y = 0; y < level.height; y += tile) {
      for (let x = 0; x < level.width; x += tile) {
        if (((x + y) / tile) % 2 === 0) {
          ctx.fillStyle = '#161a29';
          ctx.fillRect(x, y, tile, tile);
        }
      }
    }
    // Gold inlay border around the room.
    ctx.strokeStyle = 'rgba(232,193,90,0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, level.width - 40, level.height - 40);
    // Shadow rugs — dark pools where the thief is harder to spot.
    level.shadows.forEach(function (r) {
      ctx.fillStyle = '#0a0d18';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = '#2c3a5e';
      ctx.lineWidth = 1;
      ctx.strokeRect(r.x + 3, r.y + 3, r.w - 6, r.h - 6);
      ctx.fillStyle = 'rgba(154,163,184,0.5)';
      ctx.font = '10px Trebuchet MS, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SHADOW', r.x + r.w / 2, r.y + r.h / 2 + 3);
    });
  }

  function drawWalls(ctx, level, vaultOpen) {
    ctx.fillStyle = '#232742';
    level.solids.forEach(function (r) {
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = '#3a4266';
      ctx.lineWidth = 1;
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    });
    // Vault door: gold bars while locked, open gap once the keycard is used.
    const d = level.vaultDoor;
    if (vaultOpen) {
      ctx.fillStyle = '#12141f';
      ctx.fillRect(d.x, d.y, d.w, d.h);
    } else {
      ctx.fillStyle = '#6b5426';
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.fillStyle = GOLD;
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(d.x + 6 + i * 15, d.y + 2, 4, d.h - 4);
      }
      ctx.fillStyle = '#ff5d5d';
      ctx.font = 'bold 9px Trebuchet MS, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LOCKED', d.x + d.w / 2, d.y - 6);
    }
  }

  function drawCratesAndPedestals(ctx, level) {
    level.solids.forEach(function (r) {
      // Only the interior furniture gets a crate/pedestal look; walls are
      // already drawn as plain blocks above.
      const isWall = r.y === 0 || r.x === 0 || r.x + r.w >= 960 || r.y + r.h >= 600 ||
        (r.y === 16 && r.h === 16) || (r.x >= 352 && r.x < 608 && r.y <= 166);
      if (isWall) return;
      ctx.fillStyle = '#8a6d3b';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = '#5d4722';
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x + r.w, r.y + r.h);
      ctx.moveTo(r.x + r.w, r.y);
      ctx.lineTo(r.x, r.y + r.h);
      ctx.strokeStyle = 'rgba(93,71,34,0.7)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  function drawCone(ctx, x, y, angle, halfAngle, range, color) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
    ctx.closePath();
    const grad = ctx.createRadialGradient(x, y, 10, x, y, range);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }

  function drawGuard(ctx, g) {
    const alert = g.state === 'chase';
    const suspicious = g.state !== 'patrol' && !alert;
    const coneColor = alert
      ? 'rgba(255,59,48,0.42)'
      : suspicious ? 'rgba(255,159,28,0.32)' : 'rgba(255,215,106,0.24)';
    drawCone(ctx, g.x, g.y, g.angle, global.HeistGuard.CONE_HALF_ANGLE,
      global.HeistGuard.CONE_RANGE, coneColor);
    // Body: crimson uniform, gold epaulettes, facing wedge.
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(g.angle);
    ctx.fillStyle = alert ? '#c22e2e' : '#8e2f35';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(4, -7);
    ctx.lineTo(4, 7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = CREAM;
    ctx.beginPath();
    ctx.arc(3, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // State mark above the head.
    ctx.font = 'bold 16px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    if (alert) {
      ctx.fillStyle = '#ff3b30';
      ctx.fillText('!', g.x, g.y - 20);
    } else if (suspicious || g.suspicion > 35) {
      ctx.fillStyle = '#ff9f1c';
      ctx.fillText('?', g.x, g.y - 20);
    }
    ctx.fillStyle = 'rgba(242,234,216,0.85)';
    ctx.font = '10px Trebuchet MS, sans-serif';
    ctx.fillText(g.name.toUpperCase(), g.x, g.y + 26);
  }

  function drawCamera(ctx, cam) {
    const color = cam.seesPlayer
      ? 'rgba(255,59,48,0.45)' : 'rgba(255,93,143,0.22)';
    drawCone(ctx, cam.x, cam.y, cam.angle, global.HeistCamera.CAM_HALF_ANGLE,
      global.HeistCamera.CAM_RANGE, color);
    // Wall mount + lens.
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.rotate(cam.angle);
    ctx.fillStyle = '#3a3f55';
    ctx.fillRect(-6, -6, 18, 12);
    ctx.fillStyle = cam.seesPlayer ? '#ff3b30' : '#ff5d8f';
    ctx.beginPath();
    ctx.arc(12, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(13, 0, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(242,234,216,0.8)';
    ctx.font = '10px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(cam.name.toUpperCase(), cam.x, cam.y + 22);
  }

  function drawLoot(ctx, level, time) {
    // Keycard on its pedestal.
    if (!level.keycard.taken) {
      const k = level.keycard;
      const bob = Math.sin(time * 3) * 3;
      ctx.save();
      ctx.translate(k.x, k.y + bob);
      ctx.fillStyle = '#2c3a5e';
      ctx.fillRect(-14, -9, 28, 18);
      ctx.fillStyle = GOLD_BRIGHT;
      ctx.fillRect(-14, -9, 28, 5);
      ctx.fillStyle = CREAM;
      ctx.font = 'bold 8px Trebuchet MS, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('KEY', 0, 6);
      ctx.restore();
    }
    level.loot.forEach(function (item) {
      if (item.taken) return;
      const bob = Math.sin(time * 2.5 + item.x) * 3;
      if (item.kind === 'gold') {
        ctx.save();
        ctx.translate(item.x, item.y + bob);
        ctx.shadowColor = GOLD_BRIGHT;
        ctx.shadowBlur = 10;
        ctx.fillStyle = GOLD;
        ctx.beginPath();
        ctx.moveTo(-12, 6);
        ctx.lineTo(-8, -6);
        ctx.lineTo(8, -6);
        ctx.lineTo(12, 6);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff3c4';
        ctx.fillRect(-6, -4, 12, 2);
        ctx.restore();
      } else {
        // The Sunheart Diamond — the prize of the night.
        ctx.save();
        ctx.translate(item.x, item.y + bob);
        const pulse = 12 + Math.sin(time * 4) * 4;
        ctx.shadowColor = '#39d0ff';
        ctx.shadowBlur = 22;
        ctx.fillStyle = '#39d0ff';
        ctx.beginPath();
        ctx.moveTo(0, -pulse);
        ctx.lineTo(pulse * 0.75, 0);
        ctx.lineTo(0, pulse);
        ctx.lineTo(-pulse * 0.75, 0);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#e8fbff';
        ctx.beginPath();
        ctx.moveTo(0, -pulse * 0.55);
        ctx.lineTo(pulse * 0.4, 0);
        ctx.lineTo(0, pulse * 0.55);
        ctx.lineTo(-pulse * 0.4, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#39d0ff';
        ctx.font = 'bold 11px Trebuchet MS, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SUNHEART DIAMOND', item.x, item.y - 26);
      }
    });
  }

  function drawExit(ctx, level, diamondTaken) {
    const e = level.exit;
    ctx.save();
    ctx.fillStyle = diamondTaken ? '#2fd67a' : '#1f7a4a';
    ctx.fillRect(e.x, e.y - 26, e.w, 26);
    ctx.strokeStyle = diamondTaken ? '#b6ffd4' : '#2fd67a';
    ctx.lineWidth = 2;
    ctx.strokeRect(e.x + 1, e.y - 25, e.w - 2, 24);
    ctx.fillStyle = '#04120a';
    ctx.font = 'bold 13px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(diamondTaken ? 'EXIT — GO!' : 'EXIT', e.x + e.w / 2, e.y - 8);
    ctx.restore();
  }

  function drawPlayer(ctx, player, time) {
    ctx.save();
    ctx.translate(player.x, player.y);
    if (player.inShadow) {
      ctx.strokeStyle = 'rgba(57,208,255,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, player.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.rotate(player.facing);
    // Hooded thief: dark cloak, cream mask, gold clasp.
    ctx.fillStyle = '#1c2233';
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#2a3350';
    ctx.beginPath();
    ctx.moveTo(player.radius, 0);
    ctx.lineTo(2, -8);
    ctx.lineTo(2, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = CREAM;
    ctx.beginPath();
    ctx.arc(4, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#141824';
    ctx.fillRect(6, -3.5, 3, 7);
    ctx.fillStyle = GOLD_BRIGHT;
    ctx.beginPath();
    ctx.arc(-player.radius + 2, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(242,234,216,0.9)';
    ctx.font = 'bold 10px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VESPER', player.x, player.y - player.radius - 8);
  }

  function drawEffects(ctx, state) {
    state.smokes.forEach(function (s) {
      ctx.save();
      ctx.fillStyle = 'rgba(200,205,220,0.28)';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(230,235,245,0.35)';
      ctx.beginPath();
      ctx.arc(s.x - 18, s.y - 10, s.radius * 0.55, 0, Math.PI * 2);
      ctx.arc(s.x + 20, s.y + 12, s.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    state.coins.forEach(function (c) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.fillStyle = GOLD_BRIGHT;
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8a6d3b';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    });
    state.noiseRings.forEach(function (ring) {
      ctx.save();
      ctx.strokeStyle = 'rgba(232,193,90,' + Math.max(0, 0.7 - ring.age) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius * ring.age, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawAlarmBanner(ctx, state) {
    if (state.alarm < 55 || state.phase !== 'playing') return;
    ctx.save();
    ctx.fillStyle = state.alarm >= 85 ? '#ff3b30' : '#ff9f1c';
    ctx.font = 'bold 20px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.alarm >= 85 ? 'ALARM — THEY ARE ONTO YOU!' : 'SPOTTED — BREAK LINE OF SIGHT!',
      480, 52);
    ctx.restore();
  }

  function drawOverlay(ctx, state) {
    ctx.save();
    ctx.fillStyle = 'rgba(8,10,18,0.82)';
    ctx.fillRect(0, 0, 960, 600);
    ctx.textAlign = 'center';
    if (state.phase === 'title') {
      ctx.fillStyle = GOLD_BRIGHT;
      ctx.font = 'bold 54px Trebuchet MS, sans-serif';
      ctx.fillText('THE GILDED VAULT', 480, 170);
      ctx.fillStyle = CREAM;
      ctx.font = '20px Trebuchet MS, sans-serif';
      ctx.fillText('One thief. Three guards. Two cameras. One diamond.', 480, 212);
      ctx.font = '16px Trebuchet MS, sans-serif';
      ctx.fillStyle = '#9aa3b8';
      ctx.fillText('Find the keycard, crack the vault, take the Sunheart Diamond,', 480, 270);
      ctx.fillText('then slip out the service door — before the alarm hits 100%.', 480, 294);
      ctx.fillStyle = GOLD;
      ctx.font = 'bold 17px Trebuchet MS, sans-serif';
      ctx.fillText('WASD move · Shift sneak · Click toss coin · Q smoke · E grab', 480, 350);
      ctx.fillStyle = CREAM;
      ctx.font = 'bold 22px Trebuchet MS, sans-serif';
      ctx.fillText('Press any key or click to start the heist', 480, 420);
    } else if (state.phase === 'paused') {
      ctx.fillStyle = CREAM;
      ctx.font = 'bold 44px Trebuchet MS, sans-serif';
      ctx.fillText('PAUSED', 480, 280);
      ctx.font = '18px Trebuchet MS, sans-serif';
      ctx.fillText('Press P to resume · R to restart', 480, 322);
    } else if (state.phase === 'won') {
      ctx.fillStyle = '#2fd67a';
      ctx.font = 'bold 48px Trebuchet MS, sans-serif';
      ctx.fillText('CLEAN GETAWAY!', 480, 200);
      ctx.fillStyle = CREAM;
      ctx.font = '20px Trebuchet MS, sans-serif';
      ctx.fillText('The Sunheart Diamond is yours. Vesper vanishes into the night.', 480, 246);
      ctx.fillText('Score ' + state.score + ' · Time ' + state.timeText +
        ' · Rating ' + state.rating, 480, 286);
      ctx.fillStyle = GOLD;
      ctx.font = 'bold 18px Trebuchet MS, sans-serif';
      ctx.fillText('Press R to run it again', 480, 340);
    } else if (state.phase === 'busted') {
      ctx.fillStyle = '#ff3b30';
      ctx.font = 'bold 48px Trebuchet MS, sans-serif';
      ctx.fillText('BUSTED!', 480, 200);
      ctx.fillStyle = CREAM;
      ctx.font = '20px Trebuchet MS, sans-serif';
      ctx.fillText(state.bustedReason, 480, 246);
      ctx.fillText('Score ' + state.score + ' · Loot ' + state.player.loot + ' / 4', 480, 286);
      ctx.fillStyle = GOLD;
      ctx.font = 'bold 18px Trebuchet MS, sans-serif';
      ctx.fillText('Press R to try again', 480, 340);
    }
    ctx.restore();
  }

  function render(ctx, state, time) {
    const level = state.level;
    drawFloor(ctx, level);
    drawLoot(ctx, level, time);
    drawExit(ctx, level, state.player.diamond);
    state.cameras.forEach(function (cam) { drawCamera(ctx, cam); });
    state.guards.forEach(function (g) { drawGuard(ctx, g); });
    drawWalls(ctx, level, state.vaultOpen);
    drawCratesAndPedestals(ctx, level);
    drawPlayer(ctx, state.player, time);
    drawEffects(ctx, state);
    drawAlarmBanner(ctx, state);
    if (state.phase !== 'playing') drawOverlay(ctx, state);
  }

  global.HeistRender = { render: render };
})(typeof window !== 'undefined' ? window : globalThis);
