import * as THREE from 'three';
import gsap from 'gsap';
import { loadCar } from './car/CarBuilder.js';
import { TourSequencer } from './tour/TourSequencer.js';
import { OverlayController } from './ui/overlay.js';
import { initMusic, playMusic, pauseMusic, stopMusic, setVolume } from './audio/music.js';
import { setVOMuted, setVOVolume } from './audio/voiceover.js';
import { createGrass } from './scene/grass.js';
import { createParticles } from './scene/particles.js';
import { createTrees } from './scene/trees.js';
import { runSceneAudit } from './diagnostics/sceneAudit.js';

let scene, camera, renderer, car, parts, tourSequencer, overlay;
let autoRotate = true;
let envMap = null;
let grassCtrl, particleCtrl;
const clock = new THREE.Clock();
const lookAtTarget = new THREE.Vector3(0, 0.25, 0);

async function init() {
  scene = new THREE.Scene();
  // no fog — sunny day

  camera = new THREE.PerspectiveCamera(
    getFov(),
    window.innerWidth / window.innerHeight,
    0.1,
    500
  );
  camera.position.set(2.5, 1.2, 2.5);
  camera.lookAt(lookAtTarget);

  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('scene'),
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.LinearToneMapping;
  renderer.toneMappingExposure = 1.0;

  setupEnvironment();
  setupLights();
  setupGround();

  const result = await loadCar(envMap);
  car = result.car;
  parts = result.parts;
  scene.add(car);

  if (new URLSearchParams(window.location.search).has('qa')) {
    runSceneAudit(scene, car, parts, camera);
  }

  overlay = new OverlayController();
  tourSequencer = new TourSequencer(camera, car, parts, overlay, lookAtTarget);

  initMusic();
  setupEvents();

  window.addEventListener('resize', onResize);
  animate();
}

function setupEnvironment() {
  const pmrem = new THREE.PMREMGenerator(renderer);

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x88ccee);
  envScene.add(new THREE.HemisphereLight(0x88ccee, 0x44aa44, 1.0));
  const sunForEnv = new THREE.DirectionalLight(0xffffee, 2.0);
  sunForEnv.position.set(1, 1, 1);
  envScene.add(sunForEnv);

  envMap = pmrem.fromScene(envScene).texture;
  scene.environment = envMap;
  scene.environmentIntensity = 0.6;
  scene.background = new THREE.Color(0x87ceeb);

  pmrem.dispose();
  buildSkyDome();
}

function buildSkyDome() {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0.0,  '#3a8ec8');
  grad.addColorStop(0.15, '#4a9ed5');
  grad.addColorStop(0.30, '#5aade0');
  grad.addColorStop(0.45, '#6ab8e5');
  grad.addColorStop(0.55, '#7ec5ea');
  grad.addColorStop(0.65, '#96d2ee');
  grad.addColorStop(0.78, '#b8e0ec');
  grad.addColorStop(0.88, '#c8e8d8');
  grad.addColorStop(1.0,  '#9ecc8e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 4, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.flipY = false;
  const geo = new THREE.SphereGeometry(200, 32, 16);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const dome = new THREE.Mesh(geo, mat);
  scene.add(dome);
}

function setupLights() {
  const sun = new THREE.DirectionalLight(0xfff5e6, 2.0);
  sun.position.set(5, 10, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 30;
  sun.shadow.camera.left = -6;
  sun.shadow.camera.right = 6;
  sun.shadow.camera.top = 6;
  sun.shadow.camera.bottom = -6;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0x8ec8f0, 0.5);
  fill.position.set(-4, 3, -3);
  scene.add(fill);

  const hemi = new THREE.HemisphereLight(0x87ceeb, 0x3a6b35, 0.3);
  scene.add(hemi);
}

