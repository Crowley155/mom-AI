import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import gsap from 'gsap';
import { loadCar } from './car/CarBuilder.js';
import { TourSequencer } from './tour/TourSequencer.js';
import { OverlayController } from './ui/overlay.js';
import { initMusic, playMusic, pauseMusic, stopMusic, setVolume } from './audio/music.js';

let scene, camera, renderer, car, parts, tourSequencer, overlay;
let autoRotate = true;
let envMap = null;
const clock = new THREE.Clock();
const lookAtTarget = new THREE.Vector3(0, 0.6, 0);

async function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    500
  );
  camera.position.set(5, 3, 5);
  camera.lookAt(lookAtTarget);

  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('scene'),
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  await setupEnvironment();
  setupLights();
  setupGround();

  const result = await loadCar(envMap);
  car = result.car;
  parts = result.parts;
  scene.add(car);

  overlay = new OverlayController();
  tourSequencer = new TourSequencer(camera, car, parts, overlay, lookAtTarget);

  initMusic();
  setupEvents();

  window.addEventListener('resize', onResize);
  animate();
}

function setupEnvironment() {
  return new Promise((resolve) => {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    new RGBELoader().load(`${import.meta.env.BASE_URL}hdri/environment.hdr`, (texture) => {
      envMap = pmremGenerator.fromEquirectangular(texture).texture;
      scene.environment = envMap;
      scene.background = envMap;
      scene.backgroundBlurriness = 0.02;
      scene.backgroundIntensity = 0.8;
      texture.dispose();
      pmremGenerator.dispose();
      resolve();
    });
  });
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
}

function setupGround() {
  const groundGeo = new THREE.CircleGeometry(20, 64);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x3a6b35,
    roughness: 0.95,
    metalness: 0.0,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  scene.add(ground);

  const shadowGeo = new THREE.PlaneGeometry(3.2, 1.4);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
  });
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(0, 0.005, 0);
  scene.add(contactShadow);
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

  const volumeSlider = document.getElementById('volume-slider');
  volumeSlider.addEventListener('input', () => {
    setVolume(parseInt(volumeSlider.value) / 100);
  });

  document.getElementById('back-btn').addEventListener('click', () => {
    tourSequencer.skipToPrev();
  });

  document.getElementById('skip-btn').addEventListener('click', () => {
    tourSequencer.skipToNext();
  });

  document.getElementById('replay-btn').addEventListener('click', () => {
    overlay.hideFinale();
    tourSequencer.reset();
    stopMusic();
    autoRotate = false;

    gsap.to(camera.position, {
      x: 5, y: 3, z: 5,
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
    const radius = 6;
    camera.position.x = Math.cos(elapsed * 0.12) * radius;
    camera.position.z = Math.sin(elapsed * 0.12) * radius;
    camera.position.y = 2.5 + Math.sin(elapsed * 0.2) * 0.3;
    camera.lookAt(lookAtTarget);
  }

  renderer.render(scene, camera);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
