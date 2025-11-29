import type { Entity } from './Entity';
import type { ComponentType } from './Component';
import type { World } from './World';

/**
 * QueryBuilder provides a fluent API for querying entities.
 * Supports filtering by required and excluded components.
 *
 * @example
 * const movables = query()
 *   .with(Transform, Velocity)
 *   .without(Static)
 *   .execute(world);
 */
export interface QueryBuilder {
  /** Require entities to have these components */
  with(...components: ComponentType<unknown>[]): QueryBuilder;
  /** Exclude entities that have these components */
  without(...components: ComponentType<unknown>[]): QueryBuilder;
  /** Execute the query and return matching entities */
  execute(world: World): Entity[];
}

/**
 * Create a new query builder.
 */
export function query(): QueryBuilder {
  const withComponents: ComponentType<unknown>[] = [];
  const withoutComponents: ComponentType<unknown>[] = [];

  const builder: QueryBuilder = {
    with(...components) {
      withComponents.push(...components);
      return builder;
    },

    without(...components) {
      withoutComponents.push(...components);
      return builder;
    },

    execute(world) {
      return world.entities.getAll().filter((entity) => {
        // Must have all "with" components
        const hasAll = withComponents.every((c) => world.hasComponent(entity, c));
        if (!hasAll) return false;

        // Must not have any "without" components
        const hasNone = withoutComponents.every((c) => !world.hasComponent(entity, c));
        return hasNone;
      });
    },
  };

  return builder;
}
