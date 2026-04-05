import * as THREE from 'three';

export function createFuel(envMap) {
  const group = new THREE.Group();
  group.name = 'fuel';

  const mat = new THREE.MeshStandardMaterial({
    color: 0xd84393,
    roughness: 0.3,
    metalness: 0.3,
    envMap,
    envMapIntensity: 0.5,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.2,
    metalness: 0.8,
    envMap,
    envMapIntensity: 0.8,
  });

  const tank = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.4, 8, 16), mat);
  tank.rotation.z = Math.PI / 2;
  tank.position.set(0, 0.15, -0.65);
  group.add(tank);

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.04, 12), metalMat);
  cap.position.set(0.35, 0.15, -0.65);
  cap.rotation.x = Math.PI / 2;
  group.add(cap);

  const line = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 8), metalMat.clone());
  line.rotation.z = Math.PI / 2;
  line.position.set(0, 0.15, -0.55);
  group.add(line);

  group.scale.setScalar(0.9);
  group.userData.originalY = 0;
  return group;
}
