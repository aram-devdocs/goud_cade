# Arcade Cabinet Game Engine

A modular game engine built with an Entity-Component-System (ECS) architecture, designed for rendering classic arcade games on 3D arcade cabinet models.

## Architecture Overview

This project follows a **separation of concerns** pattern inspired by game engines like Unity:
- **Game logic** is pure data and behavior, decoupled from rendering
- **Rendering** is handled separately (2D canvas for games, 3D for cabinet)
- **Input** is abstracted to support keyboard, touch, and gamepad uniformly

```
┌─────────────────────────────────────────────────────────────────┐
│                        apps/web                                 │
│                    (Next.js Application)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   @repo/ui    │    │  @repo/scene  │    │  @repo/games  │
│  (UI overlay) │    │(3D cabinet)   │    │(Game wrappers)│
└───────────────┘    └───────────────┘    └───────────────┘
                                                  │
                                                  ▼
                                    ┌─────────────────────────┐
                                    │  @repo/game-definitions │
                                    │   (Game logic - ECS)    │
                                    └─────────────────────────┘
                                                  │
                    ┌─────────────────────────────┼─────────────┐
                    ▼                             ▼             ▼
            ┌─────────────┐              ┌─────────────┐ ┌─────────────┐
            │  @repo/ecs  │              │@repo/systems│ │@repo/input  │
            │   (Core)    │◄─────────────│  (Shared)   │ │  (Unified)  │
            └─────────────┘              └─────────────┘ └─────────────┘
                    ▲                             │
                    │                             │
            ┌─────────────┐                       │
            │@repo/       │◄──────────────────────┘
            │ components  │
            └─────────────┘
```

## Monorepo Structure

```
goud_cade/
├── apps/
│   └── web/                 # Next.js application
├── packages/
│   ├── ecs/                 # Core ECS framework
│   ├── components/          # Reusable ECS components
│   ├── systems/             # Shared ECS systems
│   ├── game-definitions/    # Game-specific logic (Snake, Flappy Bird)
│   ├── games/               # React wrappers for games
│   ├── input/               # Unified input handling
│   ├── scene/               # 3D arcade cabinet scene
│   ├── ui/                  # UI components (menus, overlays)
│   ├── hooks/               # Shared React hooks
│   └── tsconfig/            # Shared TypeScript configs
└── turbo.json               # Turborepo configuration
```

## Entity-Component-System (ECS)

The game engine uses ECS architecture for maximum flexibility and separation of concerns.

### Core Concepts

| Concept | Description |
|---------|-------------|
| **Entity** | A unique ID (number) representing a game object |
| **Component** | Pure data attached to entities (position, velocity, sprite) |
| **System** | Logic that processes entities with specific components |
| **World** | Container managing entities, components, systems, and resources |
| **Resource** | Singleton data shared across systems (score, game state) |

### Package: `@repo/ecs`

The core ECS framework providing:
- Entity creation and lifecycle management
- Component registration and storage (sparse Map-based)
- System scheduling with priority ordering
- Event bus for decoupled communication
- Resources for global state

### Package: `@repo/components`

Reusable component definitions organized by domain:

```
components/
├── transform/      # Position, GridPosition, Velocity
├── rendering/      # Sprite, Mesh
├── physics/        # RigidBody, Gravity, Collider
├── gameplay/       # Player, Health, Food, SnakeSegment, Pipe
├── input/          # InputReceiver, DirectionInput, ActionInput
└── audio/          # SoundEffect
```

### Package: `@repo/systems`

Shared systems reusable across games:

| System | Purpose |
|--------|---------|
| `InputSystem` | Bridges Zustand input store to ECS components |
| `VelocitySystem` | Applies velocity to transform each frame |
| `GravitySystem` | Applies gravity to velocity |
| `AudioSystem` | Handles sound playback via events |

### Package: `@repo/game-definitions`

Game-specific implementations following a consistent structure:

