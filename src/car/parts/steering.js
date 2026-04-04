import * as THREE from 'three';

export function createSteering(envMap) {
  const group = new THREE.Group();
  group.name = 'steering';

  const mat = new THREE.MeshStandardMaterial({
    color: 0x2980b9,
    roughness: 0.3,
    metalness: 0.4,
    envMap,
    envMapIntensity: 0.6,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.1,
    metalness: 0.8,
    envMap,
    envMapIntensity: 1.0,
  });

  const columnHeight = 0.45;
  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.035, columnHeight, 12),
    mat
  );
  column.position.set(0.15, 0.7, 0.12);
  column.rotation.z = Math.PI * 0.2;
  group.add(column);

  const jointGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 12);
  const joint = new THREE.Mesh(jointGeo, chromeMat);
  joint.position.y = columnHeight / 2;
  column.add(joint);

  const wheelAssembly = new THREE.Group();
  wheelAssembly.position.y = columnHeight / 2 + 0.01;
  wheelAssembly.rotation.x = Math.PI * 0.5;
  column.add(wheelAssembly);

  const wheelRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.12, 0.015, 12, 32),
    mat.clone()
  );
  wheelAssembly.add(wheelRing);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.015, 16),
    chromeMat.clone()
  );
  hub.rotation.x = Math.PI / 2;
  wheelAssembly.add(hub);

  for (let i = 0; i < 3; i++) {
    const spoke = new THREE.Mesh(
      new THREE.BoxGeometry(0.015, 0.09, 0.012),
      mat.clone()
    );
    const a = (i / 3) * Math.PI * 2;
    spoke.position.set(Math.cos(a) * 0.05, Math.sin(a) * 0.05, 0);
    spoke.rotation.z = a;
    wheelAssembly.add(spoke);
  }

  group.userData.originalY = 0;
  return group;
}
