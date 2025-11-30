import { type System, type World, SystemPriorities } from '@repo/ecs';
import {
  GridPosition,
  DirectionInput,
  ActionInput,
  Ghost,
  Pellet,
  PacMan,
  type GhostName,
} from '@repo/components';
import { PACMAN_CONFIG } from './config';
import {
  canMoveTo,
  wrapTunnel,
  getValidDirections,
  isGhostHouse,
  createPacMan,
  createAllGhosts,
  createMazePellets,
} from './prefabs';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

/**
 * Direction input system - handles Pac-Man direction changes.
 */
export const PacManDirectionSystem: System = {
  name: 'PacManDirectionSystem',
  priority: SystemPriorities.INPUT + 10,

  update(world) {
    const pacmans = world.query(PacMan, DirectionInput, GridPosition);

    for (const entity of pacmans) {
      const pacman = world.getComponent(entity, PacMan);
      const input = world.getComponent(entity, DirectionInput);
      const pos = world.getComponent(entity, GridPosition);
      if (!pacman || !input || !pos) continue;

      // Store the requested direction as next direction
      if (input.direction && input.direction !== pacman.direction) {
        // Check if we can turn immediately
        const newCol = pos.col + (input.direction === 'RIGHT' ? 1 : input.direction === 'LEFT' ? -1 : 0);
        const newRow = pos.row + (input.direction === 'DOWN' ? 1 : input.direction === 'UP' ? -1 : 0);

        if (canMoveTo(newCol, newRow)) {
          world.addComponent(entity, PacMan, {
            ...pacman,
            direction: input.direction,
            nextDirection: null,
          });
        } else {
          // Buffer the direction for later
          world.addComponent(entity, PacMan, {
            ...pacman,
            nextDirection: input.direction,
          });
        }
      }
    }
  },
};

/**
 * Pac-Man movement system - moves Pac-Man on a timer.
 */
export function createPacManMovementSystem(): System {
  let timeSinceMove = 0;

  return {
    name: 'PacManMovementSystem',
    priority: SystemPriorities.PHYSICS,

    init(world) {
      world.on('restart', () => {
        timeSinceMove = 0;
      });
    },

    update(world, deltaTime) {
      if (world.getResource<boolean>('gameOver')) return;
      if (world.getResource<boolean>('levelComplete')) return;

      timeSinceMove += deltaTime * 1000;

      const { pacmanSpeed } = PACMAN_CONFIG.gameplay;
      if (timeSinceMove < pacmanSpeed) return;
      timeSinceMove = 0;

      const pacmans = world.query(PacMan, GridPosition);

      for (const entity of pacmans) {
        const pacman = world.getComponent(entity, PacMan);
        const pos = world.getComponent(entity, GridPosition);
        if (!pacman || !pos) continue;

        // Try buffered direction first
        let direction = pacman.direction;
        if (pacman.nextDirection) {
          const nextCol = pos.col + (pacman.nextDirection === 'RIGHT' ? 1 : pacman.nextDirection === 'LEFT' ? -1 : 0);
          const nextRow = pos.row + (pacman.nextDirection === 'DOWN' ? 1 : pacman.nextDirection === 'UP' ? -1 : 0);

          if (canMoveTo(nextCol, nextRow)) {
            direction = pacman.nextDirection;
            world.addComponent(entity, PacMan, {
              ...pacman,
              direction,
              nextDirection: null,
            });
          }
        }

        // Calculate new position
        let newCol = pos.col + (direction === 'RIGHT' ? 1 : direction === 'LEFT' ? -1 : 0);
        let newRow = pos.row + (direction === 'DOWN' ? 1 : direction === 'UP' ? -1 : 0);

        // Handle tunnel
        const wrapped = wrapTunnel(newCol, newRow);
        newCol = wrapped.col;
        newRow = wrapped.row;

        // Check if can move
        if (canMoveTo(newCol, newRow)) {
          world.addComponent(entity, GridPosition, {
            ...pos,
            col: newCol,
            row: newRow,
          });

          // Animate mouth
          const currentPacman = world.getComponent(entity, PacMan)!;
          let newMouthAngle = currentPacman.mouthAngle;
          let newMouthOpening = currentPacman.mouthOpening;

          if (newMouthOpening) {
            newMouthAngle += 15;
            if (newMouthAngle >= 45) {
              newMouthAngle = 45;
              newMouthOpening = false;
            }
          } else {
            newMouthAngle -= 15;
            if (newMouthAngle <= 5) {
              newMouthAngle = 5;
              newMouthOpening = true;
            }
          }

          world.addComponent(entity, PacMan, {
            ...currentPacman,
            mouthAngle: newMouthAngle,
            mouthOpening: newMouthOpening,
          });
        }
      }
    },
  };
}

