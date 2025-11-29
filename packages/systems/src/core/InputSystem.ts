import { type System, SystemPriorities } from '@repo/ecs';
import { InputReceiver, DirectionInput, ActionInput } from '@repo/components';
import { useInputStore } from '@repo/input';

/**
 * InputSystem bridges the @repo/input Zustand store with the ECS world.
 * It reads input state each frame and updates input components on entities.
 */
export const InputSystem: System = {
  name: 'InputSystem',
  priority: SystemPriorities.INPUT,

  update(world, _deltaTime) {
    // Get current input state from Zustand store
    const inputState = useInputStore.getState();

    // Find all entities with InputReceiver
    const entities = world.query(InputReceiver);

    for (const entity of entities) {
      const receiver = world.getComponent(entity, InputReceiver);
      if (!receiver?.active) continue;

      // Update DirectionInput if entity has it
      if (world.hasComponent(entity, DirectionInput)) {
        const current = world.getComponent(entity, DirectionInput)!;
        world.addComponent(entity, DirectionInput, {
          lastDirection: current.direction,
          direction: inputState.direction,
          bufferedDirection: current.bufferedDirection,
        });
      }

      // Update ActionInput if entity has it
      if (world.hasComponent(entity, ActionInput)) {
        const current = world.getComponent(entity, ActionInput)!;
        world.addComponent(entity, ActionInput, {
          action: inputState.action,
          actionJustPressed: inputState.action && !current.action,
          interact: inputState.interact,
          back: inputState.back,
        });
      }
    }
  },
};
