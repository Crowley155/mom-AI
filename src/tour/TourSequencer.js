import gsap from 'gsap';
import * as THREE from 'three';
import { tourStepConfigs } from './steps.js';
import { tourSteps } from '../ui/captions.js';
import { createFailureAnimation } from './failures.js';
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
    this.isManual = false;
    this._waitingForNext = false;
    this._manualPhase = 0; // 0=running, 1=paused-after-caption, 2=paused-after-failure
    this._voWaiting = false;
    this.timeMultiplier = 1.0;
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
    this._manualPhase = 0;
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

    const tl = gsap.timeline();
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

    if (this.isManual) {
      tl.call(() => {
        this._manualPhase = 1;
        this._waitingForNext = true;
        this.overlay.showNextCue();
        this.masterTimeline.pause();
      });
    } else {
      tl.to({}, { duration: 12 * this.timeMultiplier });
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

    const failAnim = createFailureAnimation(config.partKey, partGroup, this.carGroup, this.camera, this.parts.wheels, this.parts);
    tl.add(failAnim, '+=0.3');

    if (this.isManual) {
      tl.call(() => {
        this._manualPhase = 2;
        this._waitingForNext = true;
        this.overlay.showNextCue();
        this.masterTimeline.pause();
        // Timeline stops here — skipToNext handles restore + advance
      });
    } else {
      tl.to({}, { duration: 8 * this.timeMultiplier });
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
        this.animateRestore(config.partKey, index + 1);
      });
    }
  }

  _runIntro(index, config, caption) {
    const ORBIT_RADIUS = 3.0;
    const ORBIT_HEIGHT = 1.2;
    const center = config.lookAt.clone();

    const tl = gsap.timeline();
    this.masterTimeline = tl;

    tl.call(() => {
      this.overlay.showCaption(caption.partLabel, caption.teamName, caption.teamDesc);
      playVO(`step-${index + 1}-caption`);
    }, [], 0);

    const orbit = { angle: 0 };
    tl.to(orbit, {
      angle: Math.PI * 2,
      duration: 30 * this.timeMultiplier,
      ease: 'none',
      repeat: -1,
      onUpdate: () => {
        this.camera.position.x = center.x + Math.cos(orbit.angle) * ORBIT_RADIUS;
        this.camera.position.z = center.z + Math.sin(orbit.angle) * ORBIT_RADIUS;
        this.camera.position.y = ORBIT_HEIGHT + Math.sin(orbit.angle * 2) * 0.15;
        this.camera.lookAt(center);
        this.currentLookAt.copy(center);
      },
    }, 0);

    if (!this.isManual) {
      const autoTl = gsap.timeline({
        delay: 30 * this.timeMultiplier,
        onComplete: () => {
          tl.kill();
          stopVO();
          this.overlay.hideCaption();
          this.runStep(index + 1);
        },
      });
      autoTl.call(() => {
        if (isVOPlaying()) {
          autoTl.pause();
          waitForVOEnd(() => {
            if (this.masterTimeline !== tl) return;
            autoTl.resume();
          });
        }
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
    const saved = this.savedPartStates[partKey];

    const tl = gsap.timeline({
      onComplete: () => {
        this.fullRestore(partKey);
        this.restoreAllOpacity();
        if (isInternal) {
          this.parts[partKey].visible = false;
        }
        if (partKey === 'body') {
          ['engine', 'steering', 'fuel', 'transmission'].forEach((k) => {
            if (this.parts[k]) this.parts[k].visible = false;
          });
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

    if (saved) {
      saved.forEach(({ obj, pos, rot, scale }) => {
        tl.to(obj.position, {
          x: pos.x, y: pos.y, z: pos.z,
          duration: 0.6, ease: 'power2.inOut',
        }, 0);
        tl.to(obj.rotation, {
          x: rot.x, y: rot.y, z: rot.z,
          duration: 0.6, ease: 'power2.inOut',
        }, 0);
        tl.to(obj.scale, {
          x: scale.x, y: scale.y, z: scale.z,
          duration: 0.6, ease: 'power2.inOut',
        }, 0);
      });
    }
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
        gsap.killTweensOf(child.material);
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
    if (this.masterTimeline && !this._voWaiting) {
      this.masterTimeline.pause();
    }
  }

  resume() {
    this.isPaused = false;
    if (this.masterTimeline && !this._voWaiting) {
      this.masterTimeline.resume();
    }
  }

  togglePause() {
    if (this.isPaused) this.resume();
    else this.pause();
    return this.isPaused;
  }

  setSpeed(multiplier) {
    this.timeMultiplier = multiplier;
  }

  setManual(manual) {
    this.isManual = manual;
    this.overlay.setPauseVisible(!manual);
    if (manual && this.isPaused) {
      this.resume();
    }
  }

  skipToNext() {
    if (this._waitingForNext && this.masterTimeline) {
      this._waitingForNext = false;
      stopVO();
      this.overlay.hideNextCue();

      if (this._manualPhase === 1) {
        // Paused after caption → resume to play failure
        this._manualPhase = 0;
        this.masterTimeline.resume();
        return;
      }

      if (this._manualPhase === 2) {
        // Paused after failure → kill timeline, restore, advance
        this._manualPhase = 0;
        this.masterTimeline.kill();
        this.overlay.hideFailure();
        this.overlay.hideCaption();
        this.animateRestore(
          tourStepConfigs[this.currentStep]?.partKey,
          this.currentStep + 1,
        );
        return;
      }
    }

    // Fallback: hard skip (intro, or not at a pause point)
    this._voWaiting = false;
    this._waitingForNext = false;
    this._manualPhase = 0;
    stopVO();
    this.overlay.hideNextCue();
    this.overlay.hideFailure();
    this.overlay.hideCaption();
    if (this.masterTimeline) this.masterTimeline.kill();

    if (tourStepConfigs[this.currentStep]?.partKey === 'intro') {
      this.runStep(this.currentStep + 1);
      return;
    }

    this.animateRestore(
      tourStepConfigs[this.currentStep]?.partKey,
      this.currentStep + 1
    );
  }

  skipToPrev() {
    this._voWaiting = false;
    this._manualPhase = 0;
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
    if (currentKey === 'body') {
      ['engine', 'steering', 'fuel', 'transmission'].forEach((k) => {
        if (this.parts[k]) this.parts[k].visible = false;
      });
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
    this._manualPhase = 0;
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
