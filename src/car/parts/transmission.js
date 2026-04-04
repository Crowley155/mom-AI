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

  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 0.28, 2, 2, 2), mat);
  housing.position.set(0.25, 0.35, 0);
  group.add(housing);

  const bellhousing = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.12, 12), mat.clone());
  bellhousing.rotation.z = Math.PI / 2;
  bellhousing.position.set(0.48, 0.35, 0);
  group.add(bellhousing);

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 10), metalMat);
  shaft.rotation.z = Math.PI / 2;
  shaft.position.set(-0.1, 0.30, 0);
  group.add(shaft);

  for (let i = 0; i < 3; i++) {
    const gear = new THREE.Mesh(new THREE.TorusGeometry(0.06 + i * 0.012, 0.015, 8, 20), metalMat.clone());
    gear.rotation.y = Math.PI / 2;
    gear.position.set(0.12 + i * 0.1, 0.35, 0);
    group.add(gear);
  }

  group.userData.originalY = 0;
  return group;
}
