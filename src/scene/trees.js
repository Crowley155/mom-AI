import * as THREE from 'three';

const TREE_COUNT = 22;
const MIN_R      = 13;
const MAX_R      = 18;

export function createTrees(scene) {
  const trunkGeo  = new THREE.CylinderGeometry(0.08, 0.12, 1, 6);
  const canopyGeo = new THREE.ConeGeometry(1, 1, 7);

  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
  const leafMat  = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });

  const trunks   = new THREE.InstancedMesh(trunkGeo, trunkMat, TREE_COUNT);
  const canopies = new THREE.InstancedMesh(canopyGeo, leafMat, TREE_COUNT);
  trunks.receiveShadow   = true;
  canopies.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const leafColor = new THREE.Color();
  const leafGreens = [0x2e7d32, 0x388e3c, 0x1b5e20, 0x4caf50, 0x33691e];

  for (let i = 0; i < TREE_COUNT; i++) {
    const angle = (i / TREE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const r     = MIN_R + Math.random() * (MAX_R - MIN_R);
    const x     = Math.cos(angle) * r;
    const z     = Math.sin(angle) * r;

    const trunkH  = 0.8 + Math.random() * 0.6;
    const canopyR = 0.7 + Math.random() * 0.8;
    const canopyH = 1.2 + Math.random() * 1.0;

    dummy.position.set(x, trunkH * 0.5, z);
    dummy.scale.set(1, trunkH, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);

    dummy.position.set(x, trunkH + canopyH * 0.4, z);
    dummy.scale.set(canopyR, canopyH, canopyR);
    dummy.rotation.set(0, Math.random() * Math.PI, 0);
    dummy.updateMatrix();
    canopies.setMatrixAt(i, dummy.matrix);

    leafColor.setHex(leafGreens[Math.floor(Math.random() * leafGreens.length)]);
    canopies.setColorAt(i, leafColor);
  }

  trunks.instanceMatrix.needsUpdate   = true;
  canopies.instanceMatrix.needsUpdate = true;
  canopies.instanceColor.needsUpdate  = true;

  scene.add(trunks);
  scene.add(canopies);
}
