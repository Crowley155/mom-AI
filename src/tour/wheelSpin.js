import * as THREE from 'three';

const WHEEL_RADIUS = 0.3;
const WHEEL_NAMES = ['WheelFrontL', 'WheelFrontR', 'WheelRearL', 'WheelRearR'];

export function getWheelNodes(wheelsGroup) {
  const nodes = [];
  wheelsGroup.traverse((child) => {
    if (WHEEL_NAMES.includes(child.name)) nodes.push(child);
  });
  return nodes;
}

export function createWheelSpinner(wheelsGroup, { radius = WHEEL_RADIUS } = {}) {
  const nodes = getWheelNodes(wheelsGroup);
  let prevZ = null;

  return {
    reset(z) { prevZ = z; },

    update(currentZ) {
      if (prevZ === null) { prevZ = currentZ; return; }
      const delta = currentZ - prevZ;
      if (Math.abs(delta) < 1e-6) return;
      const angle = delta / radius;
      nodes.forEach(n => n.rotateX(angle));
      prevZ = currentZ;
    },

    updateArc(arcLength) {
      const angle = arcLength / radius;
      nodes.forEach(n => n.rotateX(angle));
    },

    nodes,
  };
}
