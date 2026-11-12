/* src/systems/ScoreSystem.ts */
import { C } from '../config/constants';

const STORAGE_KEY = 'twinstick_hiscore';
const STORAGE_KEY_STATS = 'twinstick_stats';

export interface GameStats {
  highScore: number;
  totalScore: number;
  gamesPlayed: number;
  totalKills: number;
  highestWave: number;
  totalPlayTime: number;
  lastPlayed: number;
}

export class ScoreSystem {
  private score = 0;
  private wave = 0;
  private kills = 0;
  private startTime: number;
  private stats: GameStats;

  constructor() {
    this.startTime = Date.now();
    this.stats = this.loadStats();
  }

  private loadStats(): GameStats {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_STATS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load stats:', e);
    }
    return {
      highScore: 0,
      totalScore: 0,
      gamesPlayed: 0,
      totalKills: 0,
      highestWave: 0,
      totalPlayTime: 0,
      lastPlayed: 0,
    };
  }

  private saveStats(): void {
    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(this.stats));
      localStorage.setItem(STORAGE_KEY, String(this.stats.highScore));
    } catch (e) {
      console.warn('Failed to save stats:', e);
    }
  }

  addScore(amount: number): void {
    this.score += amount;
  }

  addKill(): void {
    this.kills++;
  }

  setWave(wave: number): void {
    this.wave = wave;
  }

  getScore(): number {
    return this.score;
  }

  getKills(): number {
    return this.kills;
  }

  getWave(): number {
    return this.wave;
  }

  getHighScore(): number {
    return this.stats.highScore;
  }

  getStats(): GameStats {
    return { ...this.stats };
  }

  onGameEnd(): { newHighScore: boolean; finalScore: number } {
    const playTime = Date.now() - this.startTime;

    this.stats.totalScore += this.score;
    this.stats.gamesPlayed++;
    this.stats.totalKills += this.kills;
    this.stats.highestWave = Math.max(this.stats.highestWave, this.wave);
    this.stats.totalPlayTime += playTime;
    this.stats.lastPlayed = Date.now();

    let newHighScore = false;
    if (this.score > this.stats.highScore) {
      this.stats.highScore = this.score;
      newHighScore = true;
    }

    this.saveStats();
    return { newHighScore, finalScore: this.score };
  }

  reset(): void {
    this.score = 0;
    this.wave = 0;
    this.kills = 0;
    this.startTime = Date.now();
  }

  formatScore(score: number): string {
    return score.toLocaleString();
  }

  formatTime(ms: number): string {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }
}