import * as THREE from 'three';

const TREE_COUNT = 22;
const MIN_R      = 13;
const MAX_R      = 18;

export function createTrees(scene) {
  const trunkGeo   = new THREE.CylinderGeometry(0.08, 0.12, 1, 6);
  const canopyGeoL = new THREE.ConeGeometry(1, 1, 7);
  const canopyGeoM = new THREE.ConeGeometry(1, 1, 7);
  const canopyGeoS = new THREE.ConeGeometry(1, 1, 7);

  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
  const leafMatL = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });
  const leafMatM = new THREE.MeshLambertMaterial({ color: 0x388e3c });
  const leafMatS = new THREE.MeshLambertMaterial({ color: 0x1b5e20 });

  const trunks    = new THREE.InstancedMesh(trunkGeo, trunkMat, TREE_COUNT);
  const canopiesL = new THREE.InstancedMesh(canopyGeoL, leafMatL, TREE_COUNT);
  const canopiesM = new THREE.InstancedMesh(canopyGeoM, leafMatM, TREE_COUNT);
  const canopiesS = new THREE.InstancedMesh(canopyGeoS, leafMatS, TREE_COUNT);

  [trunks, canopiesL, canopiesM, canopiesS].forEach((m) => {
    m.castShadow = true;
    m.receiveShadow = true;
  });

  const dummy = new THREE.Object3D();
  const leafColor  = new THREE.Color();
  const trunkColor = new THREE.Color();
  const leafGreens  = [0x2e7d32, 0x388e3c, 0x1b5e20, 0x4caf50, 0x33691e];
  const trunkBrowns = [0x5d4037, 0x4e342e, 0x6d4c41, 0x795548];

  for (let i = 0; i < TREE_COUNT; i++) {
    const angle = (i / TREE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const r     = MIN_R + Math.random() * (MAX_R - MIN_R);
    const x     = Math.cos(angle) * r;
    const z     = Math.sin(angle) * r;

    const trunkH  = 0.8 + Math.random() * 0.6;
    const canopyR = 0.7 + Math.random() * 0.8;
    const canopyH = 1.2 + Math.random() * 1.0;

    const leanX = (Math.random() - 0.5) * 0.1;
    const leanZ = (Math.random() - 0.5) * 0.1;

    // Trunk
    dummy.position.set(x, trunkH * 0.5, z);
    dummy.scale.set(1, trunkH, 1);
    dummy.rotation.set(leanX, 0, leanZ);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);

    trunkColor.setHex(trunkBrowns[Math.floor(Math.random() * trunkBrowns.length)]);
    trunks.setColorAt(i, trunkColor);

    leafColor.setHex(leafGreens[Math.floor(Math.random() * leafGreens.length)]);

    // Bottom canopy (largest)
    dummy.position.set(x, trunkH + canopyH * 0.25, z);
    dummy.scale.set(canopyR * 1.1, canopyH * 0.6, canopyR * 1.1);
    dummy.rotation.set(leanX, Math.random() * Math.PI, leanZ);
    dummy.updateMatrix();
    canopiesL.setMatrixAt(i, dummy.matrix);
    canopiesL.setColorAt(i, leafColor);

    // Middle canopy
    dummy.position.set(x, trunkH + canopyH * 0.55, z);
    dummy.scale.set(canopyR * 0.85, canopyH * 0.5, canopyR * 0.85);
    dummy.rotation.set(leanX, Math.random() * Math.PI, leanZ);
    dummy.updateMatrix();
    canopiesM.setMatrixAt(i, dummy.matrix);
    canopiesM.setColorAt(i, leafColor);

    // Top canopy (smallest)
    dummy.position.set(x, trunkH + canopyH * 0.8, z);
    dummy.scale.set(canopyR * 0.55, canopyH * 0.4, canopyR * 0.55);
    dummy.rotation.set(leanX, Math.random() * Math.PI, leanZ);
    dummy.updateMatrix();
    canopiesS.setMatrixAt(i, dummy.matrix);
    canopiesS.setColorAt(i, leafColor);
  }

  trunks.instanceMatrix.needsUpdate    = true;
  trunks.instanceColor.needsUpdate     = true;
  canopiesL.instanceMatrix.needsUpdate = true;
  canopiesL.instanceColor.needsUpdate  = true;
  canopiesM.instanceMatrix.needsUpdate = true;
  canopiesM.instanceColor.needsUpdate  = true;
  canopiesS.instanceMatrix.needsUpdate = true;
  canopiesS.instanceColor.needsUpdate  = true;

  scene.add(trunks);
  scene.add(canopiesL);
  scene.add(canopiesM);
  scene.add(canopiesS);
}