/**
 * Ghost AI system - handles ghost behavior and movement.
 */
export function createGhostMovementSystem(): System {
  let timeSinceMove = 0;

  return {
    name: 'GhostMovementSystem',
    priority: SystemPriorities.PHYSICS + 10,

    init(world) {
      world.on('restart', () => {
        timeSinceMove = 0;
      });
    },

    update(world, deltaTime) {
      if (world.getResource<boolean>('gameOver')) return;
      if (world.getResource<boolean>('levelComplete')) return;

      timeSinceMove += deltaTime * 1000;

      // Find Pac-Man for targeting
      const pacmans = world.query(PacMan, GridPosition);
      let pacmanPos: { col: number; row: number } | null = null;
      let pacmanDir: Direction = 'LEFT';

      for (const entity of pacmans) {
        const pos = world.getComponent(entity, GridPosition);
        const pm = world.getComponent(entity, PacMan);
        if (pos && pm) {
          pacmanPos = { col: pos.col, row: pos.row };
          pacmanDir = pm.direction;
          break;
        }
      }

      const ghosts = world.query(Ghost, GridPosition);

      for (const entity of ghosts) {
        const ghost = world.getComponent(entity, Ghost);
        const pos = world.getComponent(entity, GridPosition);
        if (!ghost || !pos) continue;

        // Update frightened timer
        if (ghost.frightenedTimer > 0) {
          const newTimer = ghost.frightenedTimer - deltaTime * 1000;
          if (newTimer <= 0) {
            world.addComponent(entity, Ghost, {
              ...ghost,
              mode: 'chase',
              frightenedTimer: 0,
            });
          } else {
            world.addComponent(entity, Ghost, {
              ...ghost,
              frightenedTimer: newTimer,
            });
          }
        }

        // Handle ghost house exit
        if (ghost.inHouse) {
          const newHouseTimer = ghost.houseTimer - deltaTime * 1000;
          if (newHouseTimer <= 0) {
            // Move ghost out of house
            world.addComponent(entity, Ghost, {
              ...ghost,
              inHouse: false,
              houseTimer: 0,
            });
            world.addComponent(entity, GridPosition, {
              ...pos,
              col: 9,
              row: 8,
            });
          } else {
            world.addComponent(entity, Ghost, {
              ...ghost,
              houseTimer: newHouseTimer,
            });
          }
          continue;
        }

        // Determine movement speed
        const currentGhost = world.getComponent(entity, Ghost)!;
        const speed = currentGhost.mode === 'frightened'
          ? PACMAN_CONFIG.gameplay.frightenedSpeed
          : currentGhost.mode === 'eaten'
            ? PACMAN_CONFIG.gameplay.pacmanSpeed / 2
            : PACMAN_CONFIG.gameplay.ghostSpeed;

        if (timeSinceMove < speed) continue;

        // Calculate target based on mode and ghost type
        let targetCol = pos.col;
        let targetRow = pos.row;

        if (currentGhost.mode === 'eaten') {
          // Return to ghost house
          targetCol = 9;
          targetRow = 9;

          // Check if arrived at house
          if (pos.col === targetCol && pos.row === targetRow) {
            world.addComponent(entity, Ghost, {
              ...currentGhost,
              mode: 'chase',
              inHouse: true,
              houseTimer: 1000,
            });
            continue;
          }
        } else if (currentGhost.mode === 'frightened') {
          // Random movement when frightened
          const validDirs = getValidDirections(pos.col, pos.row, currentGhost.direction, true);
          if (validDirs.length > 0) {
            const randomDir = validDirs[Math.floor(Math.random() * validDirs.length)]!;
            targetCol = pos.col + (randomDir === 'RIGHT' ? 1 : randomDir === 'LEFT' ? -1 : 0);
            targetRow = pos.row + (randomDir === 'DOWN' ? 1 : randomDir === 'UP' ? -1 : 0);
          }
        } else if (pacmanPos) {
          // Chase/scatter targeting based on ghost type
          switch (currentGhost.name) {
            case 'blinky':
              // Blinky: Direct chase
              targetCol = pacmanPos.col;
              targetRow = pacmanPos.row;
              break;
            case 'pinky':
              // Pinky: Target 4 tiles ahead of Pac-Man
              targetCol = pacmanPos.col + (pacmanDir === 'RIGHT' ? 4 : pacmanDir === 'LEFT' ? -4 : 0);
              targetRow = pacmanPos.row + (pacmanDir === 'DOWN' ? 4 : pacmanDir === 'UP' ? -4 : 0);
              break;
            case 'inky':
              // Inky: Complex targeting (simplified)
              targetCol = pacmanPos.col + (pacmanDir === 'RIGHT' ? 2 : pacmanDir === 'LEFT' ? -2 : 0);
              targetRow = pacmanPos.row + (pacmanDir === 'DOWN' ? 2 : pacmanDir === 'UP' ? -2 : 0);
              break;
            case 'clyde':
              // Clyde: Chases when far, scatters when close
              const dist = Math.abs(pos.col - pacmanPos.col) + Math.abs(pos.row - pacmanPos.row);
              if (dist > 8) {
                targetCol = pacmanPos.col;
                targetRow = pacmanPos.row;
              } else {
                targetCol = 0;
                targetRow = PACMAN_CONFIG.maze.length - 1;
              }
              break;
          }
        }

        // Find best direction toward target
        const validDirs = getValidDirections(pos.col, pos.row, currentGhost.direction, true);
        let bestDir = currentGhost.direction;
        let bestDist = Infinity;

        for (const dir of validDirs) {
          const nextCol = pos.col + (dir === 'RIGHT' ? 1 : dir === 'LEFT' ? -1 : 0);
          const nextRow = pos.row + (dir === 'DOWN' ? 1 : dir === 'UP' ? -1 : 0);
          const dist = Math.abs(nextCol - targetCol) + Math.abs(nextRow - targetRow);

          if (dist < bestDist) {
            bestDist = dist;
            bestDir = dir;
          }
        }

        // Move ghost
        let newCol = pos.col + (bestDir === 'RIGHT' ? 1 : bestDir === 'LEFT' ? -1 : 0);
        let newRow = pos.row + (bestDir === 'DOWN' ? 1 : bestDir === 'UP' ? -1 : 0);

        // Handle tunnel
        const wrapped = wrapTunnel(newCol, newRow);
        newCol = wrapped.col;
        newRow = wrapped.row;

        if (canMoveTo(newCol, newRow, true)) {
          world.addComponent(entity, GridPosition, {
            ...pos,
            col: newCol,
            row: newRow,
          });
          world.addComponent(entity, Ghost, {
            ...currentGhost,
            direction: bestDir,
          });
        }
      }

      timeSinceMove = 0;
    },
  };
}

