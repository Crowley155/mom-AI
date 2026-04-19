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

export function createFailureAnimation(partKey, partGroup, carGroup, camera, wheelsGroup, allParts) {
  const tl = gsap.timeline();
  const spinner = wheelsGroup ? createWheelSpinner(wheelsGroup) : null;

  switch (partKey) {
    case 'engine': {
      if (spinner) spinner.reset(carGroup.position.z);
      const baseY = partGroup.position.y;

      tl.to(partGroup.position, { y: baseY + 0.35, duration: 0.4, ease: 'power2.out' })
        .to(partGroup.position, { y: baseY, duration: 0.4, ease: 'bounce.out' }, 0.4);

      tl.to(partGroup.position, {
        y: baseY + 0.08, yoyo: true, repeat: 5, duration: 0.1, ease: 'steps(1)',
      }, 0.9);
      tl.to(partGroup.position, {
        y: baseY + 0.03, yoyo: true, repeat: 3, duration: 0.15, ease: 'steps(1)',
      }, 1.6);

      tl.to(partGroup.rotation, {
        z: 0.08, yoyo: true, repeat: 5, duration: 0.1, ease: 'none',
      }, 0.9);
      tl.to(partGroup.rotation, {
        z: 0.03, yoyo: true, repeat: 3, duration: 0.15, ease: 'none',
      }, 1.6);

      tl.to(carGroup.position, {
        z: '+=0.12', yoyo: true, repeat: 10, duration: 0.08, ease: 'none',
        onUpdate: () => { if (spinner) spinner.update(carGroup.position.z); },
      }, 0.5);
      tl.to(carGroup.rotation, {
        z: 0.02, yoyo: true, repeat: 6, duration: 0.1, ease: 'none',
      }, 0.5);

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
      // Collect wheel groups
      const wheels = [];
      partGroup.children.forEach((child) => {
        if (child.type === 'Group') wheels.push(child);
      });

      // Wheels simply fall off — drop to ground with a slight outward wobble
      wheels.forEach((w, i) => {
        const xDir = w.position.x > 0 ? 1 : -1;
        tl.to(w.position, {
          x: w.position.x + xDir * 0.4,
          y: -0.35,
          duration: 0.5,
          ease: 'bounce.out',
        }, i * 0.15);
        // Tilt as they fall
        tl.to(w.rotation, {
          x: w.rotation.x + 0.8,
          z: w.rotation.z + xDir * 0.5,
          duration: 0.5,
          ease: 'power2.out',
        }, i * 0.15);
      });

      // Car sags slightly
      tl.to(carGroup.rotation, { z: -0.04, duration: 0.6, ease: 'power2.out' }, 0.3);
      tl.to(carGroup.rotation, { x: 0.02, duration: 0.6, ease: 'power2.out' }, 0.3);

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
      // Show internal parts so the car isn't hollow when shell flies off
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

      tl.call(() => {
        partGroup.traverse((c) => {
          if (c.isMesh && c.userData.isDecal) c.visible = false;
        });
      }, [], 0);

      const meshes = [];
      partGroup.traverse((child) => {
        if (!child.isMesh) return;
        if (child.userData.isDecal) return;
        meshes.push(child);
      });

      // Panels explode off-screen — huge offsets so they leave the viewport entirely
      const SCALE_COMP = 2.0;
      meshes.forEach((mesh, i) => {
        const angle = (i / Math.max(meshes.length, 1)) * Math.PI * 2;
        const xOff = Math.cos(angle) * 12 * SCALE_COMP;
        const zOff = Math.sin(angle) * 12 * SCALE_COMP;
        const yOff = (3 + Math.random() * 4) * SCALE_COMP;

        tl.to(mesh.position, {
          x: mesh.position.x + xOff,
          y: mesh.position.y + yOff,
          z: mesh.position.z + zOff,
          duration: 0.8,
          ease: 'power3.out',
        }, i * 0.04);
        tl.to(mesh.rotation, {
          x: (Math.random() - 0.5) * 3,
          z: (Math.random() - 0.5) * 3,
          duration: 0.8,
          ease: 'power2.out',
        }, i * 0.04);
      });
      break;
    }
  }

  return tl;
}
