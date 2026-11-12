/* src/scenes/GameScene.ts */
import Phaser from 'phaser';
import { C } from '../config/constants';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Bullet } from '../entities/Bullet';
import { Pickup } from '../entities/Pickup';
import { WaveManager } from '../systems/WaveManager';
import { CollisionSystem } from '../systems/CollisionSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { createInputSystem, InputState } from '../utils/input';
import { audioEngine } from '../audio/AudioEngine';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private waveManager!: WaveManager;
  private collisionSystem!: CollisionSystem;
  private scoreSystem!: ScoreSystem;
  private inputState!: InputState & { update: () => void };
  private gameOver = false;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(C.BG_COLOR);
    this.cameras.main.setBounds(0, 0, C.W, C.H);

    // Initialize systems
    this.scoreSystem = new ScoreSystem();
    this.waveManager = new WaveManager(this);
    this.player = new Player(this, C.W / 2, C.H / 2);
    this.collisionSystem = new CollisionSystem(this, this.player);

    // Input
    const inputSystem = createInputSystem(this);
    this.inputState = inputSystem as InputState & { update: () => void };

    // Start wave
    this.waveManager.start();

    // Launch UI scene
    this.scene.launch('UIScene', {
      player: this.player,
      scoreSystem: this.scoreSystem,
      waveManager: this.waveManager,
    });

    // Event listeners
    this.setupEventListeners();

    // Camera follow player (slightly)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(C.W * 0.3, C.H * 0.3);
  }

  private setupEventListeners(): void {
    // Player shoot
    this.events.on('player-shoot', (data: any) => {
      this.collisionSystem.getPlayerBullets().add(
        new Bullet(this, data)
      );
    });

    // Enemy shoot
    this.events.on('enemy-shoot', (data: any) => {
      this.collisionSystem.getEnemyBullets().add(
        new Bullet(this, data)
      );
    });

    // Enemy died
    this.events.on('enemy-died', (data: any) => {
      this.scoreSystem.addScore(data.score);
      this.scoreSystem.addKill();
    });

    // Enemy killed (from collision system)
    this.events.on('enemy-killed', (data: any) => {
      this.scoreSystem.addScore(data.score);
      this.scoreSystem.addKill();
    });

    // Pickup collected
    this.events.on('pickup-collected', () => {
      this.scoreSystem.addScore(50);
    });

    // Wave complete
    this.events.on('wave-complete', (data: any) => {
      this.scoreSystem.addScore(data.bonus);
      this.scoreSystem.setWave(data.wave);
      audioEngine.playWaveComplete();
      this.cameras.main.shake(200, 0.01);
    });

    // Player died
    this.events.on('player-died', () => {
      this.gameOver = true;
      this.handleGameOver();
    });

    // Pause/Resume from UI
    this.events.on('game-paused', () => {
      this.physics.world.isPaused = true;
    });
    this.events.on('game-resumed', () => {
      this.physics.world.isPaused = false;
    });

    // Cleanup on shutdown
    this.events.once('shutdown', () => {
      this.waveManager.destroy();
      this.collisionSystem.clear();
    });
  }

  update(time: number, dt: number): void {
    if (this.gameOver) return;

    // Update input
    this.inputState.update();

    // Pause check
    if (this.inputState.pause) {
      const uiScene = this.scene.get('UIScene');
      if (uiScene && uiScene.sys && uiScene.sys.isActive()) {
        (uiScene as any).togglePause?.();
      }
    }

    // Volume controls
    if (this.inputState.mute) {
      audioEngine.toggleMute();
    }
    if (this.inputState.volumeUp) {
      audioEngine.setMasterVolume(Math.min(1, audioEngine.getMasterVolume() + 0.1));
    }
    if (this.inputState.volumeDown) {
      audioEngine.setMasterVolume(Math.max(0, audioEngine.getMasterVolume() - 0.1));
    }

    // Update player
    this.player.update(this.inputState, time, dt);

    // Update wave manager
    this.waveManager.update(time, dt, this.player);

    // Update score system wave
    this.scoreSystem.setWave(this.waveManager.getWave());

    // Sync enemies with collision system
    const enemies = this.waveManager.getEnemies();
    enemies.forEach(e => this.collisionSystem.addEnemy(e));

    const pickups = this.waveManager.getPickups();
    pickups.forEach(p => this.collisionSystem.addPickup(p));
  }

  private handleGameOver(): void {
    audioEngine.stopBGM();
    this.cameras.main.shake(300, 0.02);
    this.cameras.main.flash(500, 255, 0, 0);

    this.time.delayedCall(1000, () => {
      const { newHighScore, finalScore } = this.scoreSystem.onGameEnd();
      this.scene.start('GameOverScene', { finalScore, newHighScore, wave: this.waveManager.getWave(), kills: this.scoreSystem.getKills() });
    });
  }
}