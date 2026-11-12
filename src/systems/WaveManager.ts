/* src/systems/WaveManager.ts */
import Phaser from 'phaser';
import { C } from '../config/constants';
import { getWaveDefinition, pickEnemyType, getRandomSpawnPosition } from '../config/enemyPatterns';
import { Enemy, EnemySpawnData } from '../entities/Enemy';
import { Pickup } from '../entities/Pickup';
import { PowerUpType } from '../entities/Player';

export interface WaveStats {
  wave: number;
  enemiesKilled: number;
  enemiesSpawned: number;
  startTime: number;
}

const POWERUP_TYPES: PowerUpType[] = ['rapid', 'spread', 'pierce', 'speed', 'shield'];

export class WaveManager {
  private scene: Phaser.Scene;
  private wave = 0;
  private waveStartTime = 0;
  private spawnTimer = 0;
  private waveActive = false;
  private enemiesSpawned = 0;
  private enemiesKilled = 0;
  private enemies: Enemy[] = [];
  private pickups: Pickup[] = [];
  private waveDefinition = getWaveDefinition(0);

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  start(): void {
    this.wave = 0;
    this.startNextWave();
  }

  startNextWave(): void {
    this.wave++;
    this.waveStartTime = this.scene.time.now;
    this.spawnTimer = 0;
    this.enemiesSpawned = 0;
    this.enemiesKilled = 0;
    this.waveDefinition = getWaveDefinition(this.wave - 1);
    this.waveActive = true;

    // Clear dead enemies
    this.enemies = this.enemies.filter(e => e.active);
  }

  update(time: number, dt: number, player: { x: number; y: number }): void {
    if (!this.waveActive) return;

    const elapsed = time - this.waveStartTime;

    // Check wave completion
    if (elapsed >= this.waveDefinition.duration) {
      this.endWave();
      return;
    }

    // Spawn enemies
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.waveDefinition.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnEnemy(player);
    }

    // Update enemies
    this.enemies = this.enemies.filter(e => {
      if (!e.active) return false;
      e.update(time, dt, player);
      return true;
    });

    // Update pickups
    this.pickups = this.pickups.filter(p => {
      if (!p.active || p.collected) return false;
      p.update(time, dt);
      return true;
    });
  }

  private spawnEnemy(player: { x: number; y: number }): void {
    if (this.enemies.length >= this.waveDefinition.maxEnemies) return;
    if (this.enemiesSpawned >= C.MAX_ENEMIES_ON_SCREEN) return;

    const type = pickEnemyType(this.waveDefinition.enemyWeights);
    const pos = getRandomSpawnPosition(player.x, player.y, 400, 800);

    const enemy = new Enemy(this.scene, { type, x: pos.x, y: pos.y });
    this.enemies.push(enemy);
    this.enemiesSpawned++;

    // Listen for enemy death
    this.scene.events.once(`enemy-died-${enemy.name}`, (data: { x: number; y: number; type: string; score: number }) => {
      this.onEnemyDied(data);
    });
    enemy.name = `enemy-${this.enemiesSpawned}-${Date.now()}`;
  }

  private onEnemyDied(data: { x: number; y: number; type: string; score: number }): void {
    this.enemiesKilled++;
    this.scene.events.emit('enemy-killed', data);

    // Chance to spawn pickup
    if (Math.random() < 0.15) {
      this.spawnPickup(data.x, data.y);
    }
  }

  private spawnPickup(x: number, y: number): void {
    const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)]!;
    const pickup = new Pickup(this.scene, x, y, type);
    this.pickups.push(pickup);
  }

  private endWave(): void {
    this.waveActive = false;
    this.scene.events.emit('wave-complete', {
      wave: this.wave,
      enemiesKilled: this.enemiesKilled,
      bonus: C.SCORE_WAVE_BONUS * this.wave,
    });
  }

  registerEnemy(enemy: Enemy): void {
    this.enemies.push(enemy);
  }

  registerPickup(pickup: Pickup): void {
    this.pickups.push(pickup);
  }

  getEnemies(): Enemy[] {
    return this.enemies.filter(e => e.active);
  }

  getPickups(): Pickup[] {
    return this.pickups.filter(p => p.active && !p.collected);
  }

  getWave(): number {
    return this.wave;
  }

  getWaveProgress(): number {
    if (!this.waveActive) return 1;
    return Math.min(1, (this.scene.time.now - this.waveStartTime) / this.waveDefinition.duration);
  }

  getStats(): WaveStats {
    return {
      wave: this.wave,
      enemiesKilled: this.enemiesKilled,
      enemiesSpawned: this.enemiesSpawned,
      startTime: this.waveStartTime,
    };
  }

  isWaveActive(): boolean {
    return this.waveActive;
  }

  destroy(): void {
    this.enemies.forEach(e => e.destroy());
    this.pickups.forEach(p => p.destroy());
    this.enemies = [];
    this.pickups = [];
  }
}