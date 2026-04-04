import * as THREE from 'three';
import { createEngine } from './parts/engine.js';
import { createWheels } from './parts/wheels.js';
import { createSteering } from './parts/steering.js';
import { createFuel } from './parts/fuel.js';
import { createTransmission } from './parts/transmission.js';
import { createBody } from './parts/body.js';

export function loadCar(envMap) {
  return new Promise((resolve) => {
    const car = new THREE.Group();
    car.name = 'car';

    const parts = {
      engine: createEngine(envMap),
      wheels: createWheels(envMap),
      steering: createSteering(envMap),
      fuel: createFuel(envMap),
      transmission: createTransmission(envMap),
      body: createBody(envMap),
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

    resolve({ car, parts });
  });
}
