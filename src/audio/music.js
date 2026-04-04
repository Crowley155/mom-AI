import { Howl } from 'howler';

let bgMusic = null;

export function initMusic() {
  bgMusic = new Howl({
    src: ['https://cdn.pixabay.com/audio/2022/10/25/audio_33843be78c.mp3'],
    loop: true,
    volume: 0.3,
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
  if (bgMusic) {
    bgMusic.volume(vol);
  }
}
