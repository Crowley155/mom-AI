import { Howl } from 'howler';
import { duckMusic, restoreMusic } from './music.js';

const clips = {};
let _muted = false;
let _voVolume = 0.30;
let _current = null;
let _currentName = null;
let _endCallback = null;
let _safetyTimer = null;
let _playRequested = false;

function clipUrl(name) {
  return `${import.meta.env.BASE_URL}audio/vo/${name}.mp3`;
}

function _clearSafety() {
  if (_safetyTimer) { clearTimeout(_safetyTimer); _safetyTimer = null; }
}

function _onNaturalEnd() {
  restoreMusic();
  _current = null;
  _currentName = null;
  _playRequested = false;
  _clearSafety();
  const cb = _endCallback;
  _endCallback = null;
  if (cb) cb();
}

function _onForceStop() {
  restoreMusic();
  _current = null;
  _currentName = null;
  _playRequested = false;
}

/**
 * Play a VO clip (fire-and-forget). No callback — use waitForVOEnd() to gate on completion.
 */
export function playVO(name) {
  if (_muted) return;

  stopVO();
  _playRequested = true;

  if (!clips[name]) {
    clips[name] = new Howl({
      src: [clipUrl(name)],
      // Web Audio mode (default) — iOS Safari ignores volume on HTML5 Audio elements
      onplay:      () => duckMusic(),
      onend:       () => _onNaturalEnd(),
      onstop:      () => _onForceStop(),
      onloaderror: () => _onNaturalEnd(),
      onplayerror: () => _onNaturalEnd(),
    });
  }

  _current = clips[name];
  _currentName = name;
  _current.volume(_voVolume);
  _current.play();
}

/** Returns true if a VO clip is currently loaded and actively playing audio. */
export function isVOPlaying() {
  return _current != null && typeof _current.playing === 'function' && _current.playing();
}

/** Returns true if VO was requested (even if still loading / buffering). */
export function isVOActive() {
  return _playRequested || isVOPlaying();
}

/**
 * Register a callback that fires when the current clip ends naturally.
 * If nothing is playing or pending, fires immediately (next tick).
 * Includes a 60s safety-net to prevent permanent hangs.
 */
export function waitForVOEnd(cb) {
  _clearSafety();
  if (!isVOActive()) {
    _endCallback = null;
    setTimeout(cb, 0);
    return;
  }
  _endCallback = cb;
  _safetyTimer = setTimeout(() => {
    _safetyTimer = null;
    const fn = _endCallback;
    _endCallback = null;
    if (_current) { _current.stop(); }
    _current = null;
    _currentName = null;
    _playRequested = false;
    if (fn) fn();
  }, 60000);
}

export function stopVO() {
  _clearSafety();
  _endCallback = null;
  _playRequested = false;
  if (_current) {
    _current.stop();
  }
  _current = null;
  _currentName = null;
}

export function setVOMuted(val) {
  _muted = val;
  if (_muted) stopVO();
}

export function isVOMuted() {
  return _muted;
}

export function setVOVolume(vol) {
  _voVolume = vol;
  if (_current) _current.volume(_voVolume);
}
