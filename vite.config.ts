import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  base: process.env.GITHUB_PAGES ? '/twin-stick/' : '/',
  build: {
    outDir: 'dist',
    minify: 'terser',
    terserOptions: { compress: { passes: 2 }, mangle: true },
    rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } },
  },
  server: { port: 5173, open: true },
  define: { 'import.meta.env.VITE_VERSION': JSON.stringify(process.env.npm_package_version) },
});