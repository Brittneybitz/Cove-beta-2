import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { CustomModelConfig, ModelTarget } from '../services/customModelStorage';
import { createNameplate, CreatureRig } from './models';
import { CreatureType } from '../types/game';

const gltfLoader = new GLTFLoader();

export interface LoadedCustomRig extends CreatureRig {
  mixer?: THREE.AnimationMixer;
  isCustomModel: boolean;
}

export function sanitizeAndFixModelMaterials(root: THREE.Object3D, customSkinTexture?: THREE.Texture | null) {
  root.traverse((child) => {
    // Ensure all meshes are visible and never frustum-culled
    child.visible = true;
    child.frustumCulled = false;

    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;

      // Only apply custom skin texture if explicitly provided by the user
      if (customSkinTexture) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((mat) => {
          if (!mat) return;
          (mat as any).map = customSkinTexture;
          customSkinTexture.colorSpace = THREE.SRGBColorSpace;
          customSkinTexture.needsUpdate = true;
          mat.needsUpdate = true;
        });
      }
    }
  });
}

export function loadTextureFromBuffer(buffer: ArrayBuffer, mimeType: string = 'image/png'): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([buffer], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.needsUpdate = true;
        URL.revokeObjectURL(url);
        resolve(texture);
      },
      undefined,
      (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      }
    );
  });
}

export function loadTextureFromBase64(base64: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const dataUrl = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
    const loader = new THREE.TextureLoader();
    loader.load(
      dataUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.needsUpdate = true;
        resolve(texture);
      },
      undefined,
      (err) => reject(err)
    );
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
  badgeText: string,
  customSkinTexture?: THREE.Texture | null
): LoadedCustomRig {
  const root = new THREE.Group();

  // Clone scene using SkeletonUtils.clone to properly deep-clone SkinnedMeshes & bones!
  // Normal Object3D.clone(true) leaves SkinnedMeshes bound to the original skeleton,
  // causing all instances to render frozen on top of each other at origin (0, 0, 0).
  const cloned = SkeletonUtils.clone(modelScene) as THREE.Group;

  // Apply materials sanitization and optional skin texture to cloned instance
  sanitizeAndFixModelMaterials(cloned, customSkinTexture);

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

  // Group wrapper to handle rotation orientation (e.g. 180 flip if model was authored backwards)
  const modelWrapper = new THREE.Group();
  modelWrapper.add(cloned);

  cloned.scale.setScalar(finalScale);

  // Re-center geometry within wrapper
  cloned.position.x = -center.x * finalScale;
  cloned.position.y = -center.y * finalScale + (config.offsetY || 0);
  cloned.position.z = -center.z * finalScale;

  let currentRotYDeg = config.rotationY || 0;

  // Apply manual rotation offset if specified (e.g. 180 degrees)
  if (currentRotYDeg) {
    modelWrapper.rotation.y = (currentRotYDeg * Math.PI) / 180;
  }

  root.add(modelWrapper);

  // Add Nameplate
  const nameSprite = createNameplate(displayName, badgeText);
  nameSprite.position.set(0, (size.y * finalScale) / 2 + 1.8 + (config.offsetY || 0), 0);
  root.add(nameSprite);

  // Return animated rig
  const creatureType: CreatureType = target === 'fish' ? 'orca' : target;

  return {
    root,
    modelWrapper,
    innerMesh: cloned,
    nameSprite,
    creatureType,
    isCustomModel: true,
    setRotationYOffset: (deg: number) => {
      currentRotYDeg = deg;
      modelWrapper.rotation.y = (deg * Math.PI) / 180;
    },
    updateAnimation: (time: number, speedMultiplier: number) => {
      const freq = time * 4.5 * speedMultiplier;
      // Gentle natural undulating yaw, pitch & sway inside the modelWrapper
      modelWrapper.rotation.z = Math.sin(freq * 0.5) * 0.06;
      modelWrapper.position.y = Math.sin(freq * 0.8) * 0.25;
    },
  };
}
