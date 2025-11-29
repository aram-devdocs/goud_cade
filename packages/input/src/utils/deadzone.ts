import type { Vector2 } from '../types';

/**
 * Apply deadzone to a single axis value
 * Returns 0 if within deadzone, otherwise normalizes to full range
 */
export function applyDeadzone(value: number, deadzone: number = 0.15): number {
  if (Math.abs(value) < deadzone) return 0;
  const sign = Math.sign(value);
  return sign * (Math.abs(value) - deadzone) / (1 - deadzone);
}

/**
 * Apply radial deadzone to a 2D vector
 * Better for analog sticks as it treats the deadzone as a circle
 */
export function applyRadialDeadzone(
  vector: Vector2,
  deadzone: number = 0.15
): Vector2 {
  const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);

  if (magnitude < deadzone) {
    return { x: 0, y: 0 };
  }

  // Normalize and scale to full range
  const scale = (magnitude - deadzone) / (1 - deadzone) / magnitude;
  return {
    x: vector.x * scale,
    y: vector.y * scale,
  };
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Normalize a vector to have a maximum magnitude of 1
 */
export function normalizeVector(vector: Vector2): Vector2 {
  const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  if (magnitude <= 1) return vector;
  return {
    x: vector.x / magnitude,
    y: vector.y / magnitude,
  };
}
