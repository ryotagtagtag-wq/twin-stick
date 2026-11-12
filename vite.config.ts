import { defineConfig } from 'vite';
import packageJson from './package.json' with { type: 'json' };

export default defineConfig({
  root: '.',
  publicDir: 'public',
  base: './',
  build: {
    outDir: 'dist',
    minify: 'terser',
    terserOptions: { compress: { passes: 2 }, mangle: true },
    rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } },
  },
  server: { port: 5173, open: true },
  define: { 'import.meta.env.VITE_VERSION': JSON.stringify(packageJson.version) },
});