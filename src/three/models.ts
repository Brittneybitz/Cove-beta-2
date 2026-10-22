import * as THREE from 'three';
import { CreatureType } from '../types/game';

export interface CreatureRig {
  root: THREE.Group;
  tail?: THREE.Group;
  flukes?: THREE.Object3D;
  leftFin?: THREE.Object3D;
  rightFin?: THREE.Object3D;
  wings?: { left: THREE.Object3D; right: THREE.Object3D };
  nameSprite?: THREE.Sprite;
  creatureType: CreatureType;
  updateAnimation: (time: number, speedMultiplier: number) => void;
}

// Helper to generate procedural canvas texture for countershading or markings
function createOrcaSkinTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Base deep glossy black
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 256);

  // White belly pattern (bottom half)
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.ellipse(256, 210, 210, 42, 0, 0, Math.PI * 2);
  ctx.fill();

  // White eye patch marking
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(380, 85, 45, 18, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(132, 85, 45, 18, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Grey saddle patch
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.ellipse(256, 110, 60, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createNameplate(text: string, subtext: string = ''): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 140;
  const ctx = canvas.getContext('2d')!;

  // Background badge
  ctx.fillStyle = 'rgba(7, 24, 46, 0.88)';
  ctx.roundRect ? ctx.roundRect(16, 16, 480, 108, 20) : ctx.fillRect(16, 16, 480, 108);
  ctx.fill();

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.roundRect ? ctx.roundRect(16, 16, 480, 108, 20) : ctx.strokeRect(16, 16, 480, 108);
  ctx.stroke();

  // Name
  ctx.font = 'bold 44px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, subtext ? 52 : 70);

  // Subtext / Badge
  if (subtext) {
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(subtext, 256, 92);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(4.2, 1.15, 1);
  return sprite;
}

export function createOrcaRig(): CreatureRig {
  const root = new THREE.Group();

  // Materials
  const blackSkinMat = new THREE.MeshStandardMaterial({
    color: 0x0c1222,
    roughness: 0.15,
    metalness: 0.1,
  });
  const whitePatchMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.25,
    metalness: 0.05,
  });
  const darkFinMat = new THREE.MeshStandardMaterial({
    color: 0x090d18,
    roughness: 0.2,
    metalness: 0.1,
  });

  // 1. Torso
  const bodyGeo = new THREE.ConeGeometry(1.3, 4.4, 20, 4);
  bodyGeo.rotateX(Math.PI / 2);
  bodyGeo.scale(1.15, 0.95, 1.0);
  const bodyMesh = new THREE.Mesh(bodyGeo, blackSkinMat);
  bodyMesh.position.set(0, 0, 0.5);
  root.add(bodyMesh);

  // Snout/Head dome
  const headGeo = new THREE.SphereGeometry(1.2, 18, 14);
  headGeo.scale(0.95, 0.8, 1.4);
  const headMesh = new THREE.Mesh(headGeo, blackSkinMat);
  headMesh.position.set(0, -0.05, 2.2);
  root.add(headMesh);

  // White belly slab
  const bellyGeo = new THREE.SphereGeometry(1.1, 16, 12);
  bellyGeo.scale(0.85, 0.35, 1.8);
  const bellyMesh = new THREE.Mesh(bellyGeo, whitePatchMat);
  bellyMesh.position.set(0, -0.65, 1.1);
  root.add(bellyMesh);

  // White eye markings (left & right)
  const patchGeo = new THREE.SphereGeometry(0.35, 12, 8);
  patchGeo.scale(0.2, 0.5, 1.2);
  const leftPatch = new THREE.Mesh(patchGeo, whitePatchMat);
  leftPatch.position.set(0.95, 0.25, 2.3);
  leftPatch.rotation.set(-0.2, 0.3, -0.15);
  root.add(leftPatch);

  const rightPatch = new THREE.Mesh(patchGeo, whitePatchMat);
  rightPatch.position.set(-0.95, 0.25, 2.3);
  rightPatch.rotation.set(-0.2, -0.3, 0.15);
  root.add(rightPatch);

  // Tall Dorsal fin
  const dorsalGeo = new THREE.ConeGeometry(0.3, 2.2, 8);
  dorsalGeo.scale(0.35, 1.0, 1.2);
  dorsalGeo.rotateX(-0.3);
  const dorsalMesh = new THREE.Mesh(dorsalGeo, darkFinMat);
  dorsalMesh.position.set(0, 1.7, 0.3);
  root.add(dorsalMesh);

  // Pectoral flippers (Left & Right)
  const finGeo = new THREE.BoxGeometry(0.12, 0.35, 1.5);
  finGeo.scale(1.0, 0.2, 1.0);
  
  const leftFin = new THREE.Group();
  const leftFinMesh = new THREE.Mesh(finGeo, darkFinMat);
  leftFinMesh.position.set(0.7, 0, -0.2);
  leftFin.position.set(1.1, -0.3, 1.4);
  leftFin.rotation.set(0.1, 0.4, -0.4);
  leftFin.add(leftFinMesh);
  root.add(leftFin);

  const rightFin = new THREE.Group();
  const rightFinMesh = new THREE.Mesh(finGeo, darkFinMat);
  rightFinMesh.position.set(-0.7, 0, -0.2);
  rightFin.position.set(-1.1, -0.3, 1.4);
  rightFin.rotation.set(0.1, -0.4, 0.4);
  rightFin.add(rightFinMesh);
  root.add(rightFin);

  // Tail peduncle joint
  const tail = new THREE.Group();
  tail.position.set(0, 0, -1.8);

  const tailGeo = new THREE.ConeGeometry(0.85, 2.6, 16);
  tailGeo.rotateX(-Math.PI / 2);
  const tailMesh = new THREE.Mesh(tailGeo, blackSkinMat);
  tailMesh.position.set(0, 0, -1.3);
  tail.add(tailMesh);

  // Flukes (Tail fins)
  const flukeGeo = new THREE.BoxGeometry(2.4, 0.12, 0.7);
  flukeGeo.scale(1.0, 1.0, 0.9);
  const flukes = new THREE.Mesh(flukeGeo, darkFinMat);
  flukes.position.set(0, 0, -2.6);
  flukes.rotation.x = 0.1;
  tail.add(flukes);

  root.add(tail);

  // Nameplate Sprite
  const nameSprite = createNameplate('Oreo 🌟', 'Companion Orca');
  nameSprite.position.set(0, 3.4, 0.5);
  root.add(nameSprite);

  return {
    root,
    tail,
    flukes,
    leftFin,
    rightFin,
    nameSprite,
    creatureType: 'orca',
    updateAnimation: (time: number, speedMultiplier: number) => {
      const freq = time * 4.5 * speedMultiplier;
      // Tail sway & pitch
      tail.rotation.y = Math.sin(freq) * 0.28;
      flukes.rotation.x = Math.sin(freq + 0.8) * 0.35;
      // Body undulating pitch & roll
      root.rotation.z = Math.sin(freq * 0.5) * 0.08;
      // Flippers gentle balancing
      leftFin.rotation.z = -0.4 + Math.sin(freq) * 0.12;
      rightFin.rotation.z = 0.4 - Math.sin(freq) * 0.12;
    },
  };
}

export function createSharkRig(type: CreatureType = 'shark', name: string = 'Wild Shark'): CreatureRig {
  const root = new THREE.Group();

  const isHammerhead = type === 'hammerhead';
  const bodyColor = isHammerhead ? 0x475569 : 0x334155;
  const bellyColor = 0xe2e8f0;

  const skinMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    roughness: 0.3,
    metalness: 0.15,
  });
  const bellyMat = new THREE.MeshStandardMaterial({
    color: bellyColor,
    roughness: 0.4,
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x020617,
    roughness: 0.1,
  });

  // Torpedo Body
  const bodyGeo = new THREE.CylinderGeometry(0.85, 0.3, 3.8, 16);
  bodyGeo.rotateX(Math.PI / 2);
  const bodyMesh = new THREE.Mesh(bodyGeo, skinMat);
  bodyMesh.position.set(0, 0, 0);
  root.add(bodyMesh);

  // Underside belly
  const bellyGeo = new THREE.BoxGeometry(1.2, 0.25, 3.6);
  const bellyMesh = new THREE.Mesh(bellyGeo, bellyMat);
  bellyMesh.position.set(0, -0.45, 0);
  root.add(bellyMesh);

  // Snout
  if (isHammerhead) {
    // T-shaped Cephalofoil head
    const hammerGeo = new THREE.BoxGeometry(3.2, 0.4, 0.8);
    const hammerMesh = new THREE.Mesh(hammerGeo, skinMat);
    hammerMesh.position.set(0, 0, 2.1);
    root.add(hammerMesh);

    // Eyes on edges
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), eyeMat);
    leftEye.position.set(1.58, 0, 2.1);
    root.add(leftEye);
    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), eyeMat);
    rightEye.position.set(-1.58, 0, 2.1);
    root.add(rightEye);
  } else {
    // Sharp conical snout
    const snoutGeo = new THREE.ConeGeometry(0.85, 1.8, 16);
    snoutGeo.rotateX(Math.PI / 2);
    const snoutMesh = new THREE.Mesh(snoutGeo, skinMat);
    snoutMesh.position.set(0, 0, 2.6);
    root.add(snoutMesh);

    // Eyes
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), eyeMat);
    leftEye.position.set(0.65, 0.15, 2.2);
    root.add(leftEye);
    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), eyeMat);
    rightEye.position.set(-0.65, 0.15, 2.2);
    root.add(rightEye);
  }

  // Sharp Dorsal Fin
  const dorsalGeo = new THREE.ConeGeometry(0.22, 1.8, 8);
  dorsalGeo.scale(0.3, 1.0, 1.3);
  dorsalGeo.rotateX(-0.4);
  const dorsalMesh = new THREE.Mesh(dorsalGeo, skinMat);
  dorsalMesh.position.set(0, 1.3, 0.2);
  root.add(dorsalMesh);

  // Pectoral Fins
  const pecGeo = new THREE.BoxGeometry(1.6, 0.08, 0.7);
  pecGeo.rotateY(0.3);
  const leftFin = new THREE.Mesh(pecGeo, skinMat);
  leftFin.position.set(1.2, -0.3, 0.8);
  leftFin.rotation.set(0.1, 0, -0.3);
  root.add(leftFin);

  const rightFin = new THREE.Mesh(pecGeo, skinMat);
  rightFin.position.set(-1.2, -0.3, 0.8);
  rightFin.rotation.set(0.1, 0, 0.3);
  root.add(rightFin);

  // Tail & Caudal fin
  const tail = new THREE.Group();
  tail.position.set(0, 0, -1.9);

  const tailGeo = new THREE.ConeGeometry(0.45, 2.0, 12);
  tailGeo.rotateX(-Math.PI / 2);
  const tailMesh = new THREE.Mesh(tailGeo, skinMat);
  tailMesh.position.set(0, 0, -1.0);
  tail.add(tailMesh);

  // Heterocercal caudal fin (shark tail is vertical, taller top)
  const caudalTopGeo = new THREE.ConeGeometry(0.18, 1.6, 6);
  caudalTopGeo.scale(0.3, 1.0, 0.8);
  caudalTopGeo.rotateX(0.5);
  const caudalTop = new THREE.Mesh(caudalTopGeo, skinMat);
  caudalTop.position.set(0, 0.7, -2.2);
  tail.add(caudalTop);

  const caudalBottomGeo = new THREE.ConeGeometry(0.14, 1.0, 6);
  caudalBottomGeo.scale(0.3, 1.0, 0.7);
  caudalBottomGeo.rotateX(-0.6);
  const caudalBottom = new THREE.Mesh(caudalBottomGeo, skinMat);
  caudalBottom.position.set(0, -0.4, -2.1);
  tail.add(caudalBottom);

  root.add(tail);

  const nameSprite = createNameplate(name, isHammerhead ? 'Titan Predator' : 'Apex Hunter');
  nameSprite.position.set(0, 2.6, 0.2);
  root.add(nameSprite);

  return {
    root,
    tail,
    nameSprite,
    creatureType: type,
    updateAnimation: (time: number, speedMultiplier: number) => {
      const freq = time * 5.0 * speedMultiplier;
      tail.rotation.y = Math.sin(freq) * 0.45;
      root.rotation.y = Math.sin(freq - 1.0) * 0.08;
    },
  };
}

