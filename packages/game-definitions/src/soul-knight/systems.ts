import { type System, type World, SystemPriorities } from '@repo/ecs';
import {
  Transform,
  Velocity,
  Sprite,
  Collider,
  Player,
  Health,
  DirectionInput,
  ActionInput,
} from '@repo/components';
import { SOUL_KNIGHT_CONFIG } from './config';
import {
  type PlayerState,
  type EnemyState,
  createEnemy,
  getRandomSpawnPosition,
  getDistance,
  normalize,
  clamp,
} from './prefabs';

const { player: playerConfig, enemy: enemyConfig, arena, wave } = SOUL_KNIGHT_CONFIG;

/**
 * Player movement and action system.
 */
export const PlayerMovementSystem: System = {
  name: 'PlayerMovementSystem',
  priority: SystemPriorities.INPUT + 10,

  update(world) {
    if (world.getResource<boolean>('gameOver')) return;

    const players = world.query(Player, Transform, Velocity, DirectionInput, ActionInput, Health);
    if (players.length === 0) return;

    const playerEntity = players[0]!;
    world.getComponent(playerEntity, Transform)!;
    world.getComponent(playerEntity, Velocity)!;
    const dirInput = world.getComponent(playerEntity, DirectionInput)!;
    const actionInput = world.getComponent(playerEntity, ActionInput)!;
    const playerState = world.getResource<PlayerState>('playerState')!;

    // Handle cooldowns
    if (playerState.rollCooldown > 0) playerState.rollCooldown--;
    if (playerState.attackCooldown > 0) playerState.attackCooldown--;
    if (playerState.invincibilityFrames > 0) playerState.invincibilityFrames--;

    // Regenerate stamina when not acting
    if (!playerState.isRolling && !playerState.isAttacking) {
      playerState.stamina = Math.min(
        playerState.maxStamina,
        playerState.stamina + playerConfig.staminaRegen
      );
    }

    // Get movement direction from input
    let moveX = 0;
    let moveY = 0;

    if (dirInput.direction === 'UP') moveY = -1;
    else if (dirInput.direction === 'DOWN') moveY = 1;
    else if (dirInput.direction === 'LEFT') moveX = -1;
    else if (dirInput.direction === 'RIGHT') moveX = 1;

    // Update facing direction if moving
    if (moveX !== 0 || moveY !== 0) {
      playerState.facingDirection = normalize(moveX, moveY);
    }

    // Handle rolling
    if (playerState.isRolling) {
      playerState.rollFrames--;
      if (playerState.rollFrames <= 0) {
        playerState.isRolling = false;
      } else {
        // Move in roll direction
        world.addComponent(playerEntity, Velocity, {
          x: playerState.rollDirection.x * playerConfig.rollSpeed,
          y: playerState.rollDirection.y * playerConfig.rollSpeed,
          z: 0,
        });
        world.setResource('playerState', playerState);
        return;
      }
    }

    // Handle attacking
    if (playerState.isAttacking) {
      playerState.attackFrames--;
      if (playerState.attackFrames <= 0) {
        playerState.isAttacking = false;
      }
      // Can't move while attacking
      world.addComponent(playerEntity, Velocity, { x: 0, y: 0, z: 0 });
      world.setResource('playerState', playerState);
      return;
    }

    // Start roll (interact button)
    if (
      actionInput.interact &&
      playerState.rollCooldown === 0 &&
      playerState.stamina >= playerConfig.staminaCostRoll &&
      (moveX !== 0 || moveY !== 0)
    ) {
      playerState.isRolling = true;
      playerState.rollFrames = playerConfig.rollDuration;
      playerState.rollCooldown = playerConfig.rollCooldown;
      playerState.rollDirection = normalize(moveX, moveY);
      playerState.stamina -= playerConfig.staminaCostRoll;
      world.emit('playSound', { type: 'roll' });
    }

    // Start attack (action button)
    if (
      actionInput.actionJustPressed &&
      playerState.attackCooldown === 0 &&
      playerState.stamina >= playerConfig.staminaCostAttack
    ) {
      playerState.isAttacking = true;
      playerState.attackFrames = playerConfig.attackDuration;
      playerState.attackCooldown = playerConfig.attackCooldown;
      playerState.attackDirection = { ...playerState.facingDirection };
      playerState.stamina -= playerConfig.staminaCostAttack;
      world.emit('playSound', { type: 'attack' });
    }

    // Normal movement
    const speed = playerConfig.speed;
    const vx = moveX * speed;
    const vy = moveY * speed;

    world.addComponent(playerEntity, Velocity, { x: vx, y: vy, z: 0 });
    world.setResource('playerState', playerState);
  },
};

