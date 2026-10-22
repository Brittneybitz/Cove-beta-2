import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CustomModelConfig, ModelTarget } from '../services/customModelStorage';
import { createNameplate, CreatureRig } from './models';
import { CreatureType } from '../types/game';

const gltfLoader = new GLTFLoader();

export interface LoadedCustomRig extends CreatureRig {
  mixer?: THREE.AnimationMixer;
  isCustomModel: boolean;
}

export function sanitizeAndFixModelMaterials(root: THREE.Object3D) {
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((mat) => {
        if (!mat) return;
        mat.side = THREE.DoubleSide;
        mat.needsUpdate = true;

        if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
          if (mat.map) {
            mat.map.colorSpace = THREE.SRGBColorSpace;
            mat.map.needsUpdate = true;
          }
          if (mat.emissiveMap) {
            mat.emissiveMap.colorSpace = THREE.SRGBColorSpace;
            mat.emissiveMap.needsUpdate = true;
          }
          if (mat.normalMap) {
            mat.normalMap.needsUpdate = true;
          }
          if (mat.roughnessMap) {
            mat.roughnessMap.needsUpdate = true;
          }
          if (mat.metalnessMap) {
            mat.metalnessMap.needsUpdate = true;
          }

          // Prevent pitch-black unlit textures
          if (mat.metalness > 0.85 && !mat.metalnessMap) {
            mat.metalness = 0.3;
          }
          if (mat.color && mat.color.getHex() === 0x000000 && !mat.map) {
            mat.color.setHex(0x38bdf8);
          }
        } else if (mat instanceof THREE.MeshBasicMaterial) {
          if (mat.map) {
            mat.map.colorSpace = THREE.SRGBColorSpace;
            mat.map.needsUpdate = true;
          }
        }
      });
    }
  });
}

export async function parseGLTFBuffer(buffer: ArrayBuffer): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    gltfLoader.parse(
      buffer,
      '',
      (gltf) => {
        sanitizeAndFixModelMaterials(gltf.scene);
        resolve(gltf.scene);
      },
      (error) => {
        reject(error);
      }
    );
  });
}

export async function loadGLTFUrl(url: string): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      url,
      (gltf) => {
        sanitizeAndFixModelMaterials(gltf.scene);
        resolve(gltf.scene);
      },
      undefined,
      (error) => {
        reject(error);
      }
    );
  });
}

export function buildRigFromCustomModel(
  modelScene: THREE.Group,
  target: ModelTarget,
  config: CustomModelConfig,
  displayName: string,
  badgeText: string
): LoadedCustomRig {
  const root = new THREE.Group();

  // Clone or adapt scene
  const cloned = modelScene.clone(true);

  // Measure bounding box to normalize scale
  const bbox = new THREE.Box3().setFromObject(cloned);
  const size = bbox.getSize(new THREE.Vector3());
  const center = bbox.getCenter(new THREE.Vector3());

  // Desired reference size per creature
  const targetDimensionMap: Record<ModelTarget, number> = {
    orca: 4.8,
    shark: 4.2,
    dolphin: 3.6,
    hammerhead: 4.5,
    manta: 4.6,
    fish: 0.9,
  };

  const targetDim = targetDimensionMap[target] || 4.0;
  const maxAxis = Math.max(size.x, size.y, size.z) || 1;
  const baseScale = targetDim / maxAxis;
  const finalScale = baseScale * (config.scale || 1.0);

  cloned.scale.setScalar(finalScale);

  // Re-center geometry
  cloned.position.x = -center.x * finalScale;
  cloned.position.y = -center.y * finalScale + (config.offsetY || 0);
  cloned.position.z = -center.z * finalScale;

  root.add(cloned);

  // Add Nameplate
  const nameSprite = createNameplate(displayName, badgeText);
  nameSprite.position.set(0, (size.y * finalScale) / 2 + 1.8 + (config.offsetY || 0), 0);
  root.add(nameSprite);

  // Return animated rig
  const creatureType: CreatureType = target === 'fish' ? 'orca' : target;

  return {
    root,
    nameSprite,
    creatureType,
    isCustomModel: true,
    updateAnimation: (time: number, speedMultiplier: number) => {
      const freq = time * 4.5 * speedMultiplier;
      // Gentle natural undulating yaw & pitch
      cloned.rotation.y = Math.sin(freq) * 0.12;
      cloned.rotation.z = Math.sin(freq * 0.5) * 0.06;
      root.position.y = Math.sin(freq * 0.8) * 0.25;
    },
  };
}
