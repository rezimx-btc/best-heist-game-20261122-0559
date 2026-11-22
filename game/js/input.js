// Keyboard and mouse input for THE GILDED VAULT.
// WASD/arrows move, Shift sneaks, E interacts, Q smoke, P pause, R restart,
// M mute. Clicking the canvas tosses a coin at that spot.
(function (global) {
  'use strict';

  function makeInput() {
    return {
      up: false, down: false, left: false, right: false,
      sneak: false,
      interactPressed: false,
      smokePressed: false,
      pausePressed: false,
      restartPressed: false,
      mutePressed: false,
      clickPoint: null,   // canvas coordinates of the latest click, or null
      anyKey: false,
    };
  }

  function attachInput(input, canvas, callbacks) {
    const keys = {};
    const KEYMAP = {
      KeyW: 'up', ArrowUp: 'up',
      KeyS: 'down', ArrowDown: 'down',
      KeyA: 'left', ArrowLeft: 'left',
      KeyD: 'right', ArrowRight: 'right',
      ShiftLeft: 'sneak', ShiftRight: 'sneak',
    };

    function applyKeys() {
      input.up = !!keys.up;
      input.down = !!keys.down;
      input.left = !!keys.left;
      input.right = !!keys.right;
      input.sneak = !!keys.sneak;
    }

    window.addEventListener('keydown', function (e) {
      if (e.code in KEYMAP) {
        keys[KEYMAP[e.code]] = true;
        applyKeys();
        e.preventDefault();
      } else if (e.code === 'KeyE' && !e.repeat) {
        input.interactPressed = true;
      } else if (e.code === 'KeyQ' && !e.repeat) {
        input.smokePressed = true;
      } else if (e.code === 'KeyP' && !e.repeat) {
        input.pausePressed = true;
      } else if (e.code === 'KeyR' && !e.repeat) {
        input.restartPressed = true;
      } else if (e.code === 'KeyM' && !e.repeat) {
        input.mutePressed = true;
      }
      input.anyKey = true;
      if (callbacks && callbacks.onKey) callbacks.onKey(e.code);
    });

    window.addEventListener('keyup', function (e) {
      if (e.code in KEYMAP) {
        keys[KEYMAP[e.code]] = false;
        applyKeys();
        e.preventDefault();
      }
    });

    canvas.addEventListener('mousedown', function (e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      input.clickPoint = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
      if (callbacks && callbacks.onClick) callbacks.onClick(input.clickPoint);
    });

    window.addEventListener('blur', function () {
      for (const k in keys) keys[k] = false;
      applyKeys();
    });
  }

  // Edge-triggered presses are consumed once per frame by the game loop.
  function consumePresses(input) {
    const pressed = {
      interact: input.interactPressed,
      smoke: input.smokePressed,
      pause: input.pausePressed,
      restart: input.restartPressed,
      mute: input.mutePressed,
    };
    input.interactPressed = false;
    input.smokePressed = false;
    input.pausePressed = false;
    input.restartPressed = false;
    input.mutePressed = false;
    return pressed;
  }

  global.HeistInput = {
    makeInput: makeInput,
    attachInput: attachInput,
    consumePresses: consumePresses,
  };
})(typeof window !== 'undefined' ? window : globalThis);