/**
 * Pellet eating system - handles Pac-Man eating pellets.
 */
export function createPelletSystem(onScoreChange?: (score: number) => void): System {
  return {
    name: 'PelletSystem',
    priority: SystemPriorities.GAME_LOGIC,

    update(world) {
      if (world.getResource<boolean>('gameOver')) return;

      const pacmans = world.query(PacMan, GridPosition);
      const pellets = world.query(Pellet, GridPosition);

      for (const pacmanEntity of pacmans) {
        const pacmanPos = world.getComponent(pacmanEntity, GridPosition);
        const pacman = world.getComponent(pacmanEntity, PacMan);
        if (!pacmanPos || !pacman) continue;

        for (const pelletEntity of pellets) {
          const pelletPos = world.getComponent(pelletEntity, GridPosition);
          const pellet = world.getComponent(pelletEntity, Pellet);
          if (!pelletPos || !pellet || pellet.eaten) continue;

          // Check collision
          if (pacmanPos.col === pelletPos.col && pacmanPos.row === pelletPos.row) {
            // Eat pellet
            world.addComponent(pelletEntity, Pellet, { ...pellet, eaten: true });

            // Hide pellet
            world.removeAllComponents(pelletEntity);
            world.entities.destroy(pelletEntity);

            // Update score
            const currentScore = world.getResource<number>('score') ?? 0;
            const newScore = currentScore + pellet.points;
            world.setResource('score', newScore);
            onScoreChange?.(newScore);

            // Update pellet count
            const pelletsLeft = (world.getResource<number>('pelletsLeft') ?? 1) - 1;
            world.setResource('pelletsLeft', pelletsLeft);

            // Check for level complete
            if (pelletsLeft <= 0) {
              world.emit('levelComplete');
            }

            // Power pellet effect
            if (pellet.type === 'power') {
              world.emit('powerPelletEaten');
              world.emit('playSound', { type: 'powerUp' });
            } else {
              world.emit('playSound', { type: 'eat' });
            }
          }
        }
      }
    },
  };
}

