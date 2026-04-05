import * as THREE from 'three';

const COUNT    = 180;
const SPREAD_X = 8;
const SPREAD_Z = 8;
const CEIL     = 5;

export function createParticles(scene) {
  const positions = new Float32Array(COUNT * 3);
  const seeds     = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * SPREAD_X * 2;
    positions[i * 3 + 1] = Math.random() * CEIL;
    positions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD_Z * 2;
    seeds[i] = Math.random() * Math.PI * 2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xfff8e1,
    size: 0.04,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  return {
    update(elapsed) {
      const pos = geo.attributes.position.array;

      for (let i = 0; i < COUNT; i++) {
        const s  = seeds[i];
        const i3 = i * 3;

        pos[i3]     += Math.sin(elapsed * 0.3 + s) * 0.001;
        pos[i3 + 1] += 0.003 + Math.sin(elapsed * 0.5 + s) * 0.001;
        pos[i3 + 2] += Math.cos(elapsed * 0.25 + s) * 0.001;

        if (pos[i3 + 1] > CEIL) {
          pos[i3]     = (Math.random() - 0.5) * SPREAD_X * 2;
          pos[i3 + 1] = -0.2;
          pos[i3 + 2] = (Math.random() - 0.5) * SPREAD_Z * 2;
        }
      }

      geo.attributes.position.needsUpdate = true;
    },
  };
}