/**
 * Player boundary system - keeps player in arena.
 */
export const PlayerBoundarySystem: System = {
  name: 'PlayerBoundarySystem',
  priority: SystemPriorities.POST_PHYSICS,

  update(world) {
    const players = world.query(Player, Transform);
    if (players.length === 0) return;

    const playerEntity = players[0]!;
    const transform = world.getComponent(playerEntity, Transform)!;

    const minX = arena.offsetX + playerConfig.width / 2;
    const maxX = arena.offsetX + arena.width - playerConfig.width / 2;
    const minY = arena.offsetY + playerConfig.height / 2;
    const maxY = arena.offsetY + arena.height - playerConfig.height / 2;

    const newX = clamp(transform.x, minX, maxX);
    const newY = clamp(transform.y, minY, maxY);

    if (newX !== transform.x || newY !== transform.y) {
      world.addComponent(playerEntity, Transform, {
        ...transform,
        x: newX,
        y: newY,
      });
    }
  },
};

/**
 * Enemy AI system - chase and attack player.
 */
export const EnemyAISystem: System = {
  name: 'EnemyAISystem',
  priority: SystemPriorities.GAME_LOGIC,

  update(world) {
    if (world.getResource<boolean>('gameOver')) return;

    const players = world.query(Player, Transform);
    if (players.length === 0) return;

    const playerEntity = players[0]!;
    const playerTransform = world.getComponent(playerEntity, Transform)!;
    const playerState = world.getResource<PlayerState>('playerState');

    const enemyStates = world.getResource<Map<number, EnemyState>>('enemyStates');
    if (!enemyStates) return;

    const enemies = world.query(Sprite, Transform, Velocity, Collider);

    for (const entity of enemies) {
      // Skip player
      if (world.getComponent(entity, Player)) continue;

      const enemyState = enemyStates.get(entity);
      if (!enemyState || enemyState.isDying) continue;

      const transform = world.getComponent(entity, Transform)!;

      // Handle attack cooldown
      if (enemyState.attackCooldown > 0) enemyState.attackCooldown--;

      // Handle attacking
      if (enemyState.isAttacking) {
        enemyState.attackFrames--;
        if (enemyState.attackFrames <= 0) {
          enemyState.isAttacking = false;
        }
        world.addComponent(entity, Velocity, { x: 0, y: 0, z: 0 });
        continue;
      }

      // Calculate distance to player
      const dist = getDistance(transform.x, transform.y, playerTransform.x, playerTransform.y);

      // Attack if in range and cooldown ready
      if (dist < enemyConfig.attackRange && enemyState.attackCooldown === 0) {
        enemyState.isAttacking = true;
        enemyState.attackFrames = enemyConfig.attackDuration;
        enemyState.attackCooldown = enemyConfig.attackCooldown;
        world.addComponent(entity, Velocity, { x: 0, y: 0, z: 0 });

        // Deal damage to player
        if (playerState && playerState.invincibilityFrames === 0 && !playerState.isRolling) {
          const health = world.getComponent(playerEntity, Health)!;
          const newHealth = health.current - enemyConfig.damage;
          world.addComponent(playerEntity, Health, { ...health, current: newHealth });
          playerState.invincibilityFrames = playerConfig.invincibilityFrames;
          playerState.lastDamageTime = Date.now();
          world.setResource('playerState', playerState);
          world.emit('playSound', { type: 'damage' });

          if (newHealth <= 0) {
            world.emit('gameOver', { reason: 'death' });
          }
        }
        continue;
      }

      // Chase player if in range
      if (dist < enemyConfig.chaseRange) {
        const dir = normalize(
          playerTransform.x - transform.x,
          playerTransform.y - transform.y
        );
        world.addComponent(entity, Velocity, {
          x: dir.x * enemyConfig.speed,
          y: dir.y * enemyConfig.speed,
          z: 0,
        });
      } else {
        // Wander randomly
        if (Math.random() < 0.02) {
          const angle = Math.random() * Math.PI * 2;
          world.addComponent(entity, Velocity, {
            x: Math.cos(angle) * enemyConfig.speed * 0.5,
            y: Math.sin(angle) * enemyConfig.speed * 0.5,
            z: 0,
          });
        }
      }
    }
  },
};

/**
 * Enemy boundary system - keeps enemies in arena.
 */
