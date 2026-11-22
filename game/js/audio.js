// Synthesized sound for THE GILDED VAULT — WebAudio only, no audio files.
// Every effect is a short oscillator or noise burst built at run time.
(function (global) {
  'use strict';

  let ctx = null;
  let muted = false;
  let alarmOsc = null;
  let alarmGain = null;

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    const c = ensureCtx();
    if (!c) return;
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(vol || 0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function noiseBurst(dur, vol, filterFreq) {
    if (muted) return;
    const c = ensureCtx();
    if (!c) return;
    const t = c.currentTime;
    const len = Math.floor(c.sampleRate * dur);
    const buffer = c.createBuffer(1, len, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq || 1200;
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol || 0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(gain).connect(c.destination);
    src.start(t);
  }

  const SFX = {
    pickup: function () { tone(880, 0.12, 'sine', 0.14); tone(1320, 0.16, 'sine', 0.1); },
    diamond: function () {
      tone(1046, 0.14, 'triangle', 0.16);
      setTimeout(function () { tone(1318, 0.14, 'triangle', 0.16); }, 90);
      setTimeout(function () { tone(1568, 0.3, 'triangle', 0.16); }, 180);
    },
    keycard: function () { tone(520, 0.1, 'square', 0.08); tone(780, 0.18, 'square', 0.08); },
    vaultOpen: function () { tone(180, 0.5, 'sawtooth', 0.08, 420); noiseBurst(0.3, 0.08, 600); },
    coin: function () { tone(2400, 0.08, 'sine', 0.12); noiseBurst(0.12, 0.1, 3000); },
    smoke: function () { noiseBurst(0.5, 0.18, 500); },
    spotted: function () { tone(660, 0.16, 'square', 0.1, 880); },
    busted: function () {
      tone(392, 0.25, 'sawtooth', 0.14);
      setTimeout(function () { tone(311, 0.25, 'sawtooth', 0.14); }, 200);
      setTimeout(function () { tone(233, 0.5, 'sawtooth', 0.14); }, 400);
    },
    win: function () {
      const notes = [523, 659, 784, 1046];
      notes.forEach(function (n, i) {
        setTimeout(function () { tone(n, 0.28, 'triangle', 0.16); }, i * 130);
      });
    },
    click: function () { tone(700, 0.05, 'sine', 0.08); },
  };

  function startAlarmLoop() {
    if (muted) return;
    const c = ensureCtx();
    if (!c || alarmOsc) return;
    alarmOsc = c.createOscillator();
    alarmGain = c.createGain();
    alarmOsc.type = 'sine';
    alarmOsc.frequency.value = 520;
    alarmGain.gain.value = 0.0;
    alarmOsc.connect(alarmGain).connect(c.destination);
    alarmOsc.start();
  }

  function setAlarmLevel(level) {
    // level 0..1 — a soft pulsing wail that grows with the alarm meter.
    if (!alarmOsc || !alarmGain || !ctx) return;
    const t = ctx.currentTime;
    alarmGain.gain.setTargetAtTime(muted ? 0 : level * 0.05, t, 0.1);
    alarmOsc.frequency.setTargetAtTime(480 + level * 220 + Math.sin(t * 6) * 40, t, 0.1);
  }

  function stopAlarmLoop() {
    if (alarmOsc) {
      try { alarmOsc.stop(); } catch (e) { /* already stopped */ }
      alarmOsc = null;
      alarmGain = null;
    }
  }

  function setMuted(m) {
    muted = !!m;
    if (muted) stopAlarmLoop();
  }

  function isMuted() { return muted; }

  function unlockAudio() { ensureCtx(); }

  global.HeistAudio = {
    SFX: SFX,
    startAlarmLoop: startAlarmLoop,
    setAlarmLevel: setAlarmLevel,
    stopAlarmLoop: stopAlarmLoop,
    setMuted: setMuted,
    isMuted: isMuted,
    unlockAudio: unlockAudio,
  };
})(typeof window !== 'undefined' ? window : globalThis);
