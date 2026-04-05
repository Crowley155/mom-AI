import * as THREE from 'three';

export function createTransmission(envMap) {
  const group = new THREE.Group();
  group.name = 'transmission';

  const mat = new THREE.MeshStandardMaterial({
    color: 0x2471a3,
    roughness: 0.3,
    metalness: 0.4,
    envMap,
    envMapIntensity: 0.5,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.2,
    metalness: 0.85,
    envMap,
    envMapIntensity: 0.9,
  });

  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.20, 0.24, 2, 2, 2), mat);
  housing.position.set(0, 0.15, 0.10);
  group.add(housing);

  const bellhousing = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.08, 0.10, 12), mat.clone());
  bellhousing.rotation.x = Math.PI / 2;
  bellhousing.position.set(0, 0.15, 0.30);
  group.add(bellhousing);

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.020, 0.6, 10), metalMat);
  shaft.rotation.x = Math.PI / 2;
  shaft.position.set(0, 0.12, -0.15);
  group.add(shaft);

  for (let i = 0; i < 3; i++) {
    const gear = new THREE.Mesh(new THREE.TorusGeometry(0.05 + i * 0.010, 0.012, 8, 20), metalMat.clone());
    gear.position.set(0, 0.15, 0.10 + i * 0.1);
    group.add(gear);
  }

  group.userData.originalY = 0;
  return group;
}