function setupGround() {
  const RADIUS = 20;
  const SEGS   = 64;
  const groundGeo = new THREE.CircleGeometry(RADIUS, SEGS);

  const grassR = 0.22, grassG = 0.75, grassB = 0.10;
  const horizR = 0.62, horizG = 0.80, horizB = 0.55;

  const count  = groundGeo.attributes.position.count;
  const colors = new Float32Array(count * 3);
  const pos    = groundGeo.attributes.position;
  for (let i = 0; i < count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const d = Math.sqrt(x * x + y * y) / RADIUS;
    const t = Math.pow(Math.max(0, (d - 0.5)) / 0.5, 2.0);
    colors[i * 3]     = grassR + (horizR - grassR) * t;
    colors[i * 3 + 1] = grassG + (horizG - grassG) * t;
    colors[i * 3 + 2] = grassB + (horizB - grassB) * t;
  }
  groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const groundMat = new THREE.MeshLambertMaterial({
    vertexColors: true,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);

  grassCtrl    = createGrass(scene);
  particleCtrl = createParticles(scene);
  createTrees(scene);
}

function setupEvents() {
  document.getElementById('start-btn').addEventListener('click', () => {
    overlay.hideIntro();
    autoRotate = false;
    playMusic();
    setTimeout(() => tourSequencer.start(), 600);
  });

  document.getElementById('pause-btn').addEventListener('click', () => {
    const isPaused = tourSequencer.togglePause();
    overlay.updatePauseButton(isPaused);
    if (isPaused) pauseMusic();
    else playMusic();
  });

  const musicSlider = document.getElementById('music-slider');
  musicSlider.addEventListener('input', () => {
    setVolume(parseInt(musicSlider.value) / 100);
  });

  const voSlider = document.getElementById('vo-slider');
  voSlider.addEventListener('input', () => {
    setVOVolume(parseInt(voSlider.value) / 100);
  });

  document.getElementById('back-btn').addEventListener('click', () => {
    tourSequencer.skipToPrev();
  });

  document.getElementById('skip-btn').addEventListener('click', () => {
    tourSequencer.skipToNext();
  });

  // VO mute toggle
  let voMuted = false;
  const voToggle = document.getElementById('vo-toggle');
  voToggle.addEventListener('click', () => {
    voMuted = !voMuted;
    setVOMuted(voMuted);
    voToggle.textContent = voMuted ? '🔇' : '🔊';
    voToggle.classList.toggle('muted', voMuted);
    voToggle.title = voMuted ? 'Voiceover off — click to enable' : 'Toggle voiceover narration';
  });

  // Reading speed control — 0.5× = slower fallback, 1× = normal, 2× = faster fallback
  // (When VO is active this only affects the safety-net muted-fallback duration)
  const speeds = [
    { id: 'speed-half',   multiplier: 2.0 },
    { id: 'speed-normal', multiplier: 1.0 },
    { id: 'speed-double', multiplier: 0.5 },
  ];
  speeds.forEach(({ id, multiplier }) => {
    document.getElementById(id).addEventListener('click', () => {
      speeds.forEach(s => document.getElementById(s.id).classList.remove('active'));
      document.getElementById(id).classList.add('active');
      tourSequencer.setSpeed(multiplier);
    });
  });

  // Text size toggle — Normal / Large
  const textSizes = [
    { id: 'text-normal', cls: false },
    { id: 'text-large',  cls: true  },
  ];
  textSizes.forEach(({ id, cls }) => {
    document.getElementById(id).addEventListener('click', () => {
      textSizes.forEach(s => document.getElementById(s.id).classList.remove('active'));
      document.getElementById(id).classList.add('active');
      document.body.classList.toggle('text-large', cls);
      overlay.clearSavedSizes();
    });
  });

  // Autoplay toggle — highlighted = ON, faded = OFF
  let _autoplay = true;
  const autoplayToggle = document.getElementById('autoplay-toggle');
  autoplayToggle.addEventListener('click', () => {
    _autoplay = !_autoplay;
    tourSequencer.setManual(!_autoplay);
    autoplayToggle.classList.toggle('active', _autoplay);
    autoplayToggle.title = _autoplay ? 'Autoplay enabled' : 'Autoplay disabled — use Next to advance';
  });

  document.getElementById('replay-btn').addEventListener('click', () => {
    overlay.hideFinale();
    tourSequencer.reset();
    stopMusic();
    autoRotate = false;

    gsap.to(camera.position, {
      x: 2.5, y: 1.2, z: 2.5,
      duration: 1.2,
      ease: 'power2.inOut',
      onUpdate: () => camera.lookAt(lookAtTarget),
      onComplete: () => {
        playMusic();
        tourSequencer.start();
      },
    });
  });
}

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  if (autoRotate) {
    const radius = 3.5;
    camera.position.x = Math.cos(elapsed * 0.12) * radius;
    camera.position.z = Math.sin(elapsed * 0.12) * radius;
    camera.position.y = 1.0 + Math.sin(elapsed * 0.2) * 0.15;
    camera.lookAt(lookAtTarget);
  }

  if (grassCtrl)    grassCtrl.update(elapsed);
  if (particleCtrl) particleCtrl.update(elapsed);

  renderer.render(scene, camera);
}

/** Returns a wider FOV on narrow screens so the full car stays in frame */
function getFov() {
  if (window.innerWidth < 480) return 70;
  if (window.innerWidth < 768) return 60;
  return 50;
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.fov = getFov();
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
