import type { Entity } from './Entity';

/**
 * ComponentType defines a component's schema.
 * Components are pure data - no behavior.
 */
export interface ComponentType<T = unknown> {
  readonly name: string;
  readonly defaultValue: T;
}

/**
 * Define a new component type with a name and default value.
 * The default value serves as the schema and initial state.
 *
 * @example
 * const Transform = defineComponent('Transform', { x: 0, y: 0, rotation: 0 });
 * const Velocity = defineComponent('Velocity', { x: 0, y: 0 });
 */
export function defineComponent<T>(name: string, defaultValue: T): ComponentType<T> {
  return { name, defaultValue };
}

/**
 * ComponentStorage manages component data for all entities.
 * Uses a Map for O(1) lookup by entity ID.
 */
export interface ComponentStorage<T> {
  /** Get component data for an entity */
  get(entity: Entity): T | undefined;
  /** Set component data for an entity */
  set(entity: Entity, data: T): void;
  /** Check if an entity has this component */
  has(entity: Entity): boolean;
  /** Remove component from an entity */
  remove(entity: Entity): void;
  /** Get all entity-component pairs */
  entries(): IterableIterator<[Entity, T]>;
  /** Get all entities with this component */
  entities(): Entity[];
  /** Clear all component data */
  clear(): void;
}

export function createComponentStorage<T>(): ComponentStorage<T> {
  const storage = new Map<Entity, T>();

  return {
    get(entity) {
      return storage.get(entity);
    },

    set(entity, data) {
      storage.set(entity, data);
    },

    has(entity) {
      return storage.has(entity);
    },

    remove(entity) {
      storage.delete(entity);
    },

    entries() {
      return storage.entries();
    },

    entities() {
      return Array.from(storage.keys());
    },

    clear() {
      storage.clear();
    },
  };
}