```
game-definitions/
├── snake/
│   ├── config.ts      # Game constants (grid size, speeds, colors)
│   ├── prefabs.ts     # Entity factories (createSnakeHead, createFood)
│   ├── systems.ts     # Game-specific systems
│   ├── render.ts      # Custom canvas renderer
│   └── game.ts        # Game factory (createSnakeGame)
└── flappy/
    └── ...            # Same structure
```

Each game exports a factory function that:
1. Creates a World instance
2. Initializes resources
3. Adds systems in priority order
4. Returns control methods (start, stop, reset, destroy)

## System Priority

Systems execute in priority order (lower = earlier):

| Priority | Phase | Examples |
|----------|-------|----------|
| 0 | INPUT | InputSystem |
| 100 | PRE_PHYSICS | Direction validation |
| 200 | PHYSICS | Movement, Velocity |
| 300 | POST_PHYSICS | Collision detection |
| 400 | GAME_LOGIC | Scoring, state changes |
| 500 | PRE_RENDER | Animation updates |
| 600 | RENDER | Canvas drawing |
| 700 | POST_RENDER | Audio, cleanup |

## Input Architecture

### Package: `@repo/input`

Unified input handling supporting multiple sources:

```
input/
├── stores/
│   └── useInputStore.ts    # Zustand store for input state
├── hooks/
│   ├── useKeyboardInput.ts # Keyboard event handling
│   ├── useTouchInput.ts    # Touch/swipe handling
│   ├── useGamepadInput.ts  # Gamepad API handling
│   └── useInput.ts         # Combined hook
└── types.ts                # Direction, InputState types
```

**Data Flow:**
1. Input hooks detect keyboard/touch/gamepad events
2. Events update the Zustand store (`useInputStore`)
3. `InputSystem` reads store each frame
4. Updates `DirectionInput`/`ActionInput` components on entities
5. Game systems read these components

## Rendering Strategy

Games render to a **hidden 2D canvas** which is used as a texture on the 3D arcade cabinet screen:

```
Game (ECS) → Canvas 2D → Three.js Texture → Arcade Cabinet Screen
```

This allows:
- Games to use simple Canvas 2D API
- Cabinet to apply CRT effects, reflections
- Clean separation between game and presentation

### Package: `@repo/games`

Thin React wrappers that:
1. Create a hidden canvas element
2. Instantiate the ECS game via factory function
3. Handle React lifecycle (start/stop on mount/unmount)
4. Forward callbacks (onScoreChange, onGameOver)

### Package: `@repo/scene`

3D arcade cabinet scene using React Three Fiber:
- Cabinet model with screen mesh
- Game canvas as dynamic texture
- Lighting and camera setup

## Event-Driven Communication

Systems communicate via events rather than direct coupling:

```typescript
// Emitting
world.emit('foodEaten', { entity: foodId });
world.emit('gameOver', { reason: 'wall' });

// Subscribing (in system init)
world.on('foodEaten', (data) => {
  // Handle food collection
});
```

Common events:
- `gameOver` - Triggered when player loses
- `restart` - Triggered to reset game
- `foodEaten` - Snake collected food
- `playSound` - Request audio playback

## Resource Management

Global state is stored as **resources** rather than components:

```typescript
// Setting
world.setResource('score', 0);
world.setResource('gameOver', false);

// Getting
const score = world.getResource<number>('score');
```

Resources are reset in `initEntities()` on game restart.

## Adding a New Game

1. Create directory: `packages/game-definitions/src/[game-name]/`
2. Define config with game constants
3. Create prefabs (entity factories)
4. Implement game-specific systems
5. Create custom render system
6. Export game factory from `game.ts`
7. Create React wrapper in `packages/games/`

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Type check all packages
pnpm typecheck

# Lint all packages
pnpm lint

# Build all packages
pnpm build
```

## Design Principles

1. **Data-Oriented**: Components are pure data, systems are pure logic
2. **Composition over Inheritance**: Entities are composed of components
3. **Decoupled Communication**: Systems communicate via events
4. **Stateless Systems**: Systems don't hold game state (use resources)
5. **Priority Scheduling**: Deterministic system execution order
6. **Shared Infrastructure**: Common systems/components across games
