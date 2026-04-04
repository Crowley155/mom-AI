import gsap from 'gsap';
import * as THREE from 'three';
import { tourStepConfigs } from './steps.js';
import { tourSteps } from '../ui/captions.js';
import { createFailureAnimation, resetPart } from './failures.js';

export class TourSequencer {
  constructor(camera, carGroup, parts, overlayController, defaultLookAt) {
    this.camera = camera;
    this.carGroup = carGroup;
    this.parts = parts;
    this.overlay = overlayController;
    this.currentStep = 0;
    this.isPaused = false;
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
    const partGroup = this.parts[config.partKey];

    this.overlay.updateStep(index, tourStepConfigs.length);
    this.overlay.hideFailure();

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

    tl.call(() => {
      if (isInternal) {
        partGroup.visible = true;
      }
      this.ghostNonHighlighted(config.partKey);
      this.overlay.showCaption(caption.partLabel, caption.teamName, caption.teamDesc);
      this.pulsePartEmissive(partGroup);
    }, [], '-=0.3');

    tl.to({}, { duration: 1.8 });

    tl.call(() => {
      this.overlay.showFailure(caption.failureText);
    });

    const failAnim = createFailureAnimation(config.partKey, partGroup, this.carGroup);
    tl.add(failAnim.play(), '+=0.3');

    tl.to({}, { duration: 1.8 });

    tl.call(() => {
      this.overlay.hideFailure();
      this.overlay.hideCaption();
    });
  }

  ghostNonHighlighted(activePartKey) {
    Object.entries(this.parts).forEach(([key, group]) => {
      if (key === activePartKey) return;
      if (!group.visible) return;
      group.traverse((child) => {
        if (!child.isMesh) return;
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
        if (child.isMesh && this.originalMaterials.has(child)) {
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
      x: 5, y: 2.5, z: 5,
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

    tl.to(this.carGroup.position, {
      x: 8,
      duration: 3.5,
      ease: 'power2.in',
    }, 2.5);

    tl.call(() => {
      this.overlay.showFinale();
    }, [], 4.5);

    this.masterTimeline = tl;
  }

  pause() {
    if (this.masterTimeline) {
      this.masterTimeline.pause();
      this.isPaused = true;
    }
  }

  resume() {
    if (this.masterTimeline) {
      this.masterTimeline.resume();
      this.isPaused = false;
    }
  }

  togglePause() {
    if (this.isPaused) this.resume();
    else this.pause();
    return this.isPaused;
  }

  skipToNext() {
    if (this.masterTimeline) {
      this.masterTimeline.progress(1);
    }
  }

  skipToPrev() {
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
