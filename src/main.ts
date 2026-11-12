/* src/main.ts */
import { createGame } from './game';

// Hide loading screen when game starts
window.addEventListener('load', () => {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.display = 'none';
  }

  // Create game instance
  const game = createGame();

  // Expose for debugging
  (window as any).game = game;
});

// Handle visibility change for audio
document.addEventListener('visibilitychange', () => {
  const game = (window as any).game;
  if (game && game.scene) {
    if (document.hidden) {
      game.scene.pause('GameScene');
      game.scene.pause('UIScene');
    } else {
      game.scene.resume('GameScene');
      game.scene.resume('UIScene');
    }
  }
});