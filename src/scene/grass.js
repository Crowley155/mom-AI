import * as THREE from 'three';

const BLADE_COUNT = 6000;
const SPREAD      = 12;
const EXCLUDE_R   = 3.5;

export function createGrass(scene) {
  const bladeGeo = new THREE.BufferGeometry();
  bladeGeo.setAttribute('position', new THREE.Float32BufferAttribute([
    -0.005, 0, 0,
     0.005, 0, 0,
     0.001, 1, 0,
    -0.001, 1, 0,
  ], 3));
  bladeGeo.setIndex([0, 1, 2, 0, 2, 3]);
  bladeGeo.computeVertexNormals();

  const mat = new THREE.MeshBasicMaterial({
    color: 0x56a632,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.vertexShader = 'uniform float uTime;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       vec4 wp = instanceMatrix * vec4(position, 1.0);
       float swayStr = smoothstep(0.0, 1.0, position.y);
       float wave = sin(uTime * 1.4 + wp.x * 0.7 + wp.z * 0.9) * 0.08;
       transformed.x += wave * swayStr;
       transformed.z += wave * 0.4 * swayStr;`
    );
    mat.userData.shader = shader;
  };

  const mesh = new THREE.InstancedMesh(bladeGeo, mat, BLADE_COUNT);
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;

  const dummy  = new THREE.Object3D();
  const color  = new THREE.Color();
  const greens = [0x56a632, 0x4a9428, 0x62b43e, 0x6ebb45, 0x3f8220, 0x58a835];

  let i = 0;
  while (i < BLADE_COUNT) {
    const angle = Math.random() * Math.PI * 2;
    const r     = Math.sqrt(Math.random()) * SPREAD;
    const x     = Math.cos(angle) * r;
    const z     = Math.sin(angle) * r;

    if (Math.sqrt(x * x + z * z) < EXCLUDE_R) continue;

    dummy.position.set(x, 0, z);
    dummy.rotation.set(0, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.25);

    const h = 0.025 + Math.random() * 0.035;
    dummy.scale.set(1, h, 1);

    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);

    color.setHex(greens[Math.floor(Math.random() * greens.length)]);
    mesh.setColorAt(i, color);

    i++;
  }

  mesh.instanceMatrix.needsUpdate = true;
  mesh.instanceColor.needsUpdate  = true;
  scene.add(mesh);

  return {
    update(elapsed) {
      if (mat.userData.shader) {
        mat.userData.shader.uniforms.uTime.value = elapsed;
      }
    },
  };
}
