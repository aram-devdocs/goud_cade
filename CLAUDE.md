# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start development server
pnpm build            # Build all packages
pnpm lint             # Run ESLint across all packages
pnpm typecheck        # Type check all packages
pnpm test             # Run tests
pnpm clean            # Clean build artifacts
```

Individual package commands use the same scripts (e.g., `pnpm --filter @repo/ecs typecheck`).

## Pre-commit Hooks

Husky runs `lint`, `typecheck`, `test`, and `build` on every commit.

## Architecture

This is a **pnpm monorepo** using **Turborepo** for orchestration. It's a game engine built around the **Entity-Component-System (ECS)** pattern.

### Package Dependency Flow

```
@repo/ecs (core ECS primitives)
    ↓
@repo/components (game component definitions)
    ↓
@repo/systems (reusable systems)
    ↓
@repo/input (unified input handling: keyboard, gamepad, touch)
    ↓
@repo/game-definitions (game-specific logic: snake, flappy)
    ↓
@repo/games (game instance factories)
    ↓
@repo/web (Next.js app)
```

### ECS Core (`@repo/ecs`)

- **Entity**: Just a numeric ID (`type Entity = number`)
- **Component**: Pure data defined via `defineComponent(name, defaultValue)`
- **System**: Logic with `update(world, deltaTime)`, ordered by `priority` (lower = runs first)
- **World**: Container managing entities, components, systems, events (`emit`/`on`), and resources (`setResource`/`getResource`)

Standard system priorities in `SystemPriorities`: INPUT (0) → PRE_PHYSICS (100) → PHYSICS (200) → POST_PHYSICS (300) → GAME_LOGIC (400) → PRE_RENDER (500) → RENDER (600) → POST_RENDER (700)

### Component Categories (`@repo/components`)

- `transform/`: Transform, GridPosition, Velocity
- `physics/`: RigidBody, Gravity, Collider
- `gameplay/`: Player, Health, Score, Food, SnakeSegment, Pipe
- `input/`: InputReceiver, DirectionInput, ActionInput
- `rendering/`: Sprite, Mesh
- `audio/`: SoundEffect

### Input System (`@repo/input`)

Unified input handling with Zustand store:
- Hooks: `useInput`, `useMovementInput`, `useDirectionInput`, `useKeyboardInput`, `useGamepadInput`, `useTouchInput`
- Components: `VirtualJoystick`, `VirtualDPad`, `TouchButton`, `TouchControls`

### Game Definitions (`@repo/game-definitions`)

Each game (snake, flappy) has:
- `config.ts`: Game constants
- `prefabs.ts`: Entity factories
- `systems.ts`: Game-specific systems
- `render.ts`: Custom rendering
- `game.ts`: Factory function creating a game instance

### Creating a Game Instance

```typescript
const game = createSnakeGame({
  canvas: canvasElement,
  playSound: (type) => { /* play audio */ },
  onScoreChange: (score) => { /* update UI */ },
  onGameOver: () => { /* handle game over */ },
});
game.start();
// game.stop(), game.reset(), game.destroy()
```
