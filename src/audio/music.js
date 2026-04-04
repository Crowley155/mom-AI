import { Howl } from 'howler';

let bgMusic = null;
let _userVolume = 0.3; // tracks slider value so restoreMusic knows the target

export function initMusic() {
  bgMusic = new Howl({
    src: [`${import.meta.env.BASE_URL}audio/background.mp3`],
    loop: true,
    volume: _userVolume,
    html5: true,
  });
}

export function playMusic() {
  if (bgMusic && !bgMusic.playing()) {
    bgMusic.play();
  }
}

export function pauseMusic() {
  if (bgMusic && bgMusic.playing()) {
    bgMusic.pause();
  }
}

export function stopMusic() {
  if (bgMusic) {
    bgMusic.stop();
  }
}

export function fadeOutMusic(duration = 1000) {
  if (bgMusic) {
    bgMusic.fade(bgMusic.volume(), 0, duration);
  }
}

export function setVolume(vol) {
  _userVolume = vol;
  if (bgMusic) {
    bgMusic.volume(vol);
  }
}

/** Lower BGM volume while VO is speaking */
export function duckMusic() {
  if (bgMusic && bgMusic.playing()) {
    bgMusic.fade(bgMusic.volume(), _userVolume * 0.18, 400);
  }
}

/** Restore BGM to user-set level after VO finishes */
export function restoreMusic() {
  if (bgMusic && bgMusic.playing()) {
    bgMusic.fade(bgMusic.volume(), _userVolume, 600);
  }
}
