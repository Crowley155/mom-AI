import * as THREE from 'three';

/**
 * Solid-cylinder wheel design — no torus, no open center hole.
 * Outer black rubber cylinder + inner silver rim cylinder.
 * This is how every low-poly/stylized car (including Pixar Cars) builds wheels.
 * No see-through, no z-fighting, works at every angle including full rotation.
 *
 * faceDir: +1 = hub details face +Z (right-side wheels, visible from camera)
 *          -1 = hub details face -Z (left-side wheels)
 */
function createWheel(envMap, faceDir) {
  const wheel = new THREE.Group();

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x151515,
    roughness: 0.95,
    metalness: 0.0,
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xd0d0d0,
    roughness: 0.15,
    metalness: 0.85,
    envMap,
    envMapIntensity: 1.3,
  });

  const hubMat = new THREE.MeshStandardMaterial({
    color: 0xf2f2f2,
    roughness: 0.08,
    metalness: 0.94,
    envMap,
    envMapIntensity: 1.6,
  });

  // ── Outer tire (full-width solid cylinder, black rubber) ──
  // Radius 0.38 = same outer radius as old TorusGeometry(0.26, 0.12)
  // Width 0.25 in Z
  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.38, 0.25, 32),
    tireMat
  );
  tire.rotation.x = Math.PI / 2;
  wheel.add(tire);

  // ── Inner rim (slightly wider so rim face protrudes ~0.02 beyond tire faces) ──
  // Radius 0.22 — visible as a silver disc inside the black rubber ring
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.29, 28),
    rimMat
  );
  rim.rotation.x = Math.PI / 2;
  wheel.add(rim);

  // ── Outer face details — hub cap and 5 spokes ──
  // These sit on the outer rim face (z = faceDir * 0.145 = just outside rim cap)
  const faceZ = faceDir * 0.148;

  const hubCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.018, 20),
    hubMat
  );
  hubCap.rotation.x = Math.PI / 2;
  hubCap.position.z = faceZ + faceDir * 0.005;
  wheel.add(hubCap);

  for (let i = 0; i < 5; i++) {
    const spoke = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.13, 0.018),
      rimMat.clone()
    );
    const a = (i / 5) * Math.PI * 2;
    spoke.position.set(
      Math.cos(a) * 0.085,
      Math.sin(a) * 0.085,
      faceZ
    );
    spoke.rotation.z = a;
    wheel.add(spoke);
  }

  return wheel;
}

export function createWheels(envMap) {
  const group = new THREE.Group();
  group.name = 'wheels';

  // With solid CylinderGeometry, wheel outer radius is 0.38
  const wheelY = 0.38;

  const positions = [
    { x:  0.85, y: wheelY, z:  0.74, faceDir:  1 },
    { x:  0.85, y: wheelY, z: -0.74, faceDir: -1 },
    { x: -0.85, y: wheelY, z:  0.74, faceDir:  1 },
    { x: -0.85, y: wheelY, z: -0.74, faceDir: -1 },
  ];

  const axleMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.3,
    metalness: 0.7,
    envMap,
    envMapIntensity: 0.5,
  });

  for (const axleX of [0.85, -0.85]) {
    const axle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 1.55, 10),
      axleMat
    );
    axle.rotation.x = Math.PI / 2;
    axle.position.set(axleX, wheelY, 0);
    group.add(axle);
  }

  positions.forEach(({ x, y, z, faceDir }) => {
    const w = createWheel(envMap, faceDir);
    w.position.set(x, y, z);
    group.add(w);
  });

  group.userData.originalY = 0;
  return group;
}
