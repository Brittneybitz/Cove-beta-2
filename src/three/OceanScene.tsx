import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  createOrcaRig,
  createSharkRig,
  createDolphinRig,
  createMantaRig,
  createFishMesh,
  createKelpCluster,
  createGemNode,
  createShellHouseMesh,
  createMemorialShrine,
  CreatureRig,
} from './models';
import {
  buildRigFromCustomModel,
  loadGLTFUrl,
  parseGLTFBuffer,
} from './customModelLoader';
import { CustomModelConfig, ModelTarget } from '../services/customModelStorage';
import { CameraViewMode, WildCreatureData, TimeOfDay, ShellHouse, RarityTier, PersonalityType, BattleState, ControlScheme } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface OceanSceneProps {
  swimSpeed: number;
  cameraMode: CameraViewMode;
  onSelectOreo: (screenPos: { x: number; y: number }) => void;
  onHarvestFish: (screenPos: { x: number; y: number }) => void;
  onHarvestKelp: (screenPos: { x: number; y: number }) => void;
  onEncounterWild: (creature: WildCreatureData) => void;
  wildEncounterTrigger: number;
  companionType: string;
  customModels: Record<ModelTarget, CustomModelConfig>;
  timeOfDay?: TimeOfDay;
  isRaveParty?: boolean;
  houses?: ShellHouse[];
  onMineGem?: (type: 'topaz' | 'quartz' | 'ruby' | 'sapphire' | 'amethyst', screenPos: { x: number; y: number }) => void;
  battleState?: BattleState;
  controlScheme?: ControlScheme;
  mobileMoveVector?: { x: number; y: number; z: number };
}

