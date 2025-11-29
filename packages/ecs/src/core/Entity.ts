/**
 * Entity is just a unique numeric ID - no data attached.
 * This is the core principle of ECS: entities are identifiers,
 * components hold data, systems contain logic.
 */
export type Entity = number;

export interface EntityManager {
  /** Create a new entity and return its ID */
  create(): Entity;
  /** Destroy an entity by ID */
  destroy(entity: Entity): void;
  /** Check if an entity exists */
  exists(entity: Entity): boolean;
  /** Get all active entity IDs */
  getAll(): Entity[];
  /** Remove all entities */
  clear(): void;
  /** Get the count of active entities */
  count(): number;
}

export function createEntityManager(): EntityManager {
  let nextId = 0;
  const entities = new Set<Entity>();

  return {
    create() {
      const entity = nextId++;
      entities.add(entity);
      return entity;
    },

    destroy(entity) {
      entities.delete(entity);
    },

    exists(entity) {
      return entities.has(entity);
    },

    getAll() {
      return Array.from(entities);
    },

    clear() {
      entities.clear();
      nextId = 0;
    },

    count() {
      return entities.size;
    },
  };
}
