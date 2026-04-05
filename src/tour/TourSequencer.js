import gsap from 'gsap';
import * as THREE from 'three';
import { tourStepConfigs } from './steps.js';
import { tourSteps } from '../ui/captions.js';
import { createFailureAnimation, resetPart } from './failures.js';
import { playVO, stopVO, isVOPlaying, waitForVOEnd } from '../audio/voiceover.js';
import { createWheelSpinner } from './wheelSpin.js';

export class TourSequencer {
  constructor(camera, carGroup, parts, overlayController, defaultLookAt) {
    this.camera = camera;
    this.carGroup = carGroup;
    this.parts = parts;
    this.overlay = overlayController;
    this.currentStep = 0;
    this.isPaused = false;
    this.isManual = false;        // Step mode: user controls slide transitions
    this._waitingForNext = false; // true when paused mid-step awaiting user click
    this._voWaiting = false;      // true when GSAP is paused waiting for VO to finish
    this.timeMultiplier = 1.0;    // 1 = Normal reading pace; >1 = slower; <1 = faster
    this.masterTimeline = null;
    this.defaultLookAt = defaultLookAt || new THREE.Vector3(0, 0.6, 0);
    this.currentLookAt = this.defaultLookAt.clone();

    this.savedCarPos = carGroup.position.clone();
    this.savedCarRot = carGroup.rotation.clone();
    this.savedPartStates = {};
    this.originalMaterials = new Map();
    this._ghostMats = new Map();

    Object.entries(parts).forEach(([key, group]) => {
      const nodeStates = [];
      group.traverse((child) => {
        nodeStates.push({
          obj: child,
          pos: child.position.clone(),
          rot: child.rotation.clone(),
          scale: child.scale.clone(),
        });
        if (child.isMesh) {
          this.originalMaterials.set(child, child.material);
        }
      });
      this.savedPartStates[key] = nodeStates;
    });
  }

  start() {
    this.currentStep = 0;
    this.overlay.showTourHud();
    this.runStep(0);
  }

  runStep(index) {
    if (index >= tourStepConfigs.length) {
      this.playFinale();
      return;
    }

    this.currentStep = index;
    const config = tourStepConfigs[index];
    const caption = tourSteps[index];

    this.overlay.updateStep(index, tourStepConfigs.length);
    this.overlay.hideFailure();

    if (config.partKey === 'intro') {
      this._runIntro(index, config, caption);
      return;
    }

    const partGroup = this.parts[config.partKey];
    const isInternal = ['engine', 'steering', 'fuel', 'transmission'].includes(config.partKey);

    const tl = gsap.timeline({
      onComplete: () => {
        this.animateRestore(config.partKey, index + 1);
      },
    });
    this.masterTimeline = tl;

    tl.to(this.camera.position, {
      x: config.cameraPos.x,
      y: config.cameraPos.y,
      z: config.cameraPos.z,
      duration: 1.8,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.currentLookAt.lerp(config.lookAt, 0.08);
        this.camera.lookAt(this.currentLookAt);
      },
    });

    // ── Caption phase ─────────────────────────────────────────────────────────
    tl.call(() => {
      if (isInternal) partGroup.visible = true;
      this.ghostNonHighlighted(config.partKey);
      this.overlay.showCaption(caption.partLabel, caption.teamName, caption.teamDesc);
      this.pulsePartEmissive(partGroup);
      playVO(`step-${index + 1}-caption`);
    }, [], '-=0.3');

    // Fixed reading-time delay (always runs — guarantees advancement)
    tl.to({}, { duration: 12 * this.timeMultiplier });

    // If VO is still playing after the delay, pause and wait for it
    if (!this.isManual) {
      tl.call(() => {
        if (isVOPlaying()) {
          this._voWaiting = true;
          tl.pause();
          waitForVOEnd(() => {
            if (this.masterTimeline !== tl) return;
            this._voWaiting = false;
            if (!this.isPaused) tl.resume();
          });
        }
      });
    }

    // ── Failure phase ─────────────────────────────────────────────────────────
    tl.call(() => {
      stopVO();
      this.overlay.showFailure(caption.failureText);
      playVO(`step-${index + 1}-failure`);
    });

    const failAnim = createFailureAnimation(config.partKey, partGroup, this.carGroup, this.camera, this.parts.wheels);
    tl.add(failAnim.play(), '+=0.3');

    // Fixed reading-time delay for failure text
    tl.to({}, { duration: 8 * this.timeMultiplier });

