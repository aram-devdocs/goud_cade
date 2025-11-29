import { type System, type World, SystemPriorities } from '@repo/ecs';
import { SoundEffect } from '@repo/components';

export interface AudioSystemConfig {
  /** Function to play sounds (usually from useArcadeAudio) */
  playSound: (type: string) => void;
}

/**
 * AudioSystem handles sound effect playback.
 * Listens for 'playSound' events and processes SoundEffect components.
 */
export function createAudioSystem(config: AudioSystemConfig): System {
  return {
    name: 'AudioSystem',
    priority: SystemPriorities.POST_RENDER,

    init(world: World) {
      // Listen for sound events from other systems
      world.on('playSound', (data) => {
        const soundData = data as { type: string };
        if (soundData?.type) {
          config.playSound(soundData.type);
        }
      });
    },

    update(world, _deltaTime) {
      // Process SoundEffect components
      const entities = world.query(SoundEffect);

      for (const entity of entities) {
        const sound = world.getComponent(entity, SoundEffect);
        if (!sound || !sound.triggered) continue;

        // Play the sound
        config.playSound(sound.type);

        // Remove or reset the component
        if (sound.oneShot) {
          world.removeComponent(entity, SoundEffect);
        } else {
          world.addComponent(entity, SoundEffect, {
            ...sound,
            triggered: false,
          });
        }
      }
    },
  };
}
