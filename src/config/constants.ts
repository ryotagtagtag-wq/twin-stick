/* src/config/constants.ts */
export const C = {
  // Screen
  W: 1280,
  H: 720,
  BG_COLOR: 0x111111,

  // Player
  PLAYER_SPEED: 320,
  PLAYER_HP: 3,
  SHOOT_COOLDOWN: 120,
  INVINCIBLE_TIME: 1200,
  POWERUP_DURATION: 8000,

  // Bullet
  BULLET_SPEED: 600,
  BULLET_LIFETIME: 1200,
  PLAYER_BULLET_DAMAGE: 1,

  // Enemy
  ENEMY_BASE_HP: 1,
  ENEMY_SPEED: 80,
  ENEMY_SPAWN_RADIUS: 800,
  ENEMY_SHOOT_COOLDOWN: 2000,

  // Wave
  WAVE_DURATION: 30000,
  ENEMIES_PER_WAVE_BASE: 8,
  ENEMIES_PER_WAVE_GROWTH: 3,
  MAX_ENEMIES_ON_SCREEN: 50,

  // Score
  SCORE_KILL: 100,
  SCORE_WAVE_BONUS: 1000,

  // Colors
  COLORS: {
    PLAYER: 0x00ffff,
    PLAYER_BULLET: 0x00ff88,
    ENEMY_GRUNT: 0xff4444,
    ENEMY_SNIPER: 0xff8800,
    ENEMY_TANK: 0xaa00ff,
    ENEMY_BULLET: 0xff0044,
    PARTICLE: 0xffff00,
    PICKUP: 0xffdd00,
    UI_TEXT: 0xffffff,
    UI_BG: 0x000000,
  },

  // Z-index
  DEPTH: {
    BG: 0,
    PARTICLE: 10,
    ENEMY: 20,
    BULLET: 30,
    PLAYER: 40,
    PICKUP: 35,
    UI: 100,
  },
} as const;

export type ColorKey = keyof typeof C.COLORS;