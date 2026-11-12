/* src/entities/Particle.ts */
import Phaser from 'phaser';
import { C } from '../config/constants';
import { vec2FromAngle, randomInRange } from '../utils/math';

export interface ParticleConfig {
  x: number;
  y: number;
  color?: number;
  count?: number;
  speed?: number;
  lifetime?: number;
  size?: number;
  gravity?: number;
  fade?: boolean;
}

export class Particle extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;
  private particles: Array<{
    graphics: Phaser.GameObjects.Graphics;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: number;
    gravity: number;
    fade: boolean;
  }> = [];
  private alive = true;

  constructor(scene: Phaser.Scene, config: ParticleConfig) {
    super(scene, config.x, config.y);
    scene.add.existing(this);
    this.setDepth(C.DEPTH.PARTICLE);

    const count = config.count ?? 12;
    const baseSpeed = config.speed ?? 200;
    const lifetime = config.lifetime ?? 500;
    const size = config.size ?? 4;
    const color = config.color ?? C.COLORS.PARTICLE;
    const gravity = config.gravity ?? 0;
    const fade = config.fade ?? true;

    for (let i = 0; i < count; i++) {
      const angle = randomInRange(0, Math.PI * 2);
      const speed = baseSpeed * randomInRange(0.3, 1);
      const pLife = lifetime * randomInRange(0.5, 1);
      const pSize = size * randomInRange(0.5, 1.5);

      const g = scene.add.graphics();
      g.fillStyle(color, 1);
      g.fillCircle(0, 0, pSize);
      this.add(g);

      this.particles.push({
        graphics: g,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: pLife,
        maxLife: pLife,
        size: pSize,
        color,
        gravity,
        fade,
      });
    }
  }

  update(time: number, dt: number): void {
    if (!this.alive) return;

    let allDead = true;
    const dtSec = dt / 1000;

    for (const p of this.particles) {
      if (p.life <= 0) continue;
      allDead = false;

      p.life -= dt;
      p.vy += p.gravity * dtSec;

      p.graphics.x += p.vx * dtSec;
      p.graphics.y += p.vy * dtSec;

      if (p.fade) {
        const alpha = p.life / p.maxLife;
        p.graphics.alpha = alpha;
        p.graphics.scale = alpha;
      }
    }

    if (allDead) {
      this.alive = false;
      this.destroy();
    }
  }
}

export class HitParticle extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;
  public alive = true;
  private ring: Phaser.GameObjects.Graphics;
  private flash: Phaser.GameObjects.Graphics;
  private life = 150;
  private maxLife = 150;

  constructor(scene: Phaser.Scene, x: number, y: number, color = 0xffffff) {
    super(scene, x, y);
    scene.add.existing(this);
    this.setDepth(C.DEPTH.PARTICLE + 5);

    this.ring = scene.add.graphics();
    this.flash = scene.add.graphics();
    this.add([this.ring, this.flash]);

    this.flash.fillStyle(color, 1);
    this.flash.fillCircle(0, 0, 8);
  }

  update(time: number, dt: number): void {
    if (!this.alive) return;
    this.life -= dt;
    if (this.life <= 0) {
      this.alive = false;
      this.destroy();
      return;
    }

    const progress = 1 - this.life / this.maxLife;
    const radius = 8 + progress * 30;
    const alpha = 1 - progress;

    this.ring.clear();
    this.ring.lineStyle(2, 0xffffff, alpha);
    this.ring.strokeCircle(0, 0, radius);

    this.flash.alpha = alpha * 0.5;
    this.flash.scale = 1 + progress;
  }
}