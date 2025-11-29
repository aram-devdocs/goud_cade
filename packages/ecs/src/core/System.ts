import type { World } from './World';

/**
 * System priority determines execution order.
 * Lower priority values run first.
 */
export type SystemPriority = number;

/**
 * System interface - contains game logic that operates on entities.
 * Systems are stateless processors that query entities by components
 * and update their data each frame.
 */
export interface System {
  /** Unique name for this system */
  readonly name: string;
  /** Execution priority (lower = runs earlier) */
  readonly priority: SystemPriority;

  /** Called once when system is added to world */
  init?(world: World): void;

  /** Called every frame with delta time in seconds */
  update(world: World, deltaTime: number): void;

  /** Called when system is removed from world */
  cleanup?(world: World): void;
}

/**
 * Standard priority values for system ordering.
 * Use these to ensure systems run in the correct order.
 */
export const SystemPriorities = {
  /** Input reading (runs first) */
  INPUT: 0,
  /** Pre-physics processing (direction validation, etc.) */
  PRE_PHYSICS: 100,
  /** Physics simulation (movement, velocity) */
  PHYSICS: 200,
  /** Post-physics (collision detection) */
  POST_PHYSICS: 300,
  /** Game logic (scoring, state changes) */
  GAME_LOGIC: 400,
  /** Pre-render preparation */
  PRE_RENDER: 500,
  /** Rendering */
  RENDER: 600,
  /** Post-render (audio, cleanup) */
  POST_RENDER: 700,
} as const;

/**
 * Helper to create a system with proper typing.
 */
export function createSystem(config: System): System {
  return config;
}
