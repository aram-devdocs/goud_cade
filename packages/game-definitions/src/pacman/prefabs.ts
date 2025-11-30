import type { World, Entity } from '@repo/ecs';
import {
  GridPosition,
  Sprite,
  Player,
  InputReceiver,
  DirectionInput,
  ActionInput,
  Ghost,
  Pellet,
  PacMan,
  type GhostName,
} from '@repo/components';
import { PACMAN_CONFIG } from './config';

/**
 * Create the Pac-Man player entity with all required components.
 */
export function createPacMan(world: World): Entity {
  const entity = world.entities.create();
  const { cellSize } = PACMAN_CONFIG.grid;
  const { startPosition, startDirection, lives } = PACMAN_CONFIG.gameplay;

  world.addComponent(entity, GridPosition, {
    col: startPosition.col,
    row: startPosition.row,
    cellWidth: cellSize,
    cellHeight: cellSize,
  });

  world.addComponent(entity, Sprite, {
    width: cellSize - 2,
    height: cellSize - 2,
    color: PACMAN_CONFIG.colors.pacman,
    shape: 'circle',
    layer: 20,
    visible: true,
    opacity: 1,
    borderColor: undefined,
    borderWidth: 0,
    cornerRadius: 0,
  });

  world.addComponent(entity, PacMan, {
    direction: startDirection,
    nextDirection: null,
    mouthAngle: 45,
    mouthOpening: false,
    powered: false,
    lives,
    ghostCombo: 1,
  });

  world.addComponent(entity, Player, { id: 0 });
  world.addComponent(entity, InputReceiver, { active: true, playerId: 0 });
  world.addComponent(entity, DirectionInput, {
    direction: startDirection,
    lastDirection: startDirection,
    bufferedDirection: null,
  });
  world.addComponent(entity, ActionInput, {
    action: false,
    actionJustPressed: false,
    interact: false,
    back: false,
  });

  return entity;
}

/**
 * Create a ghost entity.
 */
export function createGhost(
  world: World,
  name: GhostName,
  col: number,
  row: number,
  color: string
): Entity {
  const entity = world.entities.create();
  const { cellSize } = PACMAN_CONFIG.grid;

  world.addComponent(entity, GridPosition, {
    col,
    row,
    cellWidth: cellSize,
    cellHeight: cellSize,
  });

  world.addComponent(entity, Sprite, {
    width: cellSize - 2,
    height: cellSize - 2,
    color,
    shape: 'rect',
    layer: 15,
    visible: true,
    opacity: 1,
    borderColor: undefined,
    borderWidth: 0,
    cornerRadius: 0,
  });

  world.addComponent(entity, Ghost, {
    name,
    mode: 'scatter',
    color,
    targetCol: col,
    targetRow: row,
    direction: 'UP',
    inHouse: name !== 'blinky', // Blinky starts outside
    houseTimer: name === 'blinky' ? 0 : getGhostHouseTime(name),
    frightenedTimer: 0,
  });

  return entity;
}

/**
 * Get the time a ghost should wait before leaving the house.
 */
function getGhostHouseTime(name: GhostName): number {
  switch (name) {
    case 'blinky':
      return 0;
    case 'pinky':
      return 2000;
    case 'inky':
      return 4000;
    case 'clyde':
      return 6000;
    default:
      return 0;
  }
}

/**
 * Create all four ghosts.
 */
export function createAllGhosts(world: World): Entity[] {
  const { ghosts } = PACMAN_CONFIG;
  return [
    createGhost(world, 'blinky', ghosts.blinky.col, ghosts.blinky.row, ghosts.blinky.color),
    createGhost(world, 'pinky', ghosts.pinky.col, ghosts.pinky.row, ghosts.pinky.color),
    createGhost(world, 'inky', ghosts.inky.col, ghosts.inky.row, ghosts.inky.color),
    createGhost(world, 'clyde', ghosts.clyde.col, ghosts.clyde.row, ghosts.clyde.color),
  ];
}

/**
 * Create a pellet (dot or power pellet).
 */
