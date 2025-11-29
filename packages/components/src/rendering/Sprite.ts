import { defineComponent } from '@repo/ecs';

/**
 * Sprite component for 2D canvas rendering.
 * Supports rectangles, circles, and rounded rectangles.
 */
export const Sprite = defineComponent('Sprite', {
  /** Width in pixels */
  width: 32,
  /** Height in pixels */
  height: 32,
  /** Fill color (CSS color string) */
  color: '#ffffff',
  /** Optional border color */
  borderColor: undefined as string | undefined,
  /** Border width in pixels */
  borderWidth: 0,
  /** Shape type */
  shape: 'rect' as 'rect' | 'circle' | 'roundRect',
  /** Corner radius for roundRect */
  cornerRadius: 0,
  /** Whether to render this sprite */
  visible: true,
  /** Z-ordering (higher = rendered on top) */
  layer: 0,
  /** Opacity (0-1) */
  opacity: 1,
});

export type SpriteData = typeof Sprite.defaultValue;
