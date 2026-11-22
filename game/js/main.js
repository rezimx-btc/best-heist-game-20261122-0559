// Main loop and rules for THE GILDED VAULT.
// Phases: title -> playing -> paused | won | busted. The alarm meter rises
// while any guard or camera sees Vesper and falls while she stays hidden;
// at 100% the job is blown. Grab the keycard, open the vault, take the
// Sunheart Diamond and reach the service door to win.
(function (global) {
  'use strict';

  const ALARM_GUARD_RATE = 34;   // per second while a guard sees the thief
  const ALARM_CAMERA_RATE = 26;  // per second while a camera sees the thief
  const ALARM_DECAY = 9;         // per second while nobody sees the thief
  const SMOKE_TIME = 3.5;
  const SMOKE_RADIUS = 95;

  function cloneLevel() {
    // Deep-copy the level so a restart never carries a taken loot item.
    return JSON.parse(JSON.stringify(global.GALLERY_LEVEL));
  }

  function makeState() {
    const level = cloneLevel();
    return {
      level: level,
      phase: 'title',
      player: global.HeistPlayer.makePlayer(level.playerStart),
      guards: level.guards.map(function (g) { return global.HeistGuard.makeGuard(g); }),
      cameras: level.cameras.map(function (c) { return global.HeistCamera.makeCamera(c); }),
      smokes: [],
      coins: [],
      noiseRings: [],
      alarm: 0,
      score: 0,
      elapsed: 0,
      smokesLeft: 2,
      coinsLeft: 5,
      vaultOpen: false,
      seen: false,
      rating: 'GHOST',
      bustedReason: '',
      timeText: '0:00',
      lastSpotTime: -99,
    };
  }

  function solidRects(state) {
    const rects = state.level.solids.slice();
    if (!state.vaultOpen) rects.push(state.level.vaultDoor);
    return rects;
  }

  function playerInShadow(state) {
    const p = state.player;
    for (let i = 0; i < state.level.shadows.length; i++) {
      if (global.HeistPlayer.pointInRect(p.x, p.y, state.level.shadows[i])) return true;
    }
    return false;
  }

  function tryPickups(state) {
    const p = state.player;
    const level = state.level;
    const near = function (x, y, r) {
      const dx = p.x - x, dy = p.y - y;
      return dx * dx + dy * dy < r * r;
    };
    if (!level.keycard.taken && near(level.keycard.x, level.keycard.y, 30)) {
      level.keycard.taken = true;
      p.hasKeycard = true;
      state.score += 50;
      global.HeistAudio.SFX.keycard();
      global.HeistHud.setStatus('Keycard lifted. The vault door will open for you now.');
    }
    level.loot.forEach(function (item) {
      if (item.taken) return;
      if (item.kind === 'diamond' && !state.vaultOpen) return; // sealed inside
      if (near(item.x, item.y, 30)) {
        item.taken = true;
        p.loot += 1;
        state.score += item.value;
        if (item.kind === 'diamond') {
          p.diamond = true;
          global.HeistAudio.SFX.diamond();
          global.HeistHud.setStatus('The Sunheart Diamond is yours — get to the exit!');
        } else {
          global.HeistAudio.SFX.pickup();
          global.HeistHud.setStatus('Gold bar pocketed (+100). ' + (4 - p.loot) + ' loot left.');
        }
      }
    });
    // Touching the vault door with the keycard slides it open.
    if (!state.vaultOpen && p.hasKeycard &&
        global.HeistPlayer.circleHitsRect(p.x, p.y, p.radius + 6, level.vaultDoor)) {
      state.vaultOpen = true;
      state.score += 50;
      global.HeistAudio.SFX.vaultOpen();
      global.HeistHud.setStatus('Vault open. The Sunheart Diamond is inside.');
    }
    // The exit only counts once the diamond is carried.
    if (p.diamond && global.HeistPlayer.circleHitsRect(p.x, p.y, p.radius, level.exit)) {
      winGame(state);
    }
  }

  function winGame(state) {
    if (state.phase !== 'playing') return;
    state.phase = 'won';
    const timeBonus = Math.max(0, 600 - Math.floor(state.elapsed * 5));
    state.score += timeBonus;
    state.timeText = global.HeistHud.formatTime(state.elapsed);
    global.HeistAudio.SFX.win();
    global.HeistAudio.stopAlarmLoop();
    global.HeistHud.setStatus('Clean getaway! Score ' + state.score + ' in ' + state.timeText + '.');
  }

  function bustGame(state, reason) {
    if (state.phase !== 'playing') return;
    state.phase = 'busted';
    state.bustedReason = reason;
    state.timeText = global.HeistHud.formatTime(state.elapsed);
    global.HeistAudio.SFX.busted();
    global.HeistAudio.stopAlarmLoop();
    global.HeistHud.setStatus('Busted. ' + reason);
  }

  function tossCoin(state, point) {
    if (state.phase !== 'playing' || state.coinsLeft <= 0) return;
    state.coinsLeft -= 1;
    state.coins.push({ x: point.x, y: point.y, age: 0 });
    state.noiseRings.push({ x: point.x, y: point.y, age: 0, radius: 130 });
    global.HeistAudio.SFX.coin();
    // The nearest guard walks over to check the clink.
    let best = null, bestD = 280;
    state.guards.forEach(function (g) {
      const d = Math.sqrt((g.x - point.x) * (g.x - point.x) + (g.y - point.y) * (g.y - point.y));
      if (d < bestD && g.state !== 'chase') { best = g; bestD = d; }
    });
    if (best) {
      best.investigateTarget = { x: point.x, y: point.y };
      best.state = 'investigate';
      global.HeistHud.setStatus(best.name + ' heard something over there…');
    } else {
      global.HeistHud.setStatus('Coin tossed. Nobody close enough to hear it.');
    }
  }

  function throwSmoke(state) {
    if (state.phase !== 'playing' || state.smokesLeft <= 0) return;
    state.smokesLeft -= 1;
    state.smokes.push({
      x: state.player.x, y: state.player.y,
      radius: SMOKE_RADIUS, age: 0, ttl: SMOKE_TIME,
    });
    global.HeistAudio.SFX.smoke();
    global.HeistHud.setStatus('Smoke out — the cones cannot see through it.');
  }

  function updatePlaying(state, input, dt) {
    state.elapsed += dt;
    const solids = solidRects(state);
    const p = state.player;
    p.inShadow = playerInShadow(state);

    global.HeistPlayer.movePlayer(p, input, dt, solids, { x: 0, y: 0, w: 960, h: 600 });
    const noise = global.HeistPlayer.playerNoise(p, state.guards);
    if (noise) state.noiseRings.push({ x: noise.x, y: noise.y, age: 0, radius: noise.radius });

    // Guards and cameras watch; being seen feeds the alarm meter.
    let spottedByGuard = false, spottedByCamera = false;
    state.guards.forEach(function (g) {
      global.HeistGuard.updateGuard(g, dt, p, solids, state.smokes, function () {
        spottedByGuard = true;
      });
      if (g.seenNow && !state.seen) {
        state.seen = true;
        state.rating = 'SPOTTED';
        global.HeistAudio.SFX.spotted();
      }
    });
    state.cameras.forEach(function (cam) {
      global.HeistCamera.updateCamera(cam, dt, p, solids, state.smokes);
      if (cam.seesPlayer) spottedByCamera = true;
    });

    if (spottedByGuard) state.alarm += ALARM_GUARD_RATE * dt * (p.inShadow ? 0.45 : 1);
    if (spottedByCamera) state.alarm += ALARM_CAMERA_RATE * dt * (p.inShadow ? 0.45 : 1);
    if (!spottedByGuard && !spottedByCamera) state.alarm -= ALARM_DECAY * dt;
    state.alarm = Math.max(0, Math.min(100, state.alarm));
    if (state.seen && !spottedByGuard && !spottedByCamera && state.rating === 'SPOTTED') {
      state.rating = 'SHADOW';
    }

    global.HeistAudio.startAlarmLoop();
    global.HeistAudio.setAlarmLevel(state.alarm / 100);

    if (state.alarm >= 100) {
      bustGame(state, 'The alarm hit 100% — the gallery locks down and the crew is caught.');
      return;
    }
    // A chasing guard that catches Vesper ends the night.
    for (let i = 0; i < state.guards.length; i++) {
      const g = state.guards[i];
      const d = Math.sqrt((g.x - p.x) * (g.x - p.x) + (g.y - p.y) * (g.y - p.y));
      if (g.state === 'chase' && d < p.radius + 14) {
        bustGame(state, g.name + ' grabbed Vesper in the gallery. The crew is caught.');
        return;
      }
    }

    // Smoke clouds fade; coins and noise rings expire.
    state.smokes.forEach(function (s) { s.age += dt; });
    state.smokes = state.smokes.filter(function (s) { return s.age < s.ttl; });
    state.coins.forEach(function (c) { c.age += dt; });
    state.coins = state.coins.filter(function (c) { return c.age < 6; });
    state.noiseRings.forEach(function (r) { r.age += dt * 1.4; });
    state.noiseRings = state.noiseRings.filter(function (r) { return r.age < 1; });

    tryPickups(state);
  }

  // Screenshot staging (the same ?shot= pattern the kit's starter uses):
  // positions the crew for a composed frame. It never plays the game, never
  // grants loot and never disables the alarm — it only sets starting spots.
  function applyShot(state, shot) {
    const p = state.player;
    if (shot === 'cover') {
      p.x = 480; p.y = 380; p.facing = -Math.PI / 2;
      state.guards[0].x = 420; state.guards[0].y = 250; state.guards[0].angle = 0;
      state.guards[1].x = 830; state.guards[1].y = 330; state.guards[1].angle = Math.PI;
      state.guards[2].x = 480; state.guards[2].y = 212; state.guards[2].angle = -Math.PI / 2;
      state.cameras[0].time = 1.2;
      state.cameras[1].time = 4.0;
      state.alarm = 34;
      state.phase = 'playing';
    } else if (shot === 'alarm') {
      p.x = 590; p.y = 250; p.facing = Math.PI;
      state.guards[0].x = 420; state.guards[0].y = 250; state.guards[0].angle = 0;
      state.guards[0].state = 'suspicious'; state.guards[0].suspicion = 82;
      state.guards[0].lastSeen = { x: p.x, y: p.y };
      state.alarm = 45;
      state.seen = true;
      state.rating = 'SPOTTED';
      state.phase = 'playing';
    } else if (shot === 'vault') {
      p.x = 480; p.y = 200; p.facing = -Math.PI / 2;
      p.hasKeycard = true;
      state.vaultOpen = true;
      state.score = 150;
      state.guards[2].x = 400; state.guards[2].y = 300; state.guards[2].angle = -Math.PI / 2;
      state.alarm = 12;
      state.phase = 'playing';
    } else if (shot === 'win') {
      p.x = 480; p.y = 200;
      p.hasKeycard = true; p.diamond = true; p.loot = 4;
      state.level.keycard.taken = true;
      state.level.loot.forEach(function (item) { item.taken = true; });
      state.vaultOpen = true;
      state.score = 1250;
      state.elapsed = 94;
      state.phase = 'won';
      state.timeText = global.HeistHud.formatTime(state.elapsed);
    }
  }

  function boot() {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    let state = makeState();
    const input = global.HeistInput.makeInput();
    global.HeistInput.attachInput(input, canvas, {
      onKey: function () { global.HeistAudio.unlockAudio(); },
      onClick: function (point) { tossCoin(state, point); },
    });

    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (shot) applyShot(state, shot);

    // Exposed for automated play-testing only: read-only live state.
    window.__heist = {
      state: function () {
        return {
          phase: state.phase,
          alarm: state.alarm,
          score: state.score,
          loot: state.player.loot,
          diamond: state.player.diamond,
          vaultOpen: state.vaultOpen,
          x: state.player.x,
          y: state.player.y,
          guards: state.guards.map(function (g) {
            return { name: g.name, state: g.state, suspicion: g.suspicion };
          }),
          cameras: state.cameras.map(function (c) { return c.seesPlayer; }),
          smokesLeft: state.smokesLeft,
          coinsLeft: state.coinsLeft,
        };
      },
    };

    function restart() {
      const keepShot = shot;
      state = makeState();
      if (keepShot) applyShot(state, keepShot);
      global.HeistHud.setStatus('Fresh night. Stay out of the cones.');
      global.HeistAudio.stopAlarmLoop();
    }

    function startGame() {
      if (state.phase === 'title') {
        state.phase = 'playing';
        global.HeistAudio.unlockAudio();
        global.HeistAudio.SFX.click();
        global.HeistHud.setStatus('The heist is on. Find the keycard first.');
      }
    }

    let last = performance.now();
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const pressed = global.HeistInput.consumePresses(input);

      if (pressed.restart) restart();
      if (pressed.mute) {
        global.HeistAudio.setMuted(!global.HeistAudio.isMuted());
        global.HeistHud.setStatus(global.HeistAudio.isMuted() ? 'Sound off.' : 'Sound on.');
      }
      if (state.phase === 'title') {
        if (pressed.interact || input.anyKey) startGame();
        if (input.clickPoint) { startGame(); input.clickPoint = null; }
      } else if (state.phase === 'playing') {
        if (pressed.pause) {
          state.phase = 'paused';
          global.HeistAudio.stopAlarmLoop();
        } else {
          if (pressed.smoke) throwSmoke(state);
          if (input.clickPoint) {
            // Clicking also starts the game from the title; in play it tosses.
            input.clickPoint = null;
          }
          updatePlaying(state, input, dt);
        }
      } else if (state.phase === 'paused') {
        if (pressed.pause) state.phase = 'playing';
      }

      global.HeistRender.render(ctx, state, now / 1000);
      global.HeistHud.updateHud(state);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.HeistMain = { makeState: makeState, applyShot: applyShot };
})(typeof window !== 'undefined' ? window : globalThis);
