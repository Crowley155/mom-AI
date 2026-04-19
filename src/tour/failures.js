import gsap from 'gsap';
import { createWheelSpinner } from './wheelSpin.js';

const ghostCache = new Map();

function getGhostMaterial(mesh) {
  if (!ghostCache.has(mesh)) {
    const ghost = mesh.material.clone();
    ghost.transparent = true;
    ghost.depthWrite = false;
    ghostCache.set(mesh, ghost);
  }
  return ghostCache.get(mesh);
}

function setGroupOpacity(group, opacity) {
  group.traverse((child) => {
    if (child.isMesh) {
      const ghost = getGhostMaterial(child);
      ghost.opacity = opacity;
      child.material = ghost;
    }
  });
}

/**
 * @param {string} partKey
 * @param {THREE.Group} partGroup
 * @param {THREE.Group} carGroup
 * @param {THREE.Camera} camera
 * @param {THREE.Group} wheelsGroup
 * @param {Object} allParts - all part groups keyed by name (for body internals)
 */
export function createFailureAnimation(partKey, partGroup, carGroup, camera, wheelsGroup, allParts) {
  const tl = gsap.timeline({ paused: true });
  const spinner = wheelsGroup ? createWheelSpinner(wheelsGroup) : null;

  switch (partKey) {
    case 'engine': {
      if (spinner) spinner.reset(carGroup.position.z);
      const baseY = partGroup.position.y;

      // Engine rises and drops
      tl.to(partGroup.position, { y: baseY + 0.35, duration: 0.4, ease: 'power2.out' })
        .to(partGroup.position, { y: baseY, duration: 0.4, ease: 'bounce.out' }, 0.4);

      // Sputtering oscillation — decreasing amplitude
      tl.to(partGroup.position, {
        y: baseY + 0.08, yoyo: true, repeat: 5, duration: 0.1, ease: 'steps(1)',
      }, 0.9);
      tl.to(partGroup.position, {
        y: baseY + 0.03, yoyo: true, repeat: 3, duration: 0.15, ease: 'steps(1)',
      }, 1.6);

      // Rotation wobble on the engine
      tl.to(partGroup.rotation, {
        z: 0.08, yoyo: true, repeat: 5, duration: 0.1, ease: 'none',
      }, 0.9);
      tl.to(partGroup.rotation, {
        z: 0.03, yoyo: true, repeat: 3, duration: 0.15, ease: 'none',
      }, 1.6);

      // Stronger car shudder
      tl.to(carGroup.position, {
        z: '+=0.12', yoyo: true, repeat: 10, duration: 0.08, ease: 'none',
        onUpdate: () => { if (spinner) spinner.update(carGroup.position.z); },
      }, 0.5);
      tl.to(carGroup.rotation, {
        z: 0.02, yoyo: true, repeat: 6, duration: 0.1, ease: 'none',
      }, 0.5);

      // Engine dims — emissive fades to nothing
      partGroup.traverse((child) => {
        if (child.isMesh && child.material.emissive) {
          tl.to(child.material, {
            emissiveIntensity: 0, duration: 1.5, ease: 'power2.in',
          }, 1.0);
        }
      });

      break;
    }
    case 'wheels': {
      const wheelPivot = partGroup.children.find((c) => c.name === 'wheelPivot');
      const wheels = [];
      if (wheelPivot) {
        wheelPivot.children.forEach((child) => {
          if (child.name && child.name.startsWith('Wheel')) wheels.push(child);
        });
      }
      if (wheels.length === 0) {
        partGroup.children.forEach((child) => {
          if (child.type === 'Group') wheels.push(child);
        });
      }

      // Wheels scatter outward and slightly UP — never below ground
      wheels.forEach((w, i) => {
        const xDir = w.position.x > 0 ? 1 : -1;
        const zDir = w.position.z > 0 ? 1 : -1;
        tl.to(w.position, {
          x: w.position.x + xDir * 1.2,
          y: w.position.y + 0.15,
          z: w.position.z + zDir * 0.8,
          duration: 0.8,
          ease: 'power2.out',
        }, i * 0.12);
        tl.to(w.rotation, {
          z: w.rotation.z + xDir * 0.4,
          duration: 0.8,
          ease: 'power2.out',
        }, i * 0.12);
      });

      // Car tilts — stays above ground (no y drop)
      tl.to(carGroup.rotation, { z: -0.06, duration: 0.5, ease: 'power2.out' }, 0.3);
      tl.to(carGroup.rotation, { x: 0.03, duration: 0.5, ease: 'power2.out' }, 0.3);

      break;
    }
    case 'steering': {
      const startRotY = carGroup.rotation.y;
      const startX = carGroup.position.x;
      const startZ = carGroup.position.z;
      const R = 1.2;
      const centerX = startX + R;
      const centerZ = startZ;

      tl.call(() => setGroupOpacity(partGroup, 0.15), [], 0);

      if (camera) {
        tl.to(camera.position, {
          x: centerX + 2.0, y: 2.0, z: centerZ + 5.0,
          duration: 1.4,
          ease: 'power2.inOut',
          onUpdate: () => camera.lookAt(carGroup.position),
        }, 0.1);
      }

      const donut = { angle: 0 };
      let prevAngle = 0;
      tl.to(donut, {
        angle: Math.PI * 4,
        duration: 4.0,
        ease: 'power1.in',
        onUpdate: () => {
          carGroup.rotation.y = startRotY + donut.angle;
          carGroup.position.x = startX + R * (1 - Math.cos(donut.angle));
          carGroup.position.z = startZ + R * Math.sin(donut.angle);
          if (camera) camera.lookAt(carGroup.position);

          if (spinner) {
            const dAngle = donut.angle - prevAngle;
            spinner.updateArc(R * dAngle);
            prevAngle = donut.angle;
          }
        },
        onComplete: () => {
          carGroup.rotation.y = startRotY;
          carGroup.position.x = startX;
          carGroup.position.z = startZ;
        },
      }, 0.3);

      break;
    }
    case 'fuel': {
      if (spinner) spinner.reset(carGroup.position.z);
      tl.call(() => setGroupOpacity(partGroup, 0.15), [], 0)
        .to(carGroup.position, {
          z: '+=0.04',
          yoyo: true,
          repeat: 4,
          duration: 0.15,
          ease: 'steps(2)',
          onUpdate: () => { if (spinner) spinner.update(carGroup.position.z); },
        }, 0.3)
        .to(carGroup.position, {
          z: '+=0.02',
          yoyo: true,
          repeat: 2,
          duration: 0.3,
          ease: 'steps(2)',
          onUpdate: () => { if (spinner) spinner.update(carGroup.position.z); },
        }, 1.0);
      break;
    }
    case 'transmission': {
      if (spinner) spinner.reset(carGroup.position.z);
      const spinUpdate = () => { if (spinner) spinner.update(carGroup.position.z); };
      tl.call(() => setGroupOpacity(partGroup, 0.15), [], 0)
        .to(carGroup.position, {
          z: '+=0.15', duration: 0.2, ease: 'power4.out', onUpdate: spinUpdate,
        }, 0.2)
        .to(carGroup.position, {
          z: '-=0.15', duration: 0.5, ease: 'power1.in', onUpdate: spinUpdate,
        }, 0.5)
        .to(carGroup.position, {
          z: '+=0.1', duration: 0.15, ease: 'power4.out', onUpdate: spinUpdate,
        }, 1.1)
        .to(carGroup.position, {
          z: '-=0.1', duration: 0.4, ease: 'power1.in', onUpdate: spinUpdate,
        }, 1.3);
      break;
    }
    case 'body': {
      // Show internal parts so the car isn't hollow
      const internalKeys = ['engine', 'steering', 'fuel', 'transmission'];
      if (allParts) {
        tl.call(() => {
          internalKeys.forEach((k) => {
            if (allParts[k]) {
              allParts[k].visible = true;
              setGroupOpacity(allParts[k], 0.5);
            }
          });
        }, [], 0);
      }

      // Hide decals
      tl.call(() => {
        partGroup.traverse((c) => {
          if (c.isMesh && c.userData.isDecal) c.visible = false;
        });
      }, [], 0);

      // Collect body meshes for scatter
      const meshes = [];
      partGroup.traverse((child) => {
        if (!child.isMesh) return;
        if (child.userData.isDecal) return;
        meshes.push(child);
      });

      // Scale offsets to compensate for the 0.5x pivot scale
      const SCALE_COMP = 2.0;

      meshes.forEach((mesh, i) => {
        const dir = gsap.utils.random(-1, 1, 0.1) || 0.5;
        tl.to(mesh.position, {
          x: mesh.position.x + dir * 1.2 * SCALE_COMP,
          y: mesh.position.y + Math.random() * 1.0 * SCALE_COMP,
          z: mesh.position.z + dir * 0.8 * SCALE_COMP,
          duration: 1.2,
          ease: 'power2.out',
        }, i * 0.08);
        tl.to(mesh.rotation, {
          x: (Math.random() - 0.5) * 1.0,
          z: (Math.random() - 0.5) * 1.0,
          duration: 1.2,
          ease: 'power2.out',
        }, i * 0.08);
      });
      break;
    }
  }

  return tl;
}
