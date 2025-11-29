import { defineComponent } from '@repo/ecs';

/**
 * RigidBody component for physics simulation.
 */
export const RigidBody = defineComponent('RigidBody', {
  /** Mass of the body */
  mass: 1,
  /** Friction coefficient */
  friction: 0,
  /** Bounciness (0-1) */
  restitution: 0,
  /** Static bodies don't move */
  isStatic: false,
  /** Triggers detect collision but don't block movement */
  isTrigger: false,
});

export type RigidBodyData = typeof RigidBody.defaultValue;