export const EnemyBoundarySystem: System = {
  name: 'EnemyBoundarySystem',
  priority: SystemPriorities.POST_PHYSICS + 5,

  update(world) {
    const enemyStates = world.getResource<Map<number, EnemyState>>('enemyStates');
    if (!enemyStates) return;

    const enemies = world.query(Sprite, Transform, Collider);

    for (const entity of enemies) {
      if (world.getComponent(entity, Player)) continue;
      if (!enemyStates.has(entity)) continue;

      const transform = world.getComponent(entity, Transform)!;

      const minX = arena.offsetX + enemyConfig.width / 2;
      const maxX = arena.offsetX + arena.width - enemyConfig.width / 2;
      const minY = arena.offsetY + enemyConfig.height / 2;
      const maxY = arena.offsetY + arena.height - enemyConfig.height / 2;

      const newX = clamp(transform.x, minX, maxX);
      const newY = clamp(transform.y, minY, maxY);

      if (newX !== transform.x || newY !== transform.y) {
        world.addComponent(entity, Transform, {
          ...transform,
          x: newX,
          y: newY,
        });
      }
    }
  },
};

/**
 * Player attack collision system - damage enemies.
 */
export const PlayerAttackSystem: System = {
  name: 'PlayerAttackSystem',
  priority: SystemPriorities.POST_PHYSICS + 10,

  update(world) {
    if (world.getResource<boolean>('gameOver')) return;

    const playerState = world.getResource<PlayerState>('playerState');
    if (!playerState || !playerState.isAttacking) return;
    // Only damage on specific frames (early in attack)
    const attackProgress = playerConfig.attackDuration - playerState.attackFrames;
    if (attackProgress < 3 || attackProgress > 8) return;

    const players = world.query(Player, Transform);
    if (players.length === 0) return;

    const playerEntity = players[0]!;
    const playerTransform = world.getComponent(playerEntity, Transform)!;

    const enemyStates = world.getResource<Map<number, EnemyState>>('enemyStates');
    if (!enemyStates) return;

    // Calculate attack hitbox
    const attackX = playerTransform.x + playerState.attackDirection.x * playerConfig.attackRange * 0.5;
    const attackY = playerTransform.y + playerState.attackDirection.y * playerConfig.attackRange * 0.5;

    const enemies = world.query(Sprite, Transform, Collider);
    const hitEnemies = world.getResource<Set<number>>('hitEnemies') ?? new Set();

    for (const entity of enemies) {
      if (world.getComponent(entity, Player)) continue;

      const enemyState = enemyStates.get(entity);
      if (!enemyState || enemyState.isDying) continue;
      if (hitEnemies.has(entity)) continue;

      const transform = world.getComponent(entity, Transform)!;
      const dist = getDistance(attackX, attackY, transform.x, transform.y);

      if (dist < playerConfig.attackRange) {
        enemyState.health--;
        hitEnemies.add(entity);

        if (enemyState.health <= 0) {
          // Enemy dies
          enemyState.isDying = true;
          enemyState.deathFrames = 20;

          // Update score
          const score = (world.getResource<number>('score') ?? 0) + enemyConfig.scorePerKill;
          world.setResource('score', score);
          world.emit('scoreChange', { score });
          world.emit('playSound', { type: 'kill' });
        } else {
          world.emit('playSound', { type: 'hit' });
        }
      }
    }

    world.setResource('hitEnemies', hitEnemies);
  },
};

/**
 * Clear hit enemies between attacks.
 */
export const ClearHitEnemiesSystem: System = {
  name: 'ClearHitEnemiesSystem',
  priority: SystemPriorities.INPUT + 5,

  update(world) {
    const playerState = world.getResource<PlayerState>('playerState');
    if (!playerState?.isAttacking) {
      world.setResource('hitEnemies', new Set());
    }
  },
};

/**
 * Enemy death system - handle death animation and cleanup.
 */
export const EnemyDeathSystem: System = {
  name: 'EnemyDeathSystem',
  priority: SystemPriorities.GAME_LOGIC + 10,

  update(world) {
    const enemyStates = world.getResource<Map<number, EnemyState>>('enemyStates');
    if (!enemyStates) return;

    const enemies = world.query(Sprite, Transform, Collider);
    const toRemove: number[] = [];

    for (const entity of enemies) {
      if (world.getComponent(entity, Player)) continue;

      const enemyState = enemyStates.get(entity);
      if (!enemyState || !enemyState.isDying) continue;

      enemyState.deathFrames--;

      // Fade out
      const sprite = world.getComponent(entity, Sprite)!;
      world.addComponent(entity, Sprite, {
        ...sprite,
        opacity: enemyState.deathFrames / 20,
      });

      if (enemyState.deathFrames <= 0) {
        toRemove.push(entity);
      }
    }

    // Remove dead enemies
    for (const entity of toRemove) {
      world.removeAllComponents(entity);
      world.entities.destroy(entity);
      enemyStates.delete(entity);
    }
  },
};

