/* src/scenes/TitleScene.ts */
import Phaser from 'phaser';
import { C } from '../config/constants';
import { ScoreSystem } from '../systems/ScoreSystem';
import { audioEngine } from '../audio/AudioEngine';

export class TitleScene extends Phaser.Scene {
  private scoreSystem: ScoreSystem;
  private titleText!: Phaser.GameObjects.Text;
  private startText!: Phaser.GameObjects.Text;
  private controlsText!: Phaser.GameObjects.Text;
  private highScoreText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;
  private blinkTimer = 0;
  private blinkVisible = true;

  constructor() {
    super('TitleScene');
    this.scoreSystem = new ScoreSystem();
  }

  create(): void {
    this.cameras.main.setBackgroundColor(C.BG_COLOR);

    // Title
    this.titleText = this.add.text(C.W / 2, C.H / 2 - 120, 'TWIN-STICK SHOOTER', {
      fontSize: '48px',
      color: '#00ffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // High Score
    this.highScoreText = this.add.text(C.W / 2, C.H / 2 - 40, `HIGH SCORE: ${this.scoreSystem.formatScore(this.scoreSystem.getHighScore())}`, {
      fontSize: '24px',
      color: '#ffdd00',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Stats
    const stats = this.scoreSystem.getStats();
    this.statsText = this.add.text(C.W / 2, C.H / 2, `Games: ${stats.gamesPlayed}  |  Total Kills: ${stats.totalKills}  |  Best Wave: ${stats.highestWave}`, {
      fontSize: '16px',
      color: '#888888',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Start prompt
    this.startText = this.add.text(C.W / 2, C.H / 2 + 80, 'CLICK OR PRESS ANY KEY TO START', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Controls
    this.controlsText = this.add.text(C.W / 2, C.H / 2 + 140, [
      'WASD / Arrow Keys - Move',
      'Mouse - Aim & Auto-fire (hold)',
      'Space - Shoot',
      'Esc / P - Pause',
      'M - Mute, [ / ] - Volume',
    ].join('\n'), {
      fontSize: '16px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5);

    // Input handling
    this.input.once('pointerdown', () => this.startGame());
    this.input.keyboard!.once('keydown', () => this.startGame());

    // Animate title
    this.tweens.add({
      targets: this.titleText,
      scale: { from: 1, to: 1.05 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  update(time: number, dt: number): void {
    this.blinkTimer += dt;
    if (this.blinkTimer >= 500) {
      this.blinkTimer = 0;
      this.blinkVisible = !this.blinkVisible;
      this.startText.setAlpha(this.blinkVisible ? 1 : 0.3);
    }
  }

  private async startGame(): Promise<void> {
    // Unlock audio
    await audioEngine.unlock();
    audioEngine.startBGM();

    this.scene.start('GameScene');
  }
}