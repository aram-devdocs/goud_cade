import { defineComponent } from '@repo/ecs';

/**
 * Mesh component for 3D Three.js rendering.
 * References a mesh by ID for the ThreeJSRenderSystem.
 */
export const Mesh = defineComponent('Mesh', {
  /** Mesh identifier (maps to a Three.js mesh) */
  meshId: '',
  /** Material color (hex) */
  color: 0xffffff,
  /** Whether to render this mesh */
  visible: true,
});

export type MeshData = typeof Mesh.defaultValue;