    if (this.isManual) {
      tl.call(() => {
        this._waitingForNext = true;
        this.overlay.showNextCue();
        this.masterTimeline.pause();
      });
    } else {
      // If VO still playing after delay + animation, wait for it
      tl.call(() => {
        if (isVOPlaying()) {
          this._voWaiting = true;
          tl.pause();
          waitForVOEnd(() => {
            if (this.masterTimeline !== tl) return;
            this._voWaiting = false;
            if (!this.isPaused) tl.resume();
          });
        }
      });

      tl.call(() => {
        stopVO();
        this.overlay.hideFailure();
        this.overlay.hideCaption();
      });
    }
  }

  _runIntro(index, config, caption) {
    const ORBIT_RADIUS = 3.0;
    const ORBIT_HEIGHT = 1.2;
    const ORBIT_DURATION = 30;
    const center = config.lookAt.clone();

    const tl = gsap.timeline({
      onComplete: () => {
        stopVO();
        this.overlay.hideCaption();
        this.runStep(index + 1);
      },
    });
    this.masterTimeline = tl;

    // Show the caption immediately
    tl.call(() => {
      this.overlay.showCaption(caption.partLabel, caption.teamName, caption.teamDesc);
      playVO(`step-${index + 1}-caption`);
    }, [], 0);

    // 360-degree orbit around the car
    const orbit = { angle: 0 };
    tl.to(orbit, {
      angle: Math.PI * 2,
      duration: ORBIT_DURATION * this.timeMultiplier,
      ease: 'none',
      onUpdate: () => {
        this.camera.position.x = center.x + Math.cos(orbit.angle) * ORBIT_RADIUS;
        this.camera.position.z = center.z + Math.sin(orbit.angle) * ORBIT_RADIUS;
        this.camera.position.y = ORBIT_HEIGHT + Math.sin(orbit.angle * 2) * 0.15;
        this.camera.lookAt(center);
        this.currentLookAt.copy(center);
      },
    }, 0);

    // If VO is still playing after the orbit, wait for it
    if (!this.isManual) {
      tl.call(() => {
        if (isVOPlaying()) {
          this._voWaiting = true;
          tl.pause();
          waitForVOEnd(() => {
            if (this.masterTimeline !== tl) return;
            this._voWaiting = false;
            if (!this.isPaused) tl.resume();
          });
        }
      });
    }

    if (this.isManual) {
      tl.call(() => {
        this._waitingForNext = true;
        this.overlay.showNextCue();
        this.masterTimeline.pause();
      });
    }
  }

  ghostNonHighlighted(activePartKey) {
    Object.entries(this.parts).forEach(([key, group]) => {
      if (key === activePartKey) return;
      if (!group.visible) return;
      group.traverse((child) => {
        if (!child.isMesh) return;
        if (child.userData.isDecal) {
          child.visible = false;
          return;
        }
        if (!this._ghostMats.has(child)) {
          const ghost = child.material.clone();
          ghost.transparent = true;
          ghost.depthWrite = false;
          this._ghostMats.set(child, ghost);
        }
        const ghost = this._ghostMats.get(child);
        ghost.opacity = 0.25;
        child.material = ghost;
      });
    });
  }

  restoreAllOpacity() {
    Object.values(this.parts).forEach((group) => {
      group.traverse((child) => {
        if (!child.isMesh) return;
        if (child.userData.isDecal) {
          child.visible = true;
          return;
        }
        if (this.originalMaterials.has(child)) {
          child.material = this.originalMaterials.get(child);
        }
      });
    });
  }

  animateRestore(partKey, nextIndex) {
    const isInternal = ['engine', 'steering', 'fuel', 'transmission'].includes(partKey);

    const tl = gsap.timeline({
      onComplete: () => {
        this.fullRestore(partKey);
        this.restoreAllOpacity();
        if (isInternal) {
          this.parts[partKey].visible = false;
        }
        this.runStep(nextIndex);
      },
    });

    tl.to(this.carGroup.position, {
      x: this.savedCarPos.x,
      y: this.savedCarPos.y,
      z: this.savedCarPos.z,
      duration: 0.6,
      ease: 'power2.inOut',
    }, 0);

    tl.to(this.carGroup.rotation, {
      x: this.savedCarRot.x,
      y: this.savedCarRot.y,
      z: this.savedCarRot.z,
      duration: 0.6,
      ease: 'power2.inOut',
    }, 0);
  }

  fullRestore(partKey) {
    gsap.set(this.carGroup.position, {
      x: this.savedCarPos.x,
      y: this.savedCarPos.y,
      z: this.savedCarPos.z,
    });
    gsap.set(this.carGroup.rotation, {
      x: this.savedCarRot.x,
      y: this.savedCarRot.y,
      z: this.savedCarRot.z,
    });

    const saved = this.savedPartStates[partKey];
    if (saved) {
      saved.forEach(({ obj, pos, rot, scale }) => {
        obj.position.copy(pos);
        obj.rotation.copy(rot);
        obj.scale.copy(scale);
      });
    }
  }

  pulsePartEmissive(group) {
    group.traverse((child) => {
      if (child.isMesh && child.material.emissive) {
        gsap.to(child.material, {
          emissiveIntensity: 0.6,
          duration: 0.5,
          yoyo: true,
          repeat: 3,
          ease: 'power2.inOut',
        });
      }
    });
  }

  playFinale() {
    this.overlay.hideTourHud();
    this.overlay.hideCaption();
    this.overlay.hideFailure();

    Object.keys(this.parts).forEach((key) => this.fullRestore(key));
    this.restoreAllOpacity();
    ['engine', 'steering', 'fuel', 'transmission'].forEach((k) => {
      if (this.parts[k]) this.parts[k].visible = false;
    });

    const tl = gsap.timeline();

    tl.to(this.camera.position, {
      x: 3.5, y: 1.5, z: 3.5,
      duration: 2.0,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.currentLookAt.lerp(this.defaultLookAt, 0.05);
        this.camera.lookAt(this.currentLookAt);
      },
    });

    Object.values(this.parts).forEach((group) => {
      group.traverse((child) => {
        if (child.isMesh && child.material.emissive) {
          tl.to(child.material, {
            emissiveIntensity: 0.4,
            duration: 0.8,
            ease: 'power2.inOut',
          }, 1.5);
        }
      });
    });

    const spinner = createWheelSpinner(this.parts.wheels);
    spinner.reset(this.carGroup.position.z);

    tl.to(this.carGroup.position, {
      z: 8,
      duration: 3.5,
      ease: 'power2.in',
      onUpdate: () => spinner.update(this.carGroup.position.z),
    }, 2.5);

    tl.call(() => {
      this.overlay.showFinale();
      playVO('finale');
    }, [], 4.5);

    this.masterTimeline = tl;
  }

  pause() {
    this.isPaused = true;
    // If waiting for VO, GSAP is already paused — just record user intent
    if (this.masterTimeline && !this._voWaiting) {
      this.masterTimeline.pause();
    }
  }

  resume() {
    this.isPaused = false;
    // Don't resume GSAP yet if we're still waiting for VO to finish
    if (this.masterTimeline && !this._voWaiting) {
      this.masterTimeline.resume();
    }
  }

  togglePause() {
    if (this.isPaused) this.resume();
    else this.pause();
    return this.isPaused;
  }

  /**
   * Set reading pace multiplier.
   * 1.0 = Normal (12s caption / 8s failure)
   * 1.5 = Slow    (18s / 12s)
   * 0.5 = Fast    ( 6s /  4s)
   */
  setSpeed(multiplier) {
    this.timeMultiplier = multiplier;
  }

  /** Switch between Auto (false) and Step/Manual (true) modes. */
  setManual(manual) {
    this.isManual = manual;
    this.overlay.setPauseVisible(!manual);
    if (manual && this.isPaused) {
      // Resume so the timeline can reach the manual pause point
      this.resume();
    }
  }

  skipToNext() {
    this._voWaiting = false;
    this._waitingForNext = false;
    stopVO(); // cancels VO callback so it won't try to resume after kill
    this.overlay.hideNextCue();
    this.overlay.hideFailure();
    this.overlay.hideCaption();
    if (this.masterTimeline) this.masterTimeline.kill();
    this.animateRestore(
      tourStepConfigs[this.currentStep]?.partKey,
      this.currentStep + 1
    );
  }

  skipToPrev() {
    this._voWaiting = false;
    stopVO();
    const prevIndex = Math.max(0, this.currentStep - 1);
    if (this.masterTimeline) {
      this.masterTimeline.kill();
    }
    this.fullRestore(tourStepConfigs[this.currentStep]?.partKey);
    this.restoreAllOpacity();
    const currentKey = tourStepConfigs[this.currentStep]?.partKey;
    if (['engine', 'steering', 'fuel', 'transmission'].includes(currentKey)) {
      if (this.parts[currentKey]) this.parts[currentKey].visible = false;
    }
    gsap.set(this.carGroup.position, {
      x: this.savedCarPos.x,
      y: this.savedCarPos.y,
      z: this.savedCarPos.z,
    });
    gsap.set(this.carGroup.rotation, {
      x: this.savedCarRot.x,
      y: this.savedCarRot.y,
      z: this.savedCarRot.z,
    });
    this.overlay.hideCaption();
    this.overlay.hideFailure();
    this.runStep(prevIndex);
  }

  reset() {
    this._voWaiting = false;
    stopVO();
    if (this.masterTimeline) {
      this.masterTimeline.kill();
    }
    gsap.set(this.carGroup.position, {
      x: this.savedCarPos.x,
      y: this.savedCarPos.y,
      z: this.savedCarPos.z,
    });
    gsap.set(this.carGroup.rotation, {
      x: this.savedCarRot.x,
      y: this.savedCarRot.y,
      z: this.savedCarRot.z,
    });
    Object.keys(this.parts).forEach((key) => this.fullRestore(key));
    this.restoreAllOpacity();
    ['engine', 'steering', 'fuel', 'transmission'].forEach((k) => {
      if (this.parts[k]) this.parts[k].visible = false;
    });
    this.currentStep = 0;
    this.currentLookAt.copy(this.defaultLookAt);
  }
}
