import { type System, type World, SystemPriorities } from '@repo/ecs';
import { Transform, Player, Health } from '@repo/components';
import { SOUL_KNIGHT_CONFIG } from './config';
import { type PlayerState, type EnemyState } from './prefabs';

export interface SoulKnightRenderConfig {
  canvas: HTMLCanvasElement;
}

/**
 * Custom render system for Soul Knight with dark dungeon aesthetics.
 */
export function createSoulKnightRenderSystem(config: SoulKnightRenderConfig): System {
  let ctx: CanvasRenderingContext2D | null = null;

  const { canvas: canvasConfig, arena, player: playerConfig, enemy: enemyConfig, colors } = SOUL_KNIGHT_CONFIG;

  return {
    name: 'SoulKnightRenderSystem',
    priority: SystemPriorities.RENDER,

    init() {
      ctx = config.canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get 2D context');

      config.canvas.width = canvasConfig.width;
      config.canvas.height = canvasConfig.height;
    },

    update(world) {
      if (!ctx) return;

      const gameStarted = world.getResource<boolean>('gameStarted') ?? false;
      const gameOver = world.getResource<boolean>('gameOver') ?? false;
      const score = world.getResource<number>('score') ?? 0;
      const highScore = world.getResource<number>('highScore') ?? 0;
      const currentWave = world.getResource<number>('wave') ?? 1;
      const playerState = world.getResource<PlayerState>('playerState');
      const enemyStates = world.getResource<Map<number, EnemyState>>('enemyStates');

      // Clear and draw background
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, canvasConfig.width, canvasConfig.height);

      // Draw arena floor tiles
      drawFloor(ctx);

      // Draw arena border
      drawArenaBorder(ctx);

      // Draw enemies
      if (enemyStates) {
        const entities = world.query(Transform);
        for (const entity of entities) {
          if (world.getComponent(entity, Player)) continue;
          const enemyState = enemyStates.get(entity);
          if (!enemyState) continue;

          const transform = world.getComponent(entity, Transform)!;
          drawEnemy(ctx, transform.x, transform.y, enemyState);
        }
      }

      // Draw player
      let currentHealth: number = playerConfig.maxHealth;
      const players = world.query(Player, Transform, Health);
      if (players.length > 0) {
        const playerEntity = players[0]!;
        const transform = world.getComponent(playerEntity, Transform)!;
        const health = world.getComponent(playerEntity, Health)!;
        currentHealth = health.current as number;

        if (playerState) {
          // Draw roll ghost trail
          if (playerState.isRolling) {
            drawRollGhost(ctx, transform.x, transform.y, playerState);
          }

          // Draw attack slash
          if (playerState.isAttacking) {
            drawAttackSlash(ctx, transform.x, transform.y, playerState);
          }

          drawPlayer(ctx, transform.x, transform.y, playerState, health.current);
        }
      }

      // Draw UI
      drawUI(ctx, score, currentWave, playerState, currentHealth);

      // Draw overlays
      if (gameOver) {
        drawGameOver(ctx, score, highScore);
      } else if (!gameStarted) {
        drawStartScreen(ctx);
      }

      // CRT scanline effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
      for (let y = 0; y < canvasConfig.height; y += 2) {
        ctx.fillRect(0, y, canvasConfig.width, 1);
      }
    },

    cleanup() {
      ctx = null;
    },
  };

  function drawFloor(ctx: CanvasRenderingContext2D) {
    const tileSize = 32;

    for (let x = arena.offsetX; x < arena.offsetX + arena.width; x += tileSize) {
      for (let y = arena.offsetY; y < arena.offsetY + arena.height; y += tileSize) {
        const isAlt = ((x - arena.offsetX) / tileSize + (y - arena.offsetY) / tileSize) % 2 === 0;
        ctx.fillStyle = isAlt ? colors.floorTile : colors.floorTileAlt;
        ctx.fillRect(x, y, tileSize, tileSize);

        // Subtle crack details
        if (Math.random() < 0.1) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + Math.random() * tileSize, y);
          ctx.lineTo(x + Math.random() * tileSize, y + tileSize);
          ctx.stroke();
        }
      }
    }
  }

  function drawArenaBorder(ctx: CanvasRenderingContext2D) {
    const borderWidth = 8;

    // Draw walls
    ctx.fillStyle = colors.wall;

    // Top wall
    ctx.fillRect(arena.offsetX - borderWidth, arena.offsetY - borderWidth, arena.width + borderWidth * 2, borderWidth);
    // Bottom wall
    ctx.fillRect(arena.offsetX - borderWidth, arena.offsetY + arena.height, arena.width + borderWidth * 2, borderWidth);
    // Left wall
    ctx.fillRect(arena.offsetX - borderWidth, arena.offsetY, borderWidth, arena.height);
    // Right wall
    ctx.fillRect(arena.offsetX + arena.width, arena.offsetY, borderWidth, arena.height);

    // Highlight
    ctx.fillStyle = colors.wallHighlight;
    ctx.fillRect(arena.offsetX - borderWidth, arena.offsetY - borderWidth, arena.width + borderWidth * 2, 2);
    ctx.fillRect(arena.offsetX - borderWidth, arena.offsetY - borderWidth, 2, arena.height + borderWidth * 2);
  }

  function drawPlayer(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    state: PlayerState,
    _health: number
  ) {
    const w = playerConfig.width;
    const h = playerConfig.height;

    ctx.save();
    ctx.translate(x, y);

    // Damage flash
    if (state.invincibilityFrames > 0 && Math.floor(state.invincibilityFrames / 4) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // Roll squish effect
    let scaleX = 1;
    let scaleY = 1;
    if (state.isRolling) {
      const rollProgress = 1 - state.rollFrames / playerConfig.rollDuration;
      scaleX = 1 + Math.sin(rollProgress * Math.PI) * 0.3;
      scaleY = 1 - Math.sin(rollProgress * Math.PI) * 0.2;
    }

    ctx.scale(scaleX, scaleY);

    // Cape
    ctx.fillStyle = colors.playerCape;
    ctx.fillRect(-w * 0.3, -h * 0.3, w * 0.6, h * 0.5);

    // Body
    ctx.fillStyle = colors.playerBody;
    ctx.fillRect(-w * 0.4, -h * 0.4, w * 0.8, h * 0.8);

    // Armor
    ctx.fillStyle = colors.playerArmor;
    ctx.fillRect(-w * 0.35, -h * 0.25, w * 0.7, h * 0.4);

    // Head
    ctx.fillStyle = colors.playerBody;
    ctx.beginPath();
    ctx.arc(0, -h * 0.25, w * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Sword (always visible, direction based on facing)
    const swordAngle = Math.atan2(state.facingDirection.y, state.facingDirection.x);
    ctx.save();
    ctx.rotate(swordAngle);

    // Attack animation
    if (state.isAttacking) {
      const attackProgress = 1 - state.attackFrames / playerConfig.attackDuration;
      const swingAngle = Math.sin(attackProgress * Math.PI) * 1.2 - 0.6;
      ctx.rotate(swingAngle);
    }

    ctx.fillStyle = colors.playerSword;
    ctx.fillRect(w * 0.2, -2, playerConfig.attackRange * 0.6, 4);

    // Sword hilt
    ctx.fillStyle = colors.playerArmor;
    ctx.fillRect(w * 0.1, -4, 8, 8);

    ctx.restore();

    ctx.restore();
  }

  function drawRollGhost(ctx: CanvasRenderingContext2D, x: number, y: number, state: PlayerState) {
    const ghostCount = 3;
    for (let i = 0; i < ghostCount; i++) {
      const offset = (ghostCount - i) * 8;
      const ghostX = x - state.rollDirection.x * offset;
      const ghostY = y - state.rollDirection.y * offset;
      const alpha = 0.2 - i * 0.05;

      ctx.fillStyle = `rgba(136, 136, 170, ${alpha})`;
      ctx.beginPath();
      ctx.ellipse(ghostX, ghostY, playerConfig.width * 0.4, playerConfig.height * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawAttackSlash(ctx: CanvasRenderingContext2D, x: number, y: number, state: PlayerState) {
    const attackProgress = 1 - state.attackFrames / playerConfig.attackDuration;
    const slashAlpha = Math.sin(attackProgress * Math.PI) * 0.6;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(state.attackDirection.y, state.attackDirection.x));

    ctx.fillStyle = `rgba(200, 220, 255, ${slashAlpha})`;
    ctx.beginPath();
    ctx.moveTo(playerConfig.width * 0.5, 0);
    ctx.lineTo(playerConfig.attackRange, -playerConfig.attackWidth * 0.5 * attackProgress);
    ctx.lineTo(playerConfig.attackRange, playerConfig.attackWidth * 0.5 * attackProgress);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawEnemy(ctx: CanvasRenderingContext2D, x: number, y: number, state: EnemyState) {
    const w = enemyConfig.width;
    const h = enemyConfig.height;

    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = state.isDying ? state.deathFrames / 20 : 1;

    // Body
    ctx.fillStyle = colors.enemyBody;
    ctx.fillRect(-w * 0.4, -h * 0.4, w * 0.8, h * 0.8);

    // Hunched posture
    ctx.fillRect(-w * 0.45, -h * 0.2, w * 0.9, h * 0.5);

    // Head
    ctx.beginPath();
    ctx.arc(0, -h * 0.3, w * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Glowing eyes
    ctx.fillStyle = colors.enemyEyes;
    ctx.shadowColor = colors.enemyEyes;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(-w * 0.12, -h * 0.32, 3, 0, Math.PI * 2);
    ctx.arc(w * 0.12, -h * 0.32, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Weapon
    ctx.fillStyle = colors.enemyWeapon;
    if (state.isAttacking) {
      const attackProgress = 1 - state.attackFrames / enemyConfig.attackDuration;
      const swingAngle = Math.sin(attackProgress * Math.PI) * 2;
      ctx.save();
      ctx.rotate(swingAngle);
      ctx.fillRect(w * 0.3, -3, 25, 6);
      ctx.restore();
    } else {
      ctx.fillRect(w * 0.2, -h * 0.1, 20, 5);
    }

    ctx.restore();
  }

  function drawUI(
    ctx: CanvasRenderingContext2D,
    score: number,
    wave: number,
    playerState: PlayerState | undefined,
    currentHealth: number
  ) {
    // Health bar
    const healthBarWidth = 100;
    const healthBarHeight = 12;
    const healthX = 10;
    const healthY = 10;

    ctx.fillStyle = colors.healthEmpty;
    ctx.fillRect(healthX, healthY, healthBarWidth, healthBarHeight);

    // Draw health segments
    const maxHealth = playerConfig.maxHealth;
    const segmentWidth = healthBarWidth / maxHealth;

    ctx.fillStyle = colors.healthFull;
    for (let i = 0; i < currentHealth; i++) {
      ctx.fillRect(healthX + i * segmentWidth + 1, healthY + 1, segmentWidth - 2, healthBarHeight - 2);
    }

    // Stamina bar
    const staminaBarWidth = 100;
    const staminaBarHeight = 8;
    const staminaX = 10;
    const staminaY = healthY + healthBarHeight + 4;

    ctx.fillStyle = colors.staminaEmpty;
    ctx.fillRect(staminaX, staminaY, staminaBarWidth, staminaBarHeight);

    if (playerState) {
      const staminaPercent = playerState.stamina / playerState.maxStamina;
      ctx.fillStyle = colors.staminaFull;
      ctx.fillRect(staminaX, staminaY, staminaBarWidth * staminaPercent, staminaBarHeight);
    }

    // Score
    ctx.fillStyle = colors.score;
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${score}`, canvasConfig.width - 10, 22);

    // Wave
    ctx.fillStyle = colors.wave;
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillText(`WAVE ${wave}`, canvasConfig.width - 10, 38);

    ctx.textAlign = 'left';
  }

  function drawGameOver(ctx: CanvasRenderingContext2D, score: number, highScore: number) {
    // Overlay
    ctx.fillStyle = colors.gameOverBg;
    ctx.fillRect(0, 0, canvasConfig.width, canvasConfig.height);

    ctx.textAlign = 'center';

    // YOU DIED text
    ctx.fillStyle = colors.youDied;
    ctx.font = '32px "Press Start 2P", monospace';
    ctx.fillText('YOU DIED', canvasConfig.width / 2, canvasConfig.height / 2 - 50);

    // Score
    ctx.fillStyle = colors.score;
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillText(`SOULS: ${score}`, canvasConfig.width / 2, canvasConfig.height / 2 + 10);

    // High score
    if (score >= highScore && score > 0) {
      ctx.fillStyle = colors.soulOrb;
      ctx.fillText('NEW BEST!', canvasConfig.width / 2, canvasConfig.height / 2 + 35);
    } else {
      ctx.fillStyle = colors.wave;
      ctx.fillText(`BEST: ${highScore}`, canvasConfig.width / 2, canvasConfig.height / 2 + 35);
    }

    // Restart prompt
    if (Math.floor(Date.now() / 500) % 2 === 0) {
      ctx.fillStyle = colors.restartText;
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText('PRESS TO RISE', canvasConfig.width / 2, canvasConfig.height / 2 + 70);
    }

    ctx.textAlign = 'left';
  }

  function drawStartScreen(ctx: CanvasRenderingContext2D) {
    ctx.textAlign = 'center';

    // Title
    ctx.fillStyle = colors.score;
    ctx.strokeStyle = colors.background;
    ctx.lineWidth = 4;
    ctx.font = '20px "Press Start 2P", monospace';
    ctx.strokeText('SOUL KNIGHT', canvasConfig.width / 2, canvasConfig.height / 2 - 30);
    ctx.fillText('SOUL KNIGHT', canvasConfig.width / 2, canvasConfig.height / 2 - 30);

    // Subtitle
    ctx.fillStyle = colors.wave;
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText('PREPARE TO DIE', canvasConfig.width / 2, canvasConfig.height / 2);

    // Controls hint
    ctx.fillStyle = colors.restartText;
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText('MOVE: D-PAD  ATTACK: A', canvasConfig.width / 2, canvasConfig.height / 2 + 40);
    ctx.fillText('ROLL: B (WHILE MOVING)', canvasConfig.width / 2, canvasConfig.height / 2 + 55);

    // Start prompt
    if (Math.floor(Date.now() / 500) % 2 === 0) {
      ctx.fillStyle = colors.score;
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText('PRESS TO START', canvasConfig.width / 2, canvasConfig.height / 2 + 85);
    }

    ctx.textAlign = 'left';
  }
}
