/* src/scenes/BootScene.ts */
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    // No external assets to load - everything is procedural
    // Show loading progress
    const loadingText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Loading...', {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      loadingText.setText(`Loading... ${Math.floor(value * 100)}%`);
    });

    this.load.on('complete', () => {
      loadingText.destroy();
    });
  }

  create(): void {
    // Initialize audio context on first user interaction
    this.scene.start('TitleScene');
  }
}