export const OceanScene: React.FC<OceanSceneProps> = ({
  swimSpeed,
  cameraMode,
  onSelectOreo,
  onHarvestFish,
  onHarvestKelp,
  onEncounterWild,
  wildEncounterTrigger,
  companionType,
  customModels,
  timeOfDay = 'midday',
  isRaveParty = false,
  houses = [],
  onMineGem,
  battleState,
  controlScheme = 'minecraft',
  mobileMoveVector = { x: 0, y: 0, z: 0 },
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const parsedSceneCache = useRef<Record<string, THREE.Group>>({});

  const propsRef = useRef({
    swimSpeed,
    cameraMode,
    onSelectOreo,
    onHarvestFish,
    onHarvestKelp,
    onEncounterWild,
    companionType,
    customModels,
    timeOfDay,
    isRaveParty,
    houses,
    onMineGem,
    battleState,
    controlScheme,
    mobileMoveVector,
  });

  useEffect(() => {
    propsRef.current = {
      swimSpeed,
      cameraMode,
      onSelectOreo,
      onHarvestFish,
      onHarvestKelp,
      onEncounterWild,
      companionType,
      customModels,
      timeOfDay,
      isRaveParty,
      houses,
      onMineGem,
      battleState,
      controlScheme,
      mobileMoveVector,
    };
  }, [
    swimSpeed,
    cameraMode,
    onSelectOreo,
    onHarvestFish,
    onHarvestKelp,
    onEncounterWild,
    companionType,
    customModels,
    timeOfDay,
    isRaveParty,
    houses,
    onMineGem,
    battleState,
    controlScheme,
    mobileMoveVector,
  ]);

  const sceneActionsRef = useRef<{
    spawnWildCreature: (forcedType?: 'shark' | 'dolphin' | 'hammerhead' | 'manta') => void;
    rebuildRigs: () => void;
    syncHouses: () => void;
  } | null>(null);

  // Parse and cache any newly updated custom models
  useEffect(() => {
    let cancelled = false;

    const syncCustomModels = async () => {
      const targets = Object.keys(customModels) as ModelTarget[];
      let changed = false;

      for (const target of targets) {
        const config = customModels[target];
        if (!config || config.sourceType === 'default') {
          if (parsedSceneCache.current[target]) {
            delete parsedSceneCache.current[target];
            changed = true;
          }
          continue;
        }

        try {
          if (config.sourceType === 'file' && config.fileBuffer) {
            const scene = await parseGLTFBuffer(config.fileBuffer);
            if (!cancelled) {
              parsedSceneCache.current[target] = scene;
              changed = true;
            }
          } else if (config.sourceType === 'url' && config.url) {
            const scene = await loadGLTFUrl(config.url);
            if (!cancelled) {
              parsedSceneCache.current[target] = scene;
              changed = true;
            }
          }
        } catch {
          // Fallback if parsing fails
        }
      }

      if (changed && sceneActionsRef.current && !cancelled) {
        sceneActionsRef.current.rebuildRigs();
      }
    };

    syncCustomModels();

    return () => {
      cancelled = true;
    };
  }, [customModels]);

  // Sync houses when list updates
  useEffect(() => {
    if (sceneActionsRef.current) {
      sceneActionsRef.current.syncHouses();
    }
  }, [houses]);

  // Trigger manual spawn when wildEncounterTrigger changes
  useEffect(() => {
    if (wildEncounterTrigger > 0 && sceneActionsRef.current) {
      sceneActionsRef.current.spawnWildCreature();
    }
  }, [wildEncounterTrigger]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Scene & Renderer setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020f24);
    scene.fog = new THREE.FogExp2(0x020f24, 0.022);

    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 22);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Procedural Studio Environment for PBR reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 55;
    controls.minDistance = 3;
    controls.maxPolarAngle = Math.PI / 2 + 0.15;
    controls.target.set(0, 0, 0);

    // 2. Underwater Lighting
    const ambientLight = new THREE.AmbientLight(0x1e3a5f, 2.2);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x064e3b, 1.8);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xe0f2fe, 3.2);
    sunLight.position.set(12, 35, 15);
    sunLight.castShadow = !isSoftwareGl;
    if (sunLight.shadow) {
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.bias = -0.0005;
    }
    scene.add(sunLight);

    // Rave party strobe light
    const strobeLight = new THREE.PointLight(0xff00ff, 0, 45);
    strobeLight.position.set(0, 6, 0);
    scene.add(strobeLight);

    // 3. Sandy Seabed & Coral Cove Environment
    const floorGeo = new THREE.PlaneGeometry(130, 130, 32, 32);
    const pos = floorGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const wave = Math.sin(vx * 0.1) * Math.cos(vy * 0.1) * 0.7;
      pos.setZ(i, wave);
    }
    floorGeo.computeVertexNormals();

    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1d3e42,
      roughness: 0.85,
      metalness: 0.1,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -6.0;
    floorMesh.receiveShadow = !isSoftwareGl;
    scene.add(floorMesh);

    // Water Surface Ceiling
    const surfaceGeo = new THREE.PlaneGeometry(130, 130);
    const surfaceMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.8,
      side: THREE.DoubleSide,
    });
    const surfaceMesh = new THREE.Mesh(surfaceGeo, surfaceMat);
    surfaceMesh.rotation.x = Math.PI / 2;
    surfaceMesh.position.y = 12.0;
    scene.add(surfaceMesh);

    // 4. Kelp Forests
    const kelpClusters: {
      group: THREE.Group;
      stalks: { mesh: THREE.Mesh; initialRotation: number }[];
    }[] = [];

    const kelpPositions = [
      { x: -18, z: -12, height: 7 },
      { x: 19, z: -15, height: 8 },
      { x: -14, z: 16, height: 6 },
      { x: 17, z: 14, height: 7 },
      { x: 0, z: -22, height: 9 },
    ];

    kelpPositions.forEach((posConfig) => {
      const cluster = createKelpCluster(posConfig.x, posConfig.z, posConfig.height);
      scene.add(cluster.group);
      kelpClusters.push(cluster);
    });

    // 5. Gem Nodes on Seabed
    const gemTypes: ('topaz' | 'quartz' | 'ruby' | 'sapphire' | 'amethyst')[] = [
      'topaz',
      'quartz',
      'ruby',
      'sapphire',
      'amethyst',
    ];
    const gemNodesGroup = new THREE.Group();
    scene.add(gemNodesGroup);

    const gemPositions = [
      { x: -11, z: 6, type: 'topaz' as const },
      { x: 9, z: -8, type: 'quartz' as const },
      { x: 14, z: 8, type: 'ruby' as const },
      { x: -7, z: -14, type: 'sapphire' as const },
      { x: 5, z: 12, type: 'amethyst' as const },
    ];

    gemPositions.forEach((gp) => {
      const node = createGemNode(gp.type);
      node.position.set(gp.x, -5.8, gp.z);
      gemNodesGroup.add(node);
    });

    // 6. The Memorial Shrine
    const memorial = createMemorialShrine();
    memorial.position.set(-24, -5.8, -4);
    scene.add(memorial);

    // 7. Shell Houses Group (Snap-Grid)
    const housesGroup = new THREE.Group();
    scene.add(housesGroup);

    const syncHouses = () => {
      while (housesGroup.children.length > 0) {
        housesGroup.remove(housesGroup.children[0]);
      }
      propsRef.current.houses.forEach((h) => {
        const houseMesh = createShellHouseMesh(h.name);
        const worldX = h.gridX * 7 - 12;
        const worldZ = h.gridZ * 7 - 8;
        houseMesh.position.set(worldX, -5.8, worldZ);
        housesGroup.add(houseMesh);
      });
    };
    syncHouses();

    // 8. Schooling Fish
    interface SchoolFish {
      mesh: THREE.Group;
      angle: number;
      speed: number;
      radius: number;
      y: number;
    }
    const fishList: SchoolFish[] = [];
    const fishCount = 14;

    for (let i = 0; i < fishCount; i++) {
      const fishMesh = createFishMesh();
      const angle = (i / fishCount) * Math.PI * 2;
      const radius = 9 + (i % 3) * 2.5;
      const y = -3 + (i % 5) * 1.5;

      fishMesh.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      scene.add(fishMesh);
      fishList.push({
        mesh: fishMesh,
        angle,
        speed: 0.8 + (i % 4) * 0.25,
        radius,
        y,
      });
    }

    // 9. Rising Bubbles
    const bubbleCount = 70;
    const bubbleGeo = new THREE.BufferGeometry();
    const bubblePositions = new Float32Array(bubbleCount * 3);
    const bubbleSpeeds = new Float32Array(bubbleCount);

    for (let b = 0; b < bubbleCount; b++) {
      bubblePositions[b * 3] = (Math.random() - 0.5) * 55;
      bubblePositions[b * 3 + 1] = -6 + Math.random() * 18;
      bubblePositions[b * 3 + 2] = (Math.random() - 0.5) * 55;
      bubbleSpeeds[b] = 1.0 + Math.random() * 2.0;
    }

    bubbleGeo.setAttribute('position', new THREE.BufferAttribute(bubblePositions, 3));

    const bubbleCanvas = document.createElement('canvas');
    bubbleCanvas.width = 64;
    bubbleCanvas.height = 64;
    const bCtx = bubbleCanvas.getContext('2d')!;
    const grad = bCtx.createRadialGradient(32, 32, 4, 32, 32, 28);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.6)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    bCtx.fillStyle = grad;
    bCtx.beginPath();
    bCtx.arc(32, 32, 28, 0, Math.PI * 2);
    bCtx.fill();

    const bubbleTexture = new THREE.CanvasTexture(bubbleCanvas);
    const bubbleMat = new THREE.PointsMaterial({
      map: bubbleTexture,
      size: 0.6,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const bubbleParticles = new THREE.Points(bubbleGeo, bubbleMat);
    scene.add(bubbleParticles);

    // 10. Companion Rig
    const createCompanionRigHelper = (type: string): CreatureRig => {
      const customConfig = propsRef.current.customModels[type as ModelTarget];
      const cachedScene = parsedSceneCache.current[type];

      if (customConfig && customConfig.sourceType !== 'default' && cachedScene) {
        const displayName = type === 'orca' ? 'Oreo 🌟' : `Oreo (${type} Form)`;
        return buildRigFromCustomModel(
          cachedScene,
          type as ModelTarget,
          customConfig,
          displayName,
          'Custom Companion'
        );
      }

      if (type === 'dolphin') return createDolphinRig('Oreo (Dolphin Form)');
      if (type === 'shark') return createSharkRig('shark', 'Oreo (Shark Form)');
      if (type === 'hammerhead') return createSharkRig('hammerhead', 'Oreo (Hammerhead Form)');
      if (type === 'manta') return createMantaRig('Oreo (Manta Form)');
      return createOrcaRig();
    };

    let companionRig: CreatureRig = createCompanionRigHelper(propsRef.current.companionType);
    scene.add(companionRig.root);
    companionRig.root.userData = { isOreo: true };

    const updateCompanionRig = (type: string) => {
      scene.remove(companionRig.root);
      companionRig = createCompanionRigHelper(type);
      scene.add(companionRig.root);
      companionRig.root.userData = { isOreo: true };
    };

    // 11. Wild Creatures System
    interface ActiveWild {
      rig: CreatureRig;
      data: WildCreatureData;
      angle: number;
      speed: number;
      radius: number;
      y: number;
      sparkles?: THREE.Points;
    }
    const wildCreatures: ActiveWild[] = [];

    const wildTemplates: Omit<WildCreatureData, 'id' | 'rarity' | 'personality' | 'speciesName' | 'defense' | 'speed'>[] = [
      {
        name: 'Great White Shark',
        type: 'shark',
        maxHp: 65,
        hp: 65,
        attackPower: 18,
        catchDifficulty: 1.2,
        color: 0x334155,
        accentColor: 0xf43f5e,
        description: 'A swift, curious predator patrolling the cove perimeter.',
      },
      {
        name: 'Bottlenose Dolphin',
        type: 'dolphin',
        maxHp: 50,
        hp: 50,
        attackPower: 13,
        catchDifficulty: 0.9,
        color: 0x64748b,
        accentColor: 0x38bdf8,
        description: 'An agile, playful dolphin known for leaping waves.',
      },
      {
        name: 'Titan Hammerhead',
        type: 'hammerhead',
        maxHp: 80,
        hp: 80,
        attackPower: 22,
        catchDifficulty: 1.5,
        color: 0x475569,
        accentColor: 0xeab308,
        description: 'A colossal hammerhead with heightened electro-sensory vision.',
      },
      {
        name: 'Azure Manta Ray',
        type: 'manta',
        maxHp: 60,
        hp: 60,
        attackPower: 15,
        catchDifficulty: 1.1,
        color: 0x1e293b,
        accentColor: 0x8b5cf6,
        description: 'A majestic cove glider with sweeping wing currents.',
      },
    ];

    const createWildRigHelper = (type: ModelTarget, name: string): CreatureRig => {
      const customConfig = propsRef.current.customModels[type];
      const cachedScene = parsedSceneCache.current[type];

      if (customConfig && customConfig.sourceType !== 'default' && cachedScene) {
        return buildRigFromCustomModel(
          cachedScene,
          type,
          customConfig,
          name,
          'Custom Wild Creature'
        );
      }

      if (type === 'dolphin') return createDolphinRig(name);
      if (type === 'hammerhead') return createSharkRig('hammerhead', name);
      if (type === 'manta') return createMantaRig(name);
      return createSharkRig('shark', name);
    };

    // Helper to generate sparkle points for Rare / Legendary whales
    const createSparklePoints = (isLegendary: boolean) => {
      const spCount = isLegendary ? 40 : 20;
      const spGeo = new THREE.BufferGeometry();
      const spPos = new Float32Array(spCount * 3);
      for (let s = 0; s < spCount; s++) {
        spPos[s * 3] = (Math.random() - 0.5) * 4;
        spPos[s * 3 + 1] = (Math.random() - 0.5) * 3;
        spPos[s * 3 + 2] = (Math.random() - 0.5) * 4;
      }
      spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3));
      const spMat = new THREE.PointsMaterial({
        color: isLegendary ? 0xfacc15 : 0x38bdf8,
        size: isLegendary ? 0.55 : 0.4,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      });
      return new THREE.Points(spGeo, spMat);
    };

    const spawnWildCreature = (forcedType?: 'shark' | 'dolphin' | 'hammerhead' | 'manta') => {
      if (wildCreatures.length >= 4) {
        const oldest = wildCreatures.shift();
        if (oldest) {
          scene.remove(oldest.rig.root);
        }
      }

      const template = forcedType
        ? wildTemplates.find((t) => t.type === forcedType) || wildTemplates[0]
        : wildTemplates[Math.floor(Math.random() * wildTemplates.length)];

      // Roll Rarity
      const roll = Math.random();
      let rarity: RarityTier = 'common';
      if (roll < 0.20) rarity = 'legendary';
      else if (roll < 0.45) rarity = 'rare';
      else if (roll < 0.75) rarity = 'uncommon';

      const personalities: PersonalityType[] = ['frugal', 'moderate', 'lavish'];
      const personality = personalities[Math.floor(Math.random() * personalities.length)];

      const isSparkling = rarity === 'rare' || rarity === 'legendary';
      const creatureData: WildCreatureData = {
        id: 'wild-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        ...template,
        name: rarity === 'legendary' ? `🌟 Golden ${template.name}` : rarity === 'rare' ? `✨ Shimmering ${template.name}` : `Wild ${template.name}`,
        speciesName: template.name,
        rarity,
        personality,
        defense: Math.floor(8 + Math.random() * 8),
        speed: Math.floor(10 + Math.random() * 8),
        isSparkling,
      };

      const rig = createWildRigHelper(creatureData.type, creatureData.name);
      scene.add(rig.root);

      rig.root.userData = {
        isWild: true,
        creatureData,
      };

      let sparkles: THREE.Points | undefined;
      if (isSparkling) {
        sparkles = createSparklePoints(rarity === 'legendary');
        rig.root.add(sparkles);
      }

      const angle = Math.random() * Math.PI * 2;
      const radius = 13 + Math.random() * 7;
      const y = -3 + Math.random() * 7;
      const speed = 0.65 + Math.random() * 0.45;

      wildCreatures.push({
        rig,
        data: creatureData,
        angle,
        speed,
        radius,
        y,
        sparkles,
      });

      soundManager.playWildEncounterAlert();
    };

    spawnWildCreature('dolphin');
    spawnWildCreature('shark');

    const spawnTimer = setInterval(() => {
      if (Math.random() < 0.5) {
        spawnWildCreature();
      }
    }, 18000);

    sceneActionsRef.current = {
      spawnWildCreature,
      rebuildRigs: () => {
        updateCompanionRig(propsRef.current.companionType);
        for (const wild of wildCreatures) {
          const posCopy = wild.rig.root.position.clone();
          scene.remove(wild.rig.root);
          wild.rig = createWildRigHelper(wild.data.type, wild.data.name);
          wild.rig.root.position.copy(posCopy);
          wild.rig.root.userData = {
            isWild: true,
            creatureData: wild.data,
          };
          if (wild.data.isSparkling) {
            const sp = createSparklePoints(wild.data.rarity === 'legendary');
            wild.rig.root.add(sp);
          }
          scene.add(wild.rig.root);
        }
      },
      syncHouses,
    };

    // 12. Raycasting & Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        let hitObj: THREE.Object3D | null = intersects[0].object;
        while (hitObj && !hitObj.userData.isOreo && !hitObj.userData.isWild && !hitObj.userData.isFish && !hitObj.userData.isKelp && !hitObj.userData.isGem && !hitObj.userData.isHouse && hitObj.parent) {
          if (hitObj === scene) break;
          hitObj = hitObj.parent;
        }

        if (hitObj) {
          const screenPos = { x: event.clientX, y: event.clientY };

          if (hitObj.userData.isOreo) {
            soundManager.playOreoClick();
            propsRef.current.onSelectOreo(screenPos);
            return;
          }

          if (hitObj.userData.isWild && hitObj.userData.creatureData) {
            soundManager.playWildEncounterAlert();
            propsRef.current.onEncounterWild(hitObj.userData.creatureData);
            return;
          }

          if (hitObj.userData.isFish) {
            soundManager.playForage();
            propsRef.current.onHarvestFish(screenPos);
            hitObj.position.y += 0.8;
            return;
          }

          if (hitObj.userData.isKelp) {
            soundManager.playForage();
            propsRef.current.onHarvestKelp(screenPos);
            return;
          }

          if (hitObj.userData.isGem && propsRef.current.onMineGem) {
            soundManager.playForage();
            propsRef.current.onMineGem(hitObj.userData.gemType, screenPos);
            hitObj.scale.set(1.4, 1.4, 1.4);
            setTimeout(() => {
              hitObj?.scale.set(1, 1, 1);
            }, 300);
            return;
          }
        }
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('click', handlePointerDown);

    // Battle Shield Dome
    const shieldGeo = new THREE.SphereGeometry(3.5, 24, 24);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      roughness: 0.1,
      metalness: 0.9,
      side: THREE.DoubleSide,
    });
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.visible = false;
    scene.add(shieldMesh);

    // Battle Opponent Rig Container
    const battleOpponentGroup = new THREE.Group();
    scene.add(battleOpponentGroup);
    let activeBattleRig: CreatureRig | null = null;
    let lastBattleEnemyId: string | null = null;

    // Minecraft Controls State
    const keysPressed: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let isMouseDown = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let camYaw = 0;
    let camPitch = 0.15;
    const companionSwimPos = new THREE.Vector3(0, 0, 0);

    // Multi-touch camera look tracking on right side of screen
    let touchLookId: number | null = null;
    let lastTouchLookX = 0;
    let lastTouchLookY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.clientX > window.innerWidth * 0.38 && touchLookId === null) {
          touchLookId = t.identifier;
          lastTouchLookX = t.clientX;
          lastTouchLookY = t.clientY;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === touchLookId) {
          const dx = t.clientX - lastTouchLookX;
          const dy = t.clientY - lastTouchLookY;
          lastTouchLookX = t.clientX;
          lastTouchLookY = t.clientY;
          camYaw -= dx * 0.0055;
          camPitch = Math.max(-0.6, Math.min(0.65, camPitch - dy * 0.0055));
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === touchLookId) {
          touchLookId = null;
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) {
        isMouseDown = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isMouseDown && propsRef.current.controlScheme === 'minecraft' && !propsRef.current.battleState?.active) {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        camYaw -= dx * 0.0045;
        camPitch = Math.max(-0.6, Math.min(0.65, camPitch - dy * 0.0045));
      }
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    domEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    domEl.addEventListener('touchmove', handleTouchMove, { passive: true });
    domEl.addEventListener('touchend', handleTouchEnd);
    domEl.addEventListener('touchcancel', handleTouchEnd);
    domEl.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // 13. Animation & Render Loop
    let clock = new THREE.Clock();
    let frameId = 0;
    let orcaOrbitAngle = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 70);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();
      const curSpeed = propsRef.current.swimSpeed;
      const isRave = propsRef.current.isRaveParty;
      const tod = propsRef.current.timeOfDay || 'midday';
      const bState = propsRef.current.battleState;
      const isBattling = !!(bState && bState.active && bState.enemy);
      const scheme = propsRef.current.controlScheme || 'minecraft';

      // Time-of-day dynamic lighting & tone adjustments
      if (tod === 'morning') {
        scene.background = new THREE.Color(0x064e3b);
        if (scene.fog) scene.fog.color.setHex(0x064e3b);
        ambientLight.color.setHex(0x10b981);
        sunLight.color.setHex(0xfde68a);
      } else if (tod === 'sunset') {
        scene.background = new THREE.Color(0x311308);
        if (scene.fog) scene.fog.color.setHex(0x311308);
        ambientLight.color.setHex(0x9a3412);
        sunLight.color.setHex(0xf97316);
      } else if (tod === 'night') {
        scene.background = new THREE.Color(0x020617);
        if (scene.fog) scene.fog.color.setHex(0x020617);
        ambientLight.color.setHex(0x0f172a);
        sunLight.color.setHex(0x818cf8);
      } else {
        scene.background = new THREE.Color(0x020f24);
        if (scene.fog) scene.fog.color.setHex(0x020f24);
        ambientLight.color.setHex(0x1e3a5f);
        sunLight.color.setHex(0xe0f2fe);
      }

      // Rave party strobe lighting effect
      if (isRave) {
        const strobeHue = (time * 2) % 1;
        strobeLight.color.setHSL(strobeHue, 1.0, 0.6);
        strobeLight.intensity = 8.0 + Math.sin(time * 25) * 4.0;
      } else {
        strobeLight.intensity = 0;
      }

      if (companionRig.creatureType !== propsRef.current.companionType) {
        updateCompanionRig(propsRef.current.companionType);
      }

      // ============================================
      // 1. POKÉMON-STYLE 3D BATTLE ARENA STAGING
      // ============================================
      if (isBattling && bState && bState.enemy) {
        controls.enabled = false;

        // Ensure opponent rig matches battle enemy
        if (!activeBattleRig || lastBattleEnemyId !== bState.enemy.id) {
          while (battleOpponentGroup.children.length > 0) {
            battleOpponentGroup.remove(battleOpponentGroup.children[0]);
          }
          activeBattleRig = createWildRigHelper(bState.enemy.type, bState.enemy.name);
          battleOpponentGroup.add(activeBattleRig.root);
          lastBattleEnemyId = bState.enemy.id;
        }

        // Fixed opposing coordinates (Pokémon duel arena)
        const pBase = new THREE.Vector3(-4.5, 0.1, 3.5);
        const oBase = new THREE.Vector3(4.5, 0.5, -2.5);

        // Move animations
        const pPos = pBase.clone();
        const oPos = oBase.clone();

        if (bState.animAction === 'player_attack') {
          // Lunge towards opponent
          pPos.addScaledVector(oBase.clone().sub(pBase), 0.38);
        } else if (bState.animAction === 'enemy_attack') {
          // Lunge towards player
          oPos.addScaledVector(pBase.clone().sub(oBase), 0.38);
        }

        // Aqua Barrier guard dome
        if (bState.animAction === 'player_guard') {
          shieldMesh.visible = true;
          shieldMesh.position.copy(pPos);
          (shieldMesh.material as THREE.MeshStandardMaterial).opacity = 0.55 + Math.sin(time * 12) * 0.15;
        } else {
          shieldMesh.visible = false;
        }

        // Position companion & opponent
        companionRig.root.position.copy(pPos);
        companionRig.root.rotation.y = Math.atan2(oBase.x - pBase.x, oBase.z - pBase.z);
        companionRig.updateAnimation(time, 0.8);

        activeBattleRig.root.position.copy(oPos);
        activeBattleRig.root.rotation.y = Math.atan2(pBase.x - oBase.x, pBase.z - oBase.z);
        activeBattleRig.updateAnimation(time, 0.8);

        // Pokémon over-the-shoulder duel perspective camera
        const duelCamPos = new THREE.Vector3(-9.2, 3.4, 9.8);
        const duelLookTarget = new THREE.Vector3(0, 0.5, 0.5);
        camera.position.lerp(duelCamPos, 0.08);
        camera.lookAt(duelLookTarget);
      } else {
        // Clean up battle opponent if battle ended
        if (activeBattleRig) {
          while (battleOpponentGroup.children.length > 0) {
            battleOpponentGroup.remove(battleOpponentGroup.children[0]);
          }
          activeBattleRig = null;
          lastBattleEnemyId = null;
        }
        shieldMesh.visible = false;

        // ============================================
        // 2. EXPLORATION SWIMMING (MINECRAFT vs ORBIT)
        // ============================================
        if (scheme === 'minecraft') {
          controls.enabled = false;

          // Keyboard input
          let kx = 0;
          let kz = 0;
          let ky = 0;
          if (keysPressed['KeyW']) kz -= 1;
          if (keysPressed['KeyS']) kz += 1;
          if (keysPressed['KeyA']) kx -= 1;
          if (keysPressed['KeyD']) kx += 1;
          if (keysPressed['Space']) ky += 1;
          if (keysPressed['ShiftLeft'] || keysPressed['ShiftRight'] || keysPressed['KeyC']) ky -= 1;

          // Mobile touch joystick input
          const mVec = propsRef.current.mobileMoveVector || { x: 0, y: 0, z: 0 };
          kx += mVec.x;
          kz += mVec.z;
          ky += mVec.y;

          // Movement direction relative to camera yaw
          const forward = new THREE.Vector3(-Math.sin(camYaw), 0, -Math.cos(camYaw));
          const right = new THREE.Vector3(Math.cos(camYaw), 0, -Math.sin(camYaw));
          const moveDir = new THREE.Vector3()
            .addScaledVector(forward, -kz)
            .addScaledVector(right, kx)
            .add(new THREE.Vector3(0, ky, 0));

          const isMoving = moveDir.lengthSq() > 0.001;
          if (isMoving) {
            moveDir.normalize();
          }

          companionSwimPos.addScaledVector(moveDir, delta * 10 * curSpeed);
          companionSwimPos.x = Math.max(-48, Math.min(48, companionSwimPos.x));
          companionSwimPos.z = Math.max(-48, Math.min(48, companionSwimPos.z));
          companionSwimPos.y = Math.max(-5.2, Math.min(10.5, companionSwimPos.y));

          companionRig.root.position.copy(companionSwimPos);

          if (isMoving) {
            const moveAngle = Math.atan2(moveDir.x, moveDir.z);
            companionRig.root.rotation.y = THREE.MathUtils.lerp(companionRig.root.rotation.y, moveAngle, 0.16);
          } else {
            companionRig.root.rotation.y = THREE.MathUtils.lerp(companionRig.root.rotation.y, camYaw, 0.08);
          }

          companionRig.updateAnimation(time, curSpeed * (isMoving ? 1.6 : 0.6));

          // Smooth third-person chase camera
          const camOffset = new THREE.Vector3(
            Math.sin(camYaw) * Math.cos(camPitch) * 8.5,
            -Math.sin(camPitch) * 8.5 + 2.8,
            Math.cos(camYaw) * Math.cos(camPitch) * 8.5
          );
          camera.position.lerp(companionSwimPos.clone().add(camOffset), 0.14);
          camera.lookAt(companionSwimPos.clone().add(new THREE.Vector3(0, 1.0, 0)));
        } else {
          // Classic Orbit Controls mode
          controls.enabled = true;
          const partySpeedMultiplier = isRave ? 2.5 : 1.0;
          orcaOrbitAngle += delta * 0.45 * curSpeed * partySpeedMultiplier;
          const orcaRadius = isRave ? 5.5 : 7.5;
          const targetX = Math.cos(orcaOrbitAngle) * orcaRadius;
          const targetZ = Math.sin(orcaOrbitAngle) * orcaRadius;
          const targetY = Math.sin(time * 0.8 * curSpeed) * 1.2;

          companionRig.root.position.set(targetX, targetY, targetZ);
          const lookTangentX = -Math.sin(orcaOrbitAngle);
          const lookTangentZ = Math.cos(orcaOrbitAngle);
          companionRig.root.rotation.y = Math.atan2(lookTangentX, lookTangentZ);

          if (isRave) {
            companionRig.root.rotation.z = Math.sin(time * 8) * 0.6;
            companionRig.root.rotation.x = Math.cos(time * 6) * 0.4;
          } else {
            companionRig.root.rotation.z = 0;
            companionRig.root.rotation.x = 0;
          }

          companionRig.updateAnimation(time, curSpeed * partySpeedMultiplier);

          const mode = propsRef.current.cameraMode;
          if (mode === 'follow') {
            const followOffset = new THREE.Vector3(
              -Math.sin(orcaOrbitAngle) * -8,
              3.5,
              Math.cos(orcaOrbitAngle) * -8
            );
            const targetCamPos = companionRig.root.position.clone().add(followOffset);
            camera.position.lerp(targetCamPos, 0.06);
            controls.target.lerp(companionRig.root.position, 0.08);
            controls.update();
          } else if (mode === 'panoramic') {
            const panoAngle = time * 0.08;
            camera.position.set(Math.cos(panoAngle) * 32, 10, Math.sin(panoAngle) * 32);
            controls.target.set(0, 0, 0);
            controls.update();
          } else {
            controls.update();
          }
        }
      }

      // 3. Wild Creatures Animation
      wildCreatures.forEach((wild) => {
        wild.angle += delta * 0.28 * wild.speed * curSpeed;
        const wx = Math.cos(wild.angle) * wild.radius;
        const wz = Math.sin(wild.angle) * wild.radius;
        const wy = wild.y + Math.sin(time * 0.7 + wild.radius) * 0.8;

        wild.rig.root.position.set(wx, wy, wz);
        const wildTanX = -Math.sin(wild.angle);
        const wildTanZ = Math.cos(wild.angle);
        wild.rig.root.rotation.y = Math.atan2(wildTanX, wildTanZ);

        wild.rig.updateAnimation(time, curSpeed);

        if (wild.sparkles) {
          wild.sparkles.rotation.y += delta * 1.5;
        }
      });

      // 4. Schooling Fish Animation
      fishList.forEach((f, idx) => {
        f.angle += delta * 0.5 * f.speed * curSpeed;
        const fx = Math.cos(f.angle + idx * 0.2) * (f.radius + Math.sin(time + idx) * 0.8);
        const fz = Math.sin(f.angle + idx * 0.2) * (f.radius + Math.cos(time + idx) * 0.8);
        const fy = f.y + Math.sin(time * 1.5 + idx) * 0.4;

        f.mesh.position.set(fx, fy, fz);
        f.mesh.rotation.y = Math.atan2(-Math.sin(f.angle), Math.cos(f.angle));
        f.mesh.rotation.z = Math.sin(time * 6 + idx) * 0.2;
      });

      // 5. Swaying Kelp Stalks
      kelpClusters.forEach((cluster, cIdx) => {
        cluster.stalks.forEach((stalk, sIdx) => {
          const sway = Math.sin(time * 1.4 + cIdx * 0.8 + sIdx * 0.5) * 0.12;
          stalk.mesh.rotation.z = sway;
          stalk.mesh.rotation.x = Math.cos(time * 1.1 + sIdx) * 0.08;
        });
      });

      // 6. Rising Bubbles
      const bPos = bubbleParticles.geometry.attributes.position;
      const bArray = bPos.array as Float32Array;
      for (let b = 0; b < bubbleCount; b++) {
        bArray[b * 3 + 1] += bubbleSpeeds[b] * delta * 1.5;
        bArray[b * 3] += Math.sin(time + b) * 0.015;
        if (bArray[b * 3 + 1] > 11.5) {
          bArray[b * 3 + 1] = -5.8;
          bArray[b * 3] = (Math.random() - 0.5) * 55;
          bArray[b * 3 + 2] = (Math.random() - 0.5) * 55;
        }
      }
      bPos.needsUpdate = true;

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      domEl.removeEventListener('click', handlePointerDown);
      domEl.removeEventListener('touchstart', handleTouchStart);
      domEl.removeEventListener('touchmove', handleTouchMove);
      domEl.removeEventListener('touchend', handleTouchEnd);
      domEl.removeEventListener('touchcancel', handleTouchEnd);
      domEl.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(spawnTimer);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full h-full absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing select-none"
    />
  );
};
