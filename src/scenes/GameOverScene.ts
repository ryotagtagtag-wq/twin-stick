/* src/scenes/GameOverScene.ts */
import Phaser from 'phaser';
import { C } from '../config/constants';
import { ScoreSystem } from '../systems/ScoreSystem';
import { audioEngine } from '../audio/AudioEngine';

interface GameOverData {
  finalScore: number;
  newHighScore: boolean;
  wave: number;
  kills: number;
}

export class GameOverScene extends Phaser.Scene {
  private gameOverData!: GameOverData;
  private scoreSystem: ScoreSystem;

  constructor() {
    super('GameOverScene');
    this.scoreSystem = new ScoreSystem();
  }

  init(data: GameOverData): void {
    this.gameOverData = data;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(C.BG_COLOR);

    // Game Over text
    const gameOverText = this.add.text(C.W / 2, C.H / 2 - 150, 'GAME OVER', {
      fontSize: '56px',
      color: '#ff4444',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Final score
    const scoreText = this.add.text(C.W / 2, C.H / 2 - 60, `FINAL SCORE: ${this.scoreSystem.formatScore(this.gameOverData.finalScore)}`, {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Wave reached
    const waveText = this.add.text(C.W / 2, C.H / 2 - 10, `WAVE REACHED: ${this.gameOverData.wave}`, {
      fontSize: '24px',
      color: '#ffdd00',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Kills
    const killsText = this.add.text(C.W / 2, C.H / 2 + 30, `ENEMIES DESTROYED: ${this.gameOverData.kills}`, {
      fontSize: '20px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // High score notification
    if (this.gameOverData.newHighScore) {
      const hsText = this.add.text(C.W / 2, C.H / 2 + 80, 'NEW HIGH SCORE!', {
        fontSize: '28px',
        color: '#00ff88',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      this.tweens.add({
        targets: hsText,
        scale: { from: 1, to: 1.2 },
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      const hsText = this.add.text(C.W / 2, C.H / 2 + 80, `HIGH SCORE: ${this.scoreSystem.formatScore(this.scoreSystem.getHighScore())}`, {
        fontSize: '20px',
        color: '#888888',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
    }

    // Restart prompt
    const restartText = this.add.text(C.W / 2, C.H / 2 + 140, 'CLICK OR PRESS ANY KEY TO RESTART', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: restartText,
      alpha: { from: 1, to: 0.3 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Input
    this.input.once('pointerdown', () => this.restart());
    this.input.keyboard!.once('keydown', () => this.restart());
  }

  private restart(): void {
    audioEngine.startBGM();
    this.scene.start('GameScene');
  }
}