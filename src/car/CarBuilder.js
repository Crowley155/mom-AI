import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createEngine } from './parts/engine.js';
import { createSteering } from './parts/steering.js';
import { createFuel } from './parts/fuel.js';
import { createTransmission } from './parts/transmission.js';

const BASE = import.meta.env.BASE_URL;

const BRG_PRIMARY   = 0xcc0000;
const BRG_SECONDARY = 0x990000;

export async function loadCar(envMap) {
  const car = new THREE.Group();
  car.name = 'car';

  const gltf = await new GLTFLoader().loadAsync(`${BASE}models/sports-car.glb`);
  const model = gltf.scene;

  const SCALE = 0.5;

  // The Khronos CarConcept model is already Y-up. No rotation needed.

  // Step 1: compute BB from the FULL model at target scale BEFORE splitting
  const tempPivot = new THREE.Group();
  tempPivot.scale.setScalar(SCALE);
  tempPivot.add(model);
  car.add(tempPivot);
  car.updateMatrixWorld(true);

  const bb = new THREE.Box3().setFromObject(tempPivot);
  const center = bb.getCenter(new THREE.Vector3());
  const offsetX = -center.x;
  const offsetY = -bb.min.y - 0.02;
  const offsetZ = -center.z;

  car.remove(tempPivot);
  tempPivot.remove(model);

  // Step 2: extract wheels — preserve transforms lost when removing from hierarchy
  car.updateMatrixWorld(true);
  const modelInverse = model.matrixWorld.clone().invert();

  const wheelNodeNames = ['WheelFrontL', 'WheelFrontR', 'WheelRearL', 'WheelRearR'];
  const wheelData = [];
  wheelNodeNames.forEach(name => {
    const node = model.getObjectByName(name);
    if (node) {
      const localInModel = new THREE.Matrix4().multiplyMatrices(modelInverse, node.matrixWorld);
      wheelData.push({ node, localInModel });
    }
  });

  const axleNode = model.getObjectByName('Axles');
  let axleMat = null;
  if (axleNode) {
    axleMat = new THREE.Matrix4().multiplyMatrices(modelInverse, axleNode.matrixWorld);
  }

  const extractedWheels = [];
  const rearQuats = {};
  wheelData.forEach(({ node, localInModel }) => {
    node.removeFromParent();
    localInModel.decompose(node.position, node.quaternion, node.scale);

    if (node.name === 'WheelRearL') rearQuats.L = node.quaternion.clone();
    if (node.name === 'WheelRearR') rearQuats.R = node.quaternion.clone();

    extractedWheels.push(node);
  });

  extractedWheels.forEach(node => {
    if (node.name === 'WheelFrontL' && rearQuats.L) node.quaternion.copy(rearQuats.L);
    if (node.name === 'WheelFrontR' && rearQuats.R) node.quaternion.copy(rearQuats.R);
  });

  if (axleNode) {
    axleNode.removeFromParent();
    axleMat.decompose(axleNode.position, axleNode.quaternion, axleNode.scale);
  }

  // Step 3: create body group (model minus wheels)
  const bodyGroup  = new THREE.Group();
  bodyGroup.name   = 'body';
  const bodyPivot = new THREE.Group();
  bodyPivot.name = 'bodyPivot';
  bodyPivot.scale.setScalar(SCALE);
  bodyPivot.position.set(offsetX, offsetY, offsetZ);
  bodyPivot.add(model);
  bodyGroup.add(bodyPivot);

  // Step 4: create wheels group
  const wheelsGroup = new THREE.Group();
  wheelsGroup.name  = 'wheels';
  const wheelPivot = new THREE.Group();
  wheelPivot.name = 'wheelPivot';
  wheelPivot.scale.setScalar(SCALE);
  wheelPivot.position.set(offsetX, offsetY, offsetZ);
  extractedWheels.forEach(n => wheelPivot.add(n));
  if (axleNode) wheelPivot.add(axleNode);
  wheelsGroup.add(wheelPivot);

  applyMaterials(bodyGroup, wheelsGroup, envMap);
  addLogoDecal(bodyGroup);
  addLicensePlate(bodyGroup);

  const parts = {
    engine: createEngine(envMap),
    wheels: wheelsGroup,
    steering: createSteering(envMap),
    fuel: createFuel(envMap),
    transmission: createTransmission(envMap),
    body: bodyGroup,
  };

  const internalParts = ['engine', 'steering', 'fuel', 'transmission'];

  Object.entries(parts).forEach(([key, part]) => {
    car.add(part);
    part.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    part.userData.originalX = part.position.x;
    part.userData.originalY = part.position.y;
    part.userData.originalZ = part.position.z;
    if (internalParts.includes(key)) {
      part.visible = false;
    }
  });

  return { car, parts };
}

