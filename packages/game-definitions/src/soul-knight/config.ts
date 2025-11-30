/**
 * Soul Knight - A simplified Dark Souls-inspired arcade roguelike.
 * Configuration constants for gameplay and visuals.
 */
export const SOUL_KNIGHT_CONFIG = {
  canvas: {
    width: 400,
    height: 360,
  },
  arena: {
    width: 360,
    height: 320,
    offsetX: 20,
    offsetY: 20,
  },
  player: {
    width: 24,
    height: 32,
    speed: 2.5,
    rollSpeed: 6,
    rollDuration: 12, // frames
    rollCooldown: 20, // frames
    attackRange: 36,
    attackWidth: 40,
    attackDuration: 15, // frames
    attackCooldown: 25, // frames
    startX: 180,
    startY: 280,
    maxHealth: 5,
    maxStamina: 100,
    staminaRegen: 1.2,
    staminaCostAttack: 25,
    staminaCostRoll: 30,
    invincibilityFrames: 45,
  },
  enemy: {
    width: 28,
    height: 36,
    speed: 1.0,
    attackRange: 32,
    attackDuration: 20,
    attackCooldown: 60,
    damage: 1,
    health: 2,
    spawnDelay: 180, // frames between spawns
    maxEnemies: 6,
    chaseRange: 150,
    scorePerKill: 100,
  },
  wave: {
    startEnemies: 2,
    enemiesPerWave: 1,
    maxWaveEnemies: 8,
  },
  colors: {
    // Dark dungeon atmosphere
    background: '#0a0a12',
    floorTile: '#1a1a24',
    floorTileAlt: '#141420',
    wall: '#2a2a3a',
    wallHighlight: '#3a3a4a',
    // Player - pale undead knight
    playerBody: '#8888aa',
    playerArmor: '#556688',
    playerSword: '#aabbcc',
    playerCape: '#554444',
    // Enemies - dark hollow warriors
    enemyBody: '#443322',
    enemyEyes: '#ff4444',
    enemyWeapon: '#665544',
    // UI
    healthFull: '#44aa44',
    healthEmpty: '#442222',
    staminaFull: '#44aa88',
    staminaEmpty: '#224444',
    score: '#ddddaa',
    wave: '#aa8866',
    // Effects
    attackSlash: 'rgba(200, 220, 255, 0.6)',
    rollGhost: 'rgba(136, 136, 170, 0.3)',
    damageFlash: '#ff4444',
    deathParticle: '#ff6644',
    soulOrb: '#44ffaa',
    // Game over
    gameOverBg: 'rgba(0, 0, 0, 0.85)',
    gameOverText: '#aa4444',
    youDied: '#881111',
    restartText: '#888888',
  },
} as const;

export type SoulKnightConfig = typeof SOUL_KNIGHT_CONFIG;
