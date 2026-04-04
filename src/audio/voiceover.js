import { Howl } from 'howler';
import { duckMusic, restoreMusic } from './music.js';

const clips = {};
let muted = false;
let current = null;
let currentName = null;

function clipUrl(name) {
  return `${import.meta.env.BASE_URL}audio/vo/${name}.mp3`;
}

export function playVO(name) {
  if (muted) return;

  // Same clip already playing — don't restart it
  if (currentName === name && current && current.playing()) return;

  stopVO();

  if (!clips[name]) {
    clips[name] = new Howl({
      src: [clipUrl(name)],
      html5: true,
      onplay:  () => duckMusic(),
      onend:   () => { restoreMusic(); current = null; currentName = null; },
      onstop:  () => { restoreMusic(); current = null; currentName = null; },
      onloaderror: () => { restoreMusic(); current = null; currentName = null; },
    });
  }

  current = clips[name];
  currentName = name;
  current.play();
}

export function stopVO() {
  if (current) {
    current.stop();
    current = null;
    currentName = null;
  }
}

export function setVOMuted(val) {
  muted = val;
  if (muted) stopVO();
}

export function isVOMuted() {
  return muted;
}