function applyMaterials(bodyGroup, wheelsGroup, envMap) {
  const paintMat = new THREE.MeshPhysicalMaterial({
    color: BRG_PRIMARY,
    metalness: 0.35,
    roughness: 0.15,
    clearcoat: 0.6,
    clearcoatRoughness: 0.12,
    envMap,
    envMapIntensity: 0.9,
  });

  const darkPaintMat = new THREE.MeshPhysicalMaterial({
    color: BRG_SECONDARY,
    metalness: 0.3,
    roughness: 0.25,
    clearcoat: 0.5,
    clearcoatRoughness: 0.15,
    envMap,
    envMapIntensity: 0.6,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x88aacc,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.92,
    thickness: 0.2,
    ior: 1.52,
    envMap,
    envMapIntensity: 0.8,
  });

  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 1.0,
    roughness: 0.0,
    envMap,
    envMapIntensity: 2.0,
  });

  const materialOverrides = {
    'Paint 1 Carmine':  paintMat,
    'Paint 1 Pearl':    paintMat,
    'Paint 1 Graphite': paintMat,
    'Paint 2 Carmine':  darkPaintMat,
    'Paint 2 Pearl':    darkPaintMat,
    'Paint 2 Graphite': darkPaintMat,
    'Glass':            glassMat,
    'Mirror':           mirrorMat,
  };

  [bodyGroup, wheelsGroup].forEach(group => {
    group.traverse((child) => {
      if (!child.isMesh) return;
      const matName = child.material?.name;
      if (matName && materialOverrides[matName]) {
        child.material = materialOverrides[matName];
      }
    });
  });
}

function addLogoDecal(bodyGroup) {
  const loader = new THREE.TextureLoader();
  loader.load(
    `${BASE}textures/jcprd-logo.png`,
    (logoTex) => {
      logoTex.colorSpace = THREE.SRGBColorSpace;

      const logoMat = new THREE.MeshStandardMaterial({
        map: logoTex,
        transparent: true,
        alphaTest: 0.1,
        depthWrite: false,
        roughness: 0.4,
        metalness: 0.1,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      });

      const aspect = logoTex.image.width / logoTex.image.height;
      const logoH = 0.15;
      const logoW = logoH * aspect;
      const logoGeo = new THREE.PlaneGeometry(logoW, logoH);

      bodyGroup.updateMatrixWorld(true);
      const bb = new THREE.Box3().setFromObject(bodyGroup);
      const doorY = (bb.min.y + bb.max.y) * 0.48;
      const doorZ = (bb.min.z + bb.max.z) * 0.5 - 0.05;

      const logoR = new THREE.Mesh(logoGeo, logoMat);
      logoR.position.set(bb.max.x + 0.001, doorY, doorZ);
      logoR.rotation.y = Math.PI / 2;
      logoR.userData.isDecal = true;
      bodyGroup.add(logoR);

      const logoL = new THREE.Mesh(logoGeo.clone(), logoMat.clone());
      logoL.position.set(bb.min.x - 0.001, doorY, doorZ);
      logoL.rotation.y = -Math.PI / 2;
      logoL.userData.isDecal = true;
      bodyGroup.add(logoL);
    },
    undefined,
    () => { /* silent fallback — logo file not found */ }
  );
}

function createKansasPlateTexture() {
  const w = 512, h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Plate background — white with subtle warm tint
  ctx.fillStyle = '#f5f2e8';
  ctx.fillRect(0, 0, w, h);

  // Blue border
  ctx.strokeStyle = '#1a3a6b';
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, w - 20, h - 20);

  // "KANSAS" header
  ctx.fillStyle = '#1a3a6b';
  ctx.font = 'bold 36px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('KANSAS', w / 2, 52);

  // Sunflower-yellow accent line
  ctx.fillStyle = '#f4c430';
  ctx.fillRect(30, 60, w - 60, 4);

  // Main plate text — "JCPRD"
  ctx.fillStyle = '#1a3a6b';
  ctx.font = 'bold 88px Arial, sans-serif';
  ctx.fillText('JCPRD', w / 2, 155);

  // "Ad Astra Per Aspera" (Kansas motto) or county tagline
  ctx.fillStyle = '#888';
  ctx.font = 'italic 22px Georgia, serif';
  ctx.fillText('Johnson County', w / 2, 200);

  // Small wheat/sunflower accent dots
  ctx.fillStyle = '#f4c430';
  [80, w - 80].forEach(x => {
    ctx.beginPath();
    ctx.arc(x, 130, 12, 0, Math.PI * 2);
    ctx.fill();
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function addLicensePlate(bodyGroup) {
  const plateTex = createKansasPlateTexture();

  const plateW = 0.18;
  const plateH = 0.09;
  const plateGeo = new THREE.PlaneGeometry(plateW, plateH);

  const plateMat = new THREE.MeshStandardMaterial({
    map: plateTex,
    roughness: 0.6,
    metalness: 0.05,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });

  bodyGroup.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(bodyGroup);

  const plateX = (bb.min.x + bb.max.x) * 0.5;
  const plateY = bb.min.y + (bb.max.y - bb.min.y) * 0.18;

  // Rear plate — faces -Z
  const rear = new THREE.Mesh(plateGeo, plateMat);
  rear.position.set(plateX, plateY, bb.min.z - 0.001);
  rear.rotation.y = Math.PI;
  rear.userData.isDecal = true;
  bodyGroup.add(rear);

  // Front plate
  const front = new THREE.Mesh(plateGeo.clone(), plateMat.clone());
  front.position.set(plateX, plateY, bb.max.z + 0.001);
  front.userData.isDecal = true;
  bodyGroup.add(front);
}