export function createDolphinRig(name: string = 'Wild Dolphin'): CreatureRig {
  const root = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.2,
    metalness: 0.1,
  });
  const bellyMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.3,
  });

  // Body
  const bodyGeo = new THREE.SphereGeometry(1.0, 16, 12);
  bodyGeo.scale(0.7, 0.65, 2.2);
  const bodyMesh = new THREE.Mesh(bodyGeo, skinMat);
  root.add(bodyMesh);

  // Belly
  const bellyGeo = new THREE.SphereGeometry(0.85, 14, 10);
  bellyGeo.scale(0.6, 0.3, 1.8);
  const bellyMesh = new THREE.Mesh(bellyGeo, bellyMat);
  bellyMesh.position.set(0, -0.4, 0);
  root.add(bellyMesh);

  // Beak / Rostrum
  const beakGeo = new THREE.ConeGeometry(0.35, 1.0, 12);
  beakGeo.rotateX(Math.PI / 2);
  const beak = new THREE.Mesh(beakGeo, skinMat);
  beak.position.set(0, -0.1, 2.5);
  root.add(beak);

  // Curved Dorsal Fin
  const dorsalGeo = new THREE.ConeGeometry(0.2, 1.1, 8);
  dorsalGeo.scale(0.3, 1.0, 1.2);
  dorsalGeo.rotateX(-0.5);
  const dorsal = new THREE.Mesh(dorsalGeo, skinMat);
  dorsal.position.set(0, 0.9, -0.1);
  root.add(dorsal);

  // Flippers
  const finGeo = new THREE.BoxGeometry(0.9, 0.08, 0.45);
  const leftFin = new THREE.Mesh(finGeo, skinMat);
  leftFin.position.set(0.8, -0.2, 0.6);
  leftFin.rotation.set(0.1, 0.3, -0.3);
  root.add(leftFin);

  const rightFin = new THREE.Mesh(finGeo, skinMat);
  rightFin.position.set(-0.8, -0.2, 0.6);
  rightFin.rotation.set(0.1, -0.3, 0.3);
  root.add(rightFin);

  // Tail
  const tail = new THREE.Group();
  tail.position.set(0, 0, -1.8);

  const tailGeo = new THREE.ConeGeometry(0.4, 1.8, 12);
  tailGeo.rotateX(-Math.PI / 2);
  const tailMesh = new THREE.Mesh(tailGeo, skinMat);
  tailMesh.position.set(0, 0, -0.9);
  tail.add(tailMesh);

  // Flukes
  const flukesGeo = new THREE.BoxGeometry(1.8, 0.08, 0.5);
  const flukes = new THREE.Mesh(flukesGeo, skinMat);
  flukes.position.set(0, 0, -1.8);
  tail.add(flukes);

  root.add(tail);

  const nameSprite = createNameplate(name, 'Playful Ocean Friend');
  nameSprite.position.set(0, 2.2, 0.2);
  root.add(nameSprite);

  return {
    root,
    tail,
    flukes,
    nameSprite,
    creatureType: 'dolphin',
    updateAnimation: (time: number, speedMultiplier: number) => {
      const freq = time * 6.0 * speedMultiplier;
      tail.rotation.x = Math.sin(freq) * 0.35;
      root.position.y = Math.sin(freq * 0.5) * 0.2;
    },
  };
}

