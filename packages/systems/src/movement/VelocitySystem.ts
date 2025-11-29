import { type System, SystemPriorities } from '@repo/ecs';
import { Transform, Velocity } from '@repo/components';

/**
 * VelocitySystem applies velocity to transform each frame.
 * Entities with both Transform and Velocity will move.
 */
export const VelocitySystem: System = {
  name: 'VelocitySystem',
  priority: SystemPriorities.PHYSICS,

  update(world, _deltaTime) {
    const entities = world.query(Transform, Velocity);

    for (const entity of entities) {
      const transform = world.getComponent(entity, Transform)!;
      const velocity = world.getComponent(entity, Velocity)!;

      world.addComponent(entity, Transform, {
        ...transform,
        x: transform.x + velocity.x,
        y: transform.y + velocity.y,
        z: transform.z + velocity.z,
      });
    }
  },
};
