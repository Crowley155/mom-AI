import gsap from 'gsap';

export class OverlayController {
  constructor() {
    this.introScreen = document.getElementById('intro-screen');
    this.tourHud = document.getElementById('tour-hud');
    this.finaleScreen = document.getElementById('finale-screen');
    this.failureOverlay = document.getElementById('failure-overlay');

    this.captionBox = document.getElementById('caption-box');
    this.partLabel = document.getElementById('part-label');
    this.teamName = document.getElementById('team-name');
    this.teamDesc = document.getElementById('team-desc');
    this.failureText = document.getElementById('failure-text');

    this.progressFill = document.getElementById('progress-fill');
    this.stepIndicator = document.getElementById('step-indicator');
    this.pauseBtn = document.getElementById('pause-btn');
  }

  showScreen(screen) {
    screen.classList.add('active');
  }

  hideScreen(screen) {
    screen.classList.remove('active');
  }

  hideIntro() {
    this.hideScreen(this.introScreen);
  }

  showTourHud() {
    this.showScreen(this.tourHud);
  }

  hideTourHud() {
    this.hideScreen(this.tourHud);
  }

  showCaption(partLabel, teamName, teamDesc) {
    this.partLabel.textContent = partLabel;
    this.teamName.textContent = teamName;
    this.teamDesc.textContent = teamDesc;

    gsap.fromTo(this.captionBox,
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' }
    );
  }

  hideCaption() {
    gsap.to(this.captionBox, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
    });
  }

  showFailure(text) {
    this.failureText.textContent = text;
    this.showScreen(this.failureOverlay);
    const box = document.getElementById('failure-box');
    gsap.fromTo(this.failureOverlay,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, ease: 'power2.out' }
    );
    gsap.fromTo(box,
      { scale: 0.92, y: 10 },
      { scale: 1, y: 0, duration: 0.45, ease: 'back.out(1.4)' }
    );
  }

  hideFailure() {
    gsap.to(this.failureOverlay, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => this.hideScreen(this.failureOverlay),
    });
  }

  showFinale() {
    this.showScreen(this.finaleScreen);
    gsap.fromTo(this.finaleScreen,
      { opacity: 0 },
      { opacity: 1, duration: 1.0, ease: 'power2.out' }
    );
  }

  hideFinale() {
    this.hideScreen(this.finaleScreen);
    gsap.set(this.finaleScreen, { opacity: 0 });
  }

  updateStep(index, total) {
    this.stepIndicator.textContent = `${index + 1} / ${total}`;
    const pct = ((index + 1) / total) * 100;
    gsap.to(this.progressFill, {
      width: `${pct}%`,
      duration: 0.5,
      ease: 'power2.out',
    });
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.style.opacity = index === 0 ? '0.3' : '1';
      backBtn.style.pointerEvents = index === 0 ? 'none' : 'all';
    }
  }

  updatePauseButton(isPaused) {
    this.pauseBtn.textContent = isPaused ? '▶' : '⏸';
    this.pauseBtn.title = isPaused ? 'Resume' : 'Pause';
  }
}
