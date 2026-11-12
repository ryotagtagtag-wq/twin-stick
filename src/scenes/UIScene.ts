/* src/scenes/UIScene.ts */
import Phaser from 'phaser';
import { C } from '../config/constants';
import { Player, PowerUpType } from '../entities/Player';
import { ScoreSystem } from '../systems/ScoreSystem';

export class UIScene extends Phaser.Scene {
  private player!: Player;
  private scoreSystem!: ScoreSystem;
  private waveManager!: any;

  private scoreText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private hpContainer!: Phaser.GameObjects.Container;
  private hpBars: Phaser.GameObjects.Graphics[] = [];
  private powerUpContainer!: Phaser.GameObjects.Container;
  private powerUpIcons: Map<PowerUpType, Phaser.GameObjects.Container> = new Map();
  private pausedText!: Phaser.GameObjects.Text;
  private isPaused = false;

  constructor() {
    super('UIScene');
  }

  init(data: { player: Player; scoreSystem: ScoreSystem; waveManager: any }): void {
    this.player = data.player;
    this.scoreSystem = data.scoreSystem;
    this.waveManager = data.waveManager;
  }

  create(): void {
    // Score
    this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setDepth(C.DEPTH.UI).setScrollFactor(0);

    // Wave
    this.waveText = this.add.text(C.W - 20, 20, 'WAVE 1', {
      fontSize: '24px',
      color: '#ffdd00',
      fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(C.DEPTH.UI).setScrollFactor(0);

    // HP Bar Container
    this.hpContainer = this.add.container(20, 60).setDepth(C.DEPTH.UI).setScrollFactor(0);
    for (let i = 0; i < this.player.maxHp; i++) {
      const bg = this.add.graphics();
      bg.fillStyle(0x333333, 1);
      bg.fillRoundedRect(i * 40, 0, 32, 16, 4);

      const bar = this.add.graphics();
      bar.fillStyle(C.COLORS.PLAYER, 1);
      bar.fillRoundedRect(i * 40, 0, 32, 16, 4);

      this.hpContainer.add([bg, bar]);
      this.hpBars.push(bar);
    }

    // Power-up Container
    this.powerUpContainer = this.add.container(C.W / 2, C.H - 50).setDepth(C.DEPTH.UI).setScrollFactor(0);

    // Paused text (hidden initially)
    this.pausedText = this.add.text(C.W / 2, C.H / 2, 'PAUSED', {
      fontSize: '48px',
      color: '#ffdd00',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(C.DEPTH.UI + 10).setScrollFactor(0).setVisible(false);

    // Pause input
    this.input.keyboard!.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard!.on('keydown-P', () => this.togglePause());
  }

  update(time: number, dt: number): void {
    if (this.isPaused) return;

    // Score
    this.scoreText.setText(`SCORE: ${this.scoreSystem.formatScore(this.scoreSystem.getScore())}`);

    // Wave
    const wave = this.waveManager.getWave();
    this.waveText.setText(`WAVE ${wave}`);

    // HP Bars
    for (let i = 0; i < this.player.maxHp; i++) {
      const bar = this.hpBars[i];
      if (!bar) continue;
      bar.clear();
      if (i < this.player.hp) {
        bar.fillStyle(C.COLORS.PLAYER, 1);
      } else {
        bar.fillStyle(0x333333, 1);
      }
      bar.fillRoundedRect(i * 40, 0, 32, 16, 4);
    }

    // Power-ups
    this.updatePowerUpDisplay();
  }

  private updatePowerUpDisplay(): void {
    const activePowerUps = this.player.getActivePowerUps();
    const currentTypes = new Set(activePowerUps.map(p => p.type));

    // Remove expired
    for (const [type, container] of this.powerUpIcons) {
      if (!currentTypes.has(type)) {
        container.destroy();
        this.powerUpIcons.delete(type);
      }
    }

    // Add/update active
    activePowerUps.forEach((powerUp) => {
      let container = this.powerUpIcons.get(powerUp.type);
      const timeLeft = powerUp.expiresAt - this.time.now;
      const progress = Math.max(0, timeLeft / 8000); // POWERUP_DURATION

      if (!container) {
        container = this.createPowerUpIcon(powerUp.type);
        this.powerUpIcons.set(powerUp.type, container);
        this.powerUpContainer.add(container);
      }

      // Position
      const total = this.powerUpIcons.size;
      const spacing = 60;
      const startX = -(total - 1) * spacing / 2;
      const icons = Array.from(this.powerUpIcons.values());
      const idx = icons.indexOf(container);
      container.x = startX + idx * spacing;

      // Update progress ring
      const ring = container.getAt(1) as Phaser.GameObjects.Graphics;
      if (ring) {
        ring.clear();
        ring.lineStyle(3, 0xffffff, 0.8);
        ring.beginPath();
        ring.arc(0, 0, 20, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        ring.strokePath();
      }

      // Level indicator
      const levelText = container.getAt(2) as Phaser.GameObjects.Text;
      if (levelText) {
        if (powerUp.level > 1) {
          levelText.setText(`×${powerUp.level}`).setVisible(true);
        } else {
          levelText.setVisible(false);
        }
      }
    });
  }

  private createPowerUpIcon(type: PowerUpType): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);

    const colors: Record<PowerUpType, number> = {
      rapid: 0x00ff88,
      spread: 0xff8800,
      pierce: 0xff00ff,
      speed: 0x00aaff,
      shield: 0xffff00,
    };

    const labels: Record<PowerUpType, string> = {
      rapid: 'RAPID',
      spread: 'SPREAD',
      pierce: 'PIERCE',
      speed: 'SPEED',
      shield: 'SHIELD',
    };

    const color = colors[type];

    // Background glow
    const bg = this.add.graphics();
    bg.fillStyle(color, 0.2);
    bg.fillCircle(0, 0, 24);
    container.add(bg);

    // Progress ring
    const ring = this.add.graphics();
    container.add(ring);

    // Icon
    const icon = this.add.graphics();
    icon.fillStyle(color, 1);
    icon.fillCircle(0, 0, 12);
    icon.lineStyle(2, 0xffffff, 0.8);
    icon.strokeCircle(0, 0, 12);
    container.add(icon);

    // Label
    const label = this.add.text(0, 30, labels[type], {
      fontSize: '10px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
    container.add(label);

    // Level indicator
    const levelText = this.add.text(16, -16, '', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(levelText);

    return container;
  }

  togglePause(): void {
    this.isPaused = !this.isPaused;
    this.pausedText.setVisible(this.isPaused);
    this.events.emit(this.isPaused ? 'game-paused' : 'game-resumed');
    this.physics.world.isPaused = this.isPaused;
  }

  setPaused(paused: boolean): void {
    this.isPaused = paused;
    this.pausedText.setVisible(paused);
    this.physics.world.isPaused = paused;
  }

  getIsPaused(): boolean {
    return this.isPaused;
  }
}