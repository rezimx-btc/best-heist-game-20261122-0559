// DOM HUD for THE GILDED VAULT — alarm meter, score, loot, guard roster,
// tools and the status line, kept in sync with the game state each frame.
(function (global) {
  'use strict';

  function el(id) { return document.getElementById(id); }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function updateHud(state) {
    const alarmFill = el('alarm-fill');
    const alarmValue = el('alarm-value');
    if (alarmFill) alarmFill.style.width = Math.round(state.alarm) + '%';
    if (alarmValue) alarmValue.textContent = Math.round(state.alarm) + '%';

    const score = el('score-value');
    if (score) score.textContent = String(state.score);

    const loot = el('loot-count');
    if (loot) loot.textContent = state.player.loot + ' / 4';

    const goal = el('goal-status');
    if (goal) {
      if (state.player.diamond) goal.textContent = 'Diamond secured — reach the exit!';
      else if (state.vaultOpen) goal.textContent = 'Vault open — grab the Sunheart Diamond!';
      else if (state.player.hasKeycard) goal.textContent = 'Keycard found — unlock the vault door.';
      else goal.textContent = 'Find the keycard, crack the vault, take the Sunheart Diamond.';
    }

    const vault = el('vault-status');
    if (vault) {
      vault.textContent = state.vaultOpen
        ? 'Vault: OPEN'
        : (state.player.hasKeycard ? 'Vault: LOCKED — touch the door to open it' : 'Vault: LOCKED — needs the keycard');
    }

    const exit = el('exit-status');
    if (exit) {
      exit.textContent = state.player.diamond
        ? 'Exit: OPEN — the service door, south-east'
        : 'Exit: the service door, south-east (needs the diamond)';
    }

    const roster = el('guard-roster');
    if (roster) {
      roster.innerHTML = state.guards.map(function (g) {
        const word = global.HeistGuard.guardStateWord(g);
        const cls = word === 'ALERT' ? 'alert' : (word === 'SUSPICIOUS' ? 'suspicious' : 'calm');
        return '<div class="guard-row"><span>' + g.name + '</span>' +
          '<span class="guard-state ' + cls + '">' + word + '</span></div>';
      }).join('') + state.cameras.map(function (c) {
        const word = c.seesPlayer ? 'SPOTTING YOU' : 'SWEEPING';
        const cls = c.seesPlayer ? 'alert' : 'calm';
        return '<div class="guard-row"><span>' + c.name + '</span>' +
          '<span class="guard-state ' + cls + '">' + word + '</span></div>';
      }).join('');
    }

    const smoke = el('smoke-count');
    if (smoke) smoke.textContent = 'Smoke bombs: ' + state.smokesLeft + ' (Q)';
    const coins = el('coin-count');
    if (coins) coins.textContent = 'Coins: ' + state.coinsLeft + ' (click to toss)';
    const timeLine = el('time-line');
    if (timeLine) timeLine.textContent = 'Time: ' + formatTime(state.elapsed);
    const rating = el('rating-line');
    if (rating) rating.textContent = 'Rating so far: ' + state.rating + (state.seen ? ' (seen)' : ' (never seen)');
  }

  function setStatus(text) {
    const line = el('status-line');
    if (line) line.textContent = text;
  }

  global.HeistHud = {
    updateHud: updateHud,
    setStatus: setStatus,
    formatTime: formatTime,
  };
})(typeof window !== 'undefined' ? window : globalThis);