export function createMantaRig(name: string = 'Wild Manta Ray'): CreatureRig {
  const root = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.25,
    metalness: 0.1,
  });
  const bellyMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.3,
  });

  // Central Disc
  const bodyGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.35, 16);
  bodyGeo.scale(1.2, 1.0, 1.6);
  const bodyMesh = new THREE.Mesh(bodyGeo, skinMat);
  root.add(bodyMesh);

  // White Belly
  const bellyMesh = new THREE.Mesh(bodyGeo, bellyMat);
  bellyMesh.position.set(0, -0.05, 0);
  bellyMesh.scale.set(1.15, 0.8, 1.55);
  root.add(bellyMesh);

  // Cephalic fins (horns)
  const hornGeo = new THREE.ConeGeometry(0.2, 0.8, 8);
  hornGeo.rotateX(Math.PI / 2);
  const leftHorn = new THREE.Mesh(hornGeo, skinMat);
  leftHorn.position.set(0.6, 0.05, 2.0);
  root.add(leftHorn);

  const rightHorn = new THREE.Mesh(hornGeo, skinMat);
  rightHorn.position.set(-0.6, 0.05, 2.0);
  root.add(rightHorn);

  // Large Pectoral Wings
  const wingGeo = new THREE.BoxGeometry(2.5, 0.1, 2.0);
  
  const leftWing = new THREE.Group();
  const leftWingMesh = new THREE.Mesh(wingGeo, skinMat);
  leftWingMesh.position.set(1.25, 0, 0);
  leftWing.position.set(1.1, 0, 0);
  leftWing.add(leftWingMesh);
  root.add(leftWing);

  const rightWing = new THREE.Group();
  const rightWingMesh = new THREE.Mesh(wingGeo, skinMat);
  rightWingMesh.position.set(-1.25, 0, 0);
  rightWing.position.set(-1.1, 0, 0);
  rightWing.add(rightWingMesh);
  root.add(rightWing);

  // Whip-like tail
  const tailGeo = new THREE.CylinderGeometry(0.04, 0.02, 3.5, 6);
  tailGeo.rotateX(Math.PI / 2);
  const tailMesh = new THREE.Mesh(tailGeo, skinMat);
  tailMesh.position.set(0, 0.05, -3.0);
  root.add(tailMesh);

  const nameSprite = createNameplate(name, 'Gentle Cove Glider');
  nameSprite.position.set(0, 2.0, 0);
  root.add(nameSprite);

  return {
    root,
    wings: { left: leftWing, right: rightWing },
    nameSprite,
    creatureType: 'manta',
    updateAnimation: (time: number, speedMultiplier: number) => {
      const freq = time * 3.5 * speedMultiplier;
      const wingFlap = Math.sin(freq) * 0.35;
      leftWing.rotation.z = wingFlap;
      rightWing.rotation.z = -wingFlap;
      root.position.y = Math.sin(freq * 0.5) * 0.3;
    },
  };
}