/**
 * Ghost collision system - handles Pac-Man/Ghost collisions.
 */
export function createGhostCollisionSystem(onScoreChange?: (score: number) => void): System {
  return {
    name: 'GhostCollisionSystem',
    priority: SystemPriorities.GAME_LOGIC + 5,

    init(world) {
      // Handle power pellet eaten
      world.on('powerPelletEaten', () => {
        const ghosts = world.query(Ghost, GridPosition);
        const { frightenedDuration } = PACMAN_CONFIG.gameplay;

        for (const entity of ghosts) {
          const ghost = world.getComponent(entity, Ghost);
          if (!ghost || ghost.mode === 'eaten') continue;

          world.addComponent(entity, Ghost, {
            ...ghost,
            mode: 'frightened',
            frightenedTimer: frightenedDuration,
          });
        }

        // Reset ghost combo
        const pacmans = world.query(PacMan);
        for (const entity of pacmans) {
          const pacman = world.getComponent(entity, PacMan);
          if (pacman) {
            world.addComponent(entity, PacMan, {
              ...pacman,
              powered: true,
              ghostCombo: 1,
            });
          }
        }
      });
    },

    update(world) {
      if (world.getResource<boolean>('gameOver')) return;

      const pacmans = world.query(PacMan, GridPosition);
      const ghosts = world.query(Ghost, GridPosition);

      for (const pacmanEntity of pacmans) {
        const pacmanPos = world.getComponent(pacmanEntity, GridPosition);
        const pacman = world.getComponent(pacmanEntity, PacMan);
        if (!pacmanPos || !pacman) continue;

        for (const ghostEntity of ghosts) {
          const ghostPos = world.getComponent(ghostEntity, GridPosition);
          const ghost = world.getComponent(ghostEntity, Ghost);
          if (!ghostPos || !ghost) continue;

          // Check collision
          if (pacmanPos.col === ghostPos.col && pacmanPos.row === ghostPos.row) {
            if (ghost.mode === 'frightened') {
              // Eat ghost
              world.addComponent(ghostEntity, Ghost, {
                ...ghost,
                mode: 'eaten',
                frightenedTimer: 0,
              });

              // Score with combo
              const points = PACMAN_CONFIG.gameplay.pointsPerGhost * pacman.ghostCombo;
              const currentScore = world.getResource<number>('score') ?? 0;
              const newScore = currentScore + points;
              world.setResource('score', newScore);
              onScoreChange?.(newScore);

              // Increase combo
              world.addComponent(pacmanEntity, PacMan, {
                ...pacman,
                ghostCombo: pacman.ghostCombo * 2,
              });

              world.emit('playSound', { type: 'eatGhost' });
            } else if (ghost.mode !== 'eaten') {
              // Pac-Man dies
              const lives = pacman.lives - 1;
              world.addComponent(pacmanEntity, PacMan, {
                ...pacman,
                lives,
              });

              if (lives <= 0) {
                world.emit('gameOver', { reason: 'ghost' });
              } else {
                world.emit('pacmanDied');
              }
            }
          }
        }
      }
    },
  };
}

