import * as THREE from 'three';

export const tourStepConfigs = [
  {
    partKey: 'engine',
    cameraPos: new THREE.Vector3(3.5, 2.2, 3.5),
    lookAt: new THREE.Vector3(0.8, 0.5, 0),
    duration: 8,
  },
  {
    partKey: 'wheels',
    cameraPos: new THREE.Vector3(3.0, 1.6, 4.0),
    lookAt: new THREE.Vector3(0.4, 0.25, 0.3),
    duration: 8,
  },
  {
    partKey: 'steering',
    cameraPos: new THREE.Vector3(2.5, 2.5, 3.5),
    lookAt: new THREE.Vector3(0.2, 0.8, 0.1),
    duration: 8,
  },
  {
    partKey: 'fuel',
    cameraPos: new THREE.Vector3(-2.5, 1.8, 4.0),
    lookAt: new THREE.Vector3(-0.5, 0.3, 0.2),
    duration: 8,
  },
  {
    partKey: 'transmission',
    cameraPos: new THREE.Vector3(2.0, 1.6, -4.0),
    lookAt: new THREE.Vector3(0.1, 0.35, 0),
    duration: 8,
  },
  {
    partKey: 'body',
    cameraPos: new THREE.Vector3(-3.5, 2.5, 4.5),
    lookAt: new THREE.Vector3(0, 0.5, 0),
    duration: 8,
  },
];