export function createFishMesh(): THREE.Group {
  const group = new THREE.Group();
  const bodyGeo = new THREE.SphereGeometry(0.35, 12, 8);
  bodyGeo.scale(0.4, 0.8, 1.6);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    roughness: 0.2,
    metalness: 0.1,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  // Caudal tail
  const tailGeo = new THREE.ConeGeometry(0.2, 0.5, 6);
  tailGeo.scale(0.2, 1.0, 1.0);
  tailGeo.rotateX(-Math.PI / 2);
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xfdba74,
    roughness: 0.3,
  });
  const tail = new THREE.Mesh(tailGeo, tailMat);
  tail.position.set(0, 0, -0.7);
  group.add(tail);

  return group;
}

export function createKelpCluster(baseX: number, baseZ: number, height: number = 8): {
  group: THREE.Group;
  stalks: { mesh: THREE.Mesh; initialRotation: number }[];
} {
  const group = new THREE.Group();
  group.position.set(baseX, -6.0, baseZ);

  const kelpGreen = 0x15803d;
  const darkGreen = 0x166534;
  const stalkMat = new THREE.MeshStandardMaterial({
    color: kelpGreen,
    roughness: 0.6,
  });
  const frondMat = new THREE.MeshStandardMaterial({
    color: darkGreen,
    roughness: 0.5,
    side: THREE.DoubleSide,
  });

  const stalks: { mesh: THREE.Mesh; initialRotation: number }[] = [];

  // Generate 3-5 stalks per cluster
  const count = 3 + Math.floor(Math.random() * 3);
  for (let s = 0; s < count; s++) {
    const offsetX = (Math.random() - 0.5) * 1.2;
    const offsetZ = (Math.random() - 0.5) * 1.2;
    const stalkHeight = height * (0.8 + Math.random() * 0.4);

    const stalkGeo = new THREE.CylinderGeometry(0.08, 0.12, stalkHeight, 6);
    stalkGeo.translate(0, stalkHeight / 2, 0);
    const stalkMesh = new THREE.Mesh(stalkGeo, stalkMat);
    stalkMesh.position.set(offsetX, 0, offsetZ);

    // Add leafy fronds along the stalk
    const frondCount = 4 + Math.floor(Math.random() * 4);
    for (let f = 0; f < frondCount; f++) {
      const fHeight = (stalkHeight * (f + 1)) / (frondCount + 1.5);
      const frondGeo = new THREE.BoxGeometry(0.04, 0.4, 1.2);
      frondGeo.scale(1.0, 0.8, 1.4);
      const frond = new THREE.Mesh(frondGeo, frondMat);
      const angle = (f * Math.PI) / 2 + Math.random() * 0.4;
      frond.position.set(Math.cos(angle) * 0.3, fHeight, Math.sin(angle) * 0.3);
      frond.rotation.set(0.3, angle, 0.5);
      stalkMesh.add(frond);
    }

    group.add(stalkMesh);
    stalks.push({ mesh: stalkMesh, initialRotation: Math.random() * Math.PI * 2 });
  }

  return { group, stalks };
}