export function createPellet(
  world: World,
  col: number,
  row: number,
  isPowerPellet: boolean
): Entity {
  const entity = world.entities.create();
  const { cellSize } = PACMAN_CONFIG.grid;
  const { pointsPerDot, pointsPerPowerPellet } = PACMAN_CONFIG.gameplay;

  world.addComponent(entity, GridPosition, {
    col,
    row,
    cellWidth: cellSize,
    cellHeight: cellSize,
  });

  world.addComponent(entity, Sprite, {
    width: isPowerPellet ? 10 : 4,
    height: isPowerPellet ? 10 : 4,
    color: isPowerPellet ? PACMAN_CONFIG.colors.powerPellet : PACMAN_CONFIG.colors.dot,
    shape: 'circle',
    layer: 5,
    visible: true,
    opacity: 1,
    borderColor: undefined,
    borderWidth: 0,
    cornerRadius: 0,
  });

  world.addComponent(entity, Pellet, {
    type: isPowerPellet ? 'power' : 'dot',
    points: isPowerPellet ? pointsPerPowerPellet : pointsPerDot,
    eaten: false,
  });

  return entity;
}

/**
 * Create all pellets from the maze layout.
 */
export function createMazePellets(world: World): Entity[] {
  const pellets: Entity[] = [];
  const { maze } = PACMAN_CONFIG;

  for (let row = 0; row < maze.length; row++) {
    for (let col = 0; col < maze[row]!.length; col++) {
      const cell = maze[row]![col];
      if (cell === 2) {
        // Regular dot
        pellets.push(createPellet(world, col, row, false));
      } else if (cell === 3) {
        // Power pellet
        pellets.push(createPellet(world, col, row, true));
      }
    }
  }

  return pellets;
}

/**
 * Check if a position is a wall.
 */
export function isWall(col: number, row: number): boolean {
  const { cols, rows } = PACMAN_CONFIG.grid;
  if (col < 0 || col >= cols || row < 0 || row >= rows) {
    // Check for tunnel
    if (row === 9 && (col === -1 || col === cols)) {
      return false; // Tunnel passage
    }
    return true;
  }
  const cell = PACMAN_CONFIG.maze[row]?.[col];
  return cell === 1;
}

/**
 * Check if a position is the ghost house.
 */
export function isGhostHouse(col: number, row: number): boolean {
  const cell = PACMAN_CONFIG.maze[row]?.[col];
  return cell === 4;
}

/**
 * Check if a position is valid for movement.
 */
export function canMoveTo(col: number, row: number, isGhost: boolean = false): boolean {
  const { cols } = PACMAN_CONFIG.grid;

  // Handle tunnel wrapping
  if (row === 9 && (col < 0 || col >= cols)) {
    return true;
  }

  if (col < 0 || col >= cols || row < 0 || row >= PACMAN_CONFIG.maze.length) {
    return false;
  }

  const cell = PACMAN_CONFIG.maze[row]?.[col];

  // Walls are never passable
  if (cell === 1) return false;

  // Ghost house is only passable by ghosts
  if (cell === 4) return isGhost;

  return true;
}

/**
 * Wrap position through tunnel.
 */
export function wrapTunnel(col: number, row: number): { col: number; row: number } {
  const { cols } = PACMAN_CONFIG.grid;

  if (row === 9) {
    if (col < 0) return { col: cols - 1, row };
    if (col >= cols) return { col: 0, row };
  }

  return { col, row };
}

/**
 * Get valid directions from a position.
 */
export function getValidDirections(
  col: number,
  row: number,
  currentDirection: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT',
  isGhost: boolean = false
): ('UP' | 'DOWN' | 'LEFT' | 'RIGHT')[] {
  const directions: ('UP' | 'DOWN' | 'LEFT' | 'RIGHT')[] = [];
  const opposite: Record<string, string> = {
    UP: 'DOWN',
    DOWN: 'UP',
    LEFT: 'RIGHT',
    RIGHT: 'LEFT',
  };

  if (canMoveTo(col, row - 1, isGhost) && currentDirection !== 'DOWN') {
    directions.push('UP');
  }
  if (canMoveTo(col, row + 1, isGhost) && currentDirection !== 'UP') {
    directions.push('DOWN');
  }
  if (canMoveTo(col - 1, row, isGhost) && currentDirection !== 'RIGHT') {
    directions.push('LEFT');
  }
  if (canMoveTo(col + 1, row, isGhost) && currentDirection !== 'LEFT') {
    directions.push('RIGHT');
  }

  // If no valid directions (dead end), allow reversing
  if (directions.length === 0) {
    const reverseDir = opposite[currentDirection] as 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
    if (canMoveTo(
      col + (reverseDir === 'RIGHT' ? 1 : reverseDir === 'LEFT' ? -1 : 0),
      row + (reverseDir === 'DOWN' ? 1 : reverseDir === 'UP' ? -1 : 0),
      isGhost
    )) {
      directions.push(reverseDir);
    }
  }

  return directions;
}
