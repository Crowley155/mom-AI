import gsap from 'gsap';

export function glowPulse(material, emissiveColor, duration = 1.2) {
  return gsap.to(material, {
    emissiveIntensity: 0.6,
    duration: duration / 2,
    yoyo: true,
    repeat: 1,
    ease: 'power2.inOut',
  });
}

export function fadeOutGroup(group, duration = 0.8) {
  const tl = gsap.timeline();
  group.traverse((child) => {
    if (child.isMesh) {
      child.material = child.material.clone();
      child.material.transparent = true;
      tl.to(child.material, { opacity: 0, duration }, 0);
    }
  });
  tl.to(group.position, { y: group.position.y - 0.3, duration }, 0);
  return tl;
}

export function fadeInGroup(group, duration = 0.6) {
  const tl = gsap.timeline();
  group.traverse((child) => {
    if (child.isMesh) {
      tl.to(child.material, { opacity: 1, duration }, 0);
    }
  });
  tl.to(group.position, { y: group.userData.originalY ?? group.position.y, duration }, 0);
  return tl;
}

export function shakeGroup(group, intensity = 0.05, duration = 0.6) {
  return gsap.to(group.position, {
    x: `+=${intensity}`,
    yoyo: true,
    repeat: 5,
    duration: duration / 6,
    ease: 'power1.inOut',
  });
}

export function cameraMoveTo(camera, target, lookAt, duration = 1.5) {
  const tl = gsap.timeline();
  tl.to(camera.position, {
    x: target.x,
    y: target.y,
    z: target.z,
    duration,
    ease: 'power2.inOut',
    onUpdate: () => camera.lookAt(lookAt.x, lookAt.y, lookAt.z),
  });
  return tl;
}
