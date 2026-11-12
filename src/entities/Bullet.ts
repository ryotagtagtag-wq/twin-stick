/* src/entities/Bullet.ts */
import Phaser from 'phaser';
import { C } from '../config/constants';
import { vec2FromAngle } from '../utils/math';

export interface BulletConfig {
  x: number;
  y: number;
  angle: number;
  speed?: number;
  lifetime?: number;
  damage: number;
  pierce?: boolean;
  owner: 'player' | 'enemy';
  color?: number;
  size?: number;
}

export class Bullet extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;
  public damage: number;
  public pierce: boolean;
  public owner: 'player' | 'enemy';
  public spawnedAt: number;
  public lifetime: number;

  private graphics: Phaser.GameObjects.Graphics;
  private trail: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, config: BulletConfig) {
    super(scene, config.x, config.y);
    this.damage = config.damage;
    this.pierce = config.pierce ?? false;
    this.owner = config.owner;
    this.spawnedAt = scene.time.now;
    this.lifetime = config.lifetime ?? C.BULLET_LIFETIME;

    this.graphics = scene.add.graphics();
    this.trail = scene.add.graphics();
    this.add([this.trail, this.graphics]);

    const color = config.color ?? (config.owner === 'player' ? C.COLORS.PLAYER_BULLET : C.COLORS.ENEMY_BULLET);
    const size = config.size ?? (config.owner === 'player' ? 6 : 8);

    this.graphics.fillStyle(color, 1);
    this.graphics.fillCircle(0, 0, size);
    this.graphics.lineStyle(1, color, 0.5);
    this.graphics.strokeCircle(0, 0, size + 2);

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(size * 2, size * 2).setOffset(-size, -size);
    this.body.setCollideWorldBounds(false);
    this.setDepth(C.DEPTH.BULLET);

    const speed = config.speed ?? C.BULLET_SPEED;
    const vel = vec2FromAngle(config.angle, speed);
    this.body.setVelocity(vel.x, vel.y);
    this.rotation = config.angle;
  }

  update(time: number, dt: number): void {
    if (time - this.spawnedAt >= this.lifetime) {
      this.destroy();
      return;
    }

    // Trail effect
    this.trail.clear();
    this.trail.lineStyle(2, this.owner === 'player' ? C.COLORS.PLAYER_BULLET : C.COLORS.ENEMY_BULLET, 0.4);
    this.trail.beginPath();
    this.trail.moveTo(0, 0);
    this.trail.lineTo(-this.body.velocity.x * 0.02, -this.body.velocity.y * 0.02);
    this.trail.strokePath();

    // Check world bounds
    if (this.x < -50 || this.x > C.W + 50 || this.y < -50 || this.y > C.H + 50) {
      this.destroy();
    }
  }

  hit(): void {
    if (!this.pierce) {
      this.destroy();
    }
  }
}