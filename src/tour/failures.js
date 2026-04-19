import gsap from 'gsap';
import * as THREE from 'three';
import { createWheelSpinner } from './wheelSpin.js';

const ghostCache = new Map();
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();

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
      // Get into wheelPivot to find individual wheel nodes
      const wheelPivot = partGroup.children.find((c) => c.name === 'wheelPivot');
      const container = wheelPivot || partGroup;
      const parentScale = wheelPivot ? wheelPivot.scale.y : 1;

      const wheels = [];
      container.children.forEach((child) => {
        if (child.name && child.name.startsWith('Wheel')) {
          wheels.push(child);
        }
      });
      // Fallback: any child that isn't the axle
      if (wheels.length === 0) {
        container.children.forEach((child) => {
          if (child.name !== 'Axles' && child.children.length > 0) wheels.push(child);
        });
      }

      // Ensure world matrices are current
      carGroup.updateMatrixWorld(true);

      wheels.forEach((w, i) => {
        w.getWorldPosition(_vec3A);
        const currentWorldY = _vec3A.y;
        // Target: wheel resting on ground (world y ≈ wheel radius)
        const wheelRadius = 0.15;
        const targetWorldY = wheelRadius;
        const deltaLocal = (targetWorldY - currentWorldY) / parentScale;

        const xDir = w.position.x > 0 ? 1 : -1;

        tl.to(w.position, {
          x: w.position.x + xDir * 0.8,
          y: w.position.y + deltaLocal,
          duration: 0.6,
          ease: 'bounce.out',
        }, i * 0.12);

        tl.to(w.rotation, {
          x: w.rotation.x + 1.2,
          z: w.rotation.z + xDir * 0.6,
          duration: 0.6,
          ease: 'power2.out',
        }, i * 0.12);
      });

      // Car sags
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

      // Ensure world matrices are current
      carGroup.updateMatrixWorld(true);
      carGroup.getWorldPosition(_vec3B);

      meshes.forEach((mesh, i) => {
        mesh.getWorldPosition(_vec3A);

        // Direction from car center to mesh in world space
        const dir = _vec3A.clone().sub(_vec3B);
        if (dir.lengthSq() < 0.001) dir.set(1, 0.5, 0);
        dir.normalize();

        // Target: 30 units away from car in world space, always above
        const target = _vec3B.clone().add(dir.multiplyScalar(30));
        target.y = Math.max(target.y, 8);

        // Convert world-space target to mesh's parent's local space
        mesh.parent.updateWorldMatrix(true, false);
        mesh.parent.worldToLocal(target);

        tl.to(mesh.position, {
          x: target.x,
          y: target.y,
          z: target.z,
          duration: 1.8,
          ease: 'power2.out',
        }, i * 0.05);
        tl.to(mesh.rotation, {
          x: (Math.random() - 0.5) * 3,
          z: (Math.random() - 0.5) * 3,
          duration: 1.8,
          ease: 'power2.out',
        }, i * 0.05);
      });

      // Insurance: hide meshes after animation so nothing lingers on screen
      tl.call(() => {
        meshes.forEach((m) => { m.visible = false; });
      });

      break;
    }
  }

  return tl;
}
