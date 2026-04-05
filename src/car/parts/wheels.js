import * as THREE from 'three';
import { createTireNormal, createBrakeDiscMap } from '../proceduralTextures.js';

function createWheel(envMap, faceDir, tireMat, rimMat) {
  const wheel = new THREE.Group();

  const hubMat = new THREE.MeshStandardMaterial({
    color: 0xf2f2f2,
    roughness: 0.08,
    metalness: 0.94,
    envMap,
    envMapIntensity: 1.6,
  });

  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.38, 0.22, 36),
    tireMat
  );
  tire.rotation.x = Math.PI / 2;
  wheel.add(tire);

  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 0.24, 36),
    rimMat
  );
  rim.rotation.x = Math.PI / 2;
  wheel.add(rim);

  const faceZ = faceDir * 0.13;

  const hubCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.018, 20),
    hubMat
  );
  hubCap.rotation.x = Math.PI / 2;
  hubCap.position.z = faceZ + faceDir * 0.005;
  wheel.add(hubCap);

  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;

    const spokeInner = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, 0.10, 0.012),
      rimMat.clone()
    );
    spokeInner.position.set(
      Math.cos(a) * 0.08,
      Math.sin(a) * 0.08,
      faceZ
    );
    spokeInner.rotation.z = a;
    wheel.add(spokeInner);

    const aL = a - 0.18;
    const aR = a + 0.18;
    for (const branchA of [aL, aR]) {
      const branch = new THREE.Mesh(
        new THREE.BoxGeometry(0.010, 0.08, 0.010),
        rimMat.clone()
      );
      branch.position.set(
        Math.cos(branchA) * 0.18,
        Math.sin(branchA) * 0.18,
        faceZ
      );
      branch.rotation.z = branchA;
      wheel.add(branch);
    }
  }

  const discMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.35,
    metalness: 0.7,
    envMap,
    envMapIntensity: 0.5,
  });
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.012, 28),
    discMat
  );
  disc.rotation.x = Math.PI / 2;
  disc.position.z = faceZ * 0.5;
  disc.userData.isBrakeDisc = true;
  wheel.add(disc);

  const caliper = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.07, 0.03),
    new THREE.MeshStandardMaterial({
      color: 0xcc0000, roughness: 0.3, metalness: 0.2,
    })
  );
  caliper.position.set(0, 0.18, faceZ * 0.5);
  wheel.add(caliper);

  for (let i = 0; i < 5; i++) {
    const lug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.01, 8),
      hubMat.clone()
    );
    const a = (i / 5) * Math.PI * 2;
    lug.rotation.x = Math.PI / 2;
    lug.position.set(
      Math.cos(a) * 0.035,
      Math.sin(a) * 0.035,
      faceZ + faceDir * 0.012
    );
    wheel.add(lug);
  }

  return wheel;
}

export function createWheels(envMap) {
  const group = new THREE.Group();
  group.name = 'wheels';

  const wheelY = 0.38;

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x151515,
    roughness: 0.95,
    metalness: 0.0,
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xc8c8c8,
    roughness: 0.10,
    metalness: 0.92,
    envMap,
    envMapIntensity: 1.5,
  });

  const positions = [
    { x:  0.90, y: wheelY, z:  0.78, faceDir:  1 },
    { x:  0.90, y: wheelY, z: -0.78, faceDir: -1 },
    { x: -0.90, y: wheelY, z:  0.78, faceDir:  1 },
    { x: -0.90, y: wheelY, z: -0.78, faceDir: -1 },
  ];

  const axleMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.3,
    metalness: 0.7,
    envMap,
    envMapIntensity: 0.5,
  });

  for (const axleX of [0.90, -0.90]) {
    const axle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 1.62, 10),
      axleMat
    );
    axle.rotation.x = Math.PI / 2;
    axle.position.set(axleX, wheelY, 0);
    group.add(axle);
  }

  positions.forEach(({ x, y, z, faceDir }) => {
    const w = createWheel(envMap, faceDir, tireMat, rimMat);
    w.position.set(x, y, z);
    group.add(w);
  });

  const tireNorm = createTireNormal();
  tireNorm.repeat.set(1, 6);
  tireMat.normalMap = tireNorm;
  tireMat.normalScale = new THREE.Vector2(0.8, 0.8);

  const discTex = createBrakeDiscMap();
  group.traverse((child) => {
    if (child.isMesh && child.userData.isBrakeDisc) {
      child.material.map = discTex;
      child.material.needsUpdate = true;
    }
  });

  group.userData.originalY = 0;
  return group;
}