/**
 * Game over handler system.
 */
export function createPacManGameOverSystem(onGameOver?: () => void): System {
  return {
    name: 'PacManGameOverSystem',
    priority: SystemPriorities.GAME_LOGIC + 20,

    init(world) {
      world.on('gameOver', () => {
        world.setResource('gameOver', true);

        // Update high score
        const score = world.getResource<number>('score') ?? 0;
        const highScore = world.getResource<number>('highScore') ?? 0;
        if (score > highScore) {
          world.setResource('highScore', score);
          if (typeof window !== 'undefined') {
            localStorage.setItem('pacman-high-score', String(score));
          }
        }

        world.emit('playSound', { type: 'gameOver' });
        onGameOver?.();
      });

      world.on('levelComplete', () => {
        world.setResource('levelComplete', true);
        world.emit('playSound', { type: 'levelComplete' });
      });

      world.on('pacmanDied', () => {
        // Reset positions
        world.emit('playSound', { type: 'death' });
        world.emit('resetPositions');
      });
    },

    update() {},
  };
}

/**
 * Reset positions system - resets Pac-Man and ghosts after death.
 */
export const ResetPositionsSystem: System = {
  name: 'ResetPositionsSystem',
  priority: SystemPriorities.GAME_LOGIC + 25,

  init(world) {
    world.on('resetPositions', () => {
      const { startPosition, startDirection } = PACMAN_CONFIG.gameplay;
      const { ghosts } = PACMAN_CONFIG;

      // Reset Pac-Man
      const pacmans = world.query(PacMan, GridPosition);
      for (const entity of pacmans) {
        const pos = world.getComponent(entity, GridPosition);
        const pacman = world.getComponent(entity, PacMan);
        if (pos && pacman) {
          world.addComponent(entity, GridPosition, {
            ...pos,
            col: startPosition.col,
            row: startPosition.row,
          });
          world.addComponent(entity, PacMan, {
            ...pacman,
            direction: startDirection,
            nextDirection: null,
            powered: false,
            ghostCombo: 1,
          });
        }
      }

      // Reset ghosts
      const ghostEntities = world.query(Ghost, GridPosition);
      for (const entity of ghostEntities) {
        const ghost = world.getComponent(entity, Ghost);
        const pos = world.getComponent(entity, GridPosition);
        if (ghost && pos) {
          const ghostConfig = ghosts[ghost.name as keyof typeof ghosts];
          world.addComponent(entity, GridPosition, {
            ...pos,
            col: ghostConfig.col,
            row: ghostConfig.row,
          });
          world.addComponent(entity, Ghost, {
            ...ghost,
            mode: 'scatter',
            inHouse: ghost.name !== 'blinky',
            houseTimer: ghost.name === 'blinky' ? 0 : 2000,
            frightenedTimer: 0,
          });
        }
      }
    });
  },

  update() {},
};

/**
 * Restart handler system - listens for action input to restart.
 */
export const PacManRestartSystem: System = {
  name: 'PacManRestartSystem',
  priority: SystemPriorities.INPUT + 20,

  update(world) {
    if (!world.getResource<boolean>('gameOver')) return;

    const entities = world.query(ActionInput);
    for (const entity of entities) {
      const input = world.getComponent(entity, ActionInput);
      if (input?.actionJustPressed) {
        world.emit('restart');
      }
    }
  },
};
