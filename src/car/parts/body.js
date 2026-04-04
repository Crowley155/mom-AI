import * as THREE from 'three';

export function createBody(envMap) {
  const group = new THREE.Group();
  group.name = 'body';

  const paintMat = new THREE.MeshPhysicalMaterial({
    color: 0x1565c0,
    metalness: 0.6,
    roughness: 0.12,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    envMap,
    envMapIntensity: 1.4,
  });

  const darkPaintMat = new THREE.MeshPhysicalMaterial({
    color: 0x0d47a1,
    metalness: 0.5,
    roughness: 0.2,
    clearcoat: 0.8,
    clearcoatRoughness: 0.05,
    envMap,
    envMapIntensity: 1.0,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x99ccee,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.8,
    thickness: 0.3,
    transparent: true,
    opacity: 0.4,
    envMap,
    envMapIntensity: 0.6,
    side: THREE.DoubleSide,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    metalness: 0.95,
    roughness: 0.05,
    envMap,
    envMapIntensity: 1.8,
  });

  const plasticMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.0,
    roughness: 0.6,
  });

  const seamMat = new THREE.MeshStandardMaterial({
    color: 0x0a3060,
    roughness: 0.5,
    metalness: 0.3,
  });

  // --- Chassis (lower body) ---
  const chassisProfile = new THREE.Shape();
  chassisProfile.moveTo(-1.5, 0.15);
  chassisProfile.bezierCurveTo(-1.55, 0.15, -1.6, 0.2, -1.55, 0.3);
  chassisProfile.lineTo(-1.45, 0.35);
  chassisProfile.lineTo(1.45, 0.35);
  chassisProfile.bezierCurveTo(1.55, 0.35, 1.6, 0.3, 1.6, 0.2);
  chassisProfile.lineTo(1.55, 0.15);
  chassisProfile.closePath();

  const chassisGeo = new THREE.ExtrudeGeometry(chassisProfile, {
    depth: 1.1,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 4,
  });
  chassisGeo.translate(0, 0, -0.55);
  group.add(new THREE.Mesh(chassisGeo, darkPaintMat));

  // --- Body shell (upper body) ---
  const bodyProfile = new THREE.Shape();
  bodyProfile.moveTo(-1.3, 0.35);
  bodyProfile.lineTo(1.3, 0.35);
  bodyProfile.bezierCurveTo(1.5, 0.35, 1.55, 0.4, 1.55, 0.5);
  bodyProfile.lineTo(1.5, 0.6);
  bodyProfile.bezierCurveTo(1.45, 0.65, 1.35, 0.65, 1.3, 0.65);
  bodyProfile.lineTo(-1.2, 0.65);
  bodyProfile.bezierCurveTo(-1.35, 0.65, -1.45, 0.65, -1.5, 0.6);
  bodyProfile.lineTo(-1.5, 0.45);
  bodyProfile.bezierCurveTo(-1.5, 0.38, -1.45, 0.35, -1.3, 0.35);
  bodyProfile.closePath();

  const bodyGeo = new THREE.ExtrudeGeometry(bodyProfile, {
    depth: 1.15,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 4,
  });
  bodyGeo.translate(0, 0, -0.575);
  group.add(new THREE.Mesh(bodyGeo, paintMat));

  // --- Cabin ---
  const cabinProfile = new THREE.Shape();
  cabinProfile.moveTo(-0.6, 0.65);
  cabinProfile.lineTo(0.4, 0.65);
  cabinProfile.bezierCurveTo(0.55, 0.65, 0.6, 0.72, 0.55, 0.82);
  cabinProfile.lineTo(0.4, 1.05);
  cabinProfile.bezierCurveTo(0.35, 1.1, 0.2, 1.12, 0.0, 1.12);
  cabinProfile.lineTo(-0.35, 1.12);
  cabinProfile.bezierCurveTo(-0.5, 1.12, -0.6, 1.08, -0.65, 1.0);
  cabinProfile.lineTo(-0.7, 0.82);
  cabinProfile.bezierCurveTo(-0.72, 0.72, -0.7, 0.65, -0.6, 0.65);
  cabinProfile.closePath();

  const cabinGeo = new THREE.ExtrudeGeometry(cabinProfile, {
    depth: 0.95,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 4,
  });
  cabinGeo.translate(0, 0, -0.475);
  group.add(new THREE.Mesh(cabinGeo, paintMat.clone()));

  // --- Hood ---
  const hoodProfile = new THREE.Shape();
  hoodProfile.moveTo(0.42, 0.63);
  hoodProfile.lineTo(1.3, 0.55);
  hoodProfile.bezierCurveTo(1.42, 0.53, 1.48, 0.55, 1.48, 0.6);
  hoodProfile.lineTo(1.45, 0.68);
  hoodProfile.bezierCurveTo(1.42, 0.72, 1.35, 0.73, 1.25, 0.72);
  hoodProfile.lineTo(0.42, 0.71);
  hoodProfile.closePath();

  const hoodGeo = new THREE.ExtrudeGeometry(hoodProfile, {
    depth: 1.0,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 3,
  });
  hoodGeo.translate(0, 0, -0.5);
  group.add(new THREE.Mesh(hoodGeo, paintMat.clone()));

  // --- Windshield (flush inset on cabin front face) ---
  const wsProfile = new THREE.Shape();
  wsProfile.moveTo(-0.38, 0.0);
  wsProfile.lineTo(0.38, 0.0);
  wsProfile.lineTo(0.3, 0.38);
  wsProfile.bezierCurveTo(0.15, 0.42, -0.15, 0.42, -0.3, 0.38);
  wsProfile.closePath();

  const wsGeo = new THREE.ShapeGeometry(wsProfile);
  const windshield = new THREE.Mesh(wsGeo, glassMat);
  windshield.position.set(0.48, 0.72, 0);
  windshield.rotation.y = Math.PI / 2;
  windshield.rotation.z = -0.18;
  group.add(windshield);

  // --- Rear window (flush inset on cabin rear face) ---
  const rwProfile = new THREE.Shape();
  rwProfile.moveTo(-0.35, 0.0);
  rwProfile.lineTo(0.35, 0.0);
  rwProfile.lineTo(0.28, 0.3);
  rwProfile.bezierCurveTo(0.12, 0.34, -0.12, 0.34, -0.28, 0.3);
  rwProfile.closePath();

  const rwGeo = new THREE.ShapeGeometry(rwProfile);
  const rearWindow = new THREE.Mesh(rwGeo, glassMat.clone());
  rearWindow.position.set(-0.66, 0.72, 0);
  rearWindow.rotation.y = Math.PI / 2;
  rearWindow.rotation.z = 0.12;
  group.add(rearWindow);

  // --- Side windows ---
  for (const side of [1, -1]) {
    const sideWinGeo = new THREE.PlaneGeometry(0.85, 0.32);
    const sideWin = new THREE.Mesh(sideWinGeo, glassMat.clone());
    sideWin.position.set(-0.12, 0.88, side * 0.48);
    sideWin.rotation.y = side > 0 ? 0 : Math.PI;
    group.add(sideWin);
  }

  // --- Wheel wells (half-cylinder indentations) ---
  const wheelWellMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.9,
    metalness: 0.0,
  });
  const wellPositions = [
    { x: 0.85, z: 0.56 },
    { x: 0.85, z: -0.56 },
    { x: -0.85, z: 0.56 },
    { x: -0.85, z: -0.56 },
  ];
  for (const wp of wellPositions) {
    const well = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.12, 16, 1, false, 0, Math.PI),
      wheelWellMat
    );
    well.rotation.x = Math.PI / 2;
    well.rotation.z = wp.z > 0 ? 0 : Math.PI;
    well.position.set(wp.x, 0.3, wp.z);
    group.add(well);
  }

  // --- Door seam lines ---
  for (const side of [1, -1]) {
    const seam = new THREE.Mesh(
      new THREE.BoxGeometry(0.005, 0.28, 0.01),
      seamMat
    );
    seam.position.set(-0.05, 0.52, side * 0.575);
    group.add(seam);

    const seamBottom = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.005, 0.01),
      seamMat
    );
    seamBottom.position.set(0.15, 0.37, side * 0.575);
    group.add(seamBottom);
  }

  // --- Headlights (larger, more visible) ---
  for (const side of [1, -1]) {
    const hl = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0xfff8dc,
        emissive: 0xfff8dc,
        emissiveIntensity: 1.0,
        roughness: 0.05,
        envMap,
      })
    );
    hl.scale.set(0.5, 0.8, 0.4);
    hl.position.set(1.53, 0.5, side * 0.32);
    group.add(hl);

    const hlRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.1, 0.012, 8, 24),
      chromeMat.clone()
    );
    hlRing.position.set(1.55, 0.5, side * 0.32);
    hlRing.rotation.y = Math.PI / 2;
    hlRing.scale.set(0.5, 0.8, 1);
    group.add(hlRing);
  }

  // --- Taillights ---
  for (const side of [1, -1]) {
    const tl = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.12, 0.18),
      new THREE.MeshStandardMaterial({
        color: 0xee1111,
        emissive: 0xee1111,
        emissiveIntensity: 0.7,
        roughness: 0.2,
      })
    );
    tl.position.set(-1.52, 0.48, side * 0.34);
    group.add(tl);
  }

  // --- Front bumper ---
  const bumperF = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.16, 1.05),
    chromeMat
  );
  bumperF.position.set(1.56, 0.3, 0);
  group.add(bumperF);

  // --- Rear bumper + license plate ---
  const bumperR = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.16, 1.05),
    chromeMat.clone()
  );
  bumperR.position.set(-1.55, 0.3, 0);
  group.add(bumperR);

  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.28, 0.14),
    new THREE.MeshStandardMaterial({
      color: 0xf5f5dc,
      roughness: 0.6,
      metalness: 0.0,
    })
  );
  plate.position.set(-1.59, 0.32, 0);
  plate.rotation.y = -Math.PI / 2;
  group.add(plate);

  // --- Grille ---
  const grilleGeo = new THREE.PlaneGeometry(0.22, 0.55);
  const grille = new THREE.Mesh(grilleGeo, plasticMat);
  grille.position.set(1.58, 0.45, 0);
  grille.rotation.y = Math.PI / 2;
  group.add(grille);

  // --- Side mirrors ---
  for (const side of [1, -1]) {
    const mirror = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 8, 8),
      chromeMat.clone()
    );
    mirror.scale.set(0.6, 1, 1.5);
    mirror.position.set(0.3, 0.72, side * 0.62);
    group.add(mirror);
  }

  group.userData.originalY = 0;
  return group;
}
