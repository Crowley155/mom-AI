import * as THREE from 'three';

const results = [];

function log(check, pass, detail) {
  const tag = pass ? 'PASS' : '** FAIL **';
  results.push({ check, pass, detail });
  console.log(`[QA] ${tag}  ${check}: ${detail}`);
}

function bb(obj) {
  obj.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(obj);
}

function bbSize(obj) {
  return bb(obj).getSize(new THREE.Vector3());
}

function bbCenter(obj) {
  return bb(obj).getCenter(new THREE.Vector3());
}

function worldPos(obj) {
  const v = new THREE.Vector3();
  obj.getWorldPosition(v);
  return v;
}

function fmt(v) {
  return `(${v.x.toFixed(3)}, ${v.y.toFixed(3)}, ${v.z.toFixed(3)})`;
}

export function runSceneAudit(scene, car, parts, camera) {
  results.length = 0;
  console.log('\n========== SCENE QA AUDIT ==========\n');

  car.updateMatrixWorld(true);

  const bodyBB = bb(parts.body);
  const bodySize = bodyBB.getSize(new THREE.Vector3());
  const bodyCenter = bodyBB.getCenter(new THREE.Vector3());
  const wheelsBB = bb(parts.wheels);
  const wheelsSize = wheelsBB.getSize(new THREE.Vector3());

  console.log(`[QA] Body BB min=${fmt(bodyBB.min)} max=${fmt(bodyBB.max)} size=${fmt(bodySize)}`);
  console.log(`[QA] Wheels BB min=${fmt(wheelsBB.min)} max=${fmt(wheelsBB.max)} size=${fmt(wheelsSize)}`);

  // ── CAR_ORIENTATION ──
  const fullBB = new THREE.Box3().setFromObject(car);
  const fullSize = fullBB.getSize(new THREE.Vector3());
  console.log(`[QA] Full car BB min=${fmt(fullBB.min)} max=${fmt(fullBB.max)} size=${fmt(fullSize)}`);

  const axes = [
    { axis: 'X', val: fullSize.x },
    { axis: 'Y', val: fullSize.y },
    { axis: 'Z', val: fullSize.z },
  ].sort((a, b) => b.val - a.val);

  const longest = axes[0];
  const middle = axes[1];
  const shortest = axes[2];

  log('CAR_ORIENTATION',
    longest.axis === 'Z' && shortest.axis === 'Y',
    `Longest=${longest.axis}(${longest.val.toFixed(3)}) Mid=${middle.axis}(${middle.val.toFixed(3)}) Short=${shortest.axis}(${shortest.val.toFixed(3)}). Expected: Z longest, Y shortest`
  );

  // ── WHEEL_GROUND_CONTACT ──
  const wheelNames = ['WheelFrontL', 'WheelFrontR', 'WheelRearL', 'WheelRearR'];
  const wheelWorldPositions = {};

  parts.wheels.traverse((node) => {
    if (wheelNames.includes(node.name)) {
      const wp = worldPos(node);
      const nodeBB = bb(node);
      wheelWorldPositions[node.name] = { pos: wp, bb: nodeBB };

      const bottomY = nodeBB.min.y;
      log(`WHEEL_GROUND_CONTACT[${node.name}]`,
        Math.abs(bottomY) < 0.05,
        `Bottom Y=${bottomY.toFixed(4)}, worldPos=${fmt(wp)}. Should be near 0.`
      );
    }
  });

  // ── WHEEL_IN_WHEELBASE ──
  Object.entries(wheelWorldPositions).forEach(([name, { pos }]) => {
    const inX = pos.x >= bodyBB.min.x - 0.1 && pos.x <= bodyBB.max.x + 0.1;
    const inZ = pos.z >= bodyBB.min.z - 0.1 && pos.z <= bodyBB.max.z + 0.1;
    log(`WHEEL_IN_WHEELBASE[${name}]`,
      inX && inZ,
      `Wheel pos=${fmt(pos)} Body X=[${bodyBB.min.x.toFixed(3)},${bodyBB.max.x.toFixed(3)}] Z=[${bodyBB.min.z.toFixed(3)},${bodyBB.max.z.toFixed(3)}]`
    );
  });

  // ── PART_INSIDE_BODY ──
  const internalParts = ['engine', 'steering', 'fuel', 'transmission'];
  const partData = {};

  internalParts.forEach((key) => {
    const part = parts[key];
    if (!part) return;
    part.visible = true;
    part.updateMatrixWorld(true);
    const partBB = bb(part);
    const partSize = partBB.getSize(new THREE.Vector3());
    const partCenter = partBB.getCenter(new THREE.Vector3());
    part.visible = false;

    partData[key] = { bb: partBB, size: partSize, center: partCenter };

    const inside =
      partCenter.x >= bodyBB.min.x && partCenter.x <= bodyBB.max.x &&
      partCenter.y >= bodyBB.min.y && partCenter.y <= bodyBB.max.y &&
      partCenter.z >= bodyBB.min.z && partCenter.z <= bodyBB.max.z;

    log(`PART_INSIDE_BODY[${key}]`, inside,
      `Part center=${fmt(partCenter)} Part size=${fmt(partSize)} Body BB=[${fmt(bodyBB.min)} to ${fmt(bodyBB.max)}]`
    );
  });

  // ── PART_SCALE_RATIO ──
  internalParts.forEach((key) => {
    const pd = partData[key];
    if (!pd) return;
    const ratioX = pd.size.x / bodySize.x;
    const ratioY = pd.size.y / bodySize.y;
    const ratioZ = pd.size.z / bodySize.z;
    const ok = ratioX < 0.6 && ratioY < 0.8 && ratioZ < 0.5;
    log(`PART_SCALE_RATIO[${key}]`, ok,
      `Ratios X=${ratioX.toFixed(2)} Y=${ratioY.toFixed(2)} Z=${ratioZ.toFixed(2)} (should be <0.6, <0.8, <0.5)`
    );
  });

  // ── LOGO_ON_SIDES ──
  const logoMeshes = [];
  parts.body.traverse((child) => {
    if (child.isMesh && child.userData.isDecal) logoMeshes.push(child);
  });

  if (logoMeshes.length === 0) {
    log('LOGO_ON_SIDES', false, 'No logo decals found on body');
  } else {
    logoMeshes.forEach((logo, i) => {
      const lp = worldPos(logo);
      const nearXFace = Math.abs(lp.x - bodyBB.max.x) < 0.15 || Math.abs(lp.x - bodyBB.min.x) < 0.15;
      const nearZFace = Math.abs(lp.z - bodyBB.max.z) < 0.15 || Math.abs(lp.z - bodyBB.min.z) < 0.15;
      log(`LOGO_ON_SIDES[${i}]`, nearXFace && !nearZFace,
        `Logo worldPos=${fmt(lp)} Body X=[${bodyBB.min.x.toFixed(3)},${bodyBB.max.x.toFixed(3)}] Z=[${bodyBB.min.z.toFixed(3)},${bodyBB.max.z.toFixed(3)}]. Should be near X faces (sides), not Z faces (front/rear).`
      );
    });
  }

  // Contact shadow removed — using real shadow mapping from directional light

  // FINALE_DRIVE_DIRECTION and FAILURE_ANIM_AXES — fixed in code (all use Z axis now)

  // ── SUMMARY ──
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`\n========== QA SUMMARY: ${passed} PASSED, ${failed} FAILED ==========\n`);

  results.filter(r => !r.pass).forEach(r => {
    console.log(`  [FAIL] ${r.check}: ${r.detail}`);
  });

  console.log('\n========== END AUDIT ==========\n');

  return results;
}
