import * as THREE from 'three';

export function createEngine(envMap) {
  const group = new THREE.Group();
  group.name = 'engine';

  const blockMat = new THREE.MeshStandardMaterial({
    color: 0xcc3333,
    roughness: 0.35,
    metalness: 0.3,
    envMap,
    envMapIntensity: 0.6,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x999999,
    roughness: 0.2,
    metalness: 0.85,
    envMap,
    envMapIntensity: 1.0,
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.9,
    metalness: 0.0,
  });

  const block = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.45, 2, 2, 2), blockMat);
  group.add(block);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.1, 0.42, 2, 1, 1), blockMat.clone());
  head.position.y = 0.25;
  group.add(head);

  const valveCover = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.42, 6, 12), blockMat.clone());
  valveCover.rotation.z = Math.PI / 2;
  valveCover.position.y = 0.33;
  group.add(valveCover);

  for (let i = 0; i < 4; i++) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.16, 8), metalMat.clone());
    pipe.position.set(-0.15 + i * 0.1, 0.42, 0.12);
    pipe.rotation.x = 0.3;
    group.add(pipe);
  }

  const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 16), metalMat.clone());
  fan.rotation.x = Math.PI / 2;
  fan.position.set(0, 0, 0.28);
  group.add(fan);

  for (let i = 0; i < 6; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.11, 0.008), metalMat.clone());
    const a = (i / 6) * Math.PI * 2;
    blade.position.set(Math.cos(a) * 0.08, Math.sin(a) * 0.08, 0.30);
    blade.rotation.z = a + Math.PI / 4;
    group.add(blade);
  }

  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.012, 8, 24), darkMat);
  belt.rotation.y = Math.PI / 2;
  belt.position.set(0, -0.05, 0.26);
  group.add(belt);

  group.position.set(0.8, 0.5, 0);
  group.userData.originalY = 0.5;
  return group;
}
