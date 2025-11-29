import { type Entity, type EntityManager, createEntityManager } from './Entity';
import {
  type ComponentType,
  type ComponentStorage,
  createComponentStorage,
} from './Component';
import type { System } from './System';

type EventHandler = (data?: unknown) => void;

/**
 * World is the container for all ECS data.
 * It manages entities, components, systems, events, and resources.
 */
export interface World {
  /** Entity manager for creating/destroying entities */
  readonly entities: EntityManager;

  // Component management
  /** Register a component type (call before using) */
  registerComponent<T>(type: ComponentType<T>): void;
  /** Add a component to an entity */
  addComponent<T>(entity: Entity, type: ComponentType<T>, data: T): void;
  /** Get component data from an entity */
  getComponent<T>(entity: Entity, type: ComponentType<T>): T | undefined;
  /** Check if entity has a component */
  hasComponent<T>(entity: Entity, type: ComponentType<T>): boolean;
  /** Remove a component from an entity */
  removeComponent<T>(entity: Entity, type: ComponentType<T>): void;
  /** Remove all components from an entity */
  removeAllComponents(entity: Entity): void;

  // System management
  /** Add a system to the world */
  addSystem(system: System): void;
  /** Remove a system by name */
  removeSystem(name: string): void;
  /** Get a system by name */
  getSystem<T extends System>(name: string): T | undefined;

  // Query
  /** Query entities that have all specified components */
  query(...components: ComponentType<unknown>[]): Entity[];

  // Lifecycle
  /** Update all systems (call once per frame) */
  update(deltaTime: number): void;
  /** Destroy the world and cleanup all resources */
  destroy(): void;

  // Events (decoupled communication between systems)
  /** Emit an event */
  emit(event: string, data?: unknown): void;
  /** Subscribe to an event, returns unsubscribe function */
  on(event: string, handler: EventHandler): () => void;

  // Resources (shared singleton data)
  /** Set a named resource */
  setResource<T>(name: string, value: T): void;
  /** Get a named resource */
  getResource<T>(name: string): T | undefined;
}

/**
 * Create a new ECS World.
 */
export function createWorld(): World {
  const entityManager = createEntityManager();
  const componentStorages = new Map<string, ComponentStorage<unknown>>();
  const systems: System[] = [];
  const eventHandlers = new Map<string, Set<EventHandler>>();
  const resources = new Map<string, unknown>();

  // Track component types for cleanup
  const registeredComponents: ComponentType<unknown>[] = [];

  function getStorage<T>(type: ComponentType<T>): ComponentStorage<T> {
    let storage = componentStorages.get(type.name);
    if (!storage) {
      storage = createComponentStorage<T>();
      componentStorages.set(type.name, storage);
      registeredComponents.push(type);
    }
    return storage as ComponentStorage<T>;
  }

  const world: World = {
    entities: entityManager,

    registerComponent<T>(type: ComponentType<T>) {
      if (!componentStorages.has(type.name)) {
        componentStorages.set(type.name, createComponentStorage<T>());
        registeredComponents.push(type);
      }
    },

    addComponent<T>(entity: Entity, type: ComponentType<T>, data: T) {
      if (!entityManager.exists(entity)) {
        console.warn(`Cannot add component to non-existent entity ${entity}`);
        return;
      }
      const storage = getStorage(type);
      storage.set(entity, data);
    },

    getComponent<T>(entity: Entity, type: ComponentType<T>): T | undefined {
      const storage = getStorage(type);
      return storage.get(entity);
    },

    hasComponent<T>(entity: Entity, type: ComponentType<T>): boolean {
      const storage = componentStorages.get(type.name);
      return storage?.has(entity) ?? false;
    },

    removeComponent<T>(entity: Entity, type: ComponentType<T>) {
      const storage = componentStorages.get(type.name);
      storage?.remove(entity);
    },

    removeAllComponents(entity: Entity) {
      for (const storage of componentStorages.values()) {
        storage.remove(entity);
      }
    },

    addSystem(system: System) {
      // Remove existing system with same name
      const existingIndex = systems.findIndex((s) => s.name === system.name);
      if (existingIndex !== -1) {
        const existing = systems[existingIndex]!;
        existing.cleanup?.(world);
        systems.splice(existingIndex, 1);
      }

      // Insert in priority order
      const insertIndex = systems.findIndex((s) => s.priority > system.priority);
      if (insertIndex === -1) {
        systems.push(system);
      } else {
        systems.splice(insertIndex, 0, system);
      }

      // Initialize the system
      system.init?.(world);
    },

    removeSystem(name: string) {
      const index = systems.findIndex((s) => s.name === name);
      if (index !== -1) {
        const system = systems[index]!;
        system.cleanup?.(world);
        systems.splice(index, 1);
      }
    },

    getSystem<T extends System>(name: string): T | undefined {
      return systems.find((s) => s.name === name) as T | undefined;
    },

    query(...components: ComponentType<unknown>[]): Entity[] {
      if (components.length === 0) {
        return entityManager.getAll();
      }

      // Start with entities that have the first component
      const firstComponent = components[0]!;
      const firstStorage = componentStorages.get(firstComponent.name);
      if (!firstStorage) return [];

      const candidates = firstStorage.entities();

      // Filter to entities that have all components
      return candidates.filter((entity) =>
        components.every((comp) => {
          const storage = componentStorages.get(comp.name);
          return storage?.has(entity) ?? false;
        })
      );
    },

    update(deltaTime: number) {
      for (const system of systems) {
        system.update(world, deltaTime);
      }
    },

    destroy() {
      // Cleanup all systems
      for (const system of systems) {
        system.cleanup?.(world);
      }
      systems.length = 0;

      // Clear all component storage
      for (const storage of componentStorages.values()) {
        storage.clear();
      }
      componentStorages.clear();

      // Clear entities
      entityManager.clear();

      // Clear events and resources
      eventHandlers.clear();
      resources.clear();
    },

    emit(event: string, data?: unknown) {
      const handlers = eventHandlers.get(event);
      if (handlers) {
        for (const handler of handlers) {
          handler(data);
        }
      }
    },

    on(event: string, handler: EventHandler): () => void {
      let handlers = eventHandlers.get(event);
      if (!handlers) {
        handlers = new Set();
        eventHandlers.set(event, handlers);
      }
      handlers.add(handler);

      // Return unsubscribe function
      return () => {
        handlers?.delete(handler);
      };
    },

    setResource<T>(name: string, value: T) {
      resources.set(name, value);
    },

    getResource<T>(name: string): T | undefined {
      return resources.get(name) as T | undefined;
    },
  };

  return world;
}
