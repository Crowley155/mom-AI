import gsap from 'gsap';

// Persists drag positions across slides for the session
const _savedPos = {
  captionBox: null,  // { left, top } strings or null → use CSS default
  failureBox: null,
};

export class OverlayController {
  constructor() {
    this.introScreen    = document.getElementById('intro-screen');
    this.tourHud        = document.getElementById('tour-hud');
    this.finaleScreen   = document.getElementById('finale-screen');
    this.failureOverlay = document.getElementById('failure-overlay');

    this.captionBox  = document.getElementById('caption-box');
    this.partLabel   = document.getElementById('part-label');
    this.teamName    = document.getElementById('team-name');
    this.teamDesc    = document.getElementById('team-desc');
    this.failureText = document.getElementById('failure-text');
    this.failureBox  = document.getElementById('failure-box');

    this.progressFill   = document.getElementById('progress-fill');
    this.stepIndicator  = document.getElementById('step-indicator');
    this.pauseBtn       = document.getElementById('pause-btn');
    this.skipBtn        = document.getElementById('skip-btn');

    this._initDrag(this.captionBox, 'captionBox');
    this._initDrag(this.failureBox, 'failureBox');
  }

  // ─── Drag support ─────────────────────────────────────────────────────────

  /**
   * Makes `el` freely draggable (mouse + touch).
   * Saves final position in _savedPos[posKey] so the next show()
   * restores where the user left it.
   */
  _initDrag(el, posKey) {
    if (!el) return;
    let sx = 0, sy = 0, ox = 0, oy = 0, active = false;

    const begin = (cx, cy) => {
      const r = el.getBoundingClientRect();
      // Detach from CSS anchor (bottom/right) and use explicit top/left
      el.style.bottom = 'auto';
      el.style.right  = 'auto';
      el.style.left   = r.left + 'px';
      el.style.top    = r.top  + 'px';
      ox = r.left; oy = r.top;
      sx = cx;     sy = cy;
      active = true;
      el.style.cursor = 'grabbing';
    };

    const move = (cx, cy) => {
      if (!active) return;
      const maxX = window.innerWidth  - el.offsetWidth;
      const maxY = window.innerHeight - el.offsetHeight;
      el.style.left = Math.max(0, Math.min(maxX, ox + (cx - sx))) + 'px';
      el.style.top  = Math.max(0, Math.min(maxY, oy + (cy - sy))) + 'px';
    };

    const end = () => {
      if (!active) return;
      active = false;
      el.style.cursor = 'grab';
      _savedPos[posKey] = { left: el.style.left, top: el.style.top };
    };

    el.addEventListener('mousedown',  (e) => { e.preventDefault(); begin(e.clientX, e.clientY); });
    window.addEventListener('mousemove', (e) => move(e.clientX, e.clientY));
    window.addEventListener('mouseup', end);

    el.addEventListener('touchstart', (e) => { const t = e.touches[0]; begin(t.clientX, t.clientY); }, { passive: true });
    window.addEventListener('touchmove', (e) => { const t = e.touches[0]; move(t.clientX, t.clientY); }, { passive: true });
    window.addEventListener('touchend', end);
  }

  /** Applies a saved drag position or falls back to CSS anchors. */
  _restorePos(el, posKey, defaults = {}) {
    const saved = _savedPos[posKey];
    if (saved) {
      el.style.left   = saved.left;
      el.style.top    = saved.top;
      el.style.bottom = 'auto';
      el.style.right  = 'auto';
    } else {
      el.style.left   = defaults.left   ?? '';
      el.style.top    = defaults.top    ?? '';
      el.style.bottom = defaults.bottom ?? '';
      el.style.right  = defaults.right  ?? '';
    }
  }

  // ─── Screen helpers ───────────────────────────────────────────────────────

  showScreen(screen) { screen.classList.add('active'); }
  hideScreen(screen) { screen.classList.remove('active'); }

  hideIntro()  { this.hideScreen(this.introScreen); }
  showTourHud(){ this.showScreen(this.tourHud); }
  hideTourHud(){ this.hideScreen(this.tourHud); }

  // ─── Caption ──────────────────────────────────────────────────────────────

  showCaption(partLabel, teamName, teamDesc) {
    this.partLabel.textContent = partLabel;
    this.teamName.textContent  = teamName;
    this.teamDesc.textContent  = teamDesc;

    this._restorePos(this.captionBox, 'captionBox', { bottom: '5.5rem', left: '1.5rem' });

    gsap.fromTo(this.captionBox,
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' }
    );
  }

  hideCaption() {
    gsap.to(this.captionBox, { opacity: 0, duration: 0.3, ease: 'power2.in' });
  }

  // ─── Failure popup ────────────────────────────────────────────────────────

  showFailure(text) {
    this.failureText.textContent = text;
    this._restorePos(this.failureBox, 'failureBox', { bottom: '5.5rem', right: '1.5rem' });
    this.showScreen(this.failureOverlay);

    gsap.fromTo(this.failureOverlay,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, ease: 'power2.out' }
    );
    gsap.fromTo(this.failureBox,
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

  // ─── Manual mode "click to continue" cue ─────────────────────────────────

  showNextCue() {
    if (this.skipBtn) this.skipBtn.classList.add('awaiting-next');
  }

  hideNextCue() {
    if (this.skipBtn) this.skipBtn.classList.remove('awaiting-next');
  }

  // ─── Finale ───────────────────────────────────────────────────────────────

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

  // ─── HUD state ────────────────────────────────────────────────────────────

  updateStep(index, total) {
    this.stepIndicator.textContent = `${index + 1} / ${total}`;
    gsap.to(this.progressFill, {
      width: `${((index + 1) / total) * 100}%`,
      duration: 0.5,
      ease: 'power2.out',
    });
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.style.opacity       = index === 0 ? '0.3' : '1';
      backBtn.style.pointerEvents = index === 0 ? 'none' : 'all';
    }
  }

  updatePauseButton(isPaused) {
    this.pauseBtn.textContent = isPaused ? '▶' : '⏸';
    this.pauseBtn.title       = isPaused ? 'Resume' : 'Pause';
  }

  /** Show/hide the pause button (irrelevant in Step/Manual mode). */
  setPauseVisible(visible) {
    if (this.pauseBtn) {
      this.pauseBtn.style.display      = visible ? 'flex' : 'none';
      this.pauseBtn.style.pointerEvents = visible ? 'all'  : 'none';
    }
  }
}
