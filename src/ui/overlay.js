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

    this._initDrag(document.getElementById('failure-box'));
  }

  /** Make an element draggable (mouse + touch). Resets to CSS default on re-show. */
  _initDrag(el) {
    if (!el) return;
    let startX = 0, startY = 0, origLeft = 0, origTop = 0, dragging = false;

    const onStart = (cx, cy) => {
      const rect = el.getBoundingClientRect();
      // Switch from bottom/right anchor to explicit top/left so we can drag freely
      el.style.bottom = 'auto';
      el.style.right = 'auto';
      el.style.left = rect.left + 'px';
      el.style.top = rect.top + 'px';
      origLeft = rect.left;
      origTop = rect.top;
      startX = cx;
      startY = cy;
      dragging = true;
      el.style.cursor = 'grabbing';
    };

    const onMove = (cx, cy) => {
      if (!dragging) return;
      const dx = cx - startX;
      const dy = cy - startY;
      const newLeft = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, origLeft + dx));
      const newTop = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, origTop + dy));
      el.style.left = newLeft + 'px';
      el.style.top = newTop + 'px';
    };

    const onEnd = () => {
      dragging = false;
      el.style.cursor = 'grab';
    };

    // Mouse
    el.addEventListener('mousedown', (e) => { e.preventDefault(); onStart(e.clientX, e.clientY); });
    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onEnd);

    // Touch
    el.addEventListener('touchstart', (e) => { const t = e.touches[0]; onStart(t.clientX, t.clientY); }, { passive: true });
    window.addEventListener('touchmove', (e) => { const t = e.touches[0]; onMove(t.clientX, t.clientY); }, { passive: true });
    window.addEventListener('touchend', onEnd);
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
    // Reset to default corner position so each step starts fresh
    const box = document.getElementById('failure-box');
    box.style.left = '';
    box.style.top = '';
    box.style.bottom = '';
    box.style.right = '';
    this.showScreen(this.failureOverlay);
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
