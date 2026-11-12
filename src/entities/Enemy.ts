/* src/entities/Enemy.ts */
import Phaser from 'phaser';
import { C } from '../config/constants';
import { ENEMY_CONFIGS, EnemyConfig, EnemyType } from '../config/enemyPatterns';
import { vec2, vec2Normalize, vec2SetLength, vec2Angle, distance, randomInRange } from '../utils/math';
import { audioEngine } from '../audio/AudioEngine';
import { Bullet, BulletConfig } from './Bullet';

export interface EnemySpawnData {
  type: EnemyType;
  x: number;
  y: number;
}

export class Enemy extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;
  public config: EnemyConfig;
  public hp: number;
  public maxHp: number;
  public lastShootTime = 0;
  public behaviorTimer = 0;
  public orbitAngle = 0;
  public orbitRadius = 0;
  public orbitDirection = 1;

  private sprite: Phaser.GameObjects.Graphics;
  private hpBar: Phaser.GameObjects.Graphics;
  private hpBarBg: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, spawnData: EnemySpawnData) {
    super(scene, spawnData.x, spawnData.y);
    this.config = ENEMY_CONFIGS[spawnData.type];
    this.hp = this.config.hp;
    this.maxHp = this.config.hp;
    this.orbitAngle = Math.random() * Math.PI * 2;
    this.orbitRadius = 200 + Math.random() * 150;
    this.orbitDirection = Math.random() > 0.5 ? 1 : -1;

    this.sprite = scene.add.graphics();
    this.hpBarBg = scene.add.graphics();
    this.hpBar = scene.add.graphics();
    this.add([this.sprite, this.hpBarBg, this.hpBar]);
    this.drawEnemy();

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(this.config.size, this.config.size).setOffset(-this.config.size / 2, -this.config.size / 2);
    this.body.setCollideWorldBounds(true);
    this.body.onWorldBounds = true;
    this.setDepth(C.DEPTH.ENEMY);

    scene.events.on('update', this.update, this);
    scene.events.once('shutdown', () => scene.events.off('update', this.update, this));
  }

  private drawEnemy(): void {
    this.sprite.clear();
    this.sprite.fillStyle(this.config.color, 1);
    this.sprite.lineStyle(2, 0xffffff, 0.5);

    switch (this.config.type) {
      case 'grunt':
        this.drawTriangle();
        break;
      case 'sniper':
        this.drawDiamond();
        break;
      case 'tank':
        this.drawSquare();
        break;
    }

    // HP bar (only for tank or damaged enemies)
    this.updateHpBar();
  }

  private drawTriangle(): void {
    const s = this.config.size / 2;
    this.sprite.beginPath();
    this.sprite.moveTo(0, -s);
    this.sprite.lineTo(s, s);
    this.sprite.lineTo(-s, s);
    this.sprite.closePath();
    this.sprite.fillPath();
    this.sprite.strokePath();
  }

  private drawDiamond(): void {
    const s = this.config.size / 2;
    this.sprite.beginPath();
    this.sprite.moveTo(0, -s);
    this.sprite.lineTo(s, 0);
    this.sprite.lineTo(0, s);
    this.sprite.lineTo(-s, 0);
    this.sprite.closePath();
    this.sprite.fillPath();
    this.sprite.strokePath();
  }

  private drawSquare(): void {
    const s = this.config.size / 2;
    this.sprite.fillRect(-s, -s, this.config.size, this.config.size);
    this.sprite.strokeRect(-s, -s, this.config.size, this.config.size);
    // Inner detail
    this.sprite.fillStyle(0xffffff, 0.2);
    this.sprite.fillRect(-s * 0.5, -s * 0.5, this.config.size * 0.5, this.config.size * 0.5);
  }

  private updateHpBar(): void {
    this.hpBarBg.clear();
    this.hpBar.clear();
    if (this.hp < this.maxHp || this.config.type === 'tank') {
      const w = this.config.size;
      const h = 4;
      const y = -this.config.size / 2 - 8;
      this.hpBarBg.fillStyle(0x000000, 0.8);
      this.hpBarBg.fillRect(-w / 2, y, w, h);
      this.hpBar.fillStyle(0x00ff00, 1);
      this.hpBar.fillRect(-w / 2, y, w * (this.hp / this.maxHp), h);
    }
  }

  update(time: number, dt: number, player: { x: number; y: number }): void {
    this.behaviorTimer += dt;

    switch (this.config.behavior) {
      case 'chase':
        this.updateChase(player, dt);
        break;
      case 'orbit':
        this.updateOrbit(player, dt);
        break;
      case 'stationary':
        this.updateStationary(player, dt);
        break;
    }

    // Shooting
    if (this.config.canShoot && time - this.lastShootTime >= this.config.shootCooldown) {
      this.shootAt(player);
      this.lastShootTime = time;
    }

    this.updateHpBar();
  }

  private updateChase(player: { x: number; y: number }, dt: number): void {
    const angle = vec2Angle(vec2(player.x - this.x, player.y - this.y));
    const speed = this.config.speed;
    this.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    this.rotation = angle;
  }

  private updateOrbit(player: { x: number; y: number }, dt: number): void {
    const toPlayer = vec2(player.x - this.x, player.y - this.y);
    const dist = Math.hypot(toPlayer.x, toPlayer.y);

    // Orbit around player
    this.orbitAngle += this.orbitDirection * 0.5 * (dt / 1000);
    const targetX = player.x + Math.cos(this.orbitAngle) * this.orbitRadius;
    const targetY = player.y + Math.sin(this.orbitAngle) * this.orbitRadius;

    const angle = vec2Angle(vec2(targetX - this.x, targetY - this.y));
    const speed = this.config.speed;
    this.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    this.rotation = vec2Angle(vec2(player.x - this.x, player.y - this.y));
  }

  private updateStationary(player: { x: number; y: number }, dt: number): void {
    // Slowly approach player but keep distance
    const toPlayer = vec2(player.x - this.x, player.y - this.y);
    const dist = Math.hypot(toPlayer.x, toPlayer.y);
    const idealDist = 300;

    if (dist > idealDist + 50) {
      const angle = vec2Angle(toPlayer);
      this.body.setVelocity(Math.cos(angle) * this.config.speed * 0.5, Math.sin(angle) * this.config.speed * 0.5);
    } else if (dist < idealDist - 50) {
      const angle = vec2Angle(toPlayer) + Math.PI;
      this.body.setVelocity(Math.cos(angle) * this.config.speed * 0.5, Math.sin(angle) * this.config.speed * 0.5);
    } else {
      this.body.setVelocity(0, 0);
    }
    this.rotation = vec2Angle(toPlayer);
  }

  private shootAt(target: { x: number; y: number }): void {
    const angle = vec2Angle(vec2(target.x - this.x, target.y - this.y));
    const spread = this.config.type === 'tank' ? 3 : 1;

    for (let i = 0; i < spread; i++) {
      let bulletAngle = angle;
      if (spread > 1) {
        bulletAngle += (i - (spread - 1) / 2) * 0.3;
      }
      this.scene.events.emit('enemy-shoot', {
        x: this.x + Math.cos(bulletAngle) * (this.config.size / 2 + 5),
        y: this.y + Math.sin(bulletAngle) * (this.config.size / 2 + 5),
        angle: bulletAngle,
        speed: this.config.bulletSpeed,
        damage: this.config.bulletDamage,
        owner: 'enemy',
        color: C.COLORS.ENEMY_BULLET,
      } as BulletConfig);
    }
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    this.updateHpBar();
    if (this.hp <= 0) {
      this.die();
      return true;
    }
    audioEngine.playHit();
    return false;
  }

  private die(): void {
    this.scene.events.emit('enemy-died', {
      x: this.x,
      y: this.y,
      type: this.config.type,
      score: this.config.score,
    });
    audioEngine.playExplosion();
    this.destroy();
  }

  preDestroy(): void {
    this.scene.events.off('update', this.update, this);
    super.preDestroy();
  }
}