// Procedural Gem Node
export function createGemNode(type: 'topaz' | 'quartz' | 'ruby' | 'sapphire' | 'amethyst'): THREE.Group {
  const group = new THREE.Group();

  const colorMap = {
    topaz: 0xf59e0b, // amber/gold
    quartz: 0xf8fafc, // clear/white
    ruby: 0xef4444, // crimson
    sapphire: 0x3b82f6, // deep ocean blue
    amethyst: 0xa855f7, // purple
  };

  const col = colorMap[type] || 0x38bdf8;

  // Base stone outcrop
  const stoneGeo = new THREE.DodecahedronGeometry(0.9, 1);
  stoneGeo.scale(1.2, 0.6, 1.2);
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.9,
  });
  const stone = new THREE.Mesh(stoneGeo, stoneMat);
  stone.position.y = 0.3;
  group.add(stone);

  // Crystal cluster (3-5 faceted shards)
  const gemMat = new THREE.MeshStandardMaterial({
    color: col,
    emissive: col,
    emissiveIntensity: 0.45,
    roughness: 0.1,
    metalness: 0.3,
    transparent: true,
    opacity: 0.92,
  });

  const shardConfigs = [
    { x: 0, y: 0.8, z: 0, h: 1.4, r: 0.35, rotX: 0.1, rotZ: -0.1 },
    { x: 0.35, y: 0.6, z: 0.2, h: 1.0, r: 0.25, rotX: 0.3, rotZ: 0.2 },
    { x: -0.3, y: 0.55, z: -0.2, h: 0.9, r: 0.22, rotX: -0.2, rotZ: -0.3 },
    { x: 0.2, y: 0.5, z: -0.35, h: 0.8, r: 0.2, rotX: -0.3, rotZ: 0.15 },
  ];

  shardConfigs.forEach((c) => {
    const shardGeo = new THREE.ConeGeometry(c.r, c.h, 6);
    shardGeo.translate(0, c.h / 2, 0);
    const shard = new THREE.Mesh(shardGeo, gemMat);
    shard.position.set(c.x, 0.3, c.z);
    shard.rotation.set(c.rotX, 0, c.rotZ);
    group.add(shard);
  });

  group.userData = { isGem: true, gemType: type };
  return group;
}

