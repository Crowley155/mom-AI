import * as THREE from 'three';

export const palette = {
  engine: 0xcc3333,
  wheels: 0xf0a500,
  steering: 0x2980b9,
  fuel: 0xd84393,
  transmission: 0x2471a3,
  body: 0x1a6b3c,

  engineEmissive: 0x991111,
  wheelsEmissive: 0xaa7700,
  steeringEmissive: 0x1a5276,
  fuelEmissive: 0xaa2d6e,
  transmissionEmissive: 0x154360,
  bodyEmissive: 0x0d3a1f,
};

export function makePartMaterial(color, emissiveColor, envMap) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: emissiveColor || 0x000000,
    emissiveIntensity: 0,
    roughness: 0.35,
    metalness: 0.2,
    envMap,
    envMapIntensity: 0.5,
  });
}
