/* src/config/enemyPatterns.ts */
import { C } from './constants';

export type EnemyType = 'grunt' | 'sniper' | 'tank';

export interface EnemyConfig {
  type: EnemyType;
  hp: number;
  speed: number;
  color: number;
  score: number;
  shootCooldown: number;
  bulletSpeed: number;
  bulletDamage: number;
  canShoot: boolean;
  size: number;
  behavior: 'chase' | 'orbit' | 'stationary';
}

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  grunt: {
    type: 'grunt',
    hp: 1,
    speed: 100,
    color: C.COLORS.ENEMY_GRUNT,
    score: 100,
    shootCooldown: 0,
    bulletSpeed: 0,
    bulletDamage: 0,
    canShoot: false,
    size: 20,
    behavior: 'chase',
  },
  sniper: {
    type: 'sniper',
    hp: 1,
    speed: 60,
    color: C.COLORS.ENEMY_SNIPER,
    score: 200,
    shootCooldown: 2500,
    bulletSpeed: 400,
    bulletDamage: 1,
    canShoot: true,
    size: 18,
    behavior: 'orbit',
  },
  tank: {
    type: 'tank',
    hp: 4,
    speed: 40,
    color: C.COLORS.ENEMY_TANK,
    score: 500,
    shootCooldown: 3000,
    bulletSpeed: 300,
    bulletDamage: 2,
    canShoot: true,
    size: 32,
    behavior: 'stationary',
  },
};

export interface WaveDefinition {
  duration: number;
  spawnInterval: number;
  enemyWeights: Record<EnemyType, number>;
  maxEnemies: number;
}

const WAVE_DEFINITIONS: readonly WaveDefinition[] = [
  { duration: 30000, spawnInterval: 2000, enemyWeights: { grunt: 100, sniper: 0, tank: 0 }, maxEnemies: 10 },
  { duration: 30000, spawnInterval: 1800, enemyWeights: { grunt: 80, sniper: 20, tank: 0 }, maxEnemies: 15 },
  { duration: 30000, spawnInterval: 1500, enemyWeights: { grunt: 60, sniper: 30, tank: 10 }, maxEnemies: 20 },
  { duration: 30000, spawnInterval: 1200, enemyWeights: { grunt: 50, sniper: 30, tank: 20 }, maxEnemies: 25 },
  { duration: 30000, spawnInterval: 1000, enemyWeights: { grunt: 40, sniper: 30, tank: 30 }, maxEnemies: 30 },
] as const;

export function getWaveDefinition(waveIndex: number): WaveDefinition {
  if (waveIndex < WAVE_DEFINITIONS.length) {
    return WAVE_DEFINITIONS[waveIndex]!;
  }
  // Endless scaling after defined waves
  const base = WAVE_DEFINITIONS[WAVE_DEFINITIONS.length - 1]!;
  const scale = 1 + (waveIndex - WAVE_DEFINITIONS.length + 1) * 0.1;
  return {
    duration: base.duration,
    spawnInterval: Math.max(500, base.spawnInterval / scale),
    enemyWeights: base.enemyWeights,
    maxEnemies: Math.min(50, Math.floor(base.maxEnemies * scale)),
  };
}

export function pickEnemyType(weights: Record<EnemyType, number>): EnemyType {
  const total = weights.grunt + weights.sniper + weights.tank;
  let r = Math.random() * total;
  if ((r -= weights.grunt) <= 0) return 'grunt';
  if ((r -= weights.sniper) <= 0) return 'sniper';
  return 'tank';
}

export interface SpawnPosition {
  x: number;
  y: number;
}

export function getRandomSpawnPosition(
  playerX: number,
  playerY: number,
  minDist = 400,
  maxDist = 800
): SpawnPosition {
  const angle = Math.random() * Math.PI * 2;
  const dist = minDist + Math.random() * (maxDist - minDist);
  return {
    x: playerX + Math.cos(angle) * dist,
    y: playerY + Math.sin(angle) * dist,
  };
}

export function clampToWorld(x: number, y: number, margin = 50): { x: number; y: number } {
  return {
    x: Math.max(margin, Math.min(C.W - margin, x)),
    y: Math.max(margin, Math.min(C.H - margin, y)),
  };
}