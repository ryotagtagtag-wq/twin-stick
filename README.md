# Twin-Stick Shooter

A browser-based twin-stick shooter built with **Phaser 3**, **TypeScript**, and **Vite**. Features procedural Web Audio API sound synthesis (zero assets), wave-based gameplay, power-ups, and persistent high scores.

**Live Demo**: https://twin-stick.pages.dev

---

## 🎮 Controls

| Action | Input |
|--------|-------|
| Move | `WASD` / Arrow Keys |
| Aim & Shoot | Mouse (hold left click / Space for auto-fire) |
| Pause | `Esc` / `P` |
| Mute | `M` |
| Volume Up/Down | `]` / `[` |

---

## 🛠 Tech Stack

| Layer | Choice |
|-------|--------|
| Game Engine | Phaser 3.80 |
| Language | TypeScript 5.4 (strict) |
| Build Tool | Vite 5.2 |
| Package Manager | pnpm |
| Deploy | Cloudflare Pages |
| Audio | Web Audio API (procedural synthesis) |

---

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Dev server (http://localhost:5173)
pnpm dev

# Production build
pnpm build

# Deploy to Cloudflare Pages
pnpm deploy
```

---

## 📁 Project Structure

```
src/
├── main.ts                 # Entry point
├── game.ts                 # Phaser config
├── audio/AudioEngine.ts    # Web Audio API engine (BGM + SFX)
├── config/
│   ├── constants.ts        # Game constants (tuning)
│   └── enemyPatterns.ts    # Enemy types & wave definitions
├── entities/
│   ├── Player.ts           # Player ship, movement, power-ups
│   ├── Enemy.ts            # 3 enemy types (grunt/sniper/tank)
│   ├── Bullet.ts           # Projectiles (player/enemy, pierce)
│   ├── Particle.ts         # Explosions, hit effects, trails
│   └── Pickup.ts           # Power-up drops
├── scenes/
│   ├── BootScene.ts        # Initialization
│   ├── TitleScene.ts       # Menu, high score, controls
│   ├── GameScene.ts        # Main gameplay loop
│   ├── UIScene.ts          # HUD (score, wave, HP, power-ups)
│   └── GameOverScene.ts    # Results, restart
├── systems/
│   ├── WaveManager.ts      # Wave progression, spawning
│   ├── CollisionSystem.ts  # Physics overlaps, damage
│   └── ScoreSystem.ts      # Scoring, localStorage persistence
└── utils/
    ├── math.ts             # Vector math helpers
    └── input.ts            # Input state management
```

---

## ⚙️ Configuration

All gameplay constants are in `src/config/constants.ts`:

```typescript
export const C = {
  PLAYER_SPEED: 320,
  PLAYER_HP: 3,
  SHOOT_COOLDOWN: 120,        // ms
  BULLET_SPEED: 600,
  ENEMY_BASE_HP: 1,
  WAVE_DURATION: 30000,       // 30s per wave
  ENEMIES_PER_WAVE_BASE: 8,
  SCORE_KILL: 100,
  SCORE_WAVE_BONUS: 1000,
  // ...
};
```

Modify and rebuild to rebalance.

---

## 🎵 Audio Engine

`src/audio/AudioEngine.ts` synthesizes all sounds at runtime:

- **BGM**: 4-bar loop @ 120 BPM (drums, bass, lead)
- **SFX**: Shoot, hit, explosion, power-up, wave complete
- **API**: `audioEngine.playShoot()`, `playExplosion()`, `startBGM()`, `setMasterVolume(v)`, `toggleMute()`

Zero external audio files — works offline, tiny bundle.

---

## 🌐 Deployment

### Cloudflare Pages (configured)

```toml
# wrangler.toml
name = "twin-stick"
pages_build_output_dir = "dist"
compatibility_date = "2024-11-12"
```

Deploy:
```bash
pnpm deploy  # builds + wrangler pages deploy dist
```

### Other Static Hosts

The `dist/` folder is a standard static site — works on Netlify, Vercel, GitHub Pages, etc.

---

## 📝 License

MIT — free to use, modify, distribute.

---

## 🙏 Credits

- **Phaser 3** — Game framework
- **Vite** — Build tool
- **Web Audio API** — Procedural audio
- Built in a weekend with AI assistance