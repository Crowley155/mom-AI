import * as THREE from 'three';

export function createCarbonNormal(size = 256) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');

  const cell = 6;
  for (let y = 0; y < size; y += cell * 2) {
    for (let x = 0; x < size; x += cell * 2) {
      // Two-pass twill: horizontal-dominant and vertical-dominant cells alternate
      ctx.fillStyle = 'rgb(140,125,255)';
      ctx.fillRect(x, y, cell, cell);
      ctx.fillRect(x + cell, y + cell, cell, cell);

      ctx.fillStyle = 'rgb(118,140,255)';
      ctx.fillRect(x + cell, y, cell, cell);
      ctx.fillRect(x, y + cell, cell, cell);

      // Highlight edges at each crossover
      ctx.fillStyle = 'rgb(150,130,255)';
      ctx.fillRect(x, y, cell, 1);
      ctx.fillRect(x + cell, y + cell, cell, 1);

      ctx.fillStyle = 'rgb(110,148,255)';
      ctx.fillRect(x + cell, y, 1, cell);
      ctx.fillRect(x, y + cell, 1, cell);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createTireNormal(w = 512, h = 128) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');

  // Flat normal base
  ctx.fillStyle = 'rgb(128,128,255)';
  ctx.fillRect(0, 0, w, h);

  // V-shaped grooves repeating across the width
  const grooveSpacing = 40;
  const grooveW = 3;
  ctx.lineWidth = grooveW;

  for (let gx = 0; gx < w; gx += grooveSpacing) {
    // Left edge of groove (normal deflects left)
    ctx.strokeStyle = 'rgb(100,128,240)';
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx + 14, h / 2);
    ctx.lineTo(gx, h);
    ctx.stroke();

    // Right edge of groove (normal deflects right)
    ctx.strokeStyle = 'rgb(156,128,240)';
    ctx.beginPath();
    ctx.moveTo(gx + grooveW + 1, 0);
    ctx.lineTo(gx + 14 + grooveW + 1, h / 2);
    ctx.lineTo(gx + grooveW + 1, h);
    ctx.stroke();

    // Dark channel center
    ctx.strokeStyle = 'rgb(128,128,220)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gx + 2, 0);
    ctx.lineTo(gx + 16, h / 2);
    ctx.lineTo(gx + 2, h);
    ctx.stroke();
    ctx.lineWidth = grooveW;
  }

  // Lateral sipes (thin horizontal lines)
  ctx.strokeStyle = 'rgb(128,110,245)';
  ctx.lineWidth = 1;
  for (let sy = 8; sy < h; sy += 16) {
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.lineTo(w, sy);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createBrakeDiscMap(size = 256) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;

  // Base metallic gray
  ctx.fillStyle = '#707070';
  ctx.fillRect(0, 0, size, size);

  // Outer disc ring
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.48, 0, Math.PI * 2);
  ctx.fillStyle = '#888';
  ctx.fill();

  // Radial scoring lines
  ctx.strokeStyle = '#6a6a6a';
  ctx.lineWidth = 0.5;
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 40) {
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * size * 0.18, cy + Math.sin(a) * size * 0.18);
    ctx.lineTo(cx + Math.cos(a) * size * 0.47, cy + Math.sin(a) * size * 0.47);
    ctx.stroke();
  }

  // Cross-drilled holes (two rings)
  ctx.fillStyle = '#3a3a3a';
  for (const ringR of [0.28, 0.39]) {
    const holeCount = ringR < 0.3 ? 16 : 24;
    for (let i = 0; i < holeCount; i++) {
      const a = (i / holeCount) * Math.PI * 2;
      const hx = cx + Math.cos(a) * size * ringR;
      const hy = cy + Math.sin(a) * size * ringR;
      ctx.beginPath();
      ctx.arc(hx, hy, size * 0.012, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Hub center
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = '#5a5a5a';
  ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  return tex;
}
