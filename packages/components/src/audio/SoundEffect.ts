import { defineComponent } from '@repo/ecs';

/**
 * SoundEffect component triggers audio playback.
 * The AudioSystem processes these and plays sounds.
 */
export const SoundEffect = defineComponent('SoundEffect', {
  /** Sound type identifier */
  type: '' as string,
  /** Whether the sound should play */
  triggered: false,
  /** Remove component after playing */
  oneShot: true,
});

export type SoundEffectData = typeof SoundEffect.defaultValue;
