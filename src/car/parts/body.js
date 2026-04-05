import * as THREE from 'three';
import { createCarbonNormal } from '../proceduralTextures.js';

const BASE = import.meta.env.BASE_URL;

export function createBody(envMap) {
  const group = new THREE.Group();
  group.name = 'body';

  /* ── Materials ─────────────────────────────────────── */
  const paintMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a472a,
    metalness: 0.7,
    roughness: 0.22,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    envMap,
    envMapIntensity: 1.4,
  });

  const darkPaintMat = new THREE.MeshPhysicalMaterial({
    color: 0x0e2218,
    metalness: 0.5,
    roughness: 0.35,
    clearcoat: 0.7,
    clearcoatRoughness: 0.08,
    envMap,
    envMapIntensity: 0.8,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x88ccaa,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.92,
    thickness: 0.2,
    ior: 1.52,
    envMap,
    envMapIntensity: 0.8,
    side: THREE.DoubleSide,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    metalness: 0.95,
    roughness: 0.05,
    envMap,
    envMapIntensity: 1.8,
  });

  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.3,
    roughness: 0.4,
    envMap,
    envMapIntensity: 0.6,
  });

  const plasticMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.85,
  });

  const seamMat = new THREE.MeshStandardMaterial({
    color: 0x0a1e12,
    roughness: 0.5,
    metalness: 0.3,
  });

  /* ── Floor Pan ─────────────────────────────────────── */
  const floorShape = new THREE.Shape();
  floorShape.moveTo(-1.60, 0.04);
  floorShape.lineTo(1.64, 0.04);
  floorShape.bezierCurveTo(1.72, 0.04, 1.74, 0.08, 1.72, 0.14);
  floorShape.lineTo(-1.56, 0.14);
  floorShape.bezierCurveTo(-1.66, 0.14, -1.68, 0.08, -1.60, 0.04);
  floorShape.closePath();

  const floorGeo = new THREE.ExtrudeGeometry(floorShape, {
    depth: 1.50, bevelEnabled: true,
    bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3,
  });
  floorGeo.translate(0, 0, -0.75);
  group.add(new THREE.Mesh(floorGeo, darkPaintMat));

  /* ── Main Body Shell (Aston Martin flowing profile) ── */
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-1.56, 0.14);
  bodyShape.lineTo(1.58, 0.14);
  bodyShape.bezierCurveTo(1.64, 0.14, 1.68, 0.18, 1.70, 0.26);
  bodyShape.bezierCurveTo(1.72, 0.34, 1.70, 0.40, 1.66, 0.44);
  bodyShape.bezierCurveTo(1.60, 0.47, 1.40, 0.49, 1.10, 0.49);
  bodyShape.bezierCurveTo(0.85, 0.49, 0.55, 0.48, 0.35, 0.47);
  bodyShape.lineTo(-0.62, 0.50);
  bodyShape.bezierCurveTo(-0.95, 0.51, -1.25, 0.50, -1.44, 0.48);
  bodyShape.bezierCurveTo(-1.54, 0.46, -1.60, 0.38, -1.62, 0.28);
  bodyShape.bezierCurveTo(-1.64, 0.20, -1.62, 0.16, -1.56, 0.14);
  bodyShape.closePath();

  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 1.38, bevelEnabled: true,
    bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 6,
  });
  bodyGeo.translate(0, 0, -0.69);
  group.add(new THREE.Mesh(bodyGeo, paintMat));

  /* ── Hood Panel (long, low power dome) ─────────────── */
  const hoodShape = new THREE.Shape();
  hoodShape.moveTo(0.32, 0.47);
  hoodShape.bezierCurveTo(0.55, 0.48, 0.90, 0.49, 1.20, 0.49);
  hoodShape.bezierCurveTo(1.45, 0.49, 1.58, 0.48, 1.62, 0.46);
  hoodShape.bezierCurveTo(1.64, 0.49, 1.60, 0.52, 1.50, 0.53);
  hoodShape.bezierCurveTo(1.20, 0.54, 0.85, 0.54, 0.60, 0.53);
  hoodShape.bezierCurveTo(0.44, 0.52, 0.36, 0.50, 0.32, 0.49);
  hoodShape.closePath();

  const hoodGeo = new THREE.ExtrudeGeometry(hoodShape, {
    depth: 1.20, bevelEnabled: true,
    bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 4,
  });
  hoodGeo.translate(0, 0, -0.60);
  group.add(new THREE.Mesh(hoodGeo, paintMat.clone()));

  /* ── Cabin / Greenhouse ────────────────────────────── */
  const cabinShape = new THREE.Shape();
  cabinShape.moveTo(0.28, 0.48);
  cabinShape.bezierCurveTo(0.22, 0.56, 0.12, 0.66, 0.00, 0.74);
  cabinShape.bezierCurveTo(-0.08, 0.79, -0.16, 0.82, -0.26, 0.83);
  cabinShape.bezierCurveTo(-0.36, 0.83, -0.44, 0.82, -0.50, 0.78);
  cabinShape.bezierCurveTo(-0.56, 0.72, -0.62, 0.62, -0.66, 0.54);
  cabinShape.bezierCurveTo(-0.68, 0.50, -0.66, 0.49, -0.62, 0.49);
  cabinShape.lineTo(0.28, 0.48);
  cabinShape.closePath();

  const cabinGeo = new THREE.ExtrudeGeometry(cabinShape, {
    depth: 1.00, bevelEnabled: true,
    bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 5,
  });
  cabinGeo.translate(0, 0, -0.50);
  group.add(new THREE.Mesh(cabinGeo, paintMat.clone()));

  /* ── Front Fender Arches ───────────────────────────── */
  for (const s of [1, -1]) {
    const archGeo = new THREE.TorusGeometry(0.36, 0.07, 10, 20, Math.PI);
    const arch = new THREE.Mesh(archGeo, paintMat.clone());
    arch.position.set(0.90, 0.38, s * 0.72);
    arch.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2;
    group.add(arch);

    const fenderBulge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.36, 0.10, 20, 1, false, 0, Math.PI),
      paintMat.clone()
    );
    fenderBulge.rotation.x = s > 0 ? -Math.PI / 2 : Math.PI / 2;
    fenderBulge.position.set(0.90, 0.38, s * 0.72);
    group.add(fenderBulge);
  }

  /* ── Rear Fender Arches (wider, more muscular) ─────── */
  for (const s of [1, -1]) {
    const archGeo = new THREE.TorusGeometry(0.40, 0.09, 10, 20, Math.PI);
    const arch = new THREE.Mesh(archGeo, paintMat.clone());
    arch.position.set(-0.90, 0.38, s * 0.74);
    arch.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2;
    group.add(arch);

    const fenderBulge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.38, 0.14, 20, 1, false, 0, Math.PI),
      paintMat.clone()
    );
    fenderBulge.rotation.x = s > 0 ? -Math.PI / 2 : Math.PI / 2;
    fenderBulge.position.set(-0.90, 0.38, s * 0.76);
    group.add(fenderBulge);
  }

  /* ── Wheel Well Liners ─────────────────────────────── */
  const wellMat = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.95 });
  for (const wp of [
    { x: 0.90, z: 0.70 }, { x: 0.90, z: -0.70 },
    { x: -0.90, z: 0.70 }, { x: -0.90, z: -0.70 },
  ]) {
    const well = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.34, 0.12, 20, 1, false, 0, Math.PI),
      wellMat
    );
    well.rotation.x = Math.PI / 2;
    well.rotation.z = wp.z > 0 ? 0 : Math.PI;
    well.position.set(wp.x, 0.36, wp.z);
    group.add(well);
  }

  /* ── Windshield (steeply raked, wide) ──────────────── */
  const wsShape = new THREE.Shape();
  wsShape.moveTo(-0.48, 0.0);
  wsShape.lineTo(0.48, 0.0);
  wsShape.bezierCurveTo(0.46, 0.10, 0.42, 0.22, 0.36, 0.32);
  wsShape.bezierCurveTo(0.28, 0.38, 0.14, 0.40, 0.0, 0.40);
  wsShape.bezierCurveTo(-0.14, 0.40, -0.28, 0.38, -0.36, 0.32);
  wsShape.bezierCurveTo(-0.42, 0.22, -0.46, 0.10, -0.48, 0.0);
  wsShape.closePath();

  const wsMesh = new THREE.Mesh(new THREE.ShapeGeometry(wsShape), glassMat);
  wsMesh.position.set(0.30, 0.52, 0);
  wsMesh.rotation.y = Math.PI / 2;
  wsMesh.rotation.z = -0.35;
  group.add(wsMesh);

  /* ── Rear Window (fastback) ────────────────────────── */
  const rwShape = new THREE.Shape();
  rwShape.moveTo(-0.42, 0.0);
  rwShape.lineTo(0.42, 0.0);
  rwShape.bezierCurveTo(0.40, 0.06, 0.36, 0.16, 0.30, 0.24);
  rwShape.bezierCurveTo(0.22, 0.30, 0.12, 0.32, 0.0, 0.32);
  rwShape.bezierCurveTo(-0.12, 0.32, -0.22, 0.30, -0.30, 0.24);
  rwShape.bezierCurveTo(-0.36, 0.16, -0.40, 0.06, -0.42, 0.0);
  rwShape.closePath();

  const rwMesh = new THREE.Mesh(new THREE.ShapeGeometry(rwShape), glassMat.clone());
  rwMesh.position.set(-0.56, 0.52, 0);
  rwMesh.rotation.y = Math.PI / 2;
  rwMesh.rotation.z = 0.28;
  group.add(rwMesh);

  /* ── Side Windows (tapered, follows cabin curve) ───── */
  for (const s of [1, -1]) {
    const swShape = new THREE.Shape();
    swShape.moveTo(0.0, 0.0);
    swShape.lineTo(0.72, 0.0);
    swShape.bezierCurveTo(0.70, 0.08, 0.62, 0.20, 0.50, 0.26);
    swShape.bezierCurveTo(0.36, 0.30, 0.18, 0.30, 0.06, 0.24);
    swShape.bezierCurveTo(-0.02, 0.18, -0.04, 0.10, 0.0, 0.0);
    swShape.closePath();

    const sw = new THREE.Mesh(new THREE.ShapeGeometry(swShape), glassMat.clone());
    sw.position.set(-0.40, 0.54, s * 0.52);
    sw.rotation.y = s > 0 ? 0 : Math.PI;
    group.add(sw);
  }

  /* ── Quarter Windows (small triangular) ────────────── */
  for (const s of [1, -1]) {
    const qwShape = new THREE.Shape();
    qwShape.moveTo(0.0, 0.0);
    qwShape.lineTo(0.16, 0.0);
    qwShape.lineTo(0.06, 0.14);
    qwShape.closePath();

    const qw = new THREE.Mesh(new THREE.ShapeGeometry(qwShape), glassMat.clone());
    qw.position.set(0.22, 0.54, s * 0.52);
    qw.rotation.y = s > 0 ? 0 : Math.PI;
    group.add(qw);
  }

  /* ── Headlights (slim, swept-back LEDs) ────────────── */
  const ledMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0xfff8dc,
    emissiveIntensity: 1.8, roughness: 0.02,
  });
  const hlLensMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 0.7, thickness: 0.1, roughness: 0.02,
    envMap, envMapIntensity: 0.5,
  });

  for (const s of [1, -1]) {
    const hlShape = new THREE.Shape();
    hlShape.moveTo(0.0, 0.0);
    hlShape.bezierCurveTo(0.06, 0.01, 0.14, 0.02, 0.22, 0.01);
    hlShape.bezierCurveTo(0.28, 0.005, 0.30, -0.01, 0.28, -0.025);
    hlShape.bezierCurveTo(0.24, -0.04, 0.12, -0.04, 0.06, -0.03);
    hlShape.bezierCurveTo(0.02, -0.02, -0.01, -0.01, 0.0, 0.0);
    hlShape.closePath();

    const hlGeo = new THREE.ExtrudeGeometry(hlShape, {
      depth: 0.06, bevelEnabled: true,
      bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 2,
    });

    const hlHousing = new THREE.Mesh(hlGeo, plasticMat);
    hlHousing.position.set(1.62, 0.42, s * 0.22);
    hlHousing.rotation.y = s > 0 ? 0 : Math.PI;
    group.add(hlHousing);

    const ledStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.012, 0.04),
      ledMat
    );
    ledStrip.position.set(1.66, 0.42, s * 0.30);
    group.add(ledStrip);

    const hlLens = new THREE.Mesh(
      new THREE.PlaneGeometry(0.26, 0.04),
      hlLensMat.clone()
    );
    hlLens.position.set(1.67, 0.42, s * 0.30);
    hlLens.rotation.y = Math.PI / 2;
    group.add(hlLens);
  }

  /* ── Taillights (full-width LED bar) ───────────────── */
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xff1111, emissive: 0xff0000,
    emissiveIntensity: 1.2, roughness: 0.1,
  });

  const tailBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.035, 1.10),
    tailMat
  );
  tailBar.position.set(-1.61, 0.44, 0);
  group.add(tailBar);

  const tailBarChrome = new THREE.Mesh(
    new THREE.BoxGeometry(0.01, 0.045, 1.14),
    chromeMat.clone()
  );
  tailBarChrome.position.set(-1.615, 0.44, 0);
  group.add(tailBarChrome);

  for (const s of [1, -1]) {
    const tailCluster = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.06, 0.18),
      tailMat.clone()
    );
    tailCluster.position.set(-1.60, 0.44, s * 0.40);
    group.add(tailCluster);
  }

  /* ── Grille (Aston Martin "mouth" shape) ───────────── */
  const grilleShape = new THREE.Shape();
  grilleShape.moveTo(-0.08, 0.0);
  grilleShape.bezierCurveTo(-0.20, 0.02, -0.30, 0.08, -0.30, 0.14);
  grilleShape.bezierCurveTo(-0.30, 0.20, -0.22, 0.24, -0.08, 0.24);
  grilleShape.lineTo(0.08, 0.24);
  grilleShape.bezierCurveTo(0.22, 0.24, 0.30, 0.20, 0.30, 0.14);
  grilleShape.bezierCurveTo(0.30, 0.08, 0.20, 0.02, 0.08, 0.0);
  grilleShape.closePath();

  const grilleMesh = new THREE.Mesh(
    new THREE.ShapeGeometry(grilleShape),
    plasticMat
  );
  grilleMesh.position.set(1.68, 0.18, 0);
  grilleMesh.rotation.y = Math.PI / 2;
  group.add(grilleMesh);

  const grilleFrame = new THREE.Mesh(
    new THREE.ShapeGeometry(grilleShape),
    chromeMat.clone()
  );
  grilleFrame.position.set(1.685, 0.18, 0);
  grilleFrame.rotation.y = Math.PI / 2;
  grilleFrame.scale.set(1.05, 1.05, 1);
  group.add(grilleFrame);

  for (let i = 0; i < 7; i++) {
    const vane = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, 0.005, 0.52),
      chromeMat.clone()
    );
    vane.position.set(1.69, 0.22 + i * 0.024, 0);
    group.add(vane);
  }

  /* ── Front Bumper / Splitter ───────────────────────── */
  const fBumperShape = new THREE.Shape();
  fBumperShape.moveTo(-0.68, 0);
  fBumperShape.bezierCurveTo(-0.72, 0.03, -0.72, 0.08, -0.68, 0.10);
  fBumperShape.lineTo(0.68, 0.10);
  fBumperShape.bezierCurveTo(0.72, 0.08, 0.72, 0.03, 0.68, 0);
  fBumperShape.closePath();

  const fBumper = new THREE.Mesh(
    new THREE.ShapeGeometry(fBumperShape),
    darkPaintMat.clone()
  );
  fBumper.position.set(1.70, 0.14, 0);
  fBumper.rotation.y = Math.PI / 2;
  group.add(fBumper);

  const splitter = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.012, 1.42),
    carbonMat
  );
  splitter.position.set(1.72, 0.06, 0);
  group.add(splitter);

  /* ── Rear Bumper / Diffuser ────────────────────────── */
  const rBumper = new THREE.Mesh(
    new THREE.ShapeGeometry(fBumperShape),
    darkPaintMat.clone()
  );
  rBumper.position.set(-1.62, 0.14, 0);
  rBumper.rotation.y = -Math.PI / 2;
  group.add(rBumper);

  const diffuser = new THREE.Mesh(
    new THREE.BoxGeometry(0.20, 0.012, 1.30),
    carbonMat.clone()
  );
  diffuser.position.set(-1.64, 0.06, 0);
  group.add(diffuser);

  for (let i = -3; i <= 3; i++) {
    const fin = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.05, 0.008),
      carbonMat.clone()
    );
    fin.position.set(-1.58, 0.09, i * 0.14);
    fin.rotation.z = 0.12;
    group.add(fin);
  }

  /* ── Integrated Lip Spoiler ────────────────────────── */
  const lipShape = new THREE.Shape();
  lipShape.moveTo(-0.06, 0);
  lipShape.bezierCurveTo(-0.06, 0.02, -0.04, 0.03, 0.0, 0.03);
  lipShape.bezierCurveTo(0.04, 0.03, 0.06, 0.02, 0.06, 0);
  lipShape.closePath();

  const lipGeo = new THREE.ExtrudeGeometry(lipShape, {
    depth: 1.10, bevelEnabled: true,
    bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2,
  });
  lipGeo.translate(0, 0, -0.55);
  const lip = new THREE.Mesh(lipGeo, darkPaintMat.clone());
  lip.position.set(-1.50, 0.49, 0);
  group.add(lip);

  /* ── Side Sill / Rocker Panel ──────────────────────── */
  for (const s of [1, -1]) {
    const sillShape = new THREE.Shape();
    sillShape.moveTo(-1.30, 0);
    sillShape.lineTo(1.30, 0);
    sillShape.bezierCurveTo(1.34, 0, 1.36, 0.01, 1.36, 0.025);
    sillShape.lineTo(-1.26, 0.025);
    sillShape.bezierCurveTo(-1.32, 0.025, -1.34, 0.01, -1.30, 0);
    sillShape.closePath();

    const sill = new THREE.Mesh(
      new THREE.ShapeGeometry(sillShape),
      darkPaintMat.clone()
    );
    sill.position.set(0, 0.14, s * 0.72);
    sill.rotation.y = s > 0 ? 0 : Math.PI;
    group.add(sill);
  }

  /* ── Door Seam Lines ───────────────────────────────── */
  for (const s of [1, -1]) {
    const seamV = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.32, 0.006), seamMat);
    seamV.position.set(-0.10, 0.35, s * 0.71);
    group.add(seamV);
    const seamH = new THREE.Mesh(new THREE.BoxGeometry(0.90, 0.004, 0.006), seamMat);
    seamH.position.set(0.10, 0.20, s * 0.71);
    group.add(seamH);
  }

  /* ── Flush Door Handles ────────────────────────────── */
  for (const s of [1, -1]) {
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.10, 0.015, 0.008),
      chromeMat.clone()
    );
    handle.position.set(-0.02, 0.40, s * 0.72);
    group.add(handle);
  }

  /* ── Side Air Vents (behind front wheels) ──────────── */
  for (const s of [1, -1]) {
    for (let i = 0; i < 4; i++) {
      const vent = new THREE.Mesh(
        new THREE.BoxGeometry(0.10, 0.006, 0.006),
        chromeMat.clone()
      );
      vent.position.set(0.52 + i * 0.035, 0.34 + i * 0.012, s * 0.72);
      group.add(vent);
    }
    const ventBack = new THREE.Mesh(
      new THREE.PlaneGeometry(0.18, 0.06),
      plasticMat
    );
    ventBack.position.set(0.57, 0.36, s * 0.715);
    ventBack.rotation.y = s > 0 ? 0 : Math.PI;
    group.add(ventBack);
  }

  /* ── Side Mirrors (teardrop housing) ───────────────── */
  for (const s of [1, -1]) {
    const stalk = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.015, 0.06),
      darkPaintMat.clone()
    );
    stalk.position.set(0.22, 0.56, s * 0.54);
    group.add(stalk);

    const housingGeo = new THREE.SphereGeometry(0.035, 12, 8);
    housingGeo.scale(1.8, 1.0, 1.2);
    const housing = new THREE.Mesh(housingGeo, darkPaintMat.clone());
    housing.position.set(0.22, 0.56, s * 0.60);
    group.add(housing);

    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(0.06, 0.04),
      new THREE.MeshStandardMaterial({
        color: 0xaacccc, metalness: 0.95, roughness: 0.02,
        envMap, envMapIntensity: 2.0,
      })
    );
    face.position.set(0.22, 0.56, s * 0.635);
    face.rotation.y = s > 0 ? 0 : Math.PI;
    group.add(face);
  }

  /* ── License Plate ─────────────────────────────────── */
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.26, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xf5f5dc, roughness: 0.6 })
  );
  plate.position.set(-1.64, 0.26, 0);
  plate.rotation.y = -Math.PI / 2;
  group.add(plate);

  /* ── Exhaust Tips ──────────────────────────────────── */
  for (const s of [1, -1]) {
    const tipOuter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.035, 0.06, 16),
      chromeMat.clone()
    );
    tipOuter.rotation.z = Math.PI / 2;
    tipOuter.position.set(-1.66, 0.12, s * 0.32);
    group.add(tipOuter);

    const tipInner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.026, 0.07, 16),
      new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3, metalness: 0.8 })
    );
    tipInner.rotation.z = Math.PI / 2;
    tipInner.position.set(-1.67, 0.12, s * 0.32);
    group.add(tipInner);
  }

  /* ── JCPRD Logo Decals (async — silent fail) ───────── */
  const texLoader = new THREE.TextureLoader();
  texLoader.load(
    BASE + 'textures/jcprd-logo.png',
    (logoTex) => {
      logoTex.colorSpace = THREE.SRGBColorSpace;
      const aspect = logoTex.image.width / logoTex.image.height;
      const h = 0.18;
      const w = h * aspect;
      const logoMat = new THREE.MeshBasicMaterial({
        map: logoTex,
        transparent: true,
        alphaTest: 0.1,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const logoGeo = new THREE.PlaneGeometry(w, h);

      const logoR = new THREE.Mesh(logoGeo, logoMat);
      logoR.position.set(0.05, 0.36, 0.73);
      logoR.castShadow = false;
      logoR.receiveShadow = false;
      logoR.userData.isDecal = true;
      group.add(logoR);

      const logoL = new THREE.Mesh(logoGeo.clone(), logoMat.clone());
      logoL.position.set(0.05, 0.36, -0.73);
      logoL.rotation.y = Math.PI;
      logoL.castShadow = false;
      logoL.receiveShadow = false;
      logoL.userData.isDecal = true;
      group.add(logoL);
    },
    undefined, () => {}
  );

  /* ── Carbon fiber normal map ───────────────────────── */
  const carbonNorm = createCarbonNormal();
  carbonNorm.repeat.set(4, 4);
  carbonMat.normalMap = carbonNorm;
  carbonMat.normalScale = new THREE.Vector2(0.6, 0.6);

  group.userData.originalY = 0;
  return group;
}
