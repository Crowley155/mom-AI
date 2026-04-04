import gsap from 'gsap';

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

export function createFailureAnimation(partKey, partGroup, carGroup) {
  const tl = gsap.timeline({ paused: true });

  switch (partKey) {
    case 'engine': {
      tl.to(partGroup.position, { y: partGroup.position.y + 0.5, duration: 0.5, ease: 'power2.out' })
        .to(partGroup, { visible: true, duration: 0 }, 0)
        .call(() => setGroupOpacity(partGroup, 0.2), [], 0.3)
        .to(carGroup.position, { x: '+=0.03', yoyo: true, repeat: 6, duration: 0.1, ease: 'none' }, 0.5);
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
      tl.call(() => setGroupOpacity(partGroup, 0.15), [], 0)
        .to(carGroup.rotation, {
          y: carGroup.rotation.y + 0.3,
          duration: 1.5,
          ease: 'power1.inOut',
        }, 0.2)
        .to(carGroup.position, { x: '+=0.4', duration: 1.5, ease: 'power1.inOut' }, 0.2);
      break;
    }
    case 'fuel': {
      tl.call(() => setGroupOpacity(partGroup, 0.15), [], 0)
        .to(carGroup.position, {
          x: '+=0.04',
          yoyo: true,
          repeat: 4,
          duration: 0.15,
          ease: 'steps(2)',
        }, 0.3)
        .to(carGroup.position, {
          x: '+=0.02',
          yoyo: true,
          repeat: 2,
          duration: 0.3,
          ease: 'steps(2)',
        }, 1.0);
      break;
    }
    case 'transmission': {
      tl.call(() => setGroupOpacity(partGroup, 0.15), [], 0)
        .to(carGroup.position, {
          x: '+=0.15',
          duration: 0.2,
          ease: 'power4.out',
        }, 0.2)
        .to(carGroup.position, {
          x: '-=0.15',
          duration: 0.5,
          ease: 'power1.in',
        }, 0.5)
        .to(carGroup.position, {
          x: '+=0.1',
          duration: 0.15,
          ease: 'power4.out',
        }, 1.1)
        .to(carGroup.position, {
          x: '-=0.1',
          duration: 0.4,
          ease: 'power1.in',
        }, 1.3);
      break;
    }
    case 'body': {
      const meshes = [];
      partGroup.traverse((child) => {
        if (child.isMesh) meshes.push(child);
      });
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
