/* src/systems/CollisionSystem.ts */
import Phaser from 'phaser';
import { C } from '../config/constants';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Bullet } from '../entities/Bullet';
import { Pickup } from '../entities/Pickup';
import { Particle, HitParticle } from '../entities/Particle';

export class CollisionSystem {
  private scene: Phaser.Scene;
  private playerBullets: Phaser.GameObjects.Group;
  private enemyBullets: Phaser.GameObjects.Group;
  private enemies: Phaser.GameObjects.Group;
  private pickups: Phaser.GameObjects.Group;
  private particles: Phaser.GameObjects.Group;
  private player: Player;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;

    this.playerBullets = scene.add.group({ runChildUpdate: true });
    this.enemyBullets = scene.add.group({ runChildUpdate: true });
    this.enemies = scene.add.group({ runChildUpdate: true });
    this.pickups = scene.add.group({ runChildUpdate: true });
    this.particles = scene.add.group({ runChildUpdate: true });

    this.setupCollisions();
    this.setupEventListeners();
  }

  private setupCollisions(): void {
    // Player bullets vs Enemies
    this.scene.physics.add.overlap(
      this.playerBullets,
      this.enemies,
      (bulletObj, enemyObj) => {
        const bullet = bulletObj as Bullet;
        const enemy = enemyObj as Enemy;
        this.onBulletHitEnemy(bullet, enemy);
      },
      undefined,
      this
    );

    // Enemy bullets vs Player
    this.scene.physics.add.overlap(
      this.player,
      this.enemyBullets,
      (playerObj, bulletObj) => {
        const bullet = bulletObj as Bullet;
        this.onBulletHitPlayer(bullet);
      },
      undefined,
      this
    );

    // Player vs Enemies (collision damage)
    this.scene.physics.add.collider(
      this.player,
      this.enemies,
      (playerObj, enemyObj) => {
        const enemy = enemyObj as Enemy;
        this.onPlayerTouchEnemy(enemy);
      },
      undefined,
      this
    );

    // Player vs Pickups
    this.scene.physics.add.overlap(
      this.player,
      this.pickups,
      (playerObj, pickupObj) => {
        const pickup = pickupObj as Pickup;
        this.onPlayerPickup(pickup);
      },
      undefined,
      this
    );

    // World bounds for bullets
    this.scene.physics.world.on('worldbounds', (body: Phaser.Physics.Arcade.Body) => {
      if (body.gameObject instanceof Bullet) {
        body.gameObject.destroy();
      }
    });
  }

  private setupEventListeners(): void {
    this.scene.events.on('player-shoot', (data: any) => {
      this.createBullet(data, 'player');
    });

    this.scene.events.on('enemy-shoot', (data: any) => {
      this.createBullet(data, 'enemy');
    });

    this.scene.events.on('enemy-died', (data: any) => {
      this.createExplosion(data.x, data.y, data.type);
    });
  }

  private createBullet(data: any, owner: 'player' | 'enemy'): void {
    const bullet = new Bullet(this.scene, {
      x: data.x,
      y: data.y,
      angle: data.angle,
      speed: data.speed,
      damage: data.damage,
      pierce: data.pierce,
      owner,
      color: data.color,
    });

    if (owner === 'player') {
      this.playerBullets.add(bullet);
    } else {
      this.enemyBullets.add(bullet);
    }
  }

  private onBulletHitEnemy(bullet: Bullet, enemy: Enemy): void {
    const died = enemy.takeDamage(bullet.damage);
    bullet.hit();

    // Hit particle
    this.createHitParticle(bullet.x, bullet.y);

    // Screen shake on kill
    if (died) {
      this.scene.cameras.main.shake(100, 0.01);
    }
  }

  private onBulletHitPlayer(bullet: Bullet): void {
    const time = this.scene.time.now;
    const dead = this.player.takeDamage(bullet.damage, time);
    bullet.hit();
    this.createHitParticle(bullet.x, bullet.y, 0xff4444);

    if (dead) {
      this.scene.events.emit('player-died');
    } else {
      this.scene.cameras.main.shake(50, 0.005);
    }
  }

  private onPlayerTouchEnemy(enemy: Enemy): void {
    const time = this.scene.time.now;
    const dead = this.player.takeDamage(1, time);
    this.createHitParticle(this.player.x, this.player.y, 0xff4444);

    if (dead) {
      this.scene.events.emit('player-died');
    }
  }

  private onPlayerPickup(pickup: Pickup): void {
    this.player.addPowerUp(pickup.type);
    pickup.collect();
    this.scene.events.emit('pickup-collected', pickup.type);
  }

  private createHitParticle(x: number, y: number, color = 0xffffff): void {
    const particle = new HitParticle(this.scene, x, y, color);
    this.particles.add(particle);
  }

  private createExplosion(x: number, y: number, enemyType: string): void {
    const colors: Record<string, number> = {
      grunt: 0xff4444,
      sniper: 0xff8800,
      tank: 0xaa00ff,
    };

    const particle = new Particle(this.scene, {
      x,
      y,
      color: colors[enemyType] || 0xffff00,
      count: enemyType === 'tank' ? 30 : 15,
      speed: 300,
      lifetime: 600,
      size: 6,
      gravity: 50,
    });
    this.particles.add(particle);
  }

  addEnemy(enemy: Enemy): void {
    this.enemies.add(enemy);
  }

  addPickup(pickup: Pickup): void {
    this.pickups.add(pickup);
  }

  getPlayerBullets(): Phaser.GameObjects.Group {
    return this.playerBullets;
  }

  getEnemyBullets(): Phaser.GameObjects.Group {
    return this.enemyBullets;
  }

  getEnemies(): Phaser.GameObjects.Group {
    return this.enemies;
  }

  getPickups(): Phaser.GameObjects.Group {
    return this.pickups;
  }

  getParticles(): Phaser.GameObjects.Group {
    return this.particles;
  }

  clear(): void {
    this.playerBullets.clear(true, true);
    this.enemyBullets.clear(true, true);
    this.enemies.clear(true, true);
    this.pickups.clear(true, true);
    this.particles.clear(true, true);
  }
}