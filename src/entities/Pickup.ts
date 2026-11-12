/* src/entities/Pickup.ts */
import Phaser from 'phaser';
import { C } from '../config/constants';
import { PowerUpType } from './Player';
import { randomInRange } from '../utils/math';

export class Pickup extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;
  public type: PowerUpType;
  public collected = false;

  private sprite: Phaser.GameObjects.Graphics;
  private glow: Phaser.GameObjects.Graphics;
  private pulseTime = 0;
  private floatOffset = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, type: PowerUpType) {
    super(scene, x, y);
    this.type = type;

    this.sprite = scene.add.graphics();
    this.glow = scene.add.graphics();
    this.add([this.glow, this.sprite]);
    this.drawPickup();

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(24, 24).setOffset(-12, -12);
    this.body.setCollideWorldBounds(true);
    this.body.setVelocity(randomInRange(-50, 50), randomInRange(-50, 50));
    this.setDepth(C.DEPTH.PICKUP);

    scene.events.on('update', this.update, this);
    scene.events.once('shutdown', () => scene.events.off('update', this.update, this));
  }

  private drawPickup(): void {
    this.sprite.clear();
    this.glow.clear();

    const colors: Record<PowerUpType, number> = {
      rapid: 0x00ff88,
      spread: 0xff8800,
      pierce: 0xff00ff,
      speed: 0x00aaff,
      shield: 0xffff00,
    };

    const symbols: Record<PowerUpType, string> = {
      rapid: '⚡',
      spread: '⌁',
      pierce: '▸',
      speed: '▶',
      shield: '◆',
    };

    const color = colors[this.type];

    // Glow
    this.glow.fillStyle(color, 0.3);
    this.glow.fillCircle(0, 0, 16);

    // Main shape
    this.sprite.fillStyle(color, 1);
    this.sprite.lineStyle(2, 0xffffff, 0.8);
    this.sprite.fillCircle(0, 0, 12);
    this.sprite.strokeCircle(0, 0, 12);

    // Symbol (using text would be better but graphics is fine)
    this.sprite.fillStyle(0x000000, 1);
    this.sprite.fillCircle(0, 0, 4);
  }

  update(time: number, dt: number): void {
    if (this.collected) return;

    this.pulseTime += dt;
    this.floatOffset = Math.sin(this.pulseTime * 0.005) * 4;

    this.y += this.floatOffset * 0.1;
    this.glow.scale = 1 + Math.sin(this.pulseTime * 0.01) * 0.2;
    this.rotation += dt * 0.001;
  }

  collect(): void {
    this.collected = true;
    this.destroy();
  }

  preDestroy(): void {
    this.scene.events.off('update', this.update, this);
    super.preDestroy();
  }
}