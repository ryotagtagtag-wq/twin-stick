/* src/entities/Player.ts */
import Phaser from 'phaser';
import { C } from '../config/constants';
import { vec2, vec2Normalize, vec2SetLength, vec2Angle } from '../utils/math';
import { audioEngine } from '../audio/AudioEngine';

export type PowerUpType = 'rapid' | 'spread' | 'pierce' | 'speed' | 'shield';

export interface PowerUpState {
  type: PowerUpType;
  expiresAt: number;
  level: number;
}

export class Player extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;
  public hp: number;
  public maxHp: number;
  public invincibleUntil = 0;
  public shootCooldown = 0;
  public powerUps: Map<PowerUpType, PowerUpState> = new Map();
  public angle = 0;

  private sprite: Phaser.GameObjects.Graphics;
  private glow: Phaser.GameObjects.Graphics;
  private lastShootTime = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.hp = C.PLAYER_HP;
    this.maxHp = C.PLAYER_HP;

    this.sprite = scene.add.graphics();
    this.glow = scene.add.graphics();
    this.add([this.glow, this.sprite]);
    this.drawShip();

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(32, 32).setOffset(-16, -16);
    this.body.setCollideWorldBounds(true);
    this.setDepth(C.DEPTH.PLAYER);
  }

  private drawShip(): void {
    this.sprite.clear();
    this.sprite.lineStyle(2, C.COLORS.PLAYER, 1);
    this.sprite.beginPath();
    this.sprite.moveTo(0, -16);
    this.sprite.lineTo(10, 10);
    this.sprite.lineTo(0, 5);
    this.sprite.lineTo(-10, 10);
    this.sprite.closePath();
    this.sprite.strokePath();

    this.glow.clear();
    this.glow.lineStyle(4, C.COLORS.PLAYER, 0.3);
    this.glow.strokeCircle(0, 0, 20);
  }

  update(input: { moveUp: boolean; moveDown: boolean; moveLeft: boolean; moveRight: boolean; shoot: boolean; pointerX: number; pointerY: number }, time: number, dt: number): void {
    // Movement
    let vx = 0, vy = 0;
    if (input.moveLeft) vx -= 1;
    if (input.moveRight) vx += 1;
    if (input.moveUp) vy -= 1;
    if (input.moveDown) vy += 1;

    const speedMult = this.hasPowerUp('speed') ? 1.5 : 1;
    const speed = C.PLAYER_SPEED * speedMult;

    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy);
      vx = (vx / len) * speed;
      vy = (vy / len) * speed;
    }
    this.body.setVelocity(vx, vy);

    // Aim at mouse
    this.angle = Math.atan2(input.pointerY - this.y, input.pointerX - this.x);
    this.rotation = this.angle;

    // Invincibility flash
    if (time < this.invincibleUntil) {
      this.alpha = Math.sin(time * 0.02) * 0.5 + 0.5;
    } else {
      this.alpha = 1;
    }

    // Power-up expiration
    this.updatePowerUps(time);

    // Shooting
    if (input.shoot && time - this.lastShootTime >= this.getShootCooldown()) {
      this.lastShootTime = time;
      this.shoot();
    }

    // Update cooldown
    this.shootCooldown = Math.max(0, this.getShootCooldown() - (time - this.lastShootTime));
  }

  private getShootCooldown(): number {
    if (this.hasPowerUp('rapid')) return C.SHOOT_COOLDOWN * 0.4;
    return C.SHOOT_COOLDOWN;
  }

  private shoot(): void {
    const spread = this.hasPowerUp('spread') ? 3 : 1;
    const pierce = this.hasPowerUp('pierce');
    const baseAngle = this.angle;

    for (let i = 0; i < spread; i++) {
      let angle = baseAngle;
      if (spread > 1) {
        angle += (i - (spread - 1) / 2) * 0.2;
      }
      this.scene.events.emit('player-shoot', {
        x: this.x + Math.cos(angle) * 20,
        y: this.y + Math.sin(angle) * 20,
        angle,
        pierce,
        damage: C.PLAYER_BULLET_DAMAGE,
      });
    }

    audioEngine.playShoot();
  }

  takeDamage(amount: number, time: number): boolean {
    if (time < this.invincibleUntil) return false;
    if (this.hasPowerUp('shield')) {
      this.removePowerUp('shield');
      this.invincibleUntil = time + 1000;
      return false;
    }
    this.hp -= amount;
    this.invincibleUntil = time + C.INVINCIBLE_TIME;
    audioEngine.playHit();
    return this.hp <= 0;
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  addPowerUp(type: PowerUpType, duration = C.POWERUP_DURATION): void {
    const now = this.scene.time.now;
    const existing = this.powerUps.get(type);
    const level = (existing?.level || 0) + 1;
    this.powerUps.set(type, { type, expiresAt: now + duration, level: Math.min(level, 3) });
    audioEngine.playPowerUp();
  }

  private updatePowerUps(time: number): void {
    for (const [type, state] of this.powerUps) {
      if (time >= state.expiresAt) {
        this.powerUps.delete(type);
      }
    }
  }

  hasPowerUp(type: PowerUpType): boolean {
    return this.powerUps.has(type);
  }

  getPowerUpLevel(type: PowerUpType): number {
    return this.powerUps.get(type)?.level || 0;
  }

  removePowerUp(type: PowerUpType): void {
    this.powerUps.delete(type);
  }

  getActivePowerUps(): PowerUpState[] {
    return Array.from(this.powerUps.values());
  }
}