/**
 * Enemy spawn system - spawn enemies in waves.
 */
export function createEnemySpawnSystem(onScoreChange?: (score: number) => void): System {
  return {
    name: 'EnemySpawnSystem',
    priority: SystemPriorities.GAME_LOGIC + 15,

    init(world: World) {
      // Listen for score changes
      world.on('scoreChange', (data: unknown) => {
        const { score } = data as { score: number };
        onScoreChange?.(score);
      });
    },

    update(world) {
      if (world.getResource<boolean>('gameOver')) return;
      if (!world.getResource<boolean>('gameStarted')) return;

      const spawnTimer = (world.getResource<number>('spawnTimer') ?? 0) + 1;
      world.setResource('spawnTimer', spawnTimer);

      // Count living enemies
      const enemyStates = world.getResource<Map<number, EnemyState>>('enemyStates') ?? new Map();
      let livingEnemies = 0;
      for (const state of enemyStates.values()) {
        if (!state.isDying) livingEnemies++;
      }

      // Check for wave completion
      if (livingEnemies === 0) {
        const currentWave = (world.getResource<number>('wave') ?? 1);
        const enemiesKilled = world.getResource<number>('enemiesKilledThisWave') ?? 0;
        const waveTarget = Math.min(
          wave.startEnemies + (currentWave - 1) * wave.enemiesPerWave,
          wave.maxWaveEnemies
        );

        if (enemiesKilled >= waveTarget) {
          // Next wave!
          world.setResource('wave', currentWave + 1);
          world.setResource('enemiesKilledThisWave', 0);
          world.setResource('spawnTimer', -60); // Brief pause between waves
          world.emit('playSound', { type: 'wave' });
        }
      }

      // Spawn enemies
      const currentWave = world.getResource<number>('wave') ?? 1;
      const waveTarget = Math.min(
        wave.startEnemies + (currentWave - 1) * wave.enemiesPerWave,
        wave.maxWaveEnemies
      );

      if (
        spawnTimer > 0 &&
        spawnTimer % enemyConfig.spawnDelay === 0 &&
        livingEnemies < enemyConfig.maxEnemies &&
        livingEnemies < waveTarget
      ) {
        const pos = getRandomSpawnPosition();
        createEnemy(world, pos.x, pos.y);
      }
    },
  };
}

/**
 * Game over system.
 */
export function createSoulKnightGameOverSystem(onGameOver?: () => void): System {
  return {
    name: 'SoulKnightGameOverSystem',
    priority: SystemPriorities.GAME_LOGIC + 20,

    init(world: World) {
      world.on('gameOver', () => {
        world.setResource('gameOver', true);

        // Update high score
        const score = world.getResource<number>('score') ?? 0;
        const highScore = world.getResource<number>('highScore') ?? 0;
        if (score > highScore) {
          world.setResource('highScore', score);
          if (typeof window !== 'undefined') {
            localStorage.setItem('soulknight-high-score', String(score));
          }
        }

        world.emit('playSound', { type: 'gameOver' });
        onGameOver?.();
      });
    },

    update() {},
  };
}

/**
 * Restart system.
 */
export const SoulKnightRestartSystem: System = {
  name: 'SoulKnightRestartSystem',
  priority: SystemPriorities.INPUT + 20,

  update(world) {
    if (!world.getResource<boolean>('gameOver')) return;

    const players = world.query(Player, ActionInput);
    for (const entity of players) {
      const input = world.getComponent(entity, ActionInput);
      if (input?.actionJustPressed) {
        world.emit('restart');
      }
    }
  },
};

/**
 * Game start system - start on first input.
 */
export const GameStartSystem: System = {
  name: 'GameStartSystem',
  priority: SystemPriorities.INPUT + 5,

  update(world) {
    if (world.getResource<boolean>('gameStarted')) return;
    if (world.getResource<boolean>('gameOver')) return;

    const players = world.query(Player, ActionInput, DirectionInput);
    for (const entity of players) {
      const actionInput = world.getComponent(entity, ActionInput);
      const dirInput = world.getComponent(entity, DirectionInput);

      if (actionInput?.actionJustPressed || dirInput?.direction) {
        world.setResource('gameStarted', true);
        world.emit('playSound', { type: 'start' });
      }
    }
  },
};