// Procedural Shell House (for Whale housing snap-grid)
export function createShellHouseMesh(name: string = 'Shell Cottage'): THREE.Group {
  const group = new THREE.Group();

  // Nautilus / Spiral shell dome
  const shellMat = new THREE.MeshStandardMaterial({
    color: 0xfde047, // warm golden pearlescent shell
    roughness: 0.4,
    metalness: 0.1,
  });

  const shellBody = new THREE.Mesh(
    new THREE.TorusGeometry(1.6, 0.9, 12, 16, Math.PI * 1.6),
    shellMat
  );
  shellBody.rotation.x = Math.PI / 2;
  shellBody.rotation.z = 0.4;
  shellBody.position.set(0, 1.2, 0);
  group.add(shellBody);

  // Entrance door / portal
  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.4,
    roughness: 0.3,
  });
  const door = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.2, 12), doorMat);
  door.rotation.x = Math.PI / 2;
  door.position.set(0, 0.7, 1.8);
  group.add(door);

  // Warm glowing coral lantern
  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    emissive: 0x10b981,
    emissiveIntensity: 0.8,
  });
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), lanternMat);
  lantern.position.set(0.8, 1.6, 1.6);
  group.add(lantern);

  const namePlate = createNameplate(name, 'Whale Residence');
  namePlate.position.set(0, 3.2, 0);
  namePlate.scale.set(3.2, 0.8, 1);
  group.add(namePlate);

  group.userData = { isHouse: true };
  return group;
}

// Procedural Memorial Shrine & Spirit Orb
export function createMemorialShrine(): THREE.Group {
  const group = new THREE.Group();

  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.8,
  });

  // Ancient stone ring
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.8, 0.6), pillarMat);
    pillar.position.set(Math.cos(angle) * 3.2, 1.9, Math.sin(angle) * 3.2);
    group.add(pillar);
  }

  // Floating ethereal spirit orb
  const spiritMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.9,
    transparent: true,
    opacity: 0.75,
  });
  const spirit = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 16), spiritMat);
  spirit.position.set(0, 2.5, 0);
  group.add(spirit);

  const plate = createNameplate('The Memorial 🕊️', 'Honoring Fallen Whales');
  plate.position.set(0, 4.4, 0);
  group.add(plate);

  group.userData = { isMemorial: true };
  return group;
}

