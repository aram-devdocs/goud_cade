import { type System, SystemPriorities } from '@repo/ecs';
import { Velocity, Gravity } from '@repo/components';

/**
 * GravitySystem applies gravity to entities with Velocity and Gravity components.
 * Runs before VelocitySystem to update velocity before movement.
 */
export const GravitySystem: System = {
  name: 'GravitySystem',
  priority: SystemPriorities.PRE_PHYSICS,

  update(world, _deltaTime) {
    const entities = world.query(Velocity, Gravity);

    for (const entity of entities) {
      const velocity = world.getComponent(entity, Velocity)!;
      const gravity = world.getComponent(entity, Gravity)!;

      if (!gravity.enabled) continue;

      // Apply gravity, capped at max fall speed
      const newVelY = Math.min(
        velocity.y + gravity.strength,
        gravity.maxFallSpeed
      );

      world.addComponent(entity, Velocity, {
        ...velocity,
        y: newVelY,
      });
    }
  },
};
