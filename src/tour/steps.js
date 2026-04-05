import * as THREE from 'three';

export const tourStepConfigs = [
  {
    partKey: 'intro',
    cameraPos: new THREE.Vector3(3.0, 1.2, 0),
    lookAt: new THREE.Vector3(0, 0.25, 0),
    duration: 15,
  },
  {
    partKey: 'engine',
    cameraPos: new THREE.Vector3(-1.5, 0.8, 2.0),
    lookAt: new THREE.Vector3(0, 0.20, 0.85),
    duration: 8,
  },
  {
    partKey: 'wheels',
    cameraPos: new THREE.Vector3(2.0, 0.6, 0.8),
    lookAt: new THREE.Vector3(0.3, 0.15, 0),
    duration: 8,
  },
  {
    partKey: 'steering',
    cameraPos: new THREE.Vector3(1.2, 0.8, 1.0),
    lookAt: new THREE.Vector3(0, 0.35, 0.35),
    duration: 8,
  },
  {
    partKey: 'fuel',
    cameraPos: new THREE.Vector3(1.5, 0.6, -1.8),
    lookAt: new THREE.Vector3(0, 0.15, -0.65),
    duration: 8,
  },
  {
    partKey: 'transmission',
    cameraPos: new THREE.Vector3(-1.3, 0.6, 0.5),
    lookAt: new THREE.Vector3(0, 0.15, 0.1),
    duration: 8,
  },
  {
    partKey: 'body',
    cameraPos: new THREE.Vector3(-2.5, 1.0, -2.0),
    lookAt: new THREE.Vector3(0, 0.3, 0),
    duration: 8,
  },
];
