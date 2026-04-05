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

export function createFailureAnimation(partKey, partGroup, carGroup, camera, wheelsGroup) {
  const tl = gsap.timeline({ paused: true });
  const spinner = wheelsGroup ? createWheelSpinner(wheelsGroup) : null;

  switch (partKey) {
    case 'engine': {
      if (spinner) spinner.reset(carGroup.position.z);
      tl.to(partGroup.position, { y: partGroup.position.y + 0.3, duration: 0.4, ease: 'power2.out' })
        .to(partGroup.position, { y: partGroup.position.y, duration: 0.4, ease: 'bounce.out' }, 0.4)
        .to(carGroup.position, {
          z: '+=0.05', yoyo: true, repeat: 8, duration: 0.08, ease: 'none',
          onUpdate: () => { if (spinner) spinner.update(carGroup.position.z); },
        }, 0.3);
      break;
    }
    case 'wheels': {
      const wheels = [];
      partGroup.children.forEach((child) => {
        if (child.type === 'Group') wheels.push(child);
      });
      wheels.forEach((w, i) => {
        tl.to(w.position, {
          y: w.position.y - 0.3,
          z: w.position.z + (w.position.z > 0 ? 0.5 : -0.5),
          duration: 0.6,
          ease: 'power2.out',
        }, i * 0.1);
      });
      tl.to(carGroup.rotation, { z: -0.05, duration: 0.4, ease: 'power2.out' }, 0.3)
        .to(carGroup.position, { y: -0.15, duration: 0.4, ease: 'bounce.out' }, 0.3);
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
      const meshes = [];
      partGroup.traverse((child) => {
        if (!child.isMesh) return;
        if (child.userData.isDecal) return;
        meshes.push(child);
      });
      tl.call(() => {
        partGroup.traverse((c) => {
          if (c.isMesh && c.userData.isDecal) c.visible = false;
        });
      }, [], 0);
      meshes.forEach((mesh, i) => {
        const dir = new gsap.utils.random(-1, 1, 0.1);
        tl.to(mesh.position, {
          x: mesh.position.x + dir * 0.6,
          y: mesh.position.y + Math.random() * 0.5,
          z: mesh.position.z + dir * 0.4,
          duration: 0.8,
          ease: 'power2.out',
        }, i * 0.05);
        tl.to(mesh.rotation, {
          x: Math.random() * 0.5,
          z: Math.random() * 0.5,
          duration: 0.8,
          ease: 'power2.out',
        }, i * 0.05);
      });
      break;
    }
  }

  return tl;
}

export function resetPart(partGroup) {
  partGroup.traverse((child) => {
    if (child.isMesh && ghostCache.has(child)) {
      const ghost = ghostCache.get(child);
      ghost.opacity = 1;
    }
  });